/**
 * tests/test-ui-helpers.js
 * TileRenderer ヘルパー関数の単体テスト
 */

import { getTileLabel, getTileColor, getPlayerLayout, getDiscardPosition } from '../src/ui/TileRenderer.js';
import { Tile, SUIT, HONOR } from '../src/core/Tile.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ ${message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    const ok = actual === expected;
    if (ok) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ ${message} (got: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)})`);
        failed++;
    }
}

// --- getTileLabel ---
console.log('\n=== getTileLabel ===');

assertEqual(getTileLabel(new Tile(SUIT.MAN, 1)), '1m', '1萬 → "1m"');
assertEqual(getTileLabel(new Tile(SUIT.MAN, 9)), '9m', '9萬 → "9m"');
assertEqual(getTileLabel(new Tile(SUIT.PIN, 5)), '5p', '5筒 → "5p"');
assertEqual(getTileLabel(new Tile(SUIT.SOU, 3)), '3s', '3索 → "3s"');
assertEqual(getTileLabel(new Tile(SUIT.MAN, 5, true)), '5m●', '赤5萬 → "5m●"');
assertEqual(getTileLabel(new Tile(SUIT.PIN, 5, true)), '5p●', '赤5筒 → "5p●"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.EAST)),  '東', '東 → "東"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.SOUTH)), '南', '南 → "南"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.WEST)),  '西', '西 → "西"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.NORTH)), '北', '北 → "北"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.HAKU)),  '白', '白 → "白"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.HATSU)), '發', '發 → "發"');
assertEqual(getTileLabel(new Tile(SUIT.HONOR, HONOR.CHUN)),  '中', '中 → "中"');

// --- getTileColor ---
console.log('\n=== getTileColor ===');

const manColor  = getTileColor(new Tile(SUIT.MAN, 1));
const pinColor  = getTileColor(new Tile(SUIT.PIN, 1));
const souColor  = getTileColor(new Tile(SUIT.SOU, 1));
const windColor = getTileColor(new Tile(SUIT.HONOR, HONOR.EAST));
const dragColor = getTileColor(new Tile(SUIT.HONOR, HONOR.HAKU));

assert(typeof manColor === 'string' && manColor.startsWith('#'), '萬の色は #xxxxxx 形式');
assert(typeof pinColor === 'string' && pinColor.startsWith('#'), '筒の色は #xxxxxx 形式');
assert(typeof souColor === 'string' && souColor.startsWith('#'), '索の色は #xxxxxx 形式');
assert(typeof windColor === 'string' && windColor.startsWith('#'), '風牌の色は #xxxxxx 形式');
assert(typeof dragColor === 'string' && dragColor.startsWith('#'), '三元牌の色は #xxxxxx 形式');
assert(manColor !== pinColor, '萬と筒の色は異なる');
assert(pinColor !== souColor, '筒と索の色は異なる');

// --- getPlayerLayout ---
console.log('\n=== getPlayerLayout ===');

for (let i = 0; i < 4; i++) {
    const layout = getPlayerLayout(i);
    assert(typeof layout === 'object', `Player${i} レイアウトはオブジェクト`);
    assert(typeof layout.handX === 'number', `Player${i} handX は数値`);
    assert(typeof layout.handY === 'number', `Player${i} handY は数値`);
    assert(typeof layout.handAngle === 'number', `Player${i} handAngle は数値`);
    assert(typeof layout.discardX === 'number', `Player${i} discardX は数値`);
    assert(typeof layout.discardY === 'number', `Player${i} discardY は数値`);
    assert(layout.handX >= 0 && layout.handX <= 1280, `Player${i} handX はcanvas内`);
    assert(layout.handY >= 0 && layout.handY <= 720,  `Player${i} handY はcanvas内`);
}

// 各プレイヤーの角度が正しい
assertEqual(getPlayerLayout(0).handAngle, 0,   'Player0(下) 角度0');
assertEqual(getPlayerLayout(1).handAngle, 90,  'Player1(右) 角度90');
assertEqual(getPlayerLayout(2).handAngle, 180, 'Player2(上) 角度180');
assertEqual(getPlayerLayout(3).handAngle, 270, 'Player3(左) 角度270');

// --- getDiscardPosition ---
console.log('\n=== getDiscardPosition ===');

for (let i = 0; i < 4; i++) {
    const pos0 = getDiscardPosition(i, 0);
    const pos1 = getDiscardPosition(i, 1);
    const pos7 = getDiscardPosition(i, 6); // 折り返し後

    assert(typeof pos0.x === 'number' && typeof pos0.y === 'number',
        `Player${i} 捨て牌0番目は数値座標`);
    assert(pos0.x !== pos1.x || pos0.y !== pos1.y,
        `Player${i} 捨て牌0番目と1番目の座標は異なる`);
    assert(pos0.x !== pos7.x || pos0.y !== pos7.y,
        `Player${i} 捨て牌0番目と6番目は行変わりで座標が異なる`);
}

// 捨て牌座標がcanvasの範囲に収まる（余裕を持って±50px）
for (let i = 0; i < 4; i++) {
    for (let d = 0; d < 18; d++) {
        const pos = getDiscardPosition(i, d);
        assert(pos.x >= -50 && pos.x <= 1330, `Player${i} 捨て牌${d}番目 x=\${pos.x} canvas範囲内`);
        assert(pos.y >= -50 && pos.y <= 770,  `Player${i} 捨て牌${d}番目 y=\${pos.y} canvas範囲内`);
    }
}

// --- 結果 ---
console.log(`\nテスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
