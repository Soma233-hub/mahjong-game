import { Game, GAME_STATE, ROUND_RESULT } from '../core/Game.js';
import {
    handPositions, discardPosition, meldTilePositions,
    CW, CH, TW, TH, SW, SH,
} from '../ui/Layout.js';

// ── 定数 ──────────────────────────────────────────────────────────
const TILE_FACE   = 0xfaf0dc;
const TILE_BACK   = 0x1a4060;
const TILE_BORDER = 0x222222;
const HL_RIICHI   = 0x55ff22;   // 有効リーチ打牌
const HL_LAST     = 0xffee00;   // 最後に捨てた牌

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.game_ = new Game();

        this._handObjs    = [[], [], [], []];
        this._discardObjs = [[], [], [], []];
        this._meldObjs    = [[], [], [], []];
        this._infoObjs    = [];
        this._claimPanel  = null;  // ボタン配列 or null
        this._actionPanel = null;  // ボタン配列 or null
        this._roundPanel  = null;  // オブジェクト配列 or null
        this._riichiMode  = false; // リーチ宣言待ち状態

        this._bindEvents();
        this._drawBackground();
        this.game_.startGame();
    }

    // ── イベントバインド ───────────────────────────────────────────

    _bindEvents() {
        const g = this.game_;
        g.on('draw',        d => this._onDraw(d, false));
        g.on('kanDraw',     d => this._onDraw(d, true));
        g.on('discard',     d => this._onDiscard(d));
        g.on('pon',         d => this._onMeld(d.playerIndex));
        g.on('chi',         d => this._onMeld(d.playerIndex));
        g.on('minkan',      d => this._onMeld(d.playerIndex));
        g.on('ankan',       d => this._onMeld(d.playerIndex));
        g.on('kakan',       d => this._onMeld(d.playerIndex));
        g.on('claimNeeded', d => this._onClaimNeeded(d));
        g.on('roundEnd',    d => this._onRoundEnd(d));
        g.on('gameEnd',     d => this._onGameEnd(d));
    }

    // ── イベントハンドラ ─────────────────────────────────────────────

    _onDraw({ playerIndex }, isKanDraw) {
        this._hideClaimPanel();
        this._hideActionPanel();

        // ラウンド開始の最初のドロー（turn=1）で全プレイヤーを一括描画
        if (!isKanDraw && this.game_.turn === 1) {
            this._renderAll();
        } else {
            this._renderHand(playerIndex);
        }
        this._updateInfo();

        if (playerIndex === 0) this._showActionButtons();
    }

    _onDiscard({ playerIndex }) {
        this._hideActionPanel();
        this._riichiMode = false;
        this._renderHand(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfo();
    }

    _onMeld(playerIndex) {
        this._hideClaimPanel();
        this._renderHand(playerIndex);
        this._renderMelds(playerIndex);
        this._updateInfo();
        if (playerIndex === 0) this._showActionButtons();
    }

    _onClaimNeeded({ playerIndex, options }) {
        if (playerIndex === 0) this._showClaimPanel(options);
    }

    _onRoundEnd(data) {
        this._hideClaimPanel();
        this._hideActionPanel();
        this._renderAll();
        this._showRoundPanel(data);
    }

    _onGameEnd({ players }) {
        this.scene.start('ResultScene', { players });
    }

    // ── 全体再描画 ────────────────────────────────────────────────

    _renderAll() {
        for (let i = 0; i < 4; i++) {
            this._renderHand(i);
            this._renderDiscards(i);
            this._renderMelds(i);
        }
        this._updateInfo();
    }

    // ── 手牌描画 ──────────────────────────────────────────────────

    _renderHand(pi) {
        this._handObjs[pi].forEach(o => o.destroy());
        this._handObjs[pi] = [];

        const player = this.game_.players[pi];
        const tiles  = player.hand.tiles;
        if (!tiles.length) return;

        const state       = this.game_.state;
        const isCurrent   = pi === this.game_.currentIndex;
        const hasDrawTile = isCurrent && state === GAME_STATE.PLAYER_ACTION;
        const meldCount   = player.hand.melds.length;
        const positions   = handPositions(pi, tiles.length, hasDrawTile, meldCount);

        const isLarge      = pi === 0;
        const tw           = isLarge ? TW : SW;
        const th           = isLarge ? TH : SH;
        const isFaceDown   = pi !== 0;
        const isInteract   = pi === 0 &&
            (state === GAME_STATE.PLAYER_ACTION || state === GAME_STATE.MELD_ACTION);

        // リーチモード時: 各牌を捨てた後テンパイになるか事前計算
        const riichiValid = [];
        if (pi === 0 && this._riichiMode) {
            for (let i = 0; i < tiles.length; i++) {
                const t = tiles.splice(i, 1)[0];
                riichiValid[i] = player.hand.isTenpai() && !player.isFuriten;
                tiles.splice(i, 0, t);
            }
        }

        positions.forEach((pos, i) => {
            const tile     = tiles[i];
            let   hlColor  = null;
            if (pi === 0 && this._riichiMode) {
                hlColor = riichiValid[i] ? HL_RIICHI : 0x888888;
            }

            const obj = this._makeTile(pos.x, pos.y, tile, isFaceDown, tw, th, pos.angle, hlColor);

            if (isInteract) {
                obj.setInteractive(
                    new Phaser.Geom.Rectangle(-TW / 2, -TH / 2, TW, TH),
                    Phaser.Geom.Rectangle.Contains,
                );
                obj.on('pointerover', () => obj.setAlpha(0.75));
                obj.on('pointerout',  () => obj.setAlpha(1));
                obj.on('pointerdown', () => this._onTileClick(i));
            }

            this._handObjs[pi].push(obj);
        });
    }

    // ── 捨て牌描画 ────────────────────────────────────────────────

    _renderDiscards(pi) {
        this._discardObjs[pi].forEach(o => o.destroy());
        this._discardObjs[pi] = [];

        const player  = this.game_.players[pi];
        const lastIdx = player.discards.length - 1;
        const isLastP = pi === this.game_.lastDiscardPlayer;

        player.discards.forEach((tile, i) => {
            const pos = discardPosition(pi, i);
            const hl  = (isLastP && i === lastIdx) ? HL_LAST : null;
            const obj = this._makeTile(pos.x, pos.y, tile, false, SW, SH, pos.angle, hl);
            this._discardObjs[pi].push(obj);
        });
    }

    // ── 副露描画 ──────────────────────────────────────────────────

    _renderMelds(pi) {
        this._meldObjs[pi].forEach(o => o.destroy());
        this._meldObjs[pi] = [];

        const player = this.game_.players[pi];
        let offset   = 0;
        player.hand.melds.forEach((meld, mi) => {
            const tc  = meld.tiles.length;
            const pos = meldTilePositions(pi, mi, offset, tc);
            meld.tiles.forEach((tile, ti) => {
                const obj = this._makeTile(pos[ti].x, pos[ti].y, tile, false, SW, SH, pos[ti].angle);
                this._meldObjs[pi].push(obj);
            });
            offset += tc;
        });
    }

    // ── 情報パネル ────────────────────────────────────────────────

    _updateInfo() {
        this._infoObjs.forEach(o => o.destroy());
        this._infoObjs = [];

        const g = this.game_;
        const names  = ['あなた', '下家', '対面', '上家'];
        const sPos   = [
            { x: 30,   y: 708, ox: 0,   oy: 0.5 },
            { x: 1250, y: 52,  ox: 1,   oy: 0.5 },
            { x: 640,  y: 58,  ox: 0.5, oy: 0.5 },
            { x: 30,   y: 52,  ox: 0,   oy: 0.5 },
        ];

        g.players.forEach((p, i) => {
            const dealer = i === g.dealerIndex ? '(親)' : '';
            const riichi = p.isRiichi ? '★' : '';
            const label  = `${names[i]}${dealer}${riichi}  ${p.score}`;
            const txt = this.add.text(sPos[i].x, sPos[i].y, label, {
                fontSize: '13px', color: '#ffffff',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(sPos[i].ox, sPos[i].oy);
            this._infoObjs.push(txt);
        });

        // 中央ラベル（局・本場・供託）
        const winds = ['東', '南', '西', '北'];
        const label  = `${winds[g.dealerIndex % 4]}${g.round + 1}局  ${g.honba}本場`;
        const kyotaku = g.kyotaku > 0 ? `  供託${g.kyotaku}` : '';
        const center = this.add.text(640, 360, label + kyotaku, {
            fontSize: '16px', color: '#ffff99',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);
        this._infoObjs.push(center);
    }

    // ── タイルオブジェクト生成 ────────────────────────────────────

    _makeTile(x, y, tile, faceDown, w, h, angle = 0, hlColor = null) {
        const c   = this.add.container(x, y);
        const gfx = this.add.graphics();

        gfx.fillStyle(faceDown ? TILE_BACK : TILE_FACE, 1);
        gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
        gfx.lineStyle(1.5, hlColor || TILE_BORDER, 1);
        gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 3);
        if (hlColor) {
            gfx.lineStyle(2.5, hlColor, 1);
            gfx.strokeRoundedRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 2);
        }
        c.add(gfx);

        if (!faceDown && tile) {
            const fs  = w >= TW ? '15px' : '10px';
            const txt = this.add.text(0, 0, tile.toString(), {
                fontSize: fs,
                color:    this._tileColor(tile),
                fontStyle: 'bold',
            }).setOrigin(0.5);
            c.add(txt);
        }

        c.setRotation(angle);
        return c;
    }

    _tileColor(tile) {
        if (tile.isRed) return '#ff2222';
        switch (tile.suit) {
            case 'man':   return '#cc0000';
            case 'pin':   return '#0044cc';
            case 'sou':   return '#005500';
            case 'honor':
                if (tile.number === 5) return '#999999'; // 白
                if (tile.number === 6) return '#005500'; // 發
                if (tile.number === 7) return '#cc0000'; // 中
                return '#222222';                         // 風牌
        }
        return '#222222';
    }

    // ── 手牌クリック ──────────────────────────────────────────────

    _onTileClick(index) {
        const player = this.game_.players[0];
        const state  = this.game_.state;
        if (state !== GAME_STATE.PLAYER_ACTION && state !== GAME_STATE.MELD_ACTION) return;

        if (player.isRiichi) {
            // リーチ中: 最後のツモ牌のみ打牌可能
            if (index === player.hand.tiles.length - 1) {
                this._hideActionPanel();
                this.game_.processDiscard(0, index);
            }
            return;
        }

        if (this._riichiMode) {
            // リーチ宣言モード: テンパイになる牌だけ有効
            const tiles = player.hand.tiles;
            const t     = tiles.splice(index, 1)[0];
            const ok    = player.hand.isTenpai() && !player.isFuriten;
            tiles.splice(index, 0, t);
            if (!ok) return;
            this._riichiMode = false;
            this._hideActionPanel();
            this.game_.processRiichi(0, index);
        } else {
            this._hideActionPanel();
            this.game_.processDiscard(0, index);
        }
    }

    // ── アクションボタン (ツモ・リーチ・槓) ─────────────────────────

    _showActionButtons() {
        this._hideActionPanel();
        const player = this.game_.players[0];
        const state  = this.game_.state;

        if (state !== GAME_STATE.PLAYER_ACTION) return; // MELD_ACTION は打牌のみ

        const btns = [];
        let   x    = 100;
        const y    = 625;

        // ツモ和了
        if (player.hand.isComplete()) {
            btns.push(this._makeBtn(x, y, 'ツモ', 0xcc6600, () => {
                this._hideActionPanel();
                this.game_.processWin(0);
            }));
            x += 110;
        }

        // リーチ宣言
        if (!player.isRiichi && player.isMenzen && player.score >= 2000
                && this._canRiichi(player)) {
            btns.push(this._makeBtn(x, y, 'リーチ', 0xaa0000, () => {
                this._riichiMode = !this._riichiMode;
                this._renderHand(0);
            }));
            x += 110;
        }

        // 暗槓
        player.hand.findAnkanIds().forEach(tileId => {
            const tile = player.hand.tiles.find(t => t.id === tileId);
            btns.push(this._makeBtn(x, y, `暗槓`, 0x442266, () => {
                this._hideActionPanel();
                this.game_.processAnkan(0, tileId);
            }));
            x += 90;
        });

        // 加槓
        player.hand.findKakanOptions().forEach(opt => {
            btns.push(this._makeBtn(x, y, `加槓`, 0x226644, () => {
                this._hideActionPanel();
                this.game_.processKakan(0, opt.meldIndex);
            }));
            x += 90;
        });

        if (btns.length) this._actionPanel = btns;
    }

    _canRiichi(player) {
        const tiles = player.hand.tiles;
        for (let i = 0; i < tiles.length; i++) {
            const t  = tiles.splice(i, 1)[0];
            const ok = player.hand.isTenpai() && !player.isFuriten;
            tiles.splice(i, 0, t);
            if (ok) return true;
        }
        return false;
    }

    _hideActionPanel() {
        if (this._actionPanel) {
            this._actionPanel.forEach(b => b.destroy());
            this._actionPanel = null;
        }
        this._riichiMode = false;
    }

    // ── 鳴き判断パネル ────────────────────────────────────────────

    _showClaimPanel(options) {
        this._hideClaimPanel();
        const { canRon, canPon, canMinkan, canChi } = options;
        const btns = [];
        let   x    = 350;
        const y    = 600;

        if (canRon) {
            btns.push(this._makeBtn(x, y, 'ロン', 0xcc0000, () => {
                this._hideClaimPanel();
                this.game_.selectClaim(0, { action: 'ron' });
            }));
            x += 100;
        }
        if (canPon) {
            btns.push(this._makeBtn(x, y, 'ポン', 0x0044cc, () => {
                this._hideClaimPanel();
                this.game_.selectClaim(0, { action: 'pon' });
            }));
            x += 100;
        }
        if (canMinkan) {
            btns.push(this._makeBtn(x, y, '明槓', 0x664400, () => {
                this._hideClaimPanel();
                this.game_.selectClaim(0, { action: 'minkan' });
            }));
            x += 100;
        }
        if (canChi) {
            const chiOpts = this.game_.players[0].hand.findChiOptions(this.game_.lastDiscard);
            chiOpts.forEach((opt, idx) => {
                const label = chiOpts.length === 1 ? 'チー' : `チー${idx + 1}`;
                btns.push(this._makeBtn(x, y, label, 0x006633, () => {
                    this._hideClaimPanel();
                    this.game_.selectClaim(0, { action: 'chi', tileIndices: opt });
                }));
                x += 100;
            });
        }

        // パスは常に表示
        btns.push(this._makeBtn(x, y, 'パス', 0x555555, () => {
            this._hideClaimPanel();
            this.game_.selectClaim(0, { action: 'pass' });
        }));

        this._claimPanel = btns;
    }

    _hideClaimPanel() {
        if (this._claimPanel) {
            this._claimPanel.forEach(b => b.destroy());
            this._claimPanel = null;
        }
    }

    // ── 局終了パネル ──────────────────────────────────────────────

    _showRoundPanel(data) {
        if (this._roundPanel) {
            this._roundPanel.forEach(o => o.destroy());
            this._roundPanel = null;
        }

        const objs = [];

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.78);
        bg.fillRoundedRect(300, 215, 680, 290, 14);
        objs.push(bg);

        // 結果テキスト
        const lines = this._buildResultLines(data);
        lines.forEach((line, i) => {
            const t = this.add.text(640, 270 + i * 38, line, {
                fontSize: '21px', color: '#ffffff', align: 'center',
                stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0.5);
            objs.push(t);
        });

        // 次の局へボタン
        const isWin      = data.result === ROUND_RESULT.TSUMO || data.result === ROUND_RESULT.RON;
        const dealerWon  = isWin && data.winnerIndex === this.game_.dealerIndex;
        const continues  = dealerWon || data.result === ROUND_RESULT.RYUUKYOKU;

        const btn = this._makeBtn(640, 458, '次の局へ  →', 0x225522, () => {
            objs.forEach(o => o.destroy());
            btn.destroy();
            this._roundPanel = null;
            this.game_.nextRound(continues);
        });
        objs.push(btn);

        this._roundPanel = objs;
    }

    _buildResultLines(data) {
        switch (data.result) {
            case ROUND_RESULT.TSUMO: {
                const lines = [`ツモ和了  Player${data.winnerIndex}`];
                if (data.yakuResult) {
                    lines.push(data.yakuResult.yaku.map(y => y.name).join('・'));
                    lines.push(`${data.han}翻 ${data.fu}符  ${data.total}点`);
                }
                return lines;
            }
            case ROUND_RESULT.RON: {
                const lines = [`ロン和了  Player${data.winnerIndex} ← Player${data.discarderIndex}`];
                if (data.yakuResult) {
                    lines.push(data.yakuResult.yaku.map(y => y.name).join('・'));
                    lines.push(`${data.han}翻 ${data.fu}符  ${data.total}点`);
                }
                return lines;
            }
            case ROUND_RESULT.RYUUKYOKU:
                return ['流局'];
            case ROUND_RESULT.CHOMBO:
                return [`チョンボ  Player${data.winnerIndex}`];
            default:
                return ['局終了'];
        }
    }

    // ── ボタン生成 ────────────────────────────────────────────────

    _makeBtn(x, y, label, color, onClick) {
        const c   = this.add.container(x, y);
        const gfx = this.add.graphics();
        gfx.fillStyle(color, 0.92);
        gfx.fillRoundedRect(-46, -20, 92, 40, 7);
        gfx.lineStyle(2, 0xffffff, 0.45);
        gfx.strokeRoundedRect(-46, -20, 92, 40, 7);
        c.add(gfx);

        const txt = this.add.text(0, 0, label, {
            fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        c.add(txt);

        c.setInteractive(
            new Phaser.Geom.Rectangle(-46, -20, 92, 40),
            Phaser.Geom.Rectangle.Contains,
        );
        c.on('pointerdown', onClick);
        c.on('pointerover', () => gfx.setAlpha(0.65));
        c.on('pointerout',  () => gfx.setAlpha(1));
        return c;
    }

    // ── 背景描画 ──────────────────────────────────────────────────

    _drawBackground() {
        const gfx = this.add.graphics();
        // テーブルフェルト
        gfx.fillStyle(0x1e6b16, 1);
        gfx.fillCircle(640, 360, 292);
        gfx.lineStyle(6, 0x0a3a08, 1);
        gfx.strokeCircle(640, 360, 292);
        // 内側リング（装飾）
        gfx.lineStyle(2, 0x2d8a24, 0.35);
        gfx.strokeCircle(640, 360, 195);

        // 各プレイヤー名ラベル（固定）
        const labels = [
            { text: 'あなた', x: 640, y: 700, ox: 0.5, oy: 0 },
            { text: '下家',   x: 1255, y: 360, ox: 1,   oy: 0.5 },
            { text: '対面',   x: 640, y: 20,  ox: 0.5, oy: 0 },
            { text: '上家',   x: 25,  y: 360, ox: 0,   oy: 0.5 },
        ];
        labels.forEach(l => {
            this.add.text(l.x, l.y, l.text, {
                fontSize: '11px', color: '#aaaaaa',
                stroke: '#000000', strokeThickness: 1,
            }).setOrigin(l.ox, l.oy);
        });
    }
}
