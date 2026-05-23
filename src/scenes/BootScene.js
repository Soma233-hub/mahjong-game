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
        this.scene.start('GameScene');
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
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 4);
        ctx.fill();

        // 枠線
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        this._roundRect(ctx, 0.5, 0.5, TW - 1, TH - 1, 4);
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
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 4);
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
        this._roundRect(ctx, 0.5, 0.5, TW - 1, TH - 1, 4);
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
