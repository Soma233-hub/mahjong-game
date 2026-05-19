import { createFullSet } from './Tile.js';

// 王牌のレイアウト（14枚）:
//   [0-3]  : 嶺上牌（最大4回のカン分）
//   [4-8]  : ドラ表示牌（[4]が初期表示、[5-8]はカンドラ）
//   [9-13] : 裏ドラ表示牌（[9]が通常裏ドラ、[10-13]はカン裏ドラ）

export class Wall {
    constructor() {
        this.tiles = [];
        this.deadWall = [];
        this.doraIndicators = [];
        this.uraDoraIndicators = [];
        this.kanCount = 0;
    }

    init() {
        const all = createFullSet();
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }

        this.deadWall = all.splice(all.length - 14, 14);
        this.tiles = all;
        this.doraIndicators = [this.deadWall[4]];
        this.uraDoraIndicators = [];
        this.kanCount = 0;
        this._rinshansUsed = 0; // カン後嶺上牌の使用数（deadWallをshiftしない）
    }

    // n枚配牌する
    deal(n) {
        return this.tiles.splice(0, n);
    }

    // 通常ツモ
    draw() {
        return this.tiles.length > 0 ? this.tiles.shift() : null;
    }

    // 嶺上ツモ（カン後）: インデックスで取得しdeadWallを変更しない
    drawRinshan() {
        return this.deadWall[this._rinshansUsed++] || null;
    }

    // カンドラをめくる: 最大4回まで（deadWall[5-8]）
    flipKanDora() {
        this.kanCount++;
        if (this.kanCount <= 4) {
            this.doraIndicators.push(this.deadWall[4 + this.kanCount]);
        }
    }

    // 裏ドラを開示（リーチ和了時）
    revealUraDora() {
        const count = this.doraIndicators.length; // リーチカン含む枚数
        for (let i = 0; i < count; i++) {
            this.uraDoraIndicators.push(this.deadWall[9 + i]);
        }
    }

    get remaining() { return this.tiles.length; }
    isEmpty()       { return this.tiles.length === 0; }
}
