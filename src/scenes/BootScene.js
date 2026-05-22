/**
 * BootScene.js — Phase UI-1: タイルテクスチャ動的生成
 *
 * create() でゲーム全体で使うタイルテクスチャを Canvas 2D API で生成し
 * Phaser の TextureManager に登録する。テクスチャはゲームレベルで共有
 * されるため、GameScene / ResultScene から参照可能。
 *
 * テクスチャキー一覧:
 *   tile_man_1  … tile_man_9    (1〜9萬)
 *   tile_man_5r                 (赤五萬)
 *   tile_pin_1  … tile_pin_9
 *   tile_pin_5r
 *   tile_sou_1  … tile_sou_9
 *   tile_sou_5r
 *   tile_honor_1 … tile_honor_7 (東南西北白發中)
 *   tile_back                   (裏牌)
 */

// タイルサイズ（GameScene の TW/TH と一致させること）
const TW = 44;
const TH = 60;

export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {}

    create() {
        this._createAllTileTextures();
        this.scene.start('GameScene');
    }

    // =====================================
    // テクスチャ生成 エントリポイント
    // =====================================

    _createAllTileTextures() {
        ['man', 'pin', 'sou'].forEach(suit => {
            for (let n = 1; n <= 9; n++) {
                this._createTileTexture(suit, n, false);
            }
            // 赤ドラ（5のみ）
            this._createTileTexture(suit, 5, true);
        });

        // 字牌 1=東 2=南 3=西 4=北 5=白 6=發 7=中
        for (let n = 1; n <= 7; n++) {
            this._createTileTexture('honor', n, false);
        }

        this._createBackTileTexture();
    }

    // =====================================
    // 内部ヘルパー
    // =====================================

    /** テクスチャキーを返す */
    _tileTextureKey(suit, number, isRed) {
        return isRed ? `tile_${suit}_${number}r` : `tile_${suit}_${number}`;
    }

    /** 牌ラベル文字列 */
    _tileLabel(suit, number) {
        if (suit === 'honor') {
            return ['', '東', '南', '西', '北', '白', '發', '中'][number] ?? '?';
        }
        const suitChar = { man: '萬', pin: '筒', sou: '索' }[suit];
        return `${number}${suitChar}`;
    }

    /**
     * Canvas 2D でパスを構築するユーティリティ（角丸矩形）
     * ctx.roundRect が未実装の環境向けフォールバック
     */
    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y,     x + w, y + r,     r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - r, r);
        ctx.lineTo(x,     y + r);
        ctx.arcTo(x,     y,     x + r, y,         r);
        ctx.closePath();
    }

    // =====================================
    // 表牌テクスチャ (1-A / 1-B)
    // =====================================

    _createTileTexture(suit, number, isRed) {
        const W = TW, H = TH, R = 4;
        const key = this._tileTextureKey(suit, number, isRed);

        // スーツ別配色
        const SUIT_BG = {
            man:   '#ffe0e0',
            pin:   '#e0e8ff',
            sou:   '#e0ffe0',
            honor: '#f5f5ee',
        };
        const SUIT_TEXT = {
            man:   '#cc0000',
            pin:   '#0033cc',
            sou:   '#006600',
            honor: '#333333',
        };

        const canvas = document.createElement('canvas');
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // --- 背景（角丸） ---
        ctx.fillStyle = SUIT_BG[suit];
        this._roundRectPath(ctx, 0, 0, W, H, R);
        ctx.fill();

        // --- 内側ハイライト（わずかに明るい内枠） ---
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        this._roundRectPath(ctx, 2, 2, W - 4, H / 2 - 2, 2);
        ctx.fill();

        // --- ボーダー ---
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, 0.5, 0.5, W - 1, H - 1, R);
        ctx.stroke();

        // --- ラベル描画 ---
        const label     = this._tileLabel(suit, number);
        const textColor = isRed ? '#ff3300' : SUIT_TEXT[suit];   // 1-B: 赤ドラは赤文字

        if (suit === 'honor') {
            // 字牌: 大きめ1文字をセンタリング
            ctx.fillStyle    = textColor;
            ctx.font         = 'bold 22px monospace';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, W / 2, H / 2);
        } else {
            // 数牌: 数字（大）+ スーツ字（小）を2行
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'alphabetic';

            // 数字
            ctx.fillStyle = textColor;
            ctx.font      = `bold 20px monospace`;
            ctx.fillText(String(number), W / 2, H / 2 + 2);

            // スーツ字（小）
            const suitChar = { man: '萬', pin: '筒', sou: '索' }[suit];
            ctx.fillStyle = textColor;
            ctx.font      = '11px monospace';
            ctx.textBaseline = 'top';
            ctx.fillText(suitChar, W / 2, H / 2 + 6);
        }

        this.textures.addCanvas(key, canvas);
    }

    // =====================================
    // 裏牌テクスチャ (1-C)
    // =====================================

    _createBackTileTexture() {
        const W = TW, H = TH, R = 4;
        const key = 'tile_back';

        const canvas = document.createElement('canvas');
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 外側背景
        ctx.fillStyle = '#334477';
        this._roundRectPath(ctx, 0, 0, W, H, R);
        ctx.fill();

        // ボーダー
        ctx.strokeStyle = '#6688cc';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, 0.5, 0.5, W - 1, H - 1, R);
        ctx.stroke();

        // 内側パネル
        ctx.fillStyle = '#445588';
        this._roundRectPath(ctx, 4, 4, W - 8, H - 8, 2);
        ctx.fill();

        // 斜めハッチング（内側パネル範囲でクリッピング）
        ctx.save();
        this._roundRectPath(ctx, 4, 4, W - 8, H - 8, 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(100,130,200,0.5)';
        ctx.lineWidth = 1;
        const step = 6;
        for (let i = -(H); i < W + H; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + H, H);
            ctx.stroke();
        }
        ctx.restore();

        // 内枠の細いハイライト
        ctx.strokeStyle = 'rgba(150,180,255,0.3)';
        ctx.lineWidth = 1;
        this._roundRectPath(ctx, 4.5, 4.5, W - 9, H - 9, 2);
        ctx.stroke();

        this.textures.addCanvas(key, canvas);
    }
}
