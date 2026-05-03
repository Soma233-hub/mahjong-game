import { Game, GAME_STATE, ROUND_RESULT } from '../core/Game.js';

// 画面定数
const W = 1280, H = 720;
const TILE_W = 40, TILE_H = 60, TILE_GAP = 4;
const COLOR = {
    BG:       0x1a6b2e,
    TILE_FG:  0xfef9f0,
    TILE_BACK:0x3060c0,
    TILE_SEL: 0xffe566,
    TEXT:     '#ffffff',
    BTN:      0x2244aa,
    BTN_HVR:  0x3355cc,
    BTN_RON:  0xaa2222,
    BTN_TSUMO:0x228822,
    PANEL:    0x000000,
};

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.game_ = new Game();
        this._selectedTileIndex = -1;
        this._handSprites    = [];  // 自分の手牌スプライト
        this._discardGroups  = [[], [], [], []];
        this._meldGroups     = [[], [], [], []];
        this._claimButtons   = [];
        this._actionButtons  = [];
        this._pendingClaim   = null; // claimNeeded イベントの options

        this._bindGameEvents();
        this._drawStaticBg();
        this.game_.startGame();
    }

    // =========================================
    // ゲームイベント → UI 更新
    // =========================================

    _bindGameEvents() {
        this.game_.on('draw',         d => this._onDraw(d));
        this.game_.on('discard',      d => this._onDiscard(d));
        this.game_.on('pon',          d => this._onMeld(d));
        this.game_.on('chi',          d => this._onMeld(d));
        this.game_.on('minkan',       d => this._onMeld(d));
        this.game_.on('ankan',        d => this._onMeld(d));
        this.game_.on('kakan',        d => this._onMeld(d));
        this.game_.on('kanDraw',      d => this._onDraw(d));
        this.game_.on('claimNeeded',  d => this._onClaimNeeded(d));
        this.game_.on('roundEnd',     d => this._onRoundEnd(d));
        this.game_.on('gameEnd',      d => this._onGameEnd(d));
    }

    _onDraw({ playerIndex }) {
        this._clearActionButtons();
        this._renderHand(0);
        if (playerIndex === 0) {
            this._showActionButtons();
        }
    }

    _onDiscard({ playerIndex }) {
        this._renderDiscards(playerIndex);
        if (playerIndex === 0) this._renderHand(0);
    }

    _onMeld({ playerIndex }) {
        this._renderMelds(playerIndex);
        this._renderHand(0);
    }

    _onClaimNeeded({ playerIndex, options }) {
        if (playerIndex !== 0) return;
        this._pendingClaim = options;
        this._clearActionButtons();
        this._showClaimButtons(options);
    }

    _onRoundEnd({ result, winnerIndex, yakuResult, han, fu }) {
        this._clearActionButtons();
        this._clearClaimButtons();

        const msgs = {
            [ROUND_RESULT.TSUMO]:     `ツモ！ Player${winnerIndex} (${han}翻${fu}符)`,
            [ROUND_RESULT.RON]:       `ロン！ Player${winnerIndex} (${han}翻${fu}符)`,
            [ROUND_RESULT.RYUUKYOKU]: '流局',
            [ROUND_RESULT.CHOMBO]:    'チョンボ',
        };
        const msg = msgs[result] || `局終了: ${result}`;

        // 半透明オーバーレイ
        const overlay = this.add.rectangle(W/2, H/2, 500, 200, 0x000000, 0.75)
            .setDepth(20);
        this.add.text(W/2, H/2 - 30, msg, {
            fontSize: '32px', color: COLOR.TEXT, align: 'center',
        }).setOrigin(0.5).setDepth(21);

        // 次局ボタン
        const btn = this._makeButton(W/2, H/2 + 50, '次局へ', 140, 44, COLOR.BTN)
            .setDepth(21);
        btn.on('pointerdown', () => {
            overlay.destroy(); btn.destroy();
            const dealerWon = (result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON)
                && winnerIndex === this.game_.dealerIndex;
            this.game_.nextRound(dealerWon);
        });
    }

    _onGameEnd({ players }) {
        this.scene.start('ResultScene', { players });
    }

    // =========================================
    // 手牌描画
    // =========================================

    _renderHand(playerIndex) {
        this._handSprites.forEach(s => s.destroy());
        this._handSprites = [];
        this._selectedTileIndex = -1;

        const player = this.game_.players[playerIndex];
        const tiles  = player.hand.tiles;
        const total  = tiles.length;
        const startX = W / 2 - (total * (TILE_W + TILE_GAP)) / 2 + TILE_W / 2;
        const y      = H - TILE_H / 2 - 16;

        tiles.forEach((tile, i) => {
            const x = startX + i * (TILE_W + TILE_GAP);
            const sprite = this._makeTileSprite(x, y, tile, true);
            sprite.setInteractive({ cursor: 'pointer' });
            sprite.on('pointerover', () => {
                if (this._selectedTileIndex !== i) sprite.setY(y - 6);
            });
            sprite.on('pointerout', () => {
                if (this._selectedTileIndex !== i) sprite.setY(y);
            });
            sprite.on('pointerdown', () => this._onTileClick(i, y, sprite));
            this._handSprites.push(sprite);
        });

        this._updateScoreDisplay();
    }

    _onTileClick(index, baseY, sprite) {
        const state = this.game_.state;
        if (state !== GAME_STATE.PLAYER_ACTION && state !== GAME_STATE.MELD_ACTION) return;

        // 前の選択を解除
        if (this._selectedTileIndex >= 0 && this._handSprites[this._selectedTileIndex]) {
            this._handSprites[this._selectedTileIndex].setY(baseY);
        }

        if (this._selectedTileIndex === index) {
            // 同じ牌を再クリック → 打牌
            this._selectedTileIndex = -1;
            this._clearActionButtons();
            this.game_.processDiscard(0, index);
        } else {
            this._selectedTileIndex = index;
            sprite.setY(baseY - 10);
            sprite.setFillStyle(COLOR.TILE_SEL);
        }
    }

    // =========================================
    // 捨て牌描画（全プレイヤー）
    // =========================================

    _renderDiscards(playerIndex) {
        this._discardGroups[playerIndex].forEach(s => s.destroy());
        this._discardGroups[playerIndex] = [];

        const player   = this.game_.players[playerIndex];
        const discards = player.discards;
        const COLS     = 6;
        const tw = TILE_W * 0.75, th = TILE_H * 0.75;

        const centerPos = [
            { x: W/2, y: H/2 + 140 },  // 自分(南端)
            { x: W/2 - 200, y: H/2 },  // 右(西)
            { x: W/2, y: H/2 - 140 },  // 対面(北端)
            { x: W/2 + 200, y: H/2 },  // 左(東)
        ];
        const { x: cx, y: cy } = centerPos[playerIndex];

        discards.forEach((tile, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const dx = cx + (col - COLS/2 + 0.5) * (tw + 2);
            const dy = cy + row * (th + 2);
            const s = this._makeTileSprite(dx, dy, tile, true, 0.75);
            this._discardGroups[playerIndex].push(s);
        });
    }

    // =========================================
    // 副露描画（全プレイヤー）
    // =========================================

    _renderMelds(playerIndex) {
        this._meldGroups[playerIndex].forEach(s => s.destroy());
        this._meldGroups[playerIndex] = [];

        const player = this.game_.players[playerIndex];
        const melds  = player.hand.melds;
        // 自分の副露は手牌右側に表示
        if (playerIndex !== 0) return;

        let rx = W/2 + 14 * (TILE_W + TILE_GAP) / 2 + 20;
        const ry = H - TILE_H / 2 - 16;

        melds.forEach(meld => {
            meld.tiles.forEach((tile, j) => {
                const s = this._makeTileSprite(rx + j * (TILE_W + TILE_GAP), ry, tile, true, 1.0);
                this._meldGroups[playerIndex].push(s);
            });
            rx += meld.tiles.length * (TILE_W + TILE_GAP) + 8;
        });
    }

    // =========================================
    // アクションボタン
    // =========================================

    _showActionButtons() {
        const player = this.game_.players[0];
        const btns   = [];
        const by     = H - TILE_H - 70;
        let bx       = W/2 - 120;

        if (player.hand.isComplete()) {
            btns.push(this._makeButton(bx, by, 'ツモ', 80, 36, COLOR.BTN_TSUMO));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearActionButtons();
                this.game_.processWin(0);
            });
            bx += 90;
        }

        const ankanIds = player.hand.findAnkanIds();
        if (ankanIds.length > 0 && !player.isRiichi) {
            btns.push(this._makeButton(bx, by, '暗槓', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearActionButtons();
                this.game_.processAnkan(0, ankanIds[0]);
            });
            bx += 90;
        }

        const kakanOpts = player.hand.findKakanOptions();
        if (kakanOpts.length > 0 && !player.isRiichi) {
            btns.push(this._makeButton(bx, by, '加槓', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearActionButtons();
                this.game_.processKakan(0, kakanOpts[0].meldIndex);
            });
            bx += 90;
        }

        if (player.isMenzen && !player.isRiichi && player.hand.isTenpai()
                && this.game_.wall.remaining > 3 && player.score >= 1000) {
            btns.push(this._makeButton(bx, by, 'リーチ', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearActionButtons();
                this._enterRiichiMode();
            });
            bx += 90;
        }

        this._actionButtons = btns;
    }

    _enterRiichiMode() {
        // 手牌をクリックするとリーチ打牌として処理
        const player = this.game_.players[0];
        const tiles  = player.hand.tiles;
        const startX = W/2 - (tiles.length * (TILE_W + TILE_GAP)) / 2 + TILE_W/2;
        const y      = H - TILE_H/2 - 16;

        this._handSprites.forEach((sprite, i) => {
            sprite.removeAllListeners();
            sprite.on('pointerdown', () => {
                this._handSprites.forEach(s => s.removeAllListeners());
                this.game_.processRiichi(0, i);
            });
        });
    }

    _showClaimButtons(opts) {
        const by = H - TILE_H - 70;
        let bx   = W/2 - 180;
        const btns = [];

        if (opts.canRon) {
            btns.push(this._makeButton(bx, by, 'ロン', 80, 36, COLOR.BTN_RON));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'ron' });
            });
            bx += 90;
        }
        if (opts.canPon) {
            btns.push(this._makeButton(bx, by, 'ポン', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'pon' });
            });
            bx += 90;
        }
        if (opts.canMinkan) {
            btns.push(this._makeButton(bx, by, '明槓', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'minkan' });
            });
            bx += 90;
        }
        if (opts.canChi) {
            btns.push(this._makeButton(bx, by, 'チー', 80, 36, COLOR.BTN));
            btns[btns.length-1].on('pointerdown', () => {
                this._clearClaimButtons();
                const tile = this.game_.lastDiscard;
                const options = this.game_.players[0].hand.findChiOptions(tile);
                this.game_.selectClaim(0, { action: 'chi', tileIndices: options[0] });
            });
            bx += 90;
        }

        // パスボタン（常に表示）
        btns.push(this._makeButton(bx, by, 'パス', 80, 36, 0x555555));
        btns[btns.length-1].on('pointerdown', () => {
            this._clearClaimButtons();
            this.game_.selectClaim(0, { action: 'pass' });
        });

        this._claimButtons = btns;
    }

    _clearActionButtons() {
        this._actionButtons.forEach(b => b.destroy());
        this._actionButtons = [];
    }

    _clearClaimButtons() {
        this._claimButtons.forEach(b => b.destroy());
        this._claimButtons = [];
    }

    // =========================================
    // スコア・情報パネル
    // =========================================

    _drawStaticBg() {
        this.add.rectangle(W/2, H/2, W, H, COLOR.BG);
        // 場の中央パネル
        this.add.rectangle(W/2, H/2, 280, 280, COLOR.PANEL, 0.3).setDepth(0);

        // 対戦相手の手牌（背面）
        this._drawOpponentHands();

        // スコアテキスト（後から更新する）
        this._scoreTxts = [0, 1, 2, 3].map(i => {
            const pos = this._scorePos(i);
            return this.add.text(pos.x, pos.y, '', {
                fontSize: '16px', color: COLOR.TEXT,
            }).setOrigin(0.5).setDepth(5);
        });

        // 局表示
        this._roundTxt = this.add.text(W/2, H/2, '', {
            fontSize: '20px', color: COLOR.TEXT,
        }).setOrigin(0.5).setDepth(5);

        this._updateScoreDisplay();
    }

    _drawOpponentHands() {
        // 右(1): 縦方向
        for (let i = 0; i < 13; i++) {
            this.add.rectangle(W - 48, H/2 - 6*TILE_W + i*(TILE_W+4), TILE_H*0.7, TILE_W*0.7, COLOR.TILE_BACK).setDepth(1);
        }
        // 対面(2): 横方向(反転)
        for (let i = 0; i < 13; i++) {
            this.add.rectangle(W/2 - 6*TILE_W + i*(TILE_W+4), 28, TILE_W*0.7, TILE_H*0.7, COLOR.TILE_BACK).setDepth(1);
        }
        // 左(3): 縦方向
        for (let i = 0; i < 13; i++) {
            this.add.rectangle(48, H/2 - 6*TILE_W + i*(TILE_W+4), TILE_H*0.7, TILE_W*0.7, COLOR.TILE_BACK).setDepth(1);
        }
    }

    _updateScoreDisplay() {
        const g = this.game_;
        const winds = ['東', '南', '西', '北'];
        [0, 1, 2, 3].forEach(i => {
            const seat = (i - g.dealerIndex + 4) % 4;
            const lbl  = `P${i}(${winds[seat]}) ${g.players[i].score}点`;
            this._scoreTxts[i].setText(lbl);
        });
        const roundWinds = ['東', '南', '西', '北'];
        const roundNum   = (g.round % 4) + 1;
        this._roundTxt.setText(`${roundWinds[Math.floor(g.round/4)]}${roundNum}局 ${g.honba}本場`);
    }

    _scorePos(playerIndex) {
        const pos = [
            { x: W/2,       y: H - 8 },   // 自分
            { x: W - 80,    y: H/2 },      // 右
            { x: W/2,       y: 8 },         // 対面
            { x: 80,        y: H/2 },       // 左
        ];
        return pos[playerIndex];
    }

    // =========================================
    // 牌スプライトユーティリティ
    // =========================================

    _makeTileSprite(x, y, tile, faceUp = true, scale = 1.0) {
        const tw = TILE_W * scale, th = TILE_H * scale;
        const rect = this.add.rectangle(x, y, tw - 2, th - 2,
            faceUp ? COLOR.TILE_FG : COLOR.TILE_BACK
        ).setDepth(3);

        if (faceUp && tile) {
            this.add.text(x, y, this._tileLabel(tile), {
                fontSize: `${Math.floor(14 * scale)}px`,
                color:    tile.suit === 'honor' ? '#cc2222' : '#111111',
                align:    'center',
            }).setOrigin(0.5).setDepth(4);
        }

        return rect;
    }

    _tileLabel(tile) {
        const suitChars = { man: '萬', pin: '筒', sou: '索', honor: '' };
        const honorNames = ['', '東', '南', '西', '北', '白', '発', '中'];
        if (tile.suit === 'honor') return honorNames[tile.num] || '?';
        return `${tile.num}${suitChars[tile.suit]}`;
    }

    _makeButton(x, y, label, w, h, color) {
        const bg = this.add.rectangle(x, y, w, h, color).setDepth(10).setInteractive();
        this.add.text(x, y, label, {
            fontSize: '18px', color: COLOR.TEXT,
        }).setOrigin(0.5).setDepth(11);
        bg.on('pointerover', () => bg.setFillStyle(COLOR.BTN_HVR));
        bg.on('pointerout',  () => bg.setFillStyle(color));
        return bg;
    }
}
