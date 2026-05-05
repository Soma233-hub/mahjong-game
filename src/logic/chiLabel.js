// チー選択肢のボタンラベルを生成する純粋関数
// handTiles: Tile[]  indices: [ia, ib]  discardTile: Tile
// 戻り値例: 'チー345m' 'チー567p' 'チー789s'
const SUIT_CHAR = { man: 'm', pin: 'p', sou: 's' };

export function chiOptionLabel(handTiles, indices, discardTile) {
    const nums = [
        handTiles[indices[0]].number,
        handTiles[indices[1]].number,
        discardTile.number,
    ].sort((a, b) => a - b);
    const suitChar = SUIT_CHAR[discardTile.suit] ?? '';
    return `チー${nums.join('')}${suitChar}`;
}
