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
        const settings = this.registry.get('gameSettings') ?? {};
        this.game_ = new Game({
            useIppatsu: settings.useIppatsu ?? true,
            useUraDora: settings.useUraDora ?? true,
        });
        this._umaRule = settings.umaRule ?? '10-20';

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
        this._lastDiscardPos        = null;   // 2-B: 捨て牌アニメ用
        this._prevScores            = null;   // 4-D: スコアバーフラッシュ用

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

        // 4-C: 風牌バッジ（P0=下, P1=右, P2=上, P3=左）
        const windStyle = { fontSize: '20px', color: '#ffcc44', fontFamily: 'monospace', backgroundColor: '#1a1a00', padding: { x: 5, y: 3 } };
        this._windBadges = [
            this.add.text( 490, 605, '', windStyle).setOrigin(0.5),  // P0 下
            this.add.text(1060, 360, '', windStyle).setOrigin(0.5),  // P1 右
            this.add.text( 200,  72, '', windStyle).setOrigin(0.5),  // P2 上
            this.add.text( 210, 360, '', windStyle).setOrigin(0.5),  // P3 左
        ];

        // 5-B: 役一覧「?」ボタン
        this._yakuPopupObjs = [];
        const helpBg  = this.add.rectangle(1260, 18, 36, 28, 0x444400).setDepth(5).setInteractive({ useHandCursor: true });
        const helpTxt = this.add.text(1260, 18, '?', { fontSize: '16px', color: '#ffee44', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(6);
        helpBg.on('pointerover',  () => helpBg.setFillStyle(0x666600))
              .on('pointerout',   () => helpBg.setFillStyle(0x444400))
              .on('pointerdown',  () => this._toggleYakuPopup());

        this._prevScores = this.game_.players.map(p => p.score);
        this._updateInfoTexts();
    }

    _updateInfoTexts() {
        const g = this.game_;
        const windNames = ['東', '南', '西', '北'];
        const roundWind = windNames[Math.floor(g.round / 4)] ?? '東';
        const roundNum  = (g.round % 4) + 1;
        this._roundTxt.setText(`${roundWind}${roundNum}局 ${g.honba}本場`);

        const seatWinds = windNames;
        const labels    = ['自分', '右', '対面', '左'];
        g.players.forEach((p, i) => {
            const riichiMark = p.isRiichi ? '★' : '';
            const seatWind   = seatWinds[(i - (g.dealerIndex ?? 0) + 4) % 4];
            this._scoreTxts[i].setText(`${labels[i]}(${seatWind}): ${p.score}${riichiMark}`);
        });

        // 4-D: 点数変動時にスコアテキストをフラッシュ
        if (this._prevScores) {
            g.players.forEach((p, i) => {
                if (p.score !== this._prevScores[i]) this._flashScoreText(i);
            });
        }
        this._prevScores = g.players.map(p => p.score);

        const kyotakuStr = g.kyotaku > 0 ? `  供託${g.kyotaku}本` : '';
        this._wallTxt.setText(`山 ${g.wall.remaining}枚${kyotakuStr}`);

        this._updateDoraDisplay();
        this._updateRiichiSticks();
        this._updateWindBadges();
    }

    // =====================================
    // イベントハンドラ
    // =====================================

    _onDraw({ playerIndex }) {
        this._clearActionButtons();
        this._renderHand(playerIndex);
        this._updateInfoTexts();
        this._playSfxDraw();

        if (playerIndex === 0) {
            this._animateDrawP0();
            this._showPlayer0Actions();
        }
    }

    _onDiscard({ playerIndex }) {
        this._renderHand(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfoTexts();
        this._playSfxDiscard();

        if (playerIndex === 0 && this._lastDiscardPos) {
            this._animateDiscardP0();
            this._lastDiscardPos = null;
        }
    }

    _onMeld({ playerIndex }) {
        this._renderHand(playerIndex);
        this._renderMelds(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfoTexts();
        this._animateMeld(playerIndex);
        this._playSfxMeld();
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

        const panelData = { result, winnerIndex, yakuResult, han, fu, total, tenpaiIndices };

        if (result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON) {
            this._animateScoreFloat(winnerIndex, total);   // 4-B: 点数フロート
            this._animateWin(winnerIndex, yakuResult, result,
                () => this._showRoundEndPanel(panelData));
        } else {
            this._showRoundEndPanel(panelData);
        }
    }

    _showRoundEndPanel({ result, winnerIndex, yakuResult, han, fu, total, tenpaiIndices }) {
        const g = this.game_;
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
            else tenpaiStr = `テンパイ: ${tenpaiIndices.map(i => ['自分','右','対面','左'][i]).join(' ')}`;
            lines = ['流局', tenpaiStr];
        } else if (result === ROUND_RESULT.CHOMBO) {
            lines = [`チョンボ  ${playerLabels[winnerIndex]}`];
        }

        lines.push('');
        lines.push(g.players.map((p, i) => `${['自分','右','対面','左'][i]}: ${p.score}`).join('  '));

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
                const obj = this._handGfxList[0][idx];
                this._lastDiscardPos = obj?.bg ? { x: obj.bg.x, y: obj.bg.y } : null;
                g.processDiscard(0, idx);
            }
            return;
        }

        if (this._selectedIdx === idx) {
            // 同じ牌を再クリック → 打牌実行
            this._clearActionButtons();
            this._hintTxt.setText('');
            const obj = this._handGfxList[0][idx];
            this._lastDiscardPos = obj?.bg ? { x: obj.bg.x, y: obj.bg.y } : null;
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
                const obj = this._handGfxList[0][tileIdx];
                this._lastDiscardPos = obj?.bg ? { x: obj.bg.x, y: obj.bg.y } : null;
                this._playSfxRiichi();
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

    // =====================================
    // アニメーション（Phase UI-2）
    // =====================================

    // 2-A: P0 ツモアニメーション（壁→手牌末尾へスライドIN 300ms）
    _animateDrawP0() {
        const objs = this._handGfxList[0];
        if (objs.length === 0) return;
        const last = objs[objs.length - 1];
        if (!last?.bg) return;
        const finalX = last.bg.x;
        const finalY = last.bg.y;
        last.bg.setPosition(1100, 640);
        this.tweens.add({
            targets: last.bg,
            x: finalX,
            y: finalY,
            duration: 300,
            ease: 'Power2.Out',
        });
    }

    // 2-B: P0 捨て牌アニメーション（手牌位置→捨て牌ゾーンへスライド 200ms）
    _animateDiscardP0() {
        const discardObjs = this._discardGfxList[0];
        if (discardObjs.length === 0 || !this._lastDiscardPos) return;
        const newest = discardObjs[discardObjs.length - 1];
        if (!newest?.bg) return;
        const finalX = newest.bg.x;
        const finalY = newest.bg.y;
        newest.bg.setPosition(this._lastDiscardPos.x, this._lastDiscardPos.y);
        this.tweens.add({
            targets: newest.bg,
            x: finalX,
            y: finalY,
            duration: 200,
            ease: 'Power2.Out',
        });
    }

    // 2-C: 副露アニメーション（新規副露牌が手牌方向からスライドIN 400ms）
    _animateMeld(playerIndex) {
        const melds = this.game_.players[playerIndex].hand.melds;
        if (melds.length === 0) return;
        const lastMeld = melds[melds.length - 1];
        const newCount = lastMeld.tiles.length;
        const gfxList  = this._meldGfxList[playerIndex];
        const newObjs  = gfxList.slice(gfxList.length - newCount);

        const origins = [
            { x: 640, y: 660 },
            { x: 1240, y: 360 },
            { x: 640, y: 72 },
            { x: 42, y: 360 },
        ];
        const o = origins[playerIndex];

        newObjs.forEach((obj, i) => {
            if (!obj?.bg) return;
            const fx = obj.bg.x;
            const fy = obj.bg.y;
            obj.bg.setPosition(o.x, o.y).setAlpha(0);
            this.tweens.add({
                targets: obj.bg,
                x: fx,
                y: fy,
                alpha: 1,
                duration: 400,
                ease: 'Power2.Out',
                delay: i * 40,
            });
        });
    }

    // 2-E: 和了演出（役名フラッシュ + P0手牌ハイライト、計500ms → パネル表示）
    _animateWin(winnerIndex, yakuResult, result, onComplete) {
        this._playSfxWin();

        if (winnerIndex === 0) {
            this._handGfxList[0].forEach(obj => {
                if (obj?.bg) obj.bg.setTint(0xffdd44);
            });
        }

        const label    = result === ROUND_RESULT.TSUMO ? 'ツモ！' : 'ロン！';
        const yakuLine = (yakuResult?.yaku || []).slice(0, 2).map(y => y.name).join('  ');
        const flashTxt = this.add.text(640, 360, yakuLine ? `${label}\n${yakuLine}` : label, {
            fontSize: '52px', color: '#ffdd00', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 5, align: 'center',
        }).setOrigin(0.5).setDepth(50).setAlpha(0).setScale(0.6);

        this.tweens.add({
            targets: flashTxt,
            alpha: 1,
            scale: 1,
            duration: 200,
            ease: 'Back.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: flashTxt,
                    alpha: 0,
                    delay: 100,
                    duration: 200,
                    onComplete: () => {
                        flashTxt.destroy();
                        if (winnerIndex === 0) {
                            this._handGfxList[0].forEach(obj => {
                                if (obj?.bg) obj.bg.clearTint();
                            });
                        }
                        onComplete();
                    },
                });
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

        // 4-A: テンパイ維持候補インデックス（薄い青ハイライト）
        const tenpaiIdxs = this._getTenpaiCandidates(player);

        tiles.forEach((tile, idx) => {
            const x    = startX + idx * (TW + TG);
            const isLast = idx === n - 1;
            const dy   = isLast ? -8 : 0; // ツモ牌を少し持ち上げる
            const obj  = this._drawTile(x, 660 + dy, tile, {
                selected: this._selectedIdx === idx,
            });
            // 選択中でないテンパイ候補牌に薄い水色 tint
            if (tenpaiIdxs.includes(idx) && this._selectedIdx !== idx) {
                obj.bg?.setTint(0xaaddff);
            }
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
        const discards  = player.discards;
        const zone     = DISCARD_ZONES[playerIndex];
        const sw = Math.floor(TW * 0.82);
        const sh = Math.floor(TH * 0.82);
        const gx = 2;

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

            // リーチ宣言牌は横向き表示（2-D）
            const isRiichiTile = player.isRiichi &&
                                 player.riichiDiscardCount >= 0 &&
                                 idx === player.riichiDiscardCount;
            const obj = this._drawTile(x, y, tile, { small: true, rotated: isRiichiTile });
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
    // 音響 (Phase UI-3)
    // =====================================

    // 指定周波数・長さのトーンを WebAudio API でスケジュール再生する低レベルヘルパー。
    // startOffset(秒) で遅延可能。freqEnd を指定すると線形スイープになる。
    _scheduleNote(freq, duration, startOffset = 0, type = 'square', vol = 0.15, freqEnd = null) {
        const ctx = this.registry.get('audioCtx');
        if (!ctx || !this.registry.get('soundEnabled')) return;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        osc.type = type;
        const t = ctx.currentTime + startOffset;
        osc.frequency.setValueAtTime(freq, t);
        if (freqEnd != null) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t);
        osc.stop(t + duration);
    }

    // 3-A: ツモ音（短いクリック音）
    _playSfxDraw()    { this._scheduleNote(880, 0.06); }

    // 3-A: 打牌音（やや低いクリック音）
    _playSfxDiscard() { this._scheduleNote(660, 0.08); }

    // 3-B: 副露SE（2音で「ポン」感）
    _playSfxMeld() {
        this._scheduleNote(700, 0.10);
        this._scheduleNote(500, 0.10, 0.10);
    }

    // 3-B: リーチSE（上昇スイープ）
    _playSfxRiichi() { this._scheduleNote(440, 0.30, 0, 'triangle', 0.18, 880); }

    // 3-C: 和了SE（上昇アルペジオ C5-E5-G5-C6）
    _playSfxWin() {
        [523, 659, 784, 1047].forEach((f, i) =>
            this._scheduleNote(f, 0.30, i * 0.10, 'triangle', 0.20));
    }

    // =====================================
    // リーチ棒表示
    // =====================================

    _updateRiichiSticks() {
        this._riichiStickList.forEach(o => o.destroy());
        this._riichiStickList = [];

        const g = this.game_;
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
            const stick = this.add.rectangle(x, y, w, h, 0xfff5e0)
                .setStrokeStyle(1, 0x999999);
            this._riichiStickList.push(stick);
        });
    }

    // =====================================
    // Phase UI-4: UX 改善
    // =====================================

    // 4-A: テンパイ維持候補インデックスを返す（14枚保持時かつ非リーチのみ）
    _getTenpaiCandidates(player) {
        if (player.hand.tiles.length !== 14 || player.isRiichi) return [];
        const result = [];
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const removed = player.hand.tiles.splice(i, 1)[0];
            if (player.hand.isTenpai()) result.push(i);
            player.hand.tiles.splice(i, 0, removed);
        }
        return result;
    }

    // 4-B: 和了者エリアから点数フロートテキストが上昇する演出
    _animateScoreFloat(winnerIndex, total) {
        if (!total || total <= 0) return;
        const paths = [
            { x: 640,  y: 605, ex: 640,  ey: 490 },  // P0 下→上
            { x: 1060, y: 360, ex: 940,  ey: 300 },  // P1 右→左上
            { x: 640,  y: 115, ex: 640,  ey: 230 },  // P2 上→下
            { x: 210,  y: 360, ex: 330,  ey: 300 },  // P3 左→右上
        ];
        const p = paths[winnerIndex] ?? paths[0];
        const txt = this.add.text(p.x, p.y, `+${total}`, {
            fontSize: '36px', color: '#ffdd00', fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(45).setAlpha(0);
        this.tweens.add({
            targets: txt,
            x: p.ex,
            y: p.ey,
            alpha: { from: 0, to: 1 },
            duration: 700,
            ease: 'Power2.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: txt,
                    alpha: 0,
                    duration: 400,
                    delay: 300,
                    onComplete: () => txt.destroy(),
                });
            },
        });
    }

    // 4-C: 各プレイヤーの座席風（東南西北）バッジを更新
    _updateWindBadges() {
        const g          = this.game_;
        const windChars  = ['東', '南', '西', '北'];
        const dealer     = g.dealerIndex ?? 0;
        this._windBadges.forEach((badge, playerIdx) => {
            badge.setText(windChars[(playerIdx - dealer + 4) % 4]);
        });
    }

    // 4-D: 点数変動時のスコアテキスト拡大フラッシュ
    _flashScoreText(i) {
        const txt = this._scoreTxts[i];
        if (!txt) return;
        this.tweens.add({
            targets: txt,
            scaleX: 1.45,
            scaleY: 1.45,
            duration: 150,
            yoyo: true,
            ease: 'Power2.Out',
        });
    }

    // =====================================
    // 5-B: 役一覧ポップアップ
    // =====================================

    _toggleYakuPopup() {
        if (this._yakuPopupObjs.length > 0) {
            this._closeYakuPopup();
        } else {
            this._showYakuPopup();
        }
    }

    _closeYakuPopup() {
        this._yakuPopupObjs.forEach(o => o.destroy());
        this._yakuPopupObjs = [];
    }

    _showYakuPopup() {
        const depth   = 90;
        const PW      = 1180;
        const PH      = 620;
        const PX      = 640;
        const PY      = 375;

        // 半透明背景
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setDepth(depth);
        overlay.setInteractive().on('pointerdown', () => this._closeYakuPopup());

        // パネル
        const panel = this.add.rectangle(PX, PY, PW, PH, 0x1a2a1a).setDepth(depth + 1)
            .setStrokeStyle(2, 0x88aa44);

        // タイトル
        const title = this.add.text(PX, PY - PH / 2 + 22, '役一覧', {
            fontSize: '18px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(depth + 2);

        // ×ボタン
        const closeBg = this.add.rectangle(PX + PW / 2 - 22, PY - PH / 2 + 22, 34, 28, 0x882222)
            .setDepth(depth + 2).setInteractive({ useHandCursor: true });
        const closeTxt = this.add.text(PX + PW / 2 - 22, PY - PH / 2 + 22, '×', {
            fontSize: '16px', color: '#fff', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(depth + 3);
        closeBg.on('pointerover',  () => closeBg.setFillStyle(0xbb3333))
               .on('pointerout',   () => closeBg.setFillStyle(0x882222))
               .on('pointerdown',  () => this._closeYakuPopup());

        // 仕切り線（タイトル下）
        const divLine = this.add.rectangle(PX, PY - PH / 2 + 44, PW - 20, 1, 0x556633).setDepth(depth + 2);

        // 役テーブルデータ （[name, han_str, note]）
        // han_str: '1翻' / '1↓0' / '2↓1' etc.  note: '門前のみ' etc.
        const COL_DATA = [
            // ---- 列 0: 1翻役 ----
            [
                ['— 1翻 —',           '',         '',          '#ffee88'],
                ['リーチ',             '1翻',      '門前',      '#ffffff'],
                ['ダブルリーチ',       '2翻',      '門前',      '#ffffff'],
                ['一発',               '1翻',      '門前',      '#ffffff'],
                ['門前清自摸和',       '1翻',      '門前',      '#ffffff'],
                ['平和',               '1翻',      '門前',      '#ffffff'],
                ['一盃口',             '1翻',      '門前',      '#ffffff'],
                ['',                  '',          '',          ''],
                ['— 1翻（共通）—',    '',          '',         '#ffee88'],
                ['タンヤオ',           '1翻',      '',          '#ffffff'],
                ['白 / 發 / 中',       '1翻',      '',          '#ffffff'],
                ['自風 / 場風',        '1翻',      '',          '#ffffff'],
                ['ハイテイ/ホウテイ',  '1翻',      '',          '#ffffff'],
                ['嶺上開花',           '1翻',      '',          '#ffffff'],
                ['槍槓',               '1翻',      '',          '#ffffff'],
            ],
            // ---- 列 1: 2〜6翻役 ----
            [
                ['— 2翻 —',           '',         '',          '#ffee88'],
                ['七対子',             '2翻',      '門前',      '#ffffff'],
                ['二盃口',             '3翻',      '門前',      '#ffffff'],
                ['三色同順',           '2↓1翻',   '',          '#ffffff'],
                ['一気通貫',           '2↓1翻',   '',          '#ffffff'],
                ['混全帯么九',         '2↓1翻',   '',          '#ffffff'],
                ['対々和',             '2翻',      '',          '#ffffff'],
                ['三暗刻',             '2翻',      '',          '#ffffff'],
                ['三色同刻',           '2翻',      '',          '#ffffff'],
                ['三槓子',             '2翻',      '',          '#ffffff'],
                ['混老頭',             '2翻',      '',          '#ffffff'],
                ['小三元',             '2翻',      '',          '#ffffff'],
                ['',                  '',          '',          ''],
                ['— 3翻 / 6翻 —',     '',         '',          '#ffee88'],
                ['混一色',             '3↓2翻',   '',          '#ffffff'],
                ['純全帯么九',         '3↓2翻',   '',          '#ffffff'],
                ['清一色',             '6↓5翻',   '',          '#ffffff'],
            ],
            // ---- 列 2: 役満 ----
            [
                ['— 役満 —',          '',         '',          '#ff8844'],
                ['天和',               '役満',     '親のみ',    '#ffffff'],
                ['地和',               '役満',     '子のみ',    '#ffffff'],
                ['国士無双',           '役満',     '門前',      '#ffffff'],
                ['四暗刻',             '役満',     '門前',      '#ffffff'],
                ['大三元',             '役満',     '',          '#ffffff'],
                ['字一色',             '役満',     '',          '#ffffff'],
                ['緑一色',             '役満',     '',          '#ffffff'],
                ['小四喜',             '役満',     '',          '#ffffff'],
                ['九連宝燈',           '役満',     '門前',      '#ffffff'],
                ['四槓子',             '役満',     '',          '#ffffff'],
                ['',                  '',          '',          ''],
                ['— ダブル役満 —',     '',         '',          '#ff4444'],
                ['国士無双十三面',     'ダブル',   '門前',      '#ffaaaa'],
                ['四暗刻単騎',         'ダブル',   '門前',      '#ffaaaa'],
                ['大四喜',             'ダブル',   '',          '#ffaaaa'],
                ['純正九連宝燈',       'ダブル',   '門前',      '#ffaaaa'],
            ],
        ];

        const COL_COUNT    = COL_DATA.length;
        const COL_W        = (PW - 40) / COL_COUNT;
        const ROW_H        = 21;
        const START_X      = PX - PW / 2 + 20;
        const START_Y      = PY - PH / 2 + 60;

        const objs = [overlay, panel, title, closeBg, closeTxt, divLine];

        for (let col = 0; col < COL_COUNT; col++) {
            const cx = START_X + col * COL_W;
            // 列区切り線
            if (col > 0) {
                objs.push(this.add.rectangle(cx - 6, PY, 1, PH - 50, 0x446633).setDepth(depth + 2));
            }
            const rows = COL_DATA[col];
            for (let row = 0; row < rows.length; row++) {
                const [name, han, note, color] = rows[row];
                if (!name) continue;
                const y = START_Y + row * ROW_H;

                // 役名
                objs.push(this.add.text(cx, y, name, {
                    fontSize: '12px', color: color || '#ffffff', fontFamily: 'monospace',
                }).setDepth(depth + 3).setOrigin(0, 0.5));

                // 翻数（右揃え）
                if (han) {
                    objs.push(this.add.text(cx + COL_W - 60, y, han, {
                        fontSize: '11px', color: '#aaddaa', fontFamily: 'monospace',
                    }).setDepth(depth + 3).setOrigin(0, 0.5));
                }
                // 備考
                if (note) {
                    objs.push(this.add.text(cx + COL_W - 14, y, note, {
                        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
                    }).setDepth(depth + 3).setOrigin(1, 0.5));
                }
            }
        }

        this._yakuPopupObjs = objs;
    }
}
