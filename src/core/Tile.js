export const SUIT = Object.freeze({
    MAN: 'man',
    PIN: 'pin',
    SOU: 'sou',
    HONOR: 'honor',
});

// 字牌の番号（1-4: 風牌, 5-7: 三元牌）
export const HONOR = Object.freeze({
    EAST: 1,
    SOUTH: 2,
    WEST: 3,
    NORTH: 4,
    HAKU: 5,
    HATSU: 6,
    CHUN: 7,
});

const SUIT_OFFSET = { man: 0, pin: 9, sou: 18, honor: 27 };

export class Tile {
    constructor(suit, number, isRed = false) {
        this.suit = suit;
        this.number = number;
        this.isRed = isRed;
    }

    // 0-33 のユニークID（赤ドラ無視）
    get id() {
        return SUIT_OFFSET[this.suit] + this.number - 1;
    }

    isHonor()           { return this.suit === SUIT.HONOR; }
    isTerminal()        { return !this.isHonor() && (this.number === 1 || this.number === 9); }
    isTerminalOrHonor() { return this.isTerminal() || this.isHonor(); }
    isSimple()          { return !this.isTerminalOrHonor(); }
    isDragon()          { return this.suit === SUIT.HONOR && this.number >= 5; }
    isWind()            { return this.suit === SUIT.HONOR && this.number <= 4; }
    isGreen() {
        // 緑一色に使える牌: 2,3,4,6,8索 + 發
        if (this.suit === SUIT.SOU && [2, 3, 4, 6, 8].includes(this.number)) return true;
        if (this.suit === SUIT.HONOR && this.number === HONOR.HATSU) return true;
        return false;
    }

    equals(other) {
        return this.suit === other.suit && this.number === other.number;
    }

    copy() {
        return new Tile(this.suit, this.number, this.isRed);
    }

    // ソートキー（手牌並び替え用）
    sortKey() {
        return this.id;
    }

    toString() {
        if (this.suit === SUIT.HONOR) {
            const names = ['', '東', '南', '西', '北', '白', '發', '中'];
            return names[this.number];
        }
        const suitChar = { man: '萬', pin: '筒', sou: '索' };
        return `${this.number}${suitChar[this.suit]}${this.isRed ? '(赤)' : ''}`;
    }
}

// 136枚の全牌セットを生成
export function createFullSet() {
    const tiles = [];

    for (const suit of [SUIT.MAN, SUIT.PIN, SUIT.SOU]) {
        for (let n = 1; n <= 9; n++) {
            for (let i = 0; i < 4; i++) {
                tiles.push(new Tile(suit, n, n === 5 && i === 0));
            }
        }
    }

    for (let n = 1; n <= 7; n++) {
        for (let i = 0; i < 4; i++) {
            tiles.push(new Tile(SUIT.HONOR, n));
        }
    }

    return tiles; // 108 + 28 = 136枚
}
