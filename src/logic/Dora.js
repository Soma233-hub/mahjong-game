import { Tile, SUIT } from '../core/Tile.js';

// ドラ表示牌の次の牌がドラ（nextTile で取得）
export function getDoraFromIndicator(indicator) {
    const { suit, number } = indicator;
    let nextNum;
    if (suit === SUIT.HONOR) {
        // 風牌: 東→南→西→北→東 (1→2→3→4→1)
        // 三元牌: 白→發→中→白 (5→6→7→5)
        if (number <= 4) nextNum = (number % 4) + 1;
        else             nextNum = ((number - 5) % 3) + 5;
    } else {
        // 数牌: 1→2→...→9→1
        nextNum = (number % 9) + 1;
    }
    return new Tile(suit, nextNum);
}

// 手牌・副露のドラ枚数を数える
export function countDora(tiles, melds, doraIndicators) {
    const doraIds = doraIndicators.map(ind => getDoraFromIndicator(ind).id);
    let count = 0;

    for (const t of tiles) {
        count += doraIds.filter(id => id === t.id).length;
        if (t.isRed) count++; // 赤ドラ
    }
    for (const meld of melds) {
        for (const t of meld.tiles) {
            count += doraIds.filter(id => id === t.id).length;
            if (t.isRed) count++;
        }
    }
    return count;
}

// 裏ドラ枚数（リーチ和了時）
export function countUraDora(tiles, melds, uraDoraIndicators) {
    return countDora(tiles, melds, uraDoraIndicators);
}
