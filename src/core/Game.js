import { Wall } from './Wall.js';
import { Player } from './Player.js';
import { Meld, MELD_TYPE } from './Meld.js';
import { AILevel3 } from '../ai/AILevel3.js';
import { evaluateYaku } from '../logic/Yaku.js';
import { calculateFu, calculateScore } from '../logic/Score.js';
import { countDora, countUraDora } from '../logic/Dora.js';

export const GAME_STATE = Object.freeze({
    INIT:           'init',
    DEAL:           'deal',
    DRAW:           'draw',
    PLAYER_ACTION:  'player_action',
    CLAIM:          'claim',
    MELD_ACTION:    'meld_action',
    KAN_DRAW:       'kan_draw',
    ROUND_END:      'round_end',
    GAME_END:       'game_end',
});

export const ROUND_RESULT = Object.freeze({
    TSUMO:     'tsumo',
    RON:       'ron',
    RYUUKYOKU: 'ryuukyoku',
    CHOMBO:    'chombo',
});

export class Game {
    constructor(options = {}) {
        this.wall    = new Wall();
        const allAI  = options.allAI || false;
        this.players = [
            new Player(0, !allAI),
            new Player(1, false),
            new Player(2, false),
            new Player(3, false),
        ];
        for (let i = (allAI ? 0 : 1); i <= 3; i++) {
            this.players[i].ai = new AILevel3(i);
        }

        this.state            = GAME_STATE.INIT;
        this.round            = 0;
        this.dealerIndex      = 0;
        this.turn             = 0;
        this.currentIndex     = 0;
        this.honba            = 0;
        this.kyotaku          = 0;

        this.lastDiscard      = null;
        this.lastDiscardPlayer = -1;

        this._isRinshan       = false;
        this._claimsThisRound = false; // ポン/チー/明槓で true → 地和不成立
        this._isChankan       = false; // 加槓に対するロン処理中
        this._pendingKakan    = null;  // 槍槓チェック中の保留加槓情報
        this._fourKanRyuukyoku = false; // 四槓散了（異なるプレイヤーが計4槓）フラグ

        // _processClaims で使う一時コンテキスト
        this._claimContext    = null;

        // トランポリン: 同期再帰をキュー駆動の反復に変換してスタック溢れを防ぐ
        this._actionQueue     = [];
        this._running         = false;

        this.eventListeners   = {};
    }

    // --- トランポリン ---

    // fn をキューに積み、ループが動いていなければ起動する。
    // ループ実行中（再帰的呼び出し）の場合はキューに追加するだけで即時 return するため
    // コールスタックが積み上がらない。
    _schedule(fn) {
        this._actionQueue.push(fn);
        if (!this._running) {
            this._running = true;
            try {
                while (this._actionQueue.length > 0) {
                    this._actionQueue.shift()();
                }
            } finally {
                this._running = false;
            }
        }
    }

    // --- ゲーム開始・局管理 ---

    startGame() {
        this.round       = 0;
        this.dealerIndex = 0;
        this.honba       = 0;
        this.kyotaku     = 0;
        this.players.forEach(p => p.score = 25000);
        this._startRound();
    }

    _startRound() {
        this.wall.init();
        this._claimsThisRound  = false;
        this._isChankan        = false;
        this._pendingKakan     = null;
        this._fourKanRyuukyoku = false;
        this.players.forEach(p => {
            p.hand.tiles  = [];
            p.hand.melds  = [];
            p.discards    = [];
            p.isRiichi    = false;
            p.isDoubleRiichi = false;
            p.riichiDiscardCount = -1;
            p.isFuriten   = false;
            p.isTemporaryFuriten = false;
            p.isIppatsu   = false;
            p.isMenzen    = true;
        });

        for (let i = 0; i < 4; i++) {
            const tiles = this.wall.deal(13);
            tiles.forEach(t => this.players[i].hand.add(t));
            this.players[i].hand.sort();
        }

        this.currentIndex = this.dealerIndex;
        this.turn = 0;
        this.state = GAME_STATE.DRAW;
        this._schedule(() => this._processDraw());
    }

