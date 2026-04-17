import { Tile, SUIT } from './Tile.js';

const SUITS_ORDER = [SUIT.MAN, SUIT.PIN, SUIT.SOU, SUIT.HONOR];

// 牌ID(0-33) → Tile インスタンス
function idToTile(id) {
    if (id < 27) {
        const suit = SUITS_ORDER[Math.floor(id / 9)];
        return new Tile(suit, (id % 9) + 1);
    }
    return new Tile(SUIT.HONOR, id - 26);
}

export class Hand {
    constructor() {
        this.tiles = [];  // 手牌（通常13枚、ツモ後14枚）
        this.melds = [];  // 副露リスト（Meldオブジェクト）
    }

    add(tile) { this.tiles.push(tile); }

    // index指定で牌を取り除き返す
    remove(index) { return this.tiles.splice(index, 1)[0]; }

    sort() { this.tiles.sort((a, b) => a.sortKey() - b.sortKey()); }

    // 副露確定: 手牌から指定インデックスを削除して副露追加
    addMeld(meld, indicesToRemove) {
        indicesToRemove.sort((a, b) => b - a).forEach(i => this.tiles.splice(i, 1));
        this.melds.push(meld);
    }

    get tileCount() { return this.tiles.length; }
    get meldCount()  { return this.melds.length; }

    // --- 向聴数計算 ---

    // returns { shanten: number, type: 'normal'|'chiitoi'|'kokushi' }
    getShantenNumber() {
        const n = this._normalShanten();
        const c = this._chiitoiShanten();
        const k = this._kokushiShanten();
        const shanten = Math.min(n, c, k);
        const type = shanten === k ? 'kokushi' : shanten === c ? 'chiitoi' : 'normal';
        return { shanten, type };
    }

    isTenpai() { return this.getShantenNumber().shanten === 0; }

    // 有効牌のidセット（向聴数を下げる牌）
    getEffectiveTileIds() {
        const { shanten } = this.getShantenNumber();
        const result = [];
        for (let id = 0; id < 34; id++) {
            const tile = idToTile(id);
            this.tiles.push(tile);
            if (this.getShantenNumber().shanten < shanten) result.push(id);
            this.tiles.pop();
        }
        return result;
    }

    // テンパイ時の待ち牌idリスト
    getWaitingTileIds() {
        if (!this.isTenpai()) return [];
        return this.getEffectiveTileIds();
    }

    // --- 内部計算 ---

    _tileCounts() {
        const c = new Array(34).fill(0);
        this.tiles.forEach(t => c[t.id]++);
        return c;
    }

    _normalShanten() {
        const counts = this._tileCounts();
        let best = 8;

        const dfs = (cnt, mentsu, jantai) => {
            // 搭子カウント
            let partial = 0;
            for (let id = 0; id < 34; id++) {
                if (cnt[id] >= 2) { partial++; continue; }
                const s = Math.floor(id / 9);
                if (s < 3 && id % 9 < 8 && cnt[id + 1] > 0) partial++;
                else if (s < 3 && id % 9 < 7 && cnt[id + 2] > 0) partial++;
            }
            // 面子+搭子の上限は4（雀頭有無で変わる）
            const limit = 4 - mentsu;
            if (partial + mentsu > 4) partial = 4 - mentsu;
            const s = 8 - 2 * mentsu - jantai - Math.min(partial, limit);
            best = Math.min(best, s);

            for (let id = 0; id < 34; id++) {
                // 刻子
                if (cnt[id] >= 3) {
                    cnt[id] -= 3;
                    dfs(cnt, mentsu + 1, jantai);
                    cnt[id] += 3;
                }
                // 順子（数牌のみ）
                const s2 = Math.floor(id / 9);
                if (s2 < 3 && id % 9 <= 6 && cnt[id] && cnt[id + 1] && cnt[id + 2]) {
                    cnt[id]--; cnt[id + 1]--; cnt[id + 2]--;
                    dfs(cnt, mentsu + 1, jantai);
                    cnt[id]++; cnt[id + 1]++; cnt[id + 2]++;
                }
            }
        };

        // 雀頭なし
        dfs(counts, 0, 0);
        // 雀頭候補を全試行
        for (let id = 0; id < 34; id++) {
            if (counts[id] >= 2) {
                counts[id] -= 2;
                dfs(counts, 0, 1);
                counts[id] += 2;
            }
        }
        return best;
    }

    _chiitoiShanten() {
        const c = this._tileCounts();
        const pairs = c.filter(v => v >= 2).length;
        const kinds = c.filter(v => v > 0).length;
        return 6 - pairs + Math.max(0, 7 - kinds);
    }

    _kokushiShanten() {
        const KOKUSHI = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        const c = this._tileCounts();
        const kinds  = KOKUSHI.filter(id => c[id] > 0).length;
        const hasPair = KOKUSHI.some(id => c[id] >= 2);
        return 13 - kinds - (hasPair ? 1 : 0);
    }
}
