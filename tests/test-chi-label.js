/**
 * chiOptionLabel テスト
 * チー選択肢ラベル生成ロジックの単体テスト
 */
import { chiOptionLabel } from '../src/logic/chiLabel.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label} ${info}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected "${b}", got "${a}")`);
}

function tile(suit, number) { return { suit, number }; }

console.log('\n[chiOptionLabel: チーラベル生成 - 正常ケース]');
{
    // 5m捨て、手牌に3m・4m → シーケンス 3-4-5m
    const hand = [tile('man', 3), tile('man', 4)];
    assertEqual(
        chiOptionLabel(hand, [0, 1], tile('man', 5)),
        'チー345m',
        '5m捨て 3m4m使用 → チー345m'
    );
}
{
    // 5p捨て、手牌に6p・7p → シーケンス 5-6-7p
    const hand = [tile('pin', 6), tile('pin', 7)];
    assertEqual(
        chiOptionLabel(hand, [0, 1], tile('pin', 5)),
        'チー567p',
        '5p捨て 6p7p使用 → チー567p'
    );
}
{
    // 5s捨て、手牌に4s・6s → シーケンス 4-5-6s
    const hand = [tile('sou', 4), tile('sou', 6)];
    assertEqual(
        chiOptionLabel(hand, [0, 1], tile('sou', 5)),
        'チー456s',
        '5s捨て 4s6s使用 → チー456s'
    );
}

console.log('\n[chiOptionLabel: 境界値]');
{
    // 1m捨て、手牌に2m・3m → シーケンス 1-2-3m
    const hand = [tile('man', 2), tile('man', 3)];
    assertEqual(
        chiOptionLabel(hand, [0, 1], tile('man', 1)),
        'チー123m',
        '1m捨て 2m3m使用 → チー123m'
    );
}
{
    // 9s捨て、手牌に7s・8s → シーケンス 7-8-9s
    const hand = [tile('sou', 7), tile('sou', 8)];
    assertEqual(
        chiOptionLabel(hand, [0, 1], tile('sou', 9)),
        'チー789s',
        '9s捨て 7s8s使用 → チー789s'
    );
}

console.log('\n[chiOptionLabel: インデックスが離れている場合]');
{
    // hand に多数の牌があり、インデックスが離れている
    const hand = [
        tile('man', 1),  // 0
        tile('pin', 5),  // 1
        tile('man', 3),  // 2
        tile('sou', 7),  // 3
        tile('man', 4),  // 4
    ];
    assertEqual(
        chiOptionLabel(hand, [2, 4], tile('man', 5)),
        'チー345m',
        'インデックス[2,4] 5m捨て → チー345m'
    );
}
{
    // 逆順インデックス（ib < ia）でも正しく動作する
    const hand = [tile('pin', 7), tile('pin', 6)];
    assertEqual(
        chiOptionLabel(hand, [1, 0], tile('pin', 5)),
        'チー567p',
        '逆順インデックス[1,0] 5p捨て → チー567p'
    );
}

console.log(`\n結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
