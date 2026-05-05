import { Game, GAME_STATE, ROUND_RESULT } from '../core/Game.js';
import { getTileLabel, getTileColor, getPlayerLayout, getDiscardPosition } from '../ui/TileRenderer.js';

// 牌のサイズ定数
const TW = 36; // 人間手牌の幅
const TH = 50; // 人間手牌の高さ
const TW_S = 22; // AI手牌（裏）幅
const TH_S = 30; // AI手牌（裏）高さ
const DW = 28; // 捨て牌幅
const DH = 38; // 捨て牌高さ
const MW = 28; // 副露牌幅
const MH = 38; // 副露牌高さ

const COLOR_TILE_BG   = 0xf5f0e0;
const COLOR_TILE_BACK = 0x336633;
const COLOR_HIGHLIGHT = 0xffff00;
const COLOR_RIICHI    = 0xff4444;
const COLOR_PANEL_BG  = 0x1a3a1a;

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this._groups = {};        // Phaser Groupsでスプライト管理
        this._handObjects = [];   // 手牌グラフィックス [playerIndex][tileIndex]
        this._discardObjects = [[], [], [], []];
        this._meldObjects   = [[], [], [], []];
        this._claimButtons  = []; // 鳴きボタン
        this._actionButtons = []; // ツモアクションボタン
        this._infoTexts     = {}; // スコア・局情報テキスト
        this._pendingClaim  = null;

        this.game_ = new Game();
        this._bindGameEvents();
        this._drawStaticUI();

        this.game_.startGame();
    }

    // ===== イベントバインド =====

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

    _onDraw({ playerIndex }) {
        this._renderHand(playerIndex);
        this._updateInfo();
        if (playerIndex === 0) {
            this._showActionButtons();
        }
    }

    _onDiscard({ playerIndex }) {
        this._clearActionButtons();
        this._clearClaimButtons();
        this._renderHand(playerIndex);
        this._renderDiscards(playerIndex);
        this._updateInfo();
    }

    _onMeld({ playerIndex }) {
        this._clearClaimButtons();
        this._renderHand(playerIndex);
        this._renderMelds(playerIndex);
        this._updateInfo();
    }

    _onClaimNeeded({ playerIndex, options }) {
        if (playerIndex !== 0) return;
        this._pendingClaim = options;
        this._showClaimButtons(options);
    }

    _onRoundEnd({ result, winnerIndex, yakuResult, han, fu, total }) {
        this._clearActionButtons();
        this._clearClaimButtons();
        this._updateInfo();
        this._showRoundResult(result, winnerIndex, yakuResult, han, fu, total);
    }

    _onGameEnd({ players }) {
        this.time.delayedCall(3000, () => {
            this.scene.start('ResultScene', { players });
        });
    }

    // ===== 静的UI =====

    _drawStaticUI() {
        const W = 1280, H = 720;

        // 外周の卓枠
        const border = this.add.graphics();
        border.lineStyle(4, 0x4a7a44, 1);
        border.strokeRect(10, 10, W - 20, H - 20);

        // 中央卓エリア（暗い緑）
        const center = this.add.graphics();
        center.fillStyle(0x1e4a1e, 1);
        center.fillRect(330, 165, 620, 390);
        center.lineStyle(2, 0x3a6a3a, 1);
        center.strokeRect(330, 165, 620, 390);

        // 局情報パネル（中央上部）
        const infoBg = this.add.graphics();
        infoBg.fillStyle(COLOR_PANEL_BG, 0.85);
        infoBg.fillRoundedRect(490, 175, 300, 60, 8);

        this._infoTexts.round = this.add.text(640, 195, '東1局 0本場', {
            fontSize: '18px', color: '#e8d88a', fontStyle: 'bold',
        }).setOrigin(0.5, 0);

        this._infoTexts.kyotaku = this.add.text(640, 218, '供託: 0本', {
            fontSize: '14px', color: '#bbaa66',
        }).setOrigin(0.5, 0);

        // ドラ表示エリア
        const doraBg = this.add.graphics();
        doraBg.fillStyle(COLOR_PANEL_BG, 0.85);
        doraBg.fillRoundedRect(490, 460, 300, 75, 8);

        this._infoTexts.doraLabel = this.add.text(640, 468, 'ドラ表示', {
            fontSize: '12px', color: '#bbaa66',
        }).setOrigin(0.5, 0);

        this._doraContainer = this.add.container(497, 484);

        // プレイヤー名・スコア表示（4隅）
        const corners = [
            { x: 16, y: 680 },   // Player0 左下
            { x: 1264, y: 40 },  // Player1 右上
            { x: 1264, y: 680 }, // Player2 右下（右上=上辺→右下に修正）
            { x: 16, y: 40 },    // Player3 左上
        ];
        const anchors = [
            [0, 1], [1, 0], [1, 1], [0, 0],
        ];
        const windNames = ['東', '南', '西', '北'];
        this._infoTexts.players = [];
        for (let i = 0; i < 4; i++) {
            const c = corners[i];
            const [ox, oy] = anchors[i];
            const bg = this.add.graphics();
            bg.fillStyle(COLOR_PANEL_BG, 0.85);
            const bx = ox === 0 ? c.x : c.x - 130;
            const by = oy === 0 ? c.y : c.y - 40;
            bg.fillRoundedRect(bx, by, 130, 40, 6);

            const nameText = this.add.text(c.x, c.y, `${windNames[i]} ${i === 0 ? 'あなた' : `AI${i}`}`, {
                fontSize: '14px', color: '#e8d88a',
            }).setOrigin(ox, oy);

            const scoreText = this.add.text(c.x, c.y - (oy === 1 ? 18 : -18), '25000', {
                fontSize: '14px', color: '#ffffff',
            }).setOrigin(ox, oy);

            this._infoTexts.players.push({ nameText, scoreText });
        }

        // 壁牌残り枚数
        this._infoTexts.wall = this.add.text(640, 355, '残: 70', {
            fontSize: '15px', color: '#aaaaaa',
        }).setOrigin(0.5);

        // 各プレイヤーの手牌エリア初期化
        this._handObjects = [[], [], [], []];
    }

    // ===== 情報更新 =====

    _updateInfo() {
        const g = this.game_;
        const roundNames = ['東1局', '東2局', '東3局', '東4局'];
        this._infoTexts.round.setText(`${roundNames[g.round] || '終局'} ${g.honba}本場`);
        this._infoTexts.kyotaku.setText(`供託: ${g.kyotaku}本`);
        this._infoTexts.wall.setText(`残: ${g.wall ? g.wall.remaining : 0}`);

        for (let i = 0; i < 4; i++) {
            const p = g.players[i];
            this._infoTexts.players[i].scoreText.setText(`${p.score}`);
        }

        this._renderDora();
    }

    _renderDora() {
        this._doraContainer.removeAll(true);
        const indicators = this.game_.wall ? this.game_.wall.doraIndicators : [];
        indicators.forEach((tile, i) => {
            const x = i * (DW + 3);
            this._drawTileAt(this._doraContainer, x, 0, DW, DH, tile, true);
        });
    }

    // ===== 手牌描画 =====

    _renderHand(playerIndex) {
        // 旧オブジェクトを消去
        if (this._handObjects[playerIndex]) {
            this._handObjects[playerIndex].forEach(o => o.destroy());
        }
        this._handObjects[playerIndex] = [];

        const player = this.game_.players[playerIndex];
        const layout = getPlayerLayout(playerIndex);
        const isHuman = playerIndex === 0;
        const angle = layout.handAngle;

        const tiles = player.hand.tiles;
        const tw = isHuman ? TW : TW_S;
        const th = isHuman ? TH : TH_S;
        const gap = 2;

        // 手牌を横に並べる（angle に応じて配置方向を変える）
        tiles.forEach((tile, idx) => {
            const isDrawn = idx === tiles.length - 1 && isHuman;
            const extraGap = isDrawn ? 8 : 0; // ツモ牌を少し離す

            let x, y;
            if (angle === 0) {
                // Player 0: 左→右
                x = layout.handX + idx * (tw + gap) + extraGap;
                y = layout.handY;
            } else if (angle === 90) {
                // Player 1: 上→下
                x = layout.handX;
                y = layout.handY + idx * (tw + gap);
            } else if (angle === 180) {
                // Player 2: 右→左
                x = layout.handX - idx * (tw + gap);
                y = layout.handY;
            } else {
                // Player 3: 下→上
                x = layout.handX;
                y = layout.handY - idx * (tw + gap);
            }

            const container = this.add.container(x, y);
            const objs = [];

            if (isHuman) {
                // 人間: 表向き
                const isRiichi = player.isRiichi;
                const obj = this._drawTileAt(container, 0, 0, tw, th, tile, true, isRiichi);
                objs.push(...obj);

                // クリックでの打牌（リーチ中は最後の牌のみ打牌可能）
                const hitArea = this.add.rectangle(0, 0, tw, th, 0xffffff, 0);
                hitArea.setInteractive({ useHandCursor: true });
                hitArea.on('pointerover', () => {
                    if (!isRiichi || idx === tiles.length - 1) {
                        hitArea.setFillStyle(0xffffff, 0.2);
                    }
                });
                hitArea.on('pointerout',  () => hitArea.setFillStyle(0xffffff, 0));
                hitArea.on('pointerdown', () => this._onTileClick(idx));
                container.add(hitArea);
                objs.push(hitArea);
            } else {
                // AI: 裏向き
                const back = this.add.graphics();
                back.fillStyle(COLOR_TILE_BACK, 1);
                back.fillRoundedRect(-tw/2, -th/2, tw, th, 3);
                back.lineStyle(1, 0x224422, 1);
                back.strokeRoundedRect(-tw/2, -th/2, tw, th, 3);
                container.add(back);
                objs.push(back);
            }

            // リーチマーク（手牌全体に赤縁）
            if (player.isRiichi && isHuman) {
                const rMark = this.add.graphics();
                rMark.lineStyle(2, COLOR_RIICHI, 1);
                rMark.strokeRect(-tw/2, -th/2, tw, th);
                container.add(rMark);
                objs.push(rMark);
            }

            this._handObjects[playerIndex].push(container);
        });
    }

    _onTileClick(tileIndex) {
        const g = this.game_;
        if (g.state !== GAME_STATE.PLAYER_ACTION && g.state !== GAME_STATE.MELD_ACTION) return;
        if (g.currentIndex !== 0) return;

        const player = g.players[0];
        if (player.isRiichi && tileIndex !== player.hand.tiles.length - 1) return;

        this._clearActionButtons();
        g.processDiscard(0, tileIndex);
    }

    // ===== 捨て牌描画 =====

    _renderDiscards(playerIndex) {
        this._discardObjects[playerIndex].forEach(o => o.destroy());
        this._discardObjects[playerIndex] = [];

        const player = this.game_.players[playerIndex];
        player.discards.forEach((tile, idx) => {
            const pos = getDiscardPosition(playerIndex, idx);
            const container = this.add.container(pos.x + DW/2, pos.y + DH/2);
            const isRotated = playerIndex === 1 || playerIndex === 3;

            if (isRotated) {
                const objs = this._drawTileAt(container, 0, 0, DH, DW, tile, true);
                container.angle = 90;
            } else {
                this._drawTileAt(container, 0, 0, DW, DH, tile, true);
            }

            this._discardObjects[playerIndex].push(container);
        });
    }

    // ===== 副露描画 =====

    _renderMelds(playerIndex) {
        this._meldObjects[playerIndex].forEach(o => o.destroy());
        this._meldObjects[playerIndex] = [];

        const player = this.game_.players[playerIndex];
        const layout = getPlayerLayout(playerIndex);

        let offset = 0;
        player.hand.melds.forEach(meld => {
            meld.tiles.forEach((tile, ti) => {
                let x, y;
                if (playerIndex === 0) {
                    x = layout.meldX + offset;
                    y = layout.meldY;
                    offset += MW + 2;
                } else if (playerIndex === 1) {
                    x = layout.meldX;
                    y = layout.meldY + offset;
                    offset += MH + 2;
                } else if (playerIndex === 2) {
                    x = layout.meldX + offset;
                    y = layout.meldY;
                    offset -= MW + 2;
                } else {
                    x = layout.meldX;
                    y = layout.meldY - offset;
                    offset += MH + 2;
                }

                const container = this.add.container(x + MW/2, y + MH/2);
                this._drawTileAt(container, 0, 0, MW, MH, tile, true);
                this._meldObjects[playerIndex].push(container);
            });
        });
    }

    // ===== 牌グラフィック共通描画 =====
    // container に牌を描画して追加されたオブジェクト配列を返す
    _drawTileAt(container, cx, cy, tw, th, tile, showFace, highlight = false) {
        const objs = [];

        // 背景
        const bg = this.add.graphics();
        const bgColor = highlight ? COLOR_HIGHLIGHT : COLOR_TILE_BG;
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(cx - tw/2, cy - th/2, tw, th, 4);
        bg.lineStyle(1, 0x888866, 1);
        bg.strokeRoundedRect(cx - tw/2, cy - th/2, tw, th, 4);
        container.add(bg);
        objs.push(bg);

        if (showFace && tile) {
            const label = getTileLabel(tile);
            const color = getTileColor(tile);
            const fontSize = Math.max(10, Math.min(tw - 6, 16));
            const text = this.add.text(cx, cy, label, {
                fontSize: `${fontSize}px`,
                color,
                fontStyle: 'bold',
            }).setOrigin(0.5);
            container.add(text);
            objs.push(text);

            // 赤ドラの場合、赤い点を右下に
            if (tile.isRed) {
                const dot = this.add.graphics();
                dot.fillStyle(0xff0000, 1);
                dot.fillCircle(cx + tw/2 - 4, cy + th/2 - 4, 3);
                container.add(dot);
                objs.push(dot);
            }
        }

        return objs;
    }

    // ===== アクションボタン（ツモ後の人間操作） =====

    _showActionButtons() {
        this._clearActionButtons();

        const g = this.game_;
        const player = g.players[0];
        if (!player.isHuman) return;
        if (g.state !== GAME_STATE.PLAYER_ACTION) return;

        const buttons = [];
        let bx = 16;
        const by = 632;
        const bh = 28;

        const addBtn = (label, color, callback) => {
            const bg = this.add.graphics();
            const bw = label.length * 14 + 16;
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(bx, by, bw, bh, 6);
            const txt = this.add.text(bx + bw/2, by + bh/2, label, {
                fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
            }).setOrigin(0.5);
            bg.setInteractive(new Phaser.Geom.Rectangle(bx, by, bw, bh), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', callback);
            bg.on('pointerover', () => bg.setAlpha(0.7));
            bg.on('pointerout',  () => bg.setAlpha(1));
            buttons.push(bg, txt);
            bx += bw + 8;
        };

        // ツモ和了
        const hand = player.hand;
        const canTsumo = hand.isComplete() && g.state === GAME_STATE.PLAYER_ACTION;
        if (canTsumo) {
            addBtn('ツモ', 0xcc4400, () => {
                this._clearActionButtons();
                g.processWin(0);
            });
        }

        // リーチ
        const canRiichi = player.isMenzen && !player.isRiichi &&
            player.score >= 1000 && g.wall.remaining > 0 &&
            hand.getShantenNumber().shanten === 0 && !player.isFuriten;
        if (canRiichi) {
            addBtn('リーチ', 0x884400, () => this._onRiichiMode());
        }

        // 暗槓
        const ankanIds = hand.findAnkanIds();
        if (ankanIds.length > 0) {
            ankanIds.forEach(tileId => {
                addBtn('暗槓', 0x334488, () => {
                    this._clearActionButtons();
                    g.processAnkan(0, tileId);
                });
            });
        }

        // 加槓
        const kakanOpts = hand.findKakanOptions();
        if (kakanOpts.length > 0) {
            kakanOpts.forEach(opt => {
                addBtn('加槓', 0x334488, () => {
                    this._clearActionButtons();
                    g.processKakan(0, opt.meldIndex);
                });
            });
        }

        this._actionButtons = buttons;
        buttons.forEach(b => { /* already added to scene */ });
    }

    _onRiichiMode() {
        // リーチモード: 打牌クリックでリーチ宣言+打牌
        this._clearActionButtons();
        // 打牌できる牌をハイライト表示
        const player = this.game_.players[0];
        const tiles = player.hand.tiles;

        tiles.forEach((tile, idx) => {
            const container = this._handObjects[0][idx];
            if (!container) return;
            // リーチ可能な打牌かチェック（その牌を捨てた後テンパイか）
            const testHand = player.hand.tiles.filter((_, i) => i !== idx);
            const hand = player.hand;
            // 元のtilesを一時退避してshantenを計算
            const orig = hand.tiles;
            hand.tiles = testHand;
            const sh = hand.getShantenNumber().shanten;
            hand.tiles = orig;

            if (sh === 0) {
                // ハイライト追加
                const hl = this.add.graphics();
                hl.lineStyle(3, COLOR_HIGHLIGHT, 1);
                hl.strokeRect(-TW/2, -TH/2, TW, TH);
                container.add(hl);
                // クリックイベントを上書き
                const hits = container.list.filter(o => o instanceof Phaser.GameObjects.Rectangle);
                hits.forEach(h => {
                    h.removeAllListeners('pointerdown');
                    h.on('pointerdown', () => {
                        container.remove(hl, true);
                        this.game_.processRiichi(0, idx);
                    });
                });
                this._actionButtons.push(hl);
            }
        });

        // キャンセルボタン
        const cancelBg = this.add.graphics();
        cancelBg.fillStyle(0x666666, 1);
        cancelBg.fillRoundedRect(16, 632, 70, 28, 6);
        const cancelTxt = this.add.text(51, 646, 'キャンセル', {
            fontSize: '11px', color: '#ffffff',
        }).setOrigin(0.5);
        cancelBg.setInteractive(new Phaser.Geom.Rectangle(16, 632, 70, 28), Phaser.Geom.Rectangle.Contains);
        cancelBg.on('pointerdown', () => {
            this._clearActionButtons();
            this._renderHand(0);
            this._showActionButtons();
        });
        this._actionButtons.push(cancelBg, cancelTxt);
    }

    _clearActionButtons() {
        this._actionButtons.forEach(o => { if (o && o.destroy) o.destroy(); });
        this._actionButtons = [];
    }

    // ===== 鳴きボタン =====

    _showClaimButtons(options) {
        this._clearClaimButtons();

        const buttons = [];
        let bx = 16;
        const by = 590;
        const bh = 32;

        const addBtn = (label, color, callback) => {
            const bw = label.length * 16 + 16;
            const bg = this.add.graphics();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(bx, by, bw, bh, 8);
            const txt = this.add.text(bx + bw/2, by + bh/2, label, {
                fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
            }).setOrigin(0.5);
            bg.setInteractive(new Phaser.Geom.Rectangle(bx, by, bw, bh), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', callback);
            bg.on('pointerover', () => bg.setAlpha(0.75));
            bg.on('pointerout',  () => bg.setAlpha(1));
            buttons.push(bg, txt);
            bx += bw + 10;
        };

        if (options.canRon) {
            addBtn('ロン', 0xcc0000, () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'ron' });
            });
        }
        if (options.canPon) {
            addBtn('ポン', 0x0055cc, () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'pon' });
            });
        }
        if (options.canMinkan) {
            addBtn('明槓', 0x004499, () => {
                this._clearClaimButtons();
                this.game_.selectClaim(0, { action: 'minkan' });
            });
        }
        if (options.canChi) {
            // チーは複数の選択肢がある場合あり
            const chiOpts = this.game_.players[0].hand.findChiOptions(this.game_.lastDiscard);
            if (chiOpts.length === 1) {
                addBtn('チー', 0x008833, () => {
                    this._clearClaimButtons();
                    this.game_.selectClaim(0, { action: 'chi', tileIndices: chiOpts[0] });
                });
            } else {
                chiOpts.forEach((opt, oi) => {
                    addBtn(`チー(${oi + 1})`, 0x008833, () => {
                        this._clearClaimButtons();
                        this.game_.selectClaim(0, { action: 'chi', tileIndices: opt });
                    });
                });
            }
        }

        addBtn('パス', 0x555555, () => {
            this._clearClaimButtons();
            this.game_.selectClaim(0, { action: 'pass' });
        });

        this._claimButtons = buttons;
    }

    _clearClaimButtons() {
        this._claimButtons.forEach(o => { if (o && o.destroy) o.destroy(); });
        this._claimButtons = [];
    }

    // ===== 局終了表示 =====

    _showRoundResult(result, winnerIndex, yakuResult, han, fu, total) {
        // 半透明オーバーレイ
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, 1280, 720);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a2a1a, 1);
        panel.fillRoundedRect(340, 200, 600, 320, 16);
        panel.lineStyle(2, 0x4a7a44, 1);
        panel.strokeRoundedRect(340, 200, 600, 320, 16);

        const resultLabels = {
            [ROUND_RESULT.TSUMO]:     'ツモ和了',
            [ROUND_RESULT.RON]:       'ロン和了',
            [ROUND_RESULT.RYUUKYOKU]: '流局',
            [ROUND_RESULT.CHOMBO]:    'チョンボ',
        };
        const label = resultLabels[result] || result;
        const color = result === ROUND_RESULT.CHOMBO ? '#ff4444' : '#ffdd44';

        this.add.text(640, 230, label, {
            fontSize: '36px', color, fontStyle: 'bold',
        }).setOrigin(0.5);

        let yy = 282;
        if (winnerIndex !== undefined) {
            const windNames = ['東', '南', '西', '北'];
            this.add.text(640, yy, `${windNames[winnerIndex]} ${winnerIndex === 0 ? 'あなた' : `AI${winnerIndex}`}`, {
                fontSize: '20px', color: '#ffffff',
            }).setOrigin(0.5);
            yy += 30;
        }

        if (yakuResult && yakuResult.yaku.length > 0) {
            const yakuNames = yakuResult.yaku.map(y => y.name).join('  ');
            this.add.text(640, yy, yakuNames, {
                fontSize: '16px', color: '#aaddaa',
            }).setOrigin(0.5);
            yy += 26;

            if (han !== undefined && fu !== undefined) {
                this.add.text(640, yy, `${han}翻${fu}符  ${total}点`, {
                    fontSize: '18px', color: '#ffcc44',
                }).setOrigin(0.5);
                yy += 30;
            }
        }

        // 点数表示
        yy += 10;
        for (let i = 0; i < 4; i++) {
            const p = this.game_.players[i];
            const windNames = ['東', '南', '西', '北'];
            this.add.text(640, yy + i * 24, `${windNames[i]}: ${p.score}点`, {
                fontSize: '14px', color: i === 0 ? '#ffeeaa' : '#cccccc',
            }).setOrigin(0.5);
        }

        // 次局ボタン
        const nextBg = this.add.graphics();
        nextBg.fillStyle(0x336633, 1);
        nextBg.fillRoundedRect(555, 480, 170, 40, 10);
        nextBg.lineStyle(2, 0x66aa66, 1);
        nextBg.strokeRoundedRect(555, 480, 170, 40, 10);
        const nextTxt = this.add.text(640, 500, '次の局へ', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        nextBg.setInteractive(new Phaser.Geom.Rectangle(555, 480, 170, 40), Phaser.Geom.Rectangle.Contains);
        nextBg.on('pointerdown', () => {
            [overlay, panel, nextBg, nextTxt].forEach(o => o.destroy());
            this._clearResultTexts();
            const dealerWon = result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON
                ? winnerIndex === this.game_.dealerIndex
                : false;
            this.game_.nextRound(dealerWon);
            // 全手牌・捨て牌・副露を再描画
            for (let i = 0; i < 4; i++) {
                this._renderHand(i);
                this._renderDiscards(i);
                this._renderMelds(i);
            }
            this._updateInfo();
        });

        this._resultObjects = [overlay, panel];
    }

    _clearResultTexts() {
        if (this._resultObjects) {
            this._resultObjects.forEach(o => { if (o && o.destroy) o.destroy(); });
            this._resultObjects = [];
        }
    }
}
