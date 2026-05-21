// タイルテクスチャ生成定数
const TW = 44;  // タイル幅
const TH = 60;  // タイル高さ

const SUIT_COLORS = {
    man:   { bg: '#ffe0e0', text: '#cc0000' },
    pin:   { bg: '#e0e8ff', text: '#0033cc' },
    sou:   { bg: '#e0ffe0', text: '#006600' },
    honor: { bg: '#f0f0f0', text: '#333333' },
};
const HONOR_LABELS = ['', '東', '南', '西', '北', '白', '發', '中'];
const SUIT_CHARS   = { man: '萬', pin: '筒', sou: '索' };

export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {}

    create() {
        // 数牌テクスチャ（通常 + 赤ドラ）
        for (const suit of ['man', 'pin', 'sou']) {
            for (let num = 1; num <= 9; num++) {
                this._createTileTexture(suit, num, false);
                if (num === 5) this._createTileTexture(suit, num, true); // 赤ドラ
            }
        }
        // 字牌テクスチャ
        for (let num = 1; num <= 7; num++) {
            this._createTileTexture('honor', num, false);
        }
        // 裏牌テクスチャ
        this._createBackTexture();

        this.scene.start('GameScene');
    }

    /**
     * Phaser3 CanvasTexture で角丸矩形 + スーツ別彩色 + 数字/漢字を描画しキャッシュ。
     * @param {string}  suit    'man'|'pin'|'sou'|'honor'
     * @param {number}  number  1-9（数牌）または 1-7（字牌）
     * @param {boolean} isRed   赤ドラなら true
     */
    _createTileTexture(suit, number, isRed = false) {
        const key = isRed ? `tile_${suit}_${number}_red` : `tile_${suit}_${number}`;
        if (this.textures.exists(key)) return;

        const { bg: bgColor, text: textColor } = SUIT_COLORS[suit];
        const color = isRed ? '#ff3300' : textColor;

        const texture = this.textures.createCanvas(key, TW, TH);
        const ctx = texture.getContext();

        // 角丸矩形（背景）
        ctx.fillStyle = bgColor;
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.fill();

        // 枠線
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 1;
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.stroke();

        // 光沢ハイライト（上部に白グラデーション風）
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        this._roundRect(ctx, 2, 2, TW - 4, Math.floor(TH * 0.35), 4);
        ctx.fill();

        // 数字 / 漢字
        const label = suit === 'honor'
            ? (HONOR_LABELS[number] ?? '?')
            : `${number}`;

        ctx.fillStyle = color;
        ctx.font = `bold 22px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, TW / 2, TH / 2 + 5);

        // スーツ記号（数牌のみ、下部に小さく）
        if (suit !== 'honor') {
            ctx.font = '11px monospace';
            ctx.fillText(SUIT_CHARS[suit], TW / 2, TH - 7);
        }

        texture.refresh();
    }

    /** 裏牌テクスチャ（濃紺 + 斜めハッチング） */
    _createBackTexture() {
        const key = 'tile_back';
        if (this.textures.exists(key)) return;

        const texture = this.textures.createCanvas(key, TW, TH);
        const ctx = texture.getContext();

        // 背景（濃紺）
        ctx.fillStyle = '#1a2a55';
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.fill();

        // 枠線
        ctx.strokeStyle = '#3a5588';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, 1, 1, TW - 2, TH - 2, 5);
        ctx.stroke();

        // 斜めハッチング（左下→右上方向）
        ctx.save();
        ctx.beginPath();
        this._roundRect(ctx, 2, 2, TW - 4, TH - 4, 4);
        ctx.clip();

        ctx.strokeStyle = 'rgba(80,120,200,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let d = 2; d < TW + TH - 2; d += 8) {
            const x1 = Math.max(2, d - TH + 2);
            const y1 = Math.min(TH - 2, d);
            const x2 = Math.min(TW - 2, d);
            const y2 = Math.max(2, d - TW + 2);
            if (x1 < x2 && y1 > y2) {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        }
        ctx.stroke();
        ctx.restore();

        // 中央に小さい菱形装飾
        const cx = TW / 2, cy = TH / 2;
        ctx.strokeStyle = 'rgba(100,150,220,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx + 7, cy);
        ctx.lineTo(cx, cy + 10);
        ctx.lineTo(cx - 7, cy);
        ctx.closePath();
        ctx.stroke();

        texture.refresh();
    }

    /** Canvas2D 角丸矩形パス */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y,     x + w, y + r,     r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - r, r);
        ctx.lineTo(x,     y + r);
        ctx.arcTo(x,     y,     x + r, y,          r);
        ctx.closePath();
    }
}
