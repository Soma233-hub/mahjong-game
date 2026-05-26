import { Game, GAME_STATE, ROUND_RESULT } from '../core/Game.js';

// --- タイル描画定数 ---
// BootScene.js の同定数と同値を保つこと（Phase 1-D で両方変更）
const TW = 44;  // タイル幅
const TH = 60;  // タイル高さ
const TG = 3;   // タイル間隔

// 捨て牌ゾーン（プレイヤー0=下, 1=右, 2=上, 3=左）
const DISCARD_ZONES = [
    { x: 510, y: 440, dir: 'h', cols: 6 },  // Player0 (下)
    { x: 760, y: 295, dir: 'v', cols: 4 },  // Player1 (右)
    { x: 510, y: 235, dir: 'h', cols: 6 },  // Player2 (上) ← 上から下へ
    { x: 370, y: 295, dir: 'v', cols: 4 },  // Player3 (左)
];

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.game_ = new Game();

        this._handGfxList       = [[], [], [], []];
        this._discardGfxList    = [[], [], [], []];
        this._meldGfxList       = [[], [], [], []];
        this._doraGfxList       = [];
        this._riichiStickList   = [];
        this._actionButtons     = [];
        this._claimButtons      = [];
        this._riichiBtn         = null;

        this._selectedIdx           = -1;
        this._riichiCandidates      = [];
        this._lastDealerContinues   = false;
        this._lastP0DiscardPos      = null;  // 2-B: 打牌アニメーション用
        this._lastRiichiMask        = '';    // 2-D: リーチ棒変化検出用

        this._bindGameEvents();
        this._buildStaticUI();

        this.game_.startGame();
    }

    // =====================================
    // イベントバインド
    // =====================================

    _bindGameEvents() {
        this.game_.on('draw',        d => this._onDraw(d));
        this.game_.on('kanDraw',     d => this._onDraw(d));
        this.game_.on('discard',     d => this._onDiscard(d));
        this.game_.on('pon',         d => this._onMeld(d));
        this.game_.on('chi',         d => this._onMeld(d));
        this.game_.on('minkan',      d => this._onMeld(d));
        this.game_.on('ankan',       d => this._onMeld(d));
        this.game_.on('kakan',       d => this._onMeld(d));
        this.game_.on('claimNeeded', d => this._onClaimNeeded(d));
        this.game_.on('roundEnd',    d => this._onRoundEnd(d));
        this.game_.on('gameEnd',     d => this._onGameEnd(d));
    }

    // =====================================
    // 静的 UI
    // =====================================

    _buildStaticUI() {
        // フェルト背景
        this.add.rectangle(640, 360, 1280, 720, 0x2d5a27);
        // 内テーブル
        this.add.rectangle(640, 360, 760, 480, 0x246020);
        // 上部スコアバー
        this.add.rectangle(640, 18, 1280, 36, 0x111111);

        // 点数テキスト
        const labels = ['自分', '右', '対面', '左'];
        const xs = [110, 360, 640, 920, 1170];
        this._scoreTxts = this.game_.players.map((p, i) =>
            this.add.text(xs[i + 1], 18,
                `${labels[i]}: ${p.score}`, {
                    fontSize: '15px', color: '#fff', fontFamily: 'monospace',
                }).setOrigin(0.5)
        );

        // 局情報（左）
        this._roundTxt = this.add.text(xs[0], 18, '東1局 0本場', {
            fontSize: '15px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 中央テキスト（山残り・供託）
        this._wallTxt = this.add.text(640, 360, '', {
            fontSize: '17px', color: '#fff', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5);

        // ヒントテキスト（手牌上）
        this._hintTxt = this.add.text(640, 608, '', {
            fontSize: '13px', color: '#cccccc', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // ドラ表示ラベル（静的）
        this.add.text(529, 325, 'ドラ:', {
            fontSize: '14px', color: '#ffee88', fontFamily: 'monospace',
        }).setOrigin(0, 0.5);

        this._updateInfoTexts();
    }

    _updateInfoTexts() {
        const g = this.game_;
        const windNames = ['東', '南', '西', '北'];
        const roundWind = windNames[Math.floor(g.round / 4)] ?? '東';
        const roundNum  = (g.round % 4) + 1;
        this._roundTxt.setText(`${roundWind}${roundNum}局 ${g.honba}本場`);

        g.players.forEach((p, i) => {
            const riichiMark = p.isRiichi ? '★' : '';
            this._scoreTxts[i].setText(`${['自分', '右', '対面', '左'][i]}: ${p.score}${riichiMark}`);
        });

        const kyotakuStr = g.kyotaku > 0 ? `  供託${g.kyotaku}本` : '';
        this._wallTxt.setText(`山 ${g.wall.remaining}枚${kyotakuStr}`);

        this._updateDoraDisplay();
        this._updateRiichiSticks();
    }

    // =====================================
    // イベントハンドラ
    // =====================================

    _onDraw({ playerIndex }) {
        this._clearActionButtons();
        this._renderHand(playerIndex);
        this._updateInfoTexts();

        // 2-A: ツモアニメーション
        this._animateDraw(playerIndex);

        if (playerIndex === 0) {
            this._showPlayer0Actions();
        }
    }

    _onDiscard({ playerIndex }) {
        // P0 の打牌: 選択状態を解除してからアニメーション
        if (playerIndex === 0) this._selectedIdx = -1;
        this._renderHand(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfoTexts();

        // 2-B: 打牌アニメーション（P0 のみ: 保存位置 → 捨て牌ゾーン）
        if (playerIndex === 0 && this._lastP0DiscardPos) {
            const savedPos = this._lastP0DiscardPos;
            this._lastP0DiscardPos = null;

            const discardList = this._discardGfxList[0];
            const lastDiscard = discardList[discardList.length - 1];
            if (lastDiscard?.bg?.active) {
                const endX = lastDiscard.bg.x;
                const endY = lastDiscard.bg.y;
                lastDiscard.bg.setVisible(false);

                const discardedTile = this.game_.players[0].discards.slice(-1)[0];
                const texKey = discardedTile?.isRed
                    ? `tile_${discardedTile.suit}_${discardedTile.number}_r`
                    : `tile_${discardedTile.suit}_${discardedTile.number}`;
                const sw = Math.floor(TW * 0.82);
                const sh = Math.floor(TH * 0.82);

                const flyImg = this.add.image(savedPos.x, savedPos.y, texKey)
                    .setDisplaySize(TW - 1, TH - 1)
                    .setDepth(50);

                this.tweens.add({
                    targets: flyImg,
                    x: endX,
                    y: endY,
                    displayWidth:  sw - 1,
                    displayHeight: sh - 1,
                    duration: 200,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        flyImg.destroy();
                        if (lastDiscard?.bg?.active) lastDiscard.bg.setVisible(true);
                    },
                });
            }
        }
    }

    _onMeld({ playerIndex }) {
        this._renderHand(playerIndex);
        this._renderMelds(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfoTexts();
    }

    _onClaimNeeded({ playerIndex, options }) {
        if (playerIndex !== 0) return;
        this._showClaimButtons(options);
    }

    _onRoundEnd({ result, winnerIndex, yakuResult, han, fu, total, tenpaiIndices }) {
        this._clearActionButtons();
        this._clearClaimButtons();

        const g = this.game_;

        // 連荘判定: 親和了 or 流局 or チョンボは連荘
        this._lastDealerContinues =
            result === ROUND_RESULT.RYUUKYOKU ||
            result === ROUND_RESULT.CHOMBO ||
            ((result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON) &&
             winnerIndex === g.dealerIndex);

        const playerLabels = ['自分', '右', '対面', '左'];
        let lines = [];

        if (result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON) {
            const label    = result === ROUND_RESULT.TSUMO ? 'ツモ！' : 'ロン！';
            const yakuStr  = (yakuResult?.yaku || []).map(y => y.name).join(' / ') || '（役なし）';
            const scoreStr = total != null ? `${han}翻${fu}符  +${total}点` : '';
            lines = [
                `${label}  ${playerLabels[winnerIndex]}`,
                yakuStr,
                scoreStr,
            ];
        } else if (result === ROUND_RESULT.RYUUKYOKU) {
            let tenpaiStr;
            if (!tenpaiIndices || tenpaiIndices.length === 0) tenpaiStr = '全員ノーテン';
            else if (tenpaiIndices.length === 4)              tenpaiStr = '全員テンパイ';
            else tenpaiStr = `テンパイ: ${tenpaiIndices.map(i => `P${i}`).join(' ')}`;
            lines = ['流局', tenpaiStr];
        } else if (result === ROUND_RESULT.CHOMBO) {
            lines = [`チョンボ  ${playerLabels[winnerIndex]}`];
        }

        lines.push('');
        lines.push(g.players.map(p => `P${p.index}: ${p.score}`).join('  '));

        // 2-E: 和了演出 — 勝者手牌を3回フラッシュ
        if ((result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON) &&
            winnerIndex != null) {
            this._handGfxList[winnerIndex].forEach(obj => {
                if (!obj?.bg?.active) return;
                this.tweens.add({
                    targets: obj.bg,
                    alpha: 0.15,
                    yoyo: true,
                    repeat: 2,
                    duration: 150,
                    ease: 'Sine.easeInOut',
                });
            });
        }

        // パネル (center=360, height=280 → y=[220,500])
        const panelBg = this.add.rectangle(640, 360, 620, 280, 0x000000, 0.88)
            .setStrokeStyle(2, 0xaaaaaa).setDepth(30);
        const panelTxt = this.add.text(640, 335, lines.join('\n'), {
            fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5).setDepth(31);

        // 次局ボタン (パネル内 y=468)
        const nextBg  = this.add.rectangle(640, 468, 160, 40, 0x334466).setDepth(32);
        const nextTxt = this.add.text(640, 468, '次局へ ▶', {
            fontSize: '17px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(33);

        nextBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => nextBg.setFillStyle(0x4455aa))
            .on('pointerout',  () => nextBg.setFillStyle(0x334466))
            .on('pointerdown', () => {
                [panelBg, panelTxt, nextBg, nextTxt].forEach(o => o.destroy());
                this._onNextRound();
            });
    }

    _onGameEnd({ players }) {
        this.scene.start('ResultScene', { players });
    }

    // =====================================
    // 局進行
    // =====================================

    _onNextRound() {
        const g = this.game_;
        if (g.state === GAME_STATE.GAME_END) {
            this.scene.start('ResultScene', { players: g.players });
            return;
        }
        // 描画をクリア
        for (let i = 0; i < 4; i++) {
            this._clearGfxList(this._handGfxList[i]);
            this._clearGfxList(this._discardGfxList[i]);
            this._clearGfxList(this._meldGfxList[i]);
        }
        this._clearGfxList(this._doraGfxList);
        this._riichiStickList.forEach(o => o.destroy());
        this._riichiStickList = [];
        this._selectedIdx = -1;
        this._lastRiichiMask = '';  // 2-D: 次局でリーチ棒アニメを再有効化
        this._hintTxt.setText('');
        // 次局開始（連荘判定は _onRoundEnd で保存済み）
        g.nextRound(this._lastDealerContinues);
        // 飛び等でゲーム終了した場合は _onGameEnd で処理済みなので描画しない
        if (g.state === GAME_STATE.GAME_END) return;
        // 全プレイヤーの手牌を描画（P0が親の場合、P1-P3がまだ未描画になる問題を解消）
        for (let i = 0; i < 4; i++) this._renderHand(i);
    }

    // =====================================
    // Player0 操作UI
    // =====================================

    _showPlayer0Actions() {
        const g  = this.game_;
        const p0 = g.players[0];
        this._clearActionButtons();
        this._selectedIdx = -1;

        if (g.state !== GAME_STATE.PLAYER_ACTION || g.currentIndex !== 0) return;

        // 四槓散了: ツモ和了のみ可能
        if (g._fourKanRyuukyoku) {
            if (g.canDeclareWin(0)) {
                this._addButton(900, 662, 'ツモ', 0x884400, () => {
                    this._clearActionButtons();
                    g.processWin(0);
                });
            }
            this._hintTxt.setText('四槓散了 — ツモ和了のみ可能（それ以外は流局）');
            this._setupHandClick(p0);
            return;
        }

        // ツモ和了ボタン（役チェック込み）
        if (g.canDeclareWin(0)) {
            this._addButton(900, 662, 'ツモ', 0x884400, () => {
                this._clearActionButtons();
                g.processWin(0);
            });
        }

        // 暗槓ボタン（リーチ中も待ちが変わらない場合は可能）
        const ankanIds = p0.hand.findAnkanIds();
        const validAnkans = p0.isRiichi
            ? ankanIds.filter(id => g._canAnkanDuringRiichi(p0, id))
            : ankanIds;
        if (validAnkans.length > 0) {
            this._addButton(1050, 662, '暗槓', 0x334477, () => {
                this._clearActionButtons();
                g.processAnkan(0, validAnkans[0]);
            });
        }

        if (!p0.isRiichi) {
            // 加槓ボタン（リーチ中は不可）
            const kakanOpts = p0.hand.findKakanOptions();
            if (kakanOpts.length > 0) {
                this._addButton(1050, 662, '加槓', 0x334477, () => {
                    this._clearActionButtons();
                    g.processKakan(0, kakanOpts[0].meldIndex);
                });
            }
            // リーチ候補を計算
            this._riichiCandidates = this._findRiichiDiscards(p0);
        }

        const hint = p0.isRiichi
            ? validAnkans.length > 0 ? 'リーチ中 — 暗槓可 / ツモ切りのみ' : 'リーチ中 — ツモ切りのみ'
            : '捨てる牌をクリック（2回目で確定）';
        this._hintTxt.setText(hint);

        this._setupHandClick(p0);
    }

    _setupHandClick(player) {
        const objs = this._handGfxList[0];
        objs.forEach((obj, idx) => {
            if (!obj?.bg) return;
            obj.bg.setInteractive({ useHandCursor: true })
                .off('pointerover').off('pointerout').off('pointerdown')
                .on('pointerover', () => {
                    // 未選択牌のみホバー tint（選択中は _drawTile で付与済み）
                    if (this._selectedIdx !== idx) obj.bg.setTint(0xffffaa);
                })
                .on('pointerout', () => {
                    if (this._selectedIdx !== idx) obj.bg.clearTint();
                })
                .on('pointerdown', () => this._onTileClick(idx, player));
        });
    }

    _onTileClick(idx, player) {
        const g  = this.game_;
        const p0 = g.players[0];
        if (g.state !== GAME_STATE.PLAYER_ACTION || g.currentIndex !== 0) return;

        if (p0.isRiichi) {
            // リーチ中: ツモ牌（末尾）のみ打牌可能
            if (idx === p0.hand.tileCount - 1) {
                this._clearActionButtons();
                g.processDiscard(0, idx);
            }
            return;
        }

        if (this._selectedIdx === idx) {
            // 同じ牌を再クリック → 打牌実行
            this._clearActionButtons();
            this._hintTxt.setText('');
            // 2-B: 打牌アニメーション用にタイル座標を保存（processDiscard より先に取得）
            this._lastP0DiscardPos = this._getTileScreenPos(0, idx);
            g.processDiscard(0, idx);
            this._selectedIdx = -1;
        } else {
            // 選択変更
            this._selectedIdx = idx;
            this._renderHand(0);    // ハイライト更新
            this._clearRiichiButton();

            // リーチ可能なら「リーチ」ボタン
            if (this._riichiCandidates.includes(idx) && p0.score >= 1000) {
                this._showRiichiButton(idx);
            }
        }
    }

    _showRiichiButton(tileIdx) {
        const bg  = this.add.rectangle(760, 662, 100, 36, 0xaa2200).setDepth(15);
        const txt = this.add.text(760, 662, 'リーチ', {
            fontSize: '16px', color: '#fff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(16);
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => bg.setFillStyle(0xcc3300))
            .on('pointerout',  () => bg.setFillStyle(0xaa2200))
            .on('pointerdown', () => {
                this._clearActionButtons();
                this._hintTxt.setText('');
                // 2-B: リーチ打牌もアニメーション対象（processRiichi内でdiscardが発火）
                this._lastP0DiscardPos = this._getTileScreenPos(0, tileIdx);
                this.game_.processRiichi(0, tileIdx);
            });
        this._riichiBtn = [bg, txt];
    }

    _clearRiichiButton() {
        if (this._riichiBtn) {
            this._riichiBtn.forEach(o => o.destroy());
            this._riichiBtn = null;
        }
    }

    _findRiichiDiscards(player) {
        if (!player.isMenzen || player.isRiichi || player.score < 1000 || player.isFuriten) return [];
        const result = [];
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const removed = player.hand.tiles.splice(i, 1)[0];
            if (player.hand.isTenpai()) {
                const waits = player.hand.getWaitingTileIds();
                const furiten = player.discards.some(d => waits.includes(d.id));
                if (!furiten) result.push(i);
            }
            player.hand.tiles.splice(i, 0, removed);
        }
        return result;
    }

    // =====================================
    // 副露クレームUI
    // =====================================

    _showClaimButtons(options) {
        this._clearClaimButtons();
        const g   = this.game_;
        const btns = [];
        let bx    = 380;

        const addBtn = (label, color, decision) => {
            const bg  = this.add.rectangle(bx, 662, 110, 38, color).setDepth(20);
            const txt = this.add.text(bx, 662, label, {
                fontSize: '16px', color: '#fff', fontFamily: 'monospace',
            }).setOrigin(0.5).setDepth(21);
            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => bg.setFillStyle(color + 0x333333))
                .on('pointerout',  () => bg.setFillStyle(color))
                .on('pointerdown', () => {
                    this._clearClaimButtons();
                    g.selectClaim(0, decision);
                });
            btns.push(bg, txt);
            bx += 125;
        };

        if (options.canRon)    addBtn('ロン',  0x882200, { action: 'ron' });
        if (options.canPon)    addBtn('ポン',  0x224488, { action: 'pon' });
        if (options.canMinkan) addBtn('明槓',  0x335599, { action: 'minkan' });
        if (options.canChi) {
            const chiOpts = g.players[0].hand.findChiOptions(g.lastDiscard);
            chiOpts.forEach((indices) => {
                const p0Tiles = g.players[0].hand.tiles;
                const nums = [p0Tiles[indices[0]], p0Tiles[indices[1]], g.lastDiscard]
                    .map(t => t.number)
                    .sort((a, b) => a - b);
                // 複数選択肢があれば牌番号を表示して区別できるようにする
                const label = chiOpts.length > 1 ? `チー${nums.join('-')}` : 'チー';
                addBtn(label, 0x226644, { action: 'chi', tileIndices: indices });
            });
        }
        addBtn('パス', 0x444444, { action: 'pass' });

        this._claimButtons = btns;
    }

    // =====================================
    // ボタン共通
    // =====================================

    _addButton(x, y, label, color, cb) {
        const bg  = this.add.rectangle(x, y, 110, 36, color).setDepth(10);
        const txt = this.add.text(x, y, label, {
            fontSize: '16px', color: '#fff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(11);
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => bg.setFillStyle(color + 0x111111))
            .on('pointerout',  () => bg.setFillStyle(color))
            .on('pointerdown', () => cb());
        this._actionButtons.push(bg, txt);
    }

    _clearActionButtons() {
        this._actionButtons.forEach(o => o.destroy());
        this._actionButtons = [];
        this._clearRiichiButton();
    }

    _clearClaimButtons() {
        this._claimButtons.forEach(o => o.destroy());
        this._claimButtons = [];
    }

    // =====================================
    // タイル描画ヘルパー
    // =====================================

    /**
     * BootScene で生成したテクスチャを使って牌を Image で描画する。
     * @returns {{ bg: Phaser.GameObjects.Image, txt: null }}
     *   bg … Image（クリック判定・tint はこちらで操作）
     *   txt … 常に null（_clearGfxList との互換のため保持）
     */
    _drawTile(x, y, tile, { selected = false, back = false, small = false, rotated = false } = {}) {
        const w = small ? Math.floor(TW * 0.82) : TW;
        const h = small ? Math.floor(TH * 0.82) : TH;

        // テクスチャキー決定
        let texKey;
        if (back) {
            texKey = 'tile_back';
        } else if (tile?.isRed) {
            texKey = `tile_${tile.suit}_${tile.number}_r`;
        } else {
            texKey = `tile_${tile.suit}_${tile.number}`;
        }

        const img = this.add.image(x, y, texKey);
        // rotated 時: setDisplaySize は元サイズのまま → setAngle(90) で視覚上 w/h が入れ替わる
        img.setDisplaySize(w - 1, h - 1);
        if (selected) img.setTint(0xffff44);   // 選択中: 明黄色 tint
        if (rotated)  img.setAngle(90);

        return { bg: img, txt: null };
    }

    _clearGfxList(list) {
        list.forEach(obj => {
            obj?.bg?.destroy();
            obj?.txt?.destroy();
        });
        list.length = 0;
    }

    /**
     * 指定プレイヤーの手牌グラフィックからスクリーン座標を取得する（2-B 用）
     */
    _getTileScreenPos(playerIndex, tileIdx) {
        const obj = this._handGfxList[playerIndex]?.[tileIdx];
        if (!obj?.bg) return null;
        return { x: obj.bg.x, y: obj.bg.y };
    }

    /**
     * 2-A: ツモアニメーション
     * 手牌末尾の牌を一時的に非表示にし、山の位置からスライドINする
     */
    _animateDraw(playerIndex) {
        const handList = this._handGfxList[playerIndex];
        if (handList.length === 0) return;
        const lastObj = handList[handList.length - 1];
        if (!lastObj?.bg?.active) return;

        const endX = lastObj.bg.x;
        const endY = lastObj.bg.y;

        // プレイヤーごとの山開始位置（内テーブル上の概算座標）
        const wallOrigins = [
            { x: 720, y: 415 },  // P0（下）: 手前壁の右端
            { x: 820, y: 285 },  // P1（右）: 右壁の上端
            { x: 560, y: 310 },  // P2（上）: 奥壁の左端
            { x: 460, y: 435 },  // P3（左）: 左壁の下端
        ];
        const start = wallOrigins[playerIndex];

        // テクスチャキー（P0=表牌、AI=裏牌）
        let texKey;
        if (playerIndex === 0) {
            const tiles = this.game_.players[0].hand.tiles;
            const tile  = tiles[tiles.length - 1];
            texKey = tile?.isRed
                ? `tile_${tile.suit}_${tile.number}_r`
                : `tile_${tile.suit}_${tile.number}`;
        } else {
            texKey = 'tile_back';
        }

        // 実タイルを一時的に非表示にしてフライング牌を生成
        lastObj.bg.setVisible(false);
        const flyImg = this.add.image(start.x, start.y, texKey)
            .setDisplaySize(TW - 1, TH - 1)
            .setDepth(50);

        this.tweens.add({
            targets: flyImg,
            x: endX,
            y: endY,
            duration: 250,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                flyImg.destroy();
                if (lastObj?.bg?.active) lastObj.bg.setVisible(true);
            },
        });
    }

    // =====================================
    // 手牌描画
    // =====================================

    _renderHand(playerIndex) {
        this._clearGfxList(this._handGfxList[playerIndex]);
        const p = this.game_.players[playerIndex];

        switch (playerIndex) {
            case 0: this._renderHand0(p);          break;
            case 1: this._renderHandRight(p);      break;
            case 2: this._renderHandTop(p);        break;
            case 3: this._renderHandLeft(p);       break;
        }
    }

    _renderHand0(player) {
        const tiles  = player.hand.tiles;
        const n      = tiles.length;
        const totalW = n * (TW + TG);
        const startX = 640 - totalW / 2 + TW / 2;

        tiles.forEach((tile, idx) => {
            const x    = startX + idx * (TW + TG);
            const isLast = idx === n - 1;
            const dy   = isLast ? -8 : 0; // ツモ牌を少し持ち上げる
            const obj  = this._drawTile(x, 660 + dy, tile, {
                selected: this._selectedIdx === idx,
            });
            this._handGfxList[0].push(obj);
        });
    }

    _renderHandTop(player) {
        const tiles  = player.hand.tiles;
        const n      = tiles.length;
        const startX = 640 - (n * (TW + TG)) / 2 + TW / 2;
        tiles.forEach((tile, idx) => {
            const obj = this._drawTile(startX + idx * (TW + TG), 72, tile, { back: true });
            this._handGfxList[2].push(obj);
        });
    }

    _renderHandRight(player) {
        const tiles  = player.hand.tiles;
        const n      = tiles.length;
        // P1/P3 は縦方向に TW+TG のステップで並べる（TH+TG では13枚が720pxを超えるため）
        const startY = 360 - (n * (TW + TG)) / 2 + TH / 2;
        tiles.forEach((tile, idx) => {
            const obj = this._drawTile(1240, startY + idx * (TW + TG), tile, { back: true });
            this._handGfxList[1].push(obj);
        });
    }

    _renderHandLeft(player) {
        const tiles  = player.hand.tiles;
        const n      = tiles.length;
        // P1/P3 は縦方向に TW+TG のステップで並べる（TH+TG では13枚が720pxを超えるため）
        const startY = 360 - (n * (TW + TG)) / 2 + TH / 2;
        tiles.forEach((tile, idx) => {
            const obj = this._drawTile(42, startY + idx * (TW + TG), tile, { back: true });
            this._handGfxList[3].push(obj);
        });
    }

    // =====================================
    // 捨て牌描画
    // =====================================

    _renderDiscards(playerIndex) {
        this._clearGfxList(this._discardGfxList[playerIndex]);
        const player   = this.game_.players[playerIndex];
        const discards = player.discards;
        const zone     = DISCARD_ZONES[playerIndex];
        const sw = Math.floor(TW * 0.82);
        const sh = Math.floor(TH * 0.82);
        const gx = 2;

        // 2-D: リーチ宣言牌インデックス（riichiDiscardCount が宣言時の捨て牌数 → その位置が宣言牌）
        const riichiDiscardIdx = (player.isRiichi && player.riichiDiscardCount >= 0)
            ? player.riichiDiscardCount
            : -1;

        discards.forEach((tile, idx) => {
            const col = idx % zone.cols;
            const row = Math.floor(idx / zone.cols);
            let x, y;

            if (playerIndex === 0) {
                // 下: 左→右、上→下
                x = zone.x + col * (sw + gx);
                y = zone.y + row * (sh + gx);
            } else if (playerIndex === 2) {
                // 上: 左→右、下→上（逆順）
                x = zone.x + col * (sw + gx);
                y = zone.y - row * (sh + gx);
            } else if (playerIndex === 1) {
                // 右: 上→下、左→右
                x = zone.x + row * (sw + gx);
                y = zone.y + col * (sh + gx);
            } else {
                // 左: 上→下、右→左
                x = zone.x - row * (sw + gx);
                y = zone.y + col * (sh + gx);
            }

            const isRiichiDiscard = idx === riichiDiscardIdx;
            const obj = this._drawTile(x, y, tile, { small: true, rotated: isRiichiDiscard });
            this._discardGfxList[playerIndex].push(obj);
        });
    }

    // =====================================
    // 副露描画
    // =====================================

    _getMeldRotatedIndex(meld) {
        if (!meld.claimedTile) return -1; // 暗槓：横向き不要
        return meld.tiles.findIndex(t => t === meld.claimedTile);
    }

    _renderMelds(playerIndex) {
        this._clearGfxList(this._meldGfxList[playerIndex]);
        const melds = this.game_.players[playerIndex].hand.melds;
        const sw = Math.floor(TW * 0.82);
        const sh = Math.floor(TH * 0.82);
        // 2-C: 副露アニメーション — 最後の副露牌数を記録（描画後にポップイン）
        const lastMeldSize = melds.length > 0 ? melds[melds.length - 1].tiles.length : 0;

        if (playerIndex === 0) {
            // 下: 手牌右端(TW=44で13枚→~943)の右に横並び
            let gx = 950;
            melds.forEach(meld => {
                const rIdx = this._getMeldRotatedIndex(meld);
                let tx = gx;
                meld.tiles.forEach((tile, ti) => {
                    const rot = ti === rIdx;
                    const tileW = rot ? sh : sw;
                    const obj = this._drawTile(tx + tileW / 2, 660, tile, { small: true, rotated: rot });
                    this._meldGfxList[0].push(obj);
                    tx += tileW + 2;
                });
                gx = tx + 4;
            });

        } else if (playerIndex === 2) {
            // 上: 13枚手牌右端(TW=44で13枚→~943)の右に横並び
            let gx = 950;
            melds.forEach(meld => {
                const rIdx = this._getMeldRotatedIndex(meld);
                let tx = gx;
                meld.tiles.forEach((tile, ti) => {
                    const rot = ti === rIdx;
                    const tileW = rot ? sh : sw;
                    const obj = this._drawTile(tx + tileW / 2, 72, tile, { small: true, rotated: rot });
                    this._meldGfxList[2].push(obj);
                    tx += tileW + 2;
                });
                gx = tx + 4;
            });

        } else if (playerIndex === 1) {
            // 右: 手牌(x=1240)の左に縦並び
            let gy = 100;
            melds.forEach(meld => {
                const rIdx = this._getMeldRotatedIndex(meld);
                let ty = gy;
                meld.tiles.forEach((tile, ti) => {
                    const rot = ti === rIdx;
                    const tileH = rot ? sw : sh; // 横向き牌は縦方向が短い
                    const obj = this._drawTile(1190, ty + tileH / 2, tile, { small: true, rotated: rot });
                    this._meldGfxList[1].push(obj);
                    ty += tileH + 2;
                });
                gy = ty + 4;
            });

        } else {
            // 左: 手牌(x=42)の右に縦並び
            let gy = 100;
            melds.forEach(meld => {
                const rIdx = this._getMeldRotatedIndex(meld);
                let ty = gy;
                meld.tiles.forEach((tile, ti) => {
                    const rot = ti === rIdx;
                    const tileH = rot ? sw : sh;
                    const obj = this._drawTile(90, ty + tileH / 2, tile, { small: true, rotated: rot });
                    this._meldGfxList[3].push(obj);
                    ty += tileH + 2;
                });
                gy = ty + 4;
            });
        }

        // 2-C: 最後の副露グループのみポップイン（scale 0 → 1）
        if (melds.length > 0 && lastMeldSize > 0) {
            const allObjs = this._meldGfxList[playerIndex];
            const newObjs = allObjs.slice(allObjs.length - lastMeldSize);
            newObjs.forEach((obj, i) => {
                if (!obj?.bg?.active) return;
                const origSX = obj.bg.scaleX;
                const origSY = obj.bg.scaleY;
                obj.bg.setScale(0.01);
                this.tweens.add({
                    targets: obj.bg,
                    scaleX: origSX,
                    scaleY: origSY,
                    duration: 250,
                    delay: i * 40,
                    ease: 'Back.easeOut',
                });
            });
        }
    }

    // =====================================
    // ドラ表示
    // =====================================

    _updateDoraDisplay() {
        this._clearGfxList(this._doraGfxList);
        const indicators = this.game_.wall?.doraIndicators;
        if (!indicators || indicators.length === 0) return;
        const sw = Math.floor(TW * 0.82);
        indicators.forEach((tile, i) => {
            const x = 575 + i * (sw + 3);
            const obj = this._drawTile(x, 325, tile, { small: true });
            this._doraGfxList.push(obj);
        });
    }

    // =====================================
    // リーチ棒表示
    // =====================================

    _updateRiichiSticks() {
        const g = this.game_;

        // 2-D: マスクが変化していなければ再描画しない（無駄な再アニメーションを防止）
        const newMask = g.players.map(p => p.isRiichi ? '1' : '0').join('');
        if (this._lastRiichiMask === newMask) return;
        this._lastRiichiMask = newMask;

        this._riichiStickList.forEach(o => o.destroy());
        this._riichiStickList = [];

        // 各プレイヤーのリーチ棒位置 [x, y, width, height]
        const configs = [
            [640, 625, 70, 9],   // P0 下
            [1130, 360, 9, 70],  // P1 右
            [640,  100, 70, 9],  // P2 上
            [150,  360, 9, 70],  // P3 左
        ];

        g.players.forEach((p, i) => {
            if (!p.isRiichi) return;
            const [x, y, w, h] = configs[i];
            // scale(0) → scale(1) のポップイン（Back.easeOut でバウンス感）
            const stick = this.add.rectangle(x, y, w, h, 0xfff5e0)
                .setStrokeStyle(1, 0x999999)
                .setScale(0);
            this.tweens.add({
                targets: stick,
                scaleX: 1,
                scaleY: 1,
                duration: 250,
                ease: 'Back.easeOut',
            });
            this._riichiStickList.push(stick);
        });
    }
}