    // --- ターン処理 ---

    _processDraw() {
        this._isRinshan = false;
        const player = this.players[this.currentIndex];
        const tile = this.wall.draw();
        if (!tile) {
            this._processRyuukyoku();
            return;
        }
        player.draw(tile);
        this.turn++;
        this.state = GAME_STATE.PLAYER_ACTION;
        this.emit('draw', { playerIndex: this.currentIndex, tile });

        if (!player.isHuman && player.ai) {
            this._processAIAction(player);
        }
    }

    // 合計カン数が4で同一プレイヤーでない場合に四槓散了フラグを設定
    _checkFourKanRyuukyoku() {
        const total = this.wall.kanCount;
        if (total < 4) return;
        const kansByPlayer = this.players.map(p =>
            p.hand.melds.filter(m =>
                m.type === MELD_TYPE.ANKAN ||
                m.type === MELD_TYPE.MINKAN ||
                m.type === MELD_TYPE.KAKAN
            ).length
        );
        const oneHasAll = kansByPlayer.some(k => k === total);
        if (!oneHasAll) this._fourKanRyuukyoku = true;
    }

    _processKanDraw() {
        this._isRinshan = true;
        const player = this.players[this.currentIndex];
        const tile = this.wall.drawRinshan();
        if (!tile) {
            this._processRyuukyoku();
            return;
        }
        player.draw(tile);
        this.state = GAME_STATE.PLAYER_ACTION;
        this.emit('kanDraw', { playerIndex: this.currentIndex, tile });

        // 四槓散了: ツモ和了のみ可能・それ以外は流局
        if (this._fourKanRyuukyoku) {
            if (!player.isHuman && player.ai) {
                if (player.hand.isComplete() && this.canDeclareWin(player.index)) {
                    this.processWin(player.index);
                } else {
                    this._processRyuukyoku();
                }
            }
            // 人間プレイヤー: processDiscard 時に流局へ誘導（GameScene 側で対応）
            return;
        }

        if (!player.isHuman && player.ai) {
            this._processAIAction(player);
        }
    }

    _processAIAction(player) {
        const action = player.ai.selectDrawAction(player, this);
        switch (action.action) {
            case 'tsumo':
                this.processWin(player.index);
                break;
            case 'riichi':
                this.processRiichi(player.index, action.index);
                break;
            case 'ankan':
                this.processAnkan(player.index, action.tileId);
                break;
            case 'kakan':
                this.processKakan(player.index, action.meldIndex);
                break;
            default:
                this.processDiscard(player.index, action.index);
        }
    }

    // 打牌（PLAYER_ACTION または MELD_ACTION 両方で受け付ける）
    processDiscard(playerIndex, tileIndex) {
        if (this.state !== GAME_STATE.PLAYER_ACTION &&
            this.state !== GAME_STATE.MELD_ACTION) return;
        if (playerIndex !== this.currentIndex) return;

        // 四槓散了: 人間が捨て牌を選んだ場合は流局に誘導
        if (this._fourKanRyuukyoku) {
            this._processRyuukyoku();
            return;
        }

        const player = this.players[playerIndex];
        const tile = player.discard(tileIndex);
        this.lastDiscard       = tile;
        this.lastDiscardPlayer = playerIndex;

        // リーチ済みプレイヤーの一発フラグ: リーチ宣言ターン以降の捨て牌でクリア
        // (リーチ宣言直後の打牌は riichiTurn == this.turn なのでクリアしない)
        if (player.isRiichi && this.turn > player.riichiTurn) {
            player.isIppatsu = false;
        }

        // リーチ中でなければフリテン再チェック
        if (!player.isRiichi) player.checkFuriten();

        this.state = GAME_STATE.CLAIM;
        this.emit('discard', { playerIndex, tile });

        this._processClaims();
    }

