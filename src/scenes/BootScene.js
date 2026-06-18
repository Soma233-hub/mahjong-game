// タイル描画定数 — GameScene.js と同値を保つこと（1-D で両方変更）
const TW = 44;  // タイル幅
const TH = 60;  // タイル高さ

// スーツ別背景色（hex 文字列）
const SUIT_BG = {
    man:   '#ffe0e0',
    pin:   '#e0e8ff',
    sou:   '#e0ffe0',
    honor: '#f0f0f0',
};
// スーツ別テキスト色
const SUIT_TEXT_COLOR = {
    man:   '#cc0000',
    pin:   '#0033cc',
    sou:   '#006600',
    honor: '#333333',
};
const HONOR_LABELS = ['', '東', '南', '西', '北', '白', '發', '中'];
const SUIT_CHARS   = { man: '萬', pin: '筒', sou: '索' };

export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() { /* アセット不要 — 動的テクスチャ生成 */ }

    create() {
        this._generateAllTileTextures();
        this._initAudio();
        this._buildStartScreen();
    }

    // ============================================================
    // 音響初期化 【3-A/3-D】
    // ============================================================

    _initAudio() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.registry.set('audioCtx', Ctx ? new Ctx() : null);
        } catch (_) {
            this.registry.set('audioCtx', null);
        }
        // 既存セッションに soundEnabled が残っている場合は soundVolume に変換
        if (this.registry.has('soundEnabled')) {
            const prev = this.registry.get('soundEnabled');
            this.registry.set('soundVolume', prev ? 80 : 0);
            this.registry.remove('soundEnabled');
        } else if (!this.registry.has('soundVolume')) {
            this.registry.set('soundVolume', 80);
        }
    }

    // ============================================================
    // スタート画面（音量トグル + ゲーム開始ボタン） 【3-D】
    // ============================================================

    _buildStartScreen() {
        this.add.rectangle(640, 360, 1280, 720, 0x1a3a15);
        this.add.text(640, 120, '麻雀ゲーム', {
            fontSize: '64px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // ゲーム設定の初期値をレジストリに登録
        if (!this.registry.has('gameSettings')) {
            this.registry.set('gameSettings', { useIppatsu: true, useUraDora: true, umaRule: '10-20', aiLevel: 3, gameType: 'tonpu', allAI: false, aiSpeed: 'normal' });
        } else {
            // 古いセーブデータに存在しないキーを補完
            const s = this.registry.get('gameSettings');
            const patched = { ...s };
            if (patched.aiLevel   === undefined) patched.aiLevel   = 3;
            if (patched.gameType  === undefined) patched.gameType  = 'tonpu';
            if (patched.allAI     === undefined) patched.allAI     = false;
            if (patched.aiSpeed   === undefined) patched.aiSpeed   = 'normal';
            this.registry.set('gameSettings', patched);
        }

        // 設定ラベル
        this.add.text(640, 210, 'ゲームルール設定', {
            fontSize: '16px', color: '#aabbcc', fontFamily: 'monospace',
        }).setOrigin(0.5);

        this._settingToggles = {};
        this._buildSettingsRow();

        // 10-D: 音量スライダー（0〜100 を10刻みで調整）
        this.add.text(640, 462, '音量', {
            fontSize: '16px', color: '#aabbcc', fontFamily: 'monospace',
        }).setOrigin(0.5);

        const getVol = () => this.registry.get('soundVolume') ?? 80;
        const setVol = v => this.registry.set('soundVolume', v);

        const minusBg = this.add.rectangle(498, 485, 44, 36, 0x334466)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x667799);
        this.add.text(498, 485, '◀', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);

        const plusBg = this.add.rectangle(782, 485, 44, 36, 0x334466)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x667799);
        this.add.text(782, 485, '▶', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5);

        const volTxt = this.add.text(640, 485, `${getVol()}%`, {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 10段階のバーグラフ（各セグメント幅22px, 間隔2px, 計240px）
        const BAR_START = 520;
        const volBars = [];
        const updateBars = () => {
            const v = getVol();
            volBars.forEach((b, i) => {
                b.setFillStyle(i < v / 10 ? 0x2288cc : 0x223344);
            });
        };
        for (let i = 0; i < 10; i++) {
            const bx = BAR_START + i * 24 + 11;
            const bar = this.add.rectangle(bx, 485, 20, 30, 0x2288cc)
                .setStrokeStyle(1, 0x446688);
            volBars.push(bar);
        }
        updateBars();

        minusBg
            .on('pointerover', () => minusBg.setFillStyle(0x445577))
            .on('pointerout',  () => minusBg.setFillStyle(0x334466))
            .on('pointerdown', () => {
                setVol(Math.max(0, getVol() - 10));
                volTxt.setText(`${getVol()}%`);
                updateBars();
            });
        plusBg
            .on('pointerover', () => plusBg.setFillStyle(0x445577))
            .on('pointerout',  () => plusBg.setFillStyle(0x334466))
            .on('pointerdown', () => {
                setVol(Math.min(100, getVol() + 10));
                volTxt.setText(`${getVol()}%`);
                updateBars();
            });

        // ゲーム開始ボタン
        const startBg = this.add.rectangle(490, 570, 220, 52, 0x225522)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x44aa44);
        this.add.text(490, 570, 'ゲーム開始 ▶', {
            fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);
        startBg
            .on('pointerover', () => startBg.setFillStyle(0x337733))
            .on('pointerout',  () => startBg.setFillStyle(0x225522))
            .on('pointerdown', () => {
                const s = { ...this.registry.get('gameSettings'), allAI: false };
                this.registry.set('gameSettings', s);
                this.scene.start('GameScene');
            });

        // 観戦ボタン（AllAI自動対局）
        const watchBg = this.add.rectangle(790, 570, 190, 52, 0x224455)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x4488aa);
        this.add.text(790, 570, '観戦 ▶', {
            fontSize: '24px', color: '#aaddff', fontFamily: 'monospace',
        }).setOrigin(0.5);
        watchBg
            .on('pointerover', () => watchBg.setFillStyle(0x336677))
            .on('pointerout',  () => watchBg.setFillStyle(0x224455))
            .on('pointerdown', () => {
                const s = { ...this.registry.get('gameSettings'), allAI: true };
                this.registry.set('gameSettings', s);
                this.scene.start('GameScene');
            });
    }

    _buildSettingsRow() {
        // 第1行: 5列（x: 160, 400, 640, 880, 1120）
        const row1 = [
            { label: '一発',    key: 'useIppatsu', x: 160,  values: [true, false],           labels: ['あり', 'なし'] },
            { label: '裏ドラ',  key: 'useUraDora', x: 400,  values: [true, false],           labels: ['あり', 'なし'] },
            { label: 'ウマ',    key: 'umaRule',    x: 640,  values: ['10-20', 'none'],       labels: ['10-20', 'なし'] },
            { label: '戦型',    key: 'gameType',   x: 880,  values: ['tonpu', 'hanchan'],    labels: ['東風戦', '半荘'] },
            { label: 'AIレベル',key: 'aiLevel',    x: 1120, values: [3, 1],                  labels: ['標準', '簡単'] },
        ];
        // 第2行: 速度設定
        const row2 = [
            { label: 'AI速度',  key: 'aiSpeed',    x: 640,  values: ['slow', 'normal', 'fast'], labels: ['遅い', '普通', '速い'] },
        ];

        const renderRow = (items, yLabel, yBtn) => {
            items.forEach(({ label, key, x, values, labels }) => {
                this.add.text(x, yLabel, label, {
                    fontSize: '18px', color: '#ccddee', fontFamily: 'monospace',
                }).setOrigin(0.5);

                const getIdx = () => {
                    const cur = this.registry.get('gameSettings')[key];
                    return values.indexOf(cur) === -1 ? 0 : values.indexOf(cur);
                };

                const btnColors = { on: 0x2255aa, off: 0x443322 };
                const isOn = () => getIdx() === 0;

                const bg = this.add.rectangle(x, yBtn, 130, 42, isOn() ? btnColors.on : btnColors.off)
                    .setInteractive({ useHandCursor: true })
                    .setStrokeStyle(1, 0x667799);
                const txt = this.add.text(x, yBtn, labels[getIdx()], {
                    fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
                }).setOrigin(0.5);

                bg.on('pointerover', () => bg.setFillStyle(0x3366bb))
                  .on('pointerout',  () => bg.setFillStyle(isOn() ? btnColors.on : btnColors.off))
                  .on('pointerdown', () => {
                      const s = { ...this.registry.get('gameSettings') };
                      const nextIdx = (getIdx() + 1) % values.length;
                      s[key] = values[nextIdx];
                      this.registry.set('gameSettings', s);
                      const on = nextIdx === 0;
                      txt.setText(labels[nextIdx]);
                      bg.setFillStyle(on ? btnColors.on : btnColors.off);
                  });

                this._settingToggles[key] = { bg, txt };
            });
        };

        renderRow(row1, 260, 310);
        renderRow(row2, 360, 410);

        // 罫線
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x335533, 0.6);
        gfx.lineBetween(110, 340, 1170, 340);
        gfx.lineBetween(110, 440, 1170, 440);
    }

    // ============================================================
    // テクスチャ一括生成
    // ============================================================

    _generateAllTileTextures() {
        // 数牌: man/pin/sou 各 1-9（5 は赤ドラ variant も生成）
        ['man', 'pin', 'sou'].forEach(suit => {
            for (let n = 1; n <= 9; n++) {
                this._createTileTexture(suit, n, false);
                if (n === 5) this._createTileTexture(suit, n, true); // 【1-B】赤ドラ
            }
        });
        // 字牌: 1-7
        for (let n = 1; n <= 7; n++) {
            this._createTileTexture('honor', n, false);
        }
        // 裏牌 【1-C】
        this._createBackTexture();
    }

    // ============================================================
    // 表牌テクスチャ生成 【1-A / 1-B】
    //   key: tile_{suit}_{number}  /  tile_{suit}_{number}_r（赤ドラ）
    // ============================================================

    _createTileTexture(suit, number, isRed = false) {
        const key = isRed ? `tile_${suit}_${number}_r` : `tile_${suit}_${number}`;
        if (this.textures.exists(key)) return;

        const canvas = document.createElement('canvas');
        canvas.width  = TW;
        canvas.height = TH;
        const ctx = canvas.getContext('2d');

        // 角丸背景
        ctx.fillStyle = SUIT_BG[suit] ?? '#f0f0f0';
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.fill();

        // 枠線
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        this._roundRect(ctx, 0.5, 0.5, TW - 1, TH - 1, 5);
        ctx.stroke();

        // テキスト（赤ドラは '#ff4400'）
        ctx.fillStyle = isRed ? '#ff4400' : (SUIT_TEXT_COLOR[suit] ?? '#333333');
        ctx.font = 'bold 16px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const label = suit === 'honor'
            ? (HONOR_LABELS[number] ?? '?')
            : `${number}${SUIT_CHARS[suit]}`;
        ctx.fillText(label, TW / 2, TH / 2);

        this.textures.addCanvas(key, canvas);
    }

    // ============================================================
    // 裏牌テクスチャ生成 【1-C】  key: tile_back
    // ============================================================

    _createBackTexture() {
        const key = 'tile_back';
        if (this.textures.exists(key)) return;

        const canvas = document.createElement('canvas');
        canvas.width  = TW;
        canvas.height = TH;
        const ctx = canvas.getContext('2d');

        // 角丸クリップ
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.save();
        ctx.clip();

        // 背景
        ctx.fillStyle = '#334477';
        ctx.fillRect(0, 0, TW, TH);

        // 斜めハッチング
        ctx.strokeStyle = '#4a5fa8';
        ctx.lineWidth = 1;
        for (let i = -TH; i < TW + TH; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + TH, TH);
            ctx.stroke();
        }

        ctx.restore();

        // 枠線（クリップ外で描画）
        ctx.strokeStyle = '#556699';
        ctx.lineWidth = 1;
        this._roundRect(ctx, 0.5, 0.5, TW - 1, TH - 1, 5);
        ctx.stroke();

        this.textures.addCanvas(key, canvas);
    }

    // ============================================================
    // Canvas ユーティリティ
    // ============================================================

    /** Canvas に角丸矩形パスをセット（fill/stroke は呼び元で行う） */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
