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
    constructor() {
        this.wall    = new Wall();
        this.players = [
            new Player(0, true),
            new Player(1, false),
            new Player(2, false),
            new Player(3, false),
        ];
        for (let i = 1; i <= 3; i++) {
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

        this._isRinshan   = false; // 嶺上開花フラグ

        // _processClaims で使う一時コンテキスト
        this._claimContext    = null;

        this.eventListeners   = {};
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
        this.players.forEach(p => {
            p.hand.tiles  = [];
            p.hand.melds  = [];
            p.discards    = [];
            p.isRiichi    = false;
            p.isDoubleRiichi = false;
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
        this._processDraw();
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

        const player = this.players[playerIndex];
        const tile = player.discard(tileIndex);
        this.lastDiscard       = tile;
        this.lastDiscardPlayer = playerIndex;

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
        this.processDiscard(playerIndex, tileIndex);
    }

    // --- 副露処理 ---

    // 他家の捨て牌に対してロン可能か（構造的チェック、役判定は第4週）
    _canRon(player, tile) {
        if (player.isFuriten || player.isTemporaryFuriten) return false;
        return player.hand.getWaitingTileIds().includes(tile.id);
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
        const { decisions, allOptions } = this._claimContext;
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

        this.currentIndex = playerIndex;
        this.wall.flipKanDora();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('minkan', { playerIndex, tile });
        this._processKanDraw();
    }

    // 暗槓実行（自摸牌で槓）
    processAnkan(playerIndex, tileId) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return;
        if (playerIndex !== this.currentIndex) return;

        const player = this.players[playerIndex];
        const ids = player.hand.findAnkanIds();
        if (!ids.includes(tileId)) return;

        const indices = [];
        for (let i = 0; i < player.hand.tiles.length; i++) {
            if (player.hand.tiles[i].id === tileId) indices.push(i);
            if (indices.length === 4) break;
        }

        const meldTiles = indices.map(i => player.hand.tiles[i]);
        const meld = new Meld(MELD_TYPE.ANKAN, meldTiles, -1, null);
        player.hand.addMeld(meld, indices);

        this.wall.flipKanDora();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('ankan', { playerIndex, tileId });
        this._processKanDraw();
    }

    // 加槓実行（ポン済み牌に追加）
    processKakan(playerIndex, meldIndex) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return;
        if (playerIndex !== this.currentIndex) return;

        const player = this.players[playerIndex];
        const opts = player.hand.findKakanOptions();
        const opt = opts.find(o => o.meldIndex === meldIndex);
        if (!opt) return;

        const addedTile = player.hand.tiles[opt.tileIndex];
        player.hand.tiles.splice(opt.tileIndex, 1);

        const ponMeld = player.hand.melds[meldIndex];
        const kakanMeld = new Meld(
            MELD_TYPE.KAKAN,
            [...ponMeld.tiles, addedTile],
            ponMeld.fromPlayer,
            ponMeld.claimedTile,
        );
        player.hand.melds[meldIndex] = kakanMeld;

        this.wall.flipKanDora();
        this.state = GAME_STATE.KAN_DRAW;
        this.emit('kakan', { playerIndex, meldIndex, tile: addedTile });
        this._processKanDraw();
    }

    // 和了（ロン）
    processRon(winnerIndex, discarderIndex) {
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
            isChankan:      false,
            isTenhou:       false,
            isChiihou:      false,
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
        this._processDraw();
    }

    _processRyuukyoku() {
        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', { result: ROUND_RESULT.RYUUKYOKU });
    }

    // --- 局回し ---

    nextRound(dealerContinues = false) {
        if (!dealerContinues) {
            this.dealerIndex = (this.dealerIndex + 1) % 4;
            this.round++;
        } else {
            this.honba++;
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

    // --- イベント ---

    on(event, cb) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(cb);
    }

    emit(event, data) {
        (this.eventListeners[event] || []).forEach(cb => cb(data));
    }
}