    // リーチ宣言（discard前）
    processRiichi(playerIndex, tileIndex) {
        const player = this.players[playerIndex];
        const isDouble = this.turn <= 4;
        player.declareRiichi(this.turn, isDouble);
        this.kyotaku++; // リーチ棒を供託
        this.processDiscard(playerIndex, tileIndex);
    }

    // --- 副露処理 ---

    _canRon(player, tile) {
        if (player.isFuriten || player.isTemporaryFuriten) return false;
        if (!player.hand.getWaitingTileIds().includes(tile.id)) return false;
        // 役チェック（無役チョンボ防止）
        player.hand.tiles.push(tile);
        const hasYaku = this._checkPlayerHasYaku(player, tile, false);
        player.hand.tiles.pop();
        return hasYaku;
    }

    // ロン/ツモ前の役有無確認（AI共有ロジック）
    // extraContext で isChankan 等を上書き可能
    _checkPlayerHasYaku(player, winTile, isTsumo, extraContext = {}) {
        const seatWind = player.getSeatWind(this.dealerIndex) + 1;
        const context = {
            isTsumo,
            isRiichi:       player.isRiichi,
            isDoubleRiichi: player.isDoubleRiichi,
            isIppatsu:      player.isIppatsu,
            seatWind,
            roundWind:      1,
            isHaitei:       isTsumo  && this.wall.isEmpty(),
            isHoutei:       !isTsumo && this.wall.isEmpty(),
            isRinshan:      this._isRinshan,
            isChankan:      false,
            isTenhou:       false,
            isChiihou:      false,
            ...extraContext,
        };
        const { yaku, isYakuman } = evaluateYaku(player.hand, winTile, context);
        return isYakuman || yaku.length > 0;
    }

    // 槍槓RON可否判定（加槓牌に対して他家がロンできるか）
    _canChankan(player, tile) {
        if (player.isFuriten || player.isTemporaryFuriten) return false;
        if (!player.hand.getWaitingTileIds().includes(tile.id)) return false;
        player.hand.tiles.push(tile);
        const hasYaku = this._checkPlayerHasYaku(player, tile, false, { isChankan: true });
        player.hand.tiles.pop();
        return hasYaku;
    }

    _canPon(player, tile) {
        let count = 0;
        for (const t of player.hand.tiles) {
            if (t.id === tile.id && ++count >= 2) return true;
        }
        return false;
    }

    _canMinkan(player, tile) {
        let count = 0;
        for (const t of player.hand.tiles) {
            if (t.id === tile.id && ++count >= 3) return true;
        }
        return false;
    }

    _canChi(player, tile) {
        if (tile.isHonor()) return false;
        return player.hand.findChiOptions(tile).length > 0;
    }

    _getClaimOptions(player, tile, discarderIdx) {
        const canRon = this._canRon(player, tile);
        if (player.isRiichi) {
            return { canRon, canPon: false, canMinkan: false, canChi: false };
        }
        const canPon    = this._canPon(player, tile);
        const canMinkan = this._canMinkan(player, tile);
        const isLeft    = (discarderIdx + 1) % 4 === player.index;
        const canChi    = isLeft && this._canChi(player, tile);
        return { canRon, canPon, canMinkan, canChi };
    }

    _processClaims() {
        const discarderIdx = this.lastDiscardPlayer;
        const tile = this.lastDiscard;

        // 各プレイヤーの請求選択肢を収集
        const allOptions = {};
        for (let i = 0; i < 4; i++) {
            if (i === discarderIdx) continue;
            const opts = this._getClaimOptions(this.players[i], tile, discarderIdx);
            if (opts.canRon || opts.canPon || opts.canMinkan || opts.canChi) {
                allOptions[i] = opts;
            }
        }

        if (Object.keys(allOptions).length === 0) {
            this._nextTurn();
            return;
        }

        // AI の決定を即時収集
        const decisions = {};
        let waitForHuman = false;

        for (const [idxStr, opts] of Object.entries(allOptions)) {
            const i = Number(idxStr);
            const player = this.players[i];
            if (player.isHuman) {
                waitForHuman = true;
                decisions[i] = null; // UI から selectClaim() で設定される
            } else {
                decisions[i] = player.ai.selectClaimAction(player, this, tile, opts);
            }
        }

        this._claimContext = { decisions, allOptions, discarderIdx, tile };

        if (waitForHuman) {
            const humanIdx = this.players.findIndex(p => p.isHuman);
            this.emit('claimNeeded', { playerIndex: humanIdx, options: allOptions[humanIdx] || {} });
        } else {
            this._resolveClaimDecisions();
        }
    }

