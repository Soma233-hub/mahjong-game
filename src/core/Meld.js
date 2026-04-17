export const MELD_TYPE = Object.freeze({
    CHI:    'chi',    // チー（順子・他家から）
    PON:    'pon',    // ポン（刻子・他家から）
    MINKAN: 'minkan', // 明槓（他家から）
    ANKAN:  'ankan',  // 暗槓（自摸）
    KAKAN:  'kakan',  // 加槓（ポン済みに追加）
});

export class Meld {
    /**
     * @param {string}  type       - MELD_TYPE のいずれか
     * @param {Tile[]}  tiles      - 副露を構成する牌（3枚または4枚）
     * @param {number}  fromPlayer - 牌を取った相手のプレイヤーインデックス（暗槓は -1）
     * @param {Tile}    claimedTile - 取った牌（チー/ポン/明槓/加槓の場合）
     */
    constructor(type, tiles, fromPlayer = -1, claimedTile = null) {
        this.type = type;
        this.tiles = tiles;
        this.fromPlayer = fromPlayer;
        this.claimedTile = claimedTile;
    }

    isKan()    { return this.type === MELD_TYPE.MINKAN || this.type === MELD_TYPE.ANKAN || this.type === MELD_TYPE.KAKAN; }
    isOpen()   { return this.type !== MELD_TYPE.ANKAN; }
    isClosed() { return this.type === MELD_TYPE.ANKAN; }

    toString() {
        return `[${this.type}:${this.tiles.map(t => t.toString()).join('')}]`;
    }
}