    // 人間プレイヤーの宣言（UI から呼ぶ）
    selectClaim(playerIndex, decision) {
        if (!this._claimContext) return;
        this._claimContext.decisions[playerIndex] = decision;
        // 全員の決定が揃ったら解決
        const allDone = Object.values(this._claimContext.decisions).every(d => d !== null);
        if (allDone) this._resolveClaimDecisions();
    }

    _resolveClaimDecisions() {
        const { decisions, allOptions, _chankan } = this._claimContext;
        this._claimContext = null;

        // ロンを見逃したプレイヤーに一時フリテン付与
        for (const [idxStr, opts] of Object.entries(allOptions)) {
            const i = Number(idxStr);
            const dec = decisions[i];
            if (opts.canRon && (!dec || dec.action !== 'ron')) {
                const player = this.players[i];
                if (player.isRiichi) {
                    player.isFuriten = true;
                } else {
                    player.isTemporaryFuriten = true;
                }
            }
        }

        // 優先度1: ロン（複数同時OK）
        const rons = Object.entries(decisions)
            .filter(([, d]) => d && d.action === 'ron')
            .map(([idx]) => Number(idx));
        if (rons.length > 0) {
            rons.forEach(idx => this.processRon(idx, this.lastDiscardPlayer));
            if (_chankan) this._isChankan = false;
            return;
        }

        // 槍槓: 全員パス → 加槓を完了
        if (_chankan) {
            this._isChankan = false;
            this._completePendingKakan();
            return;
        }

        // 優先度2: 明槓 > ポン（同プレイヤーには両立しない）
        for (const [idxStr, dec] of Object.entries(decisions)) {
            if (!dec || dec.action === 'pass') continue;
            const i = Number(idxStr);
            if (dec.action === 'minkan') { this.processMinkan(i); return; }
            if (dec.action === 'pon')    { this.processPon(i); return; }
        }

        // 優先度3: チー
        for (const [idxStr, dec] of Object.entries(decisions)) {
            if (!dec || dec.action === 'pass') continue;
            const i = Number(idxStr);
            if (dec.action === 'chi') { this.processChi(i, dec.tileIndices); return; }
        }

        // 全員パス
        this._nextTurn();
    }

    // ポン実行
    processPon(playerIndex) {
        const player = this.players[playerIndex];
        const tile = this.lastDiscard;
        const indices = player.hand.findPonIndices(tile);
        if (!indices) return;

        const meldTiles = [
            player.hand.tiles[indices[0]],
            player.hand.tiles[indices[1]],
            tile,
        ];
        const meld = new Meld(MELD_TYPE.PON, meldTiles, this.lastDiscardPlayer, tile);
        player.hand.addMeld(meld, indices);
        player.isMenzen = false;

        this._claimsThisRound = true;
        this.players.forEach(p => { if (p.isRiichi) p.isIppatsu = false; });

        this.currentIndex = playerIndex;
        this.state = GAME_STATE.MELD_ACTION;
        this.emit('pon', { playerIndex, tile });

        if (!player.isHuman && player.ai) {
            const idx = player.ai.selectDiscard(player, this);
            this.processDiscard(playerIndex, idx);
        }
    }

    // チー実行（tileIndices: 手牌の2インデックス）
    processChi(playerIndex, tileIndices) {
        const player = this.players[playerIndex];
        const tile = this.lastDiscard;
        if (!tileIndices || tileIndices.length < 2) return;

        const [ia, ib] = tileIndices;
        const meldTiles = [
            player.hand.tiles[ia],
            player.hand.tiles[ib],
            tile,
        ].sort((a, b) => a.id - b.id);

        const meld = new Meld(MELD_TYPE.CHI, meldTiles, this.lastDiscardPlayer, tile);
        player.hand.addMeld(meld, [ia, ib]);
        player.isMenzen = false;

        this._claimsThisRound = true;
        this.players.forEach(p => { if (p.isRiichi) p.isIppatsu = false; });

        this.currentIndex = playerIndex;
        this.state = GAME_STATE.MELD_ACTION;
        this.emit('chi', { playerIndex, tile });

        if (!player.isHuman && player.ai) {
            const idx = player.ai.selectDiscard(player, this);
            this.processDiscard(playerIndex, idx);
        }
    }

    // 明槓実行（他家の捨て牌を槓）
    processMinkan(playerIndex) {
        const player = this.players[playerIndex];
        const tile = this.lastDiscard;
        const indices = player.hand.findMinkanIndices(tile);
        if (!indices) return;

        const meldTiles = [
            player.hand.tiles[indices[0]],
            player.hand.tiles[indices[1]],
            player.hand.tiles[indices[2]],
            tile,
        ];
        const meld = new Meld(MELD_TYPE.MINKAN, meldTiles, this.lastDiscardPlayer, tile);
        player.hand.addMeld(meld, indices);
        player.isMenzen = false;

        this._claimsThisRound = true;
        this.players.forEach(p => { if (p.isRiichi) p.isIppatsu = false; });

        this.currentIndex = playerIndex;
        this.wall.flipKanDora();
        this._checkFourKanRyuukyoku();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('minkan', { playerIndex, tile });
        this._schedule(() => this._processKanDraw());
    }

    // リーチ中の暗槓可否: 暗槓後も待ちが変わらない場合のみ許可
    // リーチ中でない場合は常に true を返す
    _canAnkanDuringRiichi(player, tileId) {
        if (!player.isRiichi) return true;

        const hand = player.hand;

        // 13枚リーチ手の待ち: ツモ牌（末尾）を外した状態で確認
        const drawnTile = hand.tiles.pop();
        const beforeWaits = hand.getWaitingTileIds();
        hand.tiles.push(drawnTile);

        // 暗槓シミュレート: 4枚除去 + ankan meld 追加
        const savedTiles = [...hand.tiles];
        const savedMelds = [...hand.melds];

        const removedIndices = [];
        for (let i = 0; i < hand.tiles.length; i++) {
            if (hand.tiles[i].id === tileId) removedIndices.push(i);
            if (removedIndices.length === 4) break;
        }
        const ankanTiles = removedIndices.map(i => hand.tiles[i]);
        removedIndices.sort((a, b) => b - a).forEach(i => hand.tiles.splice(i, 1));
        hand.melds.push(new Meld(MELD_TYPE.ANKAN, ankanTiles, -1, null));

        const afterWaits = hand.getWaitingTileIds();

        // 状態復元
        hand.tiles = savedTiles;
        hand.melds = savedMelds;

        if (beforeWaits.length !== afterWaits.length) return false;
        return beforeWaits.every(w => afterWaits.includes(w));
    }

    // 暗槓実行（自摸牌で槓）
    processAnkan(playerIndex, tileId) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return;
        if (playerIndex !== this.currentIndex) return;
        if (this._fourKanRyuukyoku) return; // 四槓散了中は槓不可

        const player = this.players[playerIndex];
        const ids = player.hand.findAnkanIds();
        if (!ids.includes(tileId)) return;

        // リーチ中: 待ちが変わる暗槓は禁止
        if (player.isRiichi && !this._canAnkanDuringRiichi(player, tileId)) return;

        const indices = [];
        for (let i = 0; i < player.hand.tiles.length; i++) {
            if (player.hand.tiles[i].id === tileId) indices.push(i);
            if (indices.length === 4) break;
        }

        const meldTiles = indices.map(i => player.hand.tiles[i]);
        const meld = new Meld(MELD_TYPE.ANKAN, meldTiles, -1, null);
        player.hand.addMeld(meld, indices);

        // 暗槓でも一発キャンセル（自分自身のみならず全員）
        this.players.forEach(p => { if (p.isRiichi) p.isIppatsu = false; });

        this.wall.flipKanDora();
        this._checkFourKanRyuukyoku();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('ankan', { playerIndex, tileId });
        this._schedule(() => this._processKanDraw());
    }

    // 加槓実行（ポン済み牌に追加）- 槍槓チェック付き
    processKakan(playerIndex, meldIndex) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return;
        if (playerIndex !== this.currentIndex) return;
        if (this._fourKanRyuukyoku) return; // 四槓散了中は槓不可

        const player = this.players[playerIndex];
        const opts = player.hand.findKakanOptions();
        const opt = opts.find(o => o.meldIndex === meldIndex);
        if (!opt) return;

        const addedTile = player.hand.tiles[opt.tileIndex];

        // 槍槓チェック: 加牌確定前に他家がロン可能か確認
        const hasChankan = this.players.some((p, i) =>
            i !== playerIndex && this._canChankan(p, addedTile)
        );

        if (hasChankan) {
            this._pendingKakan = { playerIndex, meldIndex, opt };
            this._isChankan = true;
            this.lastDiscard = addedTile;
            this.lastDiscardPlayer = playerIndex;
            this.state = GAME_STATE.CLAIM;
            this._processChankanClaims(playerIndex, addedTile);
        } else {
            this._executeKakan(playerIndex, meldIndex, opt, addedTile);
        }
    }

    // 加槓の実際の処理（槍槓なし、または全員パス後）
    _executeKakan(playerIndex, meldIndex, opt, addedTile) {
        const player = this.players[playerIndex];
        player.hand.tiles.splice(opt.tileIndex, 1);

        const ponMeld = player.hand.melds[meldIndex];
        const kakanMeld = new Meld(
            MELD_TYPE.KAKAN,
            [...ponMeld.tiles, addedTile],
            ponMeld.fromPlayer,
            ponMeld.claimedTile,
        );
        player.hand.melds[meldIndex] = kakanMeld;

        this.players.forEach(p => { if (p.isRiichi) p.isIppatsu = false; });
        this.wall.flipKanDora();
        this._checkFourKanRyuukyoku();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('kakan', { playerIndex, meldIndex, tile: addedTile });
        this._schedule(() => this._processKanDraw());
    }

    // 槍槓クレーム処理
    _processChankanClaims(kakanPlayerIndex, addedTile) {
        const decisions = {};
        let waitForHuman = false;

        for (let i = 0; i < 4; i++) {
            if (i === kakanPlayerIndex) continue;
            const player = this.players[i];
            if (!this._canChankan(player, addedTile)) continue;

            if (player.isHuman) {
                waitForHuman = true;
                decisions[i] = null;
            } else {
                const opts = { canRon: true, canPon: false, canMinkan: false, canChi: false };
                decisions[i] = player.ai.selectClaimAction(player, this, addedTile, opts);
            }
        }

        if (Object.keys(decisions).length === 0) {
            this._isChankan = false;
            this._completePendingKakan();
            return;
        }

        this._claimContext = {
            decisions,
            allOptions: Object.fromEntries(
                Object.keys(decisions).map(k => [Number(k), {
                    canRon: true, canPon: false, canMinkan: false, canChi: false,
                }])
            ),
            discarderIdx: kakanPlayerIndex,
            tile: addedTile,
            _chankan: true,
        };

        if (waitForHuman) {
            const humanIdx = this.players.findIndex(p => p.isHuman);
            const opts = decisions[humanIdx] === null
                ? { canRon: true, canPon: false, canMinkan: false, canChi: false }
                : {};
            this.emit('claimNeeded', { playerIndex: humanIdx, options: opts });
        } else {
            this._resolveClaimDecisions();
        }
    }

    // 保留中の加槓を完了（全員パスの場合）
    _completePendingKakan() {
        if (!this._pendingKakan) return;
        const { playerIndex, meldIndex, opt } = this._pendingKakan;
        this._pendingKakan = null;
        const player = this.players[playerIndex];
        const addedTile = player.hand.tiles[opt.tileIndex];
        this._executeKakan(playerIndex, meldIndex, opt, addedTile);
    }

    // 和了（ロン）
    processRon(winnerIndex, discarderIndex) {
        // 複数ロン宣言時: 先行ロン処理後に nextRound() が呼ばれると state が CLAIM 以外になるためスキップ
        if (this.state !== GAME_STATE.CLAIM) return;

        const winner   = this.players[winnerIndex];
        const discarder = this.players[discarderIndex];

        // 和了牌を手牌に追加して役・符・点数を計算
        winner.hand.add(this.lastDiscard);
        const result = this._calculateWin(winnerIndex, false);

        if (!result) {
            // 役なしチョンボ
            winner.hand.tiles.pop();
            this.state = GAME_STATE.ROUND_END;
            this.emit('roundEnd', { result: ROUND_RESULT.CHOMBO, winnerIndex });
            return;
        }

        const { total, payments } = result;
        winner.score    += total;
        discarder.score -= payments[0];
        this.kyotaku = 0;

        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', { result: ROUND_RESULT.RON, winnerIndex, discarderIndex, ...result });
    }

    // 和了（ツモ）
    processWin(winnerIndex) {
        // 局が既に終了している場合（再帰イベント処理による二重実行を防止）
        if (this.state === GAME_STATE.ROUND_END || this.state === GAME_STATE.GAME_END) return;

        const winner    = this.players[winnerIndex];
        const isDealer  = winnerIndex === this.dealerIndex;
        const result    = this._calculateWin(winnerIndex, true);

        if (!result) {
            this.state = GAME_STATE.ROUND_END;
            this.emit('roundEnd', { result: ROUND_RESULT.CHOMBO, winnerIndex });
            return;
        }

        const { total, payments } = result;
        winner.score += total;

        if (isDealer) {
            // 親ツモ: 子3人が各 payments[0] 支払い
            for (let i = 0; i < 4; i++) {
                if (i !== winnerIndex) this.players[i].score -= payments[0];
            }
        } else {
            // 子ツモ: 親=payments[0], 各子=payments[1]
            for (let i = 0; i < 4; i++) {
                if (i === winnerIndex) continue;
                if (i === this.dealerIndex) this.players[i].score -= payments[0];
                else                        this.players[i].score -= payments[1];
            }
        }
        this.kyotaku = 0;

        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', { result: ROUND_RESULT.TSUMO, winnerIndex, ...result });
    }

    // 和了時の役・符・点数計算（内部ヘルパー）
    // 呼び出し前: 和了牌は必ず winner.hand.tiles の末尾に追加済みであること
    _calculateWin(winnerIndex, isTsumo) {
        const winner   = this.players[winnerIndex];
        const isDealer = winnerIndex === this.dealerIndex;
        const seatWind = winner.getSeatWind(this.dealerIndex) + 1; // 1=東…4=北
        const winTile  = winner.hand.tiles[winner.hand.tiles.length - 1];

        const context = {
            isTsumo,
            isRiichi:       winner.isRiichi,
            isDoubleRiichi: winner.isDoubleRiichi,
            isIppatsu:      winner.isIppatsu,
            seatWind,
            roundWind:      1, // 東風戦固定
            isHaitei:       isTsumo  && this.wall.isEmpty(),
            isHoutei:       !isTsumo && this.wall.isEmpty(),
            isRinshan:      this._isRinshan,
            isChankan:      this._isChankan,
            isTenhou:  isTsumo && winnerIndex === this.dealerIndex && this.turn === 1,
            isChiihou: isTsumo && winnerIndex !== this.dealerIndex &&
                       !this._claimsThisRound && this.turn <= 4,
        };

        const yakuResult = evaluateYaku(winner.hand, winTile, context);

        // 役なし
        if (!yakuResult.isYakuman && yakuResult.yaku.length === 0) return null;

        // ドラ計算
        const doraCnt = countDora(
            winner.hand.tiles, winner.hand.melds, this.wall.doraIndicators
        );

        // 裏ドラ（リーチ和了時）
        let uraDoraCnt = 0;
        if (winner.isRiichi) {
            this.wall.revealUraDora();
            uraDoraCnt = countUraDora(
                winner.hand.tiles, winner.hand.melds, this.wall.uraDoraIndicators
            );
        }

        // 翻数
        let han;
        if (yakuResult.isYakuman) {
            const singles = yakuResult.yaku.filter(y => y.yakuman && !y.double).length;
            const doubles = yakuResult.yaku.filter(y => y.double).length;
            han = (singles + doubles * 2) * 13;
        } else {
            han = yakuResult.han + doraCnt + uraDoraCnt;
        }

        // 符計算（isPinfuはyakuResultから判定）
        context.isPinfu = yakuResult.yaku.some(y => y.key === 'PINFU');
        const fu = calculateFu(winner.hand, winTile, context);

        const scoreResult = calculateScore(
            han, fu, isDealer, isTsumo, this.honba, this.kyotaku
        );

        return { yakuResult, han, fu, doraCnt, uraDoraCnt, ...scoreResult };
    }

    _nextTurn() {
        this.currentIndex = (this.currentIndex + 1) % 4;
        this.state = GAME_STATE.DRAW;
        this._schedule(() => this._processDraw());
    }

    _processRyuukyoku() {
        // テンパイ料（ノーテン罰符）計算
        const tenpaiPlayers = this.players.filter(p => p.hand.isTenpai());
        const tc = tenpaiPlayers.length;
        if (tc > 0 && tc < 4) {
            const nc = 4 - tc;
            const payPerNoten    = 3000 / nc;
            const receivePerTenpai = 3000 / tc;
            this.players.forEach(p => {
                if (tenpaiPlayers.includes(p)) p.score += receivePerTenpai;
                else                            p.score -= payPerNoten;
            });
        }

        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', {
            result: ROUND_RESULT.RYUUKYOKU,
            tenpaiIndices: tenpaiPlayers.map(p => p.index),
        });
    }

    // --- 局回し ---

    nextRound(dealerContinues = false) {
        if (!dealerContinues) {
            this.dealerIndex = (this.dealerIndex + 1) % 4;
            this.round++;
            this.honba = 0; // 親交代時は本場リセット
        } else {
            this.honba++;
        }
        // 飛び: 0点以下のプレイヤーがいればゲーム終了
        if (this.players.some(p => p.score <= 0)) {
            this._checkGameEnd();
            return;
        }
        if (this.round >= 4) {
            this._checkGameEnd();
            return;
        }
        this._startRound();
    }

    _checkGameEnd() {
        this.state = GAME_STATE.GAME_END;
        this.emit('gameEnd', { players: this.players });
    }

    // ツモ和了宣言可否（役チェック込み）— GameScene のツモボタン表示判定に使用
    canDeclareWin(playerIndex) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return false;
        const player = this.players[playerIndex];
        if (!player.hand.isComplete()) return false;
        // 天和・地和は役あり確定
        if (playerIndex === this.dealerIndex && this.turn === 1) return true;
        if (playerIndex !== this.dealerIndex && !this._claimsThisRound && this.turn <= 4) return true;
        const winTile = player.hand.tiles[player.hand.tiles.length - 1];
        return this._checkPlayerHasYaku(player, winTile, true);
    }

    // --- イベント ---

    on(event, cb) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(cb);
    }

    emit(event, data) {
        (this.eventListeners[event] || []).forEach(cb => cb(data));
    }
}
