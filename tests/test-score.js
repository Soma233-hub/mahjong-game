/**
 * 点数計算テスト（第5週）
 * node --experimental-vm-modules node_modules/.bin/jest で実行
 */
import { Tile, SUIT, HONOR } from '../src/core/Tile.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import {
    calculateFu,
    calculateScore,
    basicPoints,
    roundUp100,
    scoreLabel,
} from '../src/logic/Score.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label}${info ? ' ' + info : ''}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected ${b}, got ${a})`);
}

// ---- 牌生成ヘルパー ----
function t(str) {
    const num = parseInt(str[0]);
    const suitMap = { m: SUIT.MAN, p: SUIT.PIN, s: SUIT.SOU, z: SUIT.HONOR };
    return new Tile(suitMap[str[1]], num);
}
function makeHand(strs) {
    const h = new Hand();
    strs.forEach(s => h.add(t(s)));
    return h;
}
function makeHandWithMelds(closedStrs, melds) {
    const h = new Hand();
    closedStrs.forEach(s => h.add(t(s)));
    melds.forEach(m => h.melds.push(m));
    return h;
}
function makePon(tileStr, from = 1) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.PON, [tile, tile.copy(), tile.copy()], from, tile.copy());
}
function makeMinkan(tileStr, from = 1) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.MINKAN, [tile, tile.copy(), tile.copy(), tile.copy()], from, tile.copy());
}
function makeAnkan(tileStr) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.ANKAN, [tile, tile.copy(), tile.copy(), tile.copy()], -1, null);
}
function makeKakan(tileStr, from = 1) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.KAKAN, [tile, tile.copy(), tile.copy(), tile.copy()], from, tile.copy());
}

// ============================================================
// basicPoints テスト
// ============================================================
console.log('\n=== basicPoints テスト ===');
{
    // 通常翻符
    assertEqual(basicPoints(1, 30), 240,   '1翻30符 基本点=240');
    assertEqual(basicPoints(2, 30), 480,   '2翻30符 基本点=480');
    assertEqual(basicPoints(3, 30), 960,   '3翻30符 基本点=960');
    assertEqual(basicPoints(4, 30), 1920,  '4翻30符 基本点=1920');
    assertEqual(basicPoints(1, 50), 400,   '1翻50符 基本点=400');
    assertEqual(basicPoints(2, 40), 640,   '2翻40符 基本点=640');
    assertEqual(basicPoints(3, 60), 1920,  '3翻60符 基本点=1920(満貫未満)');

    // 切り上げ満貫（base >= 2000）
    assertEqual(basicPoints(4, 50), 2000,  '4翻50符 base=3200→満貫');
    assertEqual(basicPoints(3, 70), 2000,  '3翻70符 base=2240→満貫');

    // 満貫（han >= 5）
    assertEqual(basicPoints(5, 30), 2000,  '5翻30符 満貫=2000');
    assertEqual(basicPoints(5, 20), 2000,  '5翻20符 満貫=2000');

    // 跳満・倍満・三倍満・役満
    assertEqual(basicPoints(6,  30), 3000,  '6翻 跳満=3000');
    assertEqual(basicPoints(7,  30), 3000,  '7翻 跳満=3000');
    assertEqual(basicPoints(8,  30), 4000,  '8翻 倍満=4000');
    assertEqual(basicPoints(10, 30), 4000,  '10翻 倍満=4000');
    assertEqual(basicPoints(11, 30), 6000,  '11翻 三倍満=6000');
    assertEqual(basicPoints(12, 30), 6000,  '12翻 三倍満=6000');
    assertEqual(basicPoints(13, 30), 8000,  '13翻(役満) =8000');
    assertEqual(basicPoints(26, 30), 16000, '26翻(ダブル役満) =16000');
}

// ============================================================
// roundUp100 テスト
// ============================================================
console.log('\n=== roundUp100 テスト ===');
{
    assertEqual(roundUp100(100),  100,  'roundUp100(100)=100');
    assertEqual(roundUp100(101),  200,  'roundUp100(101)=200');
    assertEqual(roundUp100(960),  1000, 'roundUp100(960)=1000');
    assertEqual(roundUp100(3840), 3900, 'roundUp100(3840)=3900');
    assertEqual(roundUp100(7680), 7700, 'roundUp100(7680)=7700');
    assertEqual(roundUp100(8000), 8000, 'roundUp100(8000)=8000');
}

// ============================================================
// scoreLabel テスト
// ============================================================
console.log('\n=== scoreLabel テスト ===');
{
    assertEqual(scoreLabel(1, 30),  '1翻30符', '1翻30符');
    assertEqual(scoreLabel(4, 30),  '4翻30符', '4翻30符');
    assertEqual(scoreLabel(5, 30),  '満貫',    '5翻=満貫');
    assertEqual(scoreLabel(4, 50),  '満貫',    '4翻50符=満貫(切り上げ)');
    assertEqual(scoreLabel(6, 30),  '跳満',    '6翻=跳満');
    assertEqual(scoreLabel(8, 30),  '倍満',    '8翻=倍満');
    assertEqual(scoreLabel(11, 30), '三倍満',  '11翻=三倍満');
    assertEqual(scoreLabel(13, 30), '役満',    '13翻=役満');
    assertEqual(scoreLabel(26, 30), '役満×2',  '26翻=役満×2');
}

// ============================================================
// calculateScore テスト
// ============================================================
console.log('\n=== calculateScore: 子ロン ===');
{
    // 1翻30符 子ロン: base=240, pay=roundUp100(240×4)=1000
    const { total, payments } = calculateScore(1, 30, false, false);
    assertEqual(total,       1000, '1翻30符 子ロン total=1000');
    assertEqual(payments[0], 1000, '1翻30符 子ロン 放銃=1000');
}
{
    // 2翻30符 子ロン: base=480, pay=roundUp100(1920)=2000
    const { total, payments } = calculateScore(2, 30, false, false);
    assertEqual(total,       2000, '2翻30符 子ロン total=2000');
    assertEqual(payments[0], 2000, '2翻30符 子ロン 放銃=2000');
}
{
    // 3翻30符 子ロン: base=960, pay=roundUp100(3840)=3900
    const { total, payments } = calculateScore(3, 30, false, false);
    assertEqual(total,       3900, '3翻30符 子ロン total=3900');
    assertEqual(payments[0], 3900, '3翻30符 子ロン 放銃=3900');
}
{
    // 4翻30符 子ロン: base=1920, pay=roundUp100(7680)=7700
    const { total, payments } = calculateScore(4, 30, false, false);
    assertEqual(total,       7700, '4翻30符 子ロン total=7700');
    assertEqual(payments[0], 7700, '4翻30符 子ロン 放銃=7700');
}

console.log('\n=== calculateScore: 親ロン ===');
{
    // 1翻30符 親ロン: base=240, pay=roundUp100(240×6)=1500
    const { total, payments } = calculateScore(1, 30, true, false);
    assertEqual(total,       1500, '1翻30符 親ロン total=1500');
    assertEqual(payments[0], 1500, '1翻30符 親ロン 放銃=1500');
}
{
    // 3翻30符 親ロン: base=960, pay=roundUp100(5760)=5800
    const { total, payments } = calculateScore(3, 30, true, false);
    assertEqual(total,       5800, '3翻30符 親ロン total=5800');
    assertEqual(payments[0], 5800, '3翻30符 親ロン 放銃=5800');
}

console.log('\n=== calculateScore: 満貫 ===');
{
    // 満貫 子ロン: base=2000, pay=roundUp100(8000)=8000
    const { total, payments } = calculateScore(5, 30, false, false);
    assertEqual(total,       8000, '満貫 子ロン total=8000');
    assertEqual(payments[0], 8000, '満貫 子ロン 放銃=8000');
}
{
    // 満貫 親ロン: base=2000, pay=roundUp100(12000)=12000
    const { total, payments } = calculateScore(5, 30, true, false);
    assertEqual(total,        12000, '満貫 親ロン total=12000');
    assertEqual(payments[0],  12000, '満貫 親ロン 放銃=12000');
}
{
    // 満貫 子ツモ: dealer=4000, each=2000, total=8000
    const { total, payments } = calculateScore(5, 30, false, true);
    assertEqual(total,       8000, '満貫 子ツモ total=8000');
    assertEqual(payments[0], 4000, '満貫 子ツモ 親支払い=4000');
    assertEqual(payments[1], 2000, '満貫 子ツモ 子支払い=2000');
}
{
    // 満貫 親ツモ: each=4000, total=12000
    const { total, payments } = calculateScore(5, 30, true, true);
    assertEqual(total,       12000, '満貫 親ツモ total=12000');
    assertEqual(payments[0], 4000,  '満貫 親ツモ 各子支払い=4000');
}

console.log('\n=== calculateScore: 跳満・倍満・役満 ===');
{
    // 跳満 子ロン: base=3000, pay=12000
    const { total } = calculateScore(6, 30, false, false);
    assertEqual(total, 12000, '跳満 子ロン =12000');
}
{
    // 倍満 子ロン: base=4000, pay=16000
    const { total } = calculateScore(8, 30, false, false);
    assertEqual(total, 16000, '倍満 子ロン =16000');
}
{
    // 三倍満 子ロン: base=6000, pay=24000
    const { total } = calculateScore(11, 30, false, false);
    assertEqual(total, 24000, '三倍満 子ロン =24000');
}
{
    // 役満 子ロン: base=8000, pay=32000
    const { total } = calculateScore(13, 30, false, false);
    assertEqual(total, 32000, '役満 子ロン =32000');
}
{
    // 役満 親ロン: base=8000, pay=48000
    const { total } = calculateScore(13, 30, true, false);
    assertEqual(total, 48000, '役満 親ロン =48000');
}
{
    // ダブル役満 子ロン: base=16000, pay=64000
    const { total } = calculateScore(26, 30, false, false);
    assertEqual(total, 64000, 'ダブル役満 子ロン =64000');
}

console.log('\n=== calculateScore: 本場・供託 ===');
{
    // 3翻30符 子ロン 1本場: 3900 + 300 = 4200
    const { total, payments } = calculateScore(3, 30, false, false, 1, 0);
    assertEqual(total,       4200, '3翻30符 子ロン 1本場 total=4200');
    assertEqual(payments[0], 4200, '3翻30符 子ロン 1本場 放銃=4200');
}
{
    // 3翻30符 子ツモ 2本場: dealer=2000+200, each=1000+200, total=(2200+1200×2)=4600
    const { total, payments } = calculateScore(3, 30, false, true, 2, 0);
    assertEqual(total,       4600, '3翻30符 子ツモ 2本場 total=4600');
    assertEqual(payments[0], 2200, '3翻30符 子ツモ 2本場 親支払い=2200');
    assertEqual(payments[1], 1200, '3翻30符 子ツモ 2本場 子支払い=1200');
}
{
    // 供託2本あり: 満貫子ロン+供託2本 = 8000 + 2000 = 10000
    const { total, payments } = calculateScore(5, 30, false, false, 0, 2);
    assertEqual(total,       10000, '満貫 子ロン 供託2本 total=10000');
    assertEqual(payments[0], 8000,  '満貫 子ロン 供託2本 放銃=8000(供託含まず)');
}

// ============================================================
// calculateFu テスト
// ============================================================

console.log('\n=== calculateFu: 七対子 ===');
{
    // 七対子は常に25符
    const h = makeHand(['1m','1m','3m','3m','5m','5m','7m','7m','9m','9m','1p','1p','3p','3p']);
    const ctx = { isTsumo: true,  seatWind: 1, roundWind: 1 };
    assertEqual(calculateFu(h, t('3p'), ctx), 25, '七対子 ツモ=25符');
    const ctx2 = { isTsumo: false, seatWind: 1, roundWind: 1 };
    assertEqual(calculateFu(h, t('3p'), ctx2), 25, '七対子 ロン=25符');
}

console.log('\n=== calculateFu: 平和 ===');
{
    // 平和ツモ: 20符
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','3p','4p','6p','6p']);
    const ctx = { isTsumo: true, isPinfu: true, seatWind: 1, roundWind: 1 };
    assertEqual(calculateFu(h, t('9m'), ctx), 20, '平和ツモ=20符');

    // 平和ロン: 30符
    const ctx2 = { isTsumo: false, isPinfu: true, seatWind: 1, roundWind: 1 };
    assertEqual(calculateFu(h, t('9m'), ctx2), 30, '平和ロン=30符');
}

console.log('\n=== calculateFu: 門前基本符 ===');
{
    // 門前ロン（非平和）: 30符ベース
    // 123m 456m 789m 22p + ロン7s  → 基本30 + 単騎2 → 32→40符
    // Wait, this hand needs to be 14 tiles for complete. Let me think...
    // 123m 456m 789m 22p 待ち: ロンで7sを引く場合は, 7sが4つ目の面子の一部
    // 実際にはこの手は完成していないので、別の手を使う

    // 門前完成形: 123m 456m 789m 11p + 2p (ロン/ツモ) → shanten=-1
    // hand: 1m2m3m4m5m6m7m8m9m1p1p2p → 12枚 + win 3p → sequence 2p3p?
    // Let's do: 1m2m3m 4m5m6m 7m8m9m 1p1p + 2p3p (ryanmen wait on 1p or 4p)
    // Wait tile = 2p3p waiting for 1p or 4p, win = 4p → ryanmen
    // hand after win: 1m2m3m4m5m6m7m8m9m1p1p2p3p4p
    // pair=1p, mentsu=[123m, 456m, 789m, 234p]
    // 234p is a sequence, win=4p at pos 2, ids[0]=1p(id=9)...

    // Let me use: pair=5p(non-yakuhai), 3 sequences, ryanmen
    // 123m 456m 789m 55p, win=6p forming sequence 456p? No, that doesn't work.
    // Let me use: 123m 456m 789m 55p + 4p5p6p (but then 5p appears twice)
    // Wait: 123m 456m 789m 44p + 3p4p5p (pair=4p, win=5p tanki? no)

    // Simplest non-pinfu: triplet in closed hand
    // 111m 456m 789m 22p + 3p (ryanmen) → sequence 234p? wait=3p→tanki
    // 111m 456m 789m 22p (13 tiles) waiting for 2p (tanki)
    // Add 2p to make pair → but then pair becomes triplet 222p
    // OK: 111m 456m 789m 2p2p (13 tiles) + 2p (tsumo) → triple 222p... or tanki?
    // With 111m 456m 789m 22p, waiting for a tile to complete pair→ tanki on 2p, or...
    // Actually 111m456m789m22p is shanten=-1! It's already complete (111m=triplet, 456m=seq, 789m=seq, 22p=pair)
    // Ah, I need a 13-tile hand that is tenpai, then add the 14th tile.

    // Let me use: 1m2m3m 4m5m6m 7m8m9m 1p1p 2p3p (12 closed + 2p3p waiting for 1p or 4p = ryanmen)
    // Wait, that's 12 tiles. I need 13 before win.
    // 1m2m3m 4m5m6m 7m8m9m 1p1p 2p (11 tiles) + wait for 3p... that's 11 tiles waiting 2-sided.
    // Standard complete hand: 4 mentsu + 1 pair = 14 tiles
    // 13-tile tenpai: remove 1 tile from complete hand

    // I'll just test with a concrete 14-tile complete hand:
    // 1m2m3m 4m5m6m 7m8m9m 2p2p 1p2p3p → win=3p (ryanmen: had 1p2p waiting for 3p or... no)
    // Actually I need to be careful. Let me use a simpler approach:

    // 門前ロン 単騎待ち: 基本符30 + 単騎符2 = 32 → 40符
    // hand: 1m2m3m 4m5m6m 7m8m9m 1p2p3p + 5p(tanki)
    // But 5p is a non-yakuhai pair → tanki +2. Total: 30+2=32→40符
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','5p','5p']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // decomp: pair=5p, mentsu=[123m, 456m, 789m, 123p]
    // menzen bonus +10, tanki +2, no pair fu for 5p → 20+10+2=32→40
    assertEqual(calculateFu(h, t('5p'), ctx), 40, '門前ロン 単騎待ち=40符');
}

console.log('\n=== calculateFu: ツモ符 ===');
{
    // 非平和門前ツモ: 20+2=22→30符
    // 1m2m3m 4m5m6m 7m8m9m 1p2p3p 5p5p → ツモ5p
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','5p','5p']);
    const ctx = { isTsumo: true, seatWind: 1, roundWind: 1 };
    // 20 + 2(tsumo) + 2(tanki) = 24 → 30
    assertEqual(calculateFu(h, t('5p'), ctx), 30, '非平和門前ツモ 単騎=30符');
}

console.log('\n=== calculateFu: 副露手 ===');
{
    // ポン副露あり: 基本20符（門前ロン+10なし）
    // 1m2m3m 4m5m6m 2p2p + ポン5p × 1
    // closedStr: 1m2m3m4m5m6m2p2p (8牌) + pon:5p(3枚で1副露)
    // total: 4 mentsu needed→ 4-1=3 closed mentsu from 8 tiles = 2seq+1pair ✓
    // win = 2p (tanki) or something else
    // Actually: 1m2m3m 4m5m6m 2p2p = 8 tiles, 1 pon (5p) → need 2 more mentsu from 8 tiles
    // 8 tiles = 2 sequences (3+3) + 1 pair (2) → correct!
    // waiting for the 8th tile... actually with 8 closed tiles and 1 meld, after dealing 13:
    // closed = 13 - 3 = 10 tiles → I need to make the hand with 10 closed tiles

    // Let me redo: 1 open pon means closed has 13-3=10 tiles → 3 mentsu + 1 pair from 10 tiles
    // closed: 1m2m3m 4m5m6m 7m8m9m 2p2p (10 tiles) + pon of 5p → complete
    // win = 2p (tanki)
    const pon = makePon('5p');
    const h = makeHandWithMelds(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','2p'], [pon]);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // base=20 (no menzen bonus), no tsumo, pon(5p)=中張刻子open=2, tanki=2
    // total: 20 + 2(pon) + 2(tanki) = 24 → 30符
    assertEqual(calculateFu(h, t('2p'), ctx), 30, '副露（ポン中張）タンキ待ち=30符');
}
{
    // 老頭牌のポン: 4符（開刻）
    // closed: 1m2m3m 4m5m6m 7m8m9m 2p2p + pon of 1p (老頭)
    const pon = makePon('1p'); // 1p=老頭
    const h = makeHandWithMelds(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','2p'], [pon]);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // base=20, pon(1p)=老頭open=4, tanki(2p)=2 → 26→30符
    assertEqual(calculateFu(h, t('2p'), ctx), 30, '副露（ポン老頭）タンキ待ち=30符');
}
{
    // 明槓（中張）: 8符
    const minkan = makeMinkan('5p');
    const h = makeHandWithMelds(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','2p'], [minkan]);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // base=20, minkan(5p)=中張open槓=8, tanki(2p)=2 → 30→30符
    assertEqual(calculateFu(h, t('2p'), ctx), 30, '副露（明槓中張）タンキ待ち=30符');
}
{
    // 暗槓（中張）: 16符
    const ankan = makeAnkan('5p');
    const h = makeHandWithMelds(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','2p'], [ankan]);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // base=20, menzen=+10(暗槓は副露扱いでない=isOpen()=false→門前), ankan(5p)=中張暗槓=16, tanki=2
    // → 20+10+16+2=48→50符
    assertEqual(calculateFu(h, t('2p'), ctx), 50, '暗槓（中張）タンキ待ち=50符');
}

console.log('\n=== calculateFu: 閉刻符 ===');
{
    // 閉手暗刻（中張）: 4符
    // 111m 222p 333s 4m5m6m + 7p7p (tanki 7p)
    const h = makeHand(['1m','1m','1m','4m','5m','6m','2p','2p','2p','3s','3s','3s','7p','7p']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // 30(menzen) + 8(暗刻1m老頭) + 4(暗刻2p中張) + 4(暗刻3s中張) + 2(単騎7p) = 48→50符
    assertEqual(calculateFu(h, t('7p'), ctx), 50, '閉手暗刻3つ タンキ ロン=50符');
}
{
    // 閉手暗刻（老頭牌）: 8符
    // 999m 999p 999s 1z1z + ロン1z → 刻子完成→双碰
    // hand: 999m 999p 999s 1z1z (13tiles) → wait for 1z (shanpon with 1z1z?
    // Actually 999m999p999s1z1z = 13 tiles complete? Let's check: 3+3+3+2=11 tiles, need 14
    // I need: 999m 999p 999s + 2z2z (pair) + 1z1z = 3+3+3+2+2=13? No, that's too many
    // OK: 3 triplets + 1 pair = 3×3+2 = 11 tiles. Not complete. Need 4 mentsu + 1 pair = 14 tiles.
    // Let me try: 999m 999p 1s2s3s + 1z1z (11 tiles) → 13 tile tenpai with tanki wait
    // Hmm, let me just test a specific case.

    // 閉手: 111m(老頭暗刻)で8符 、sequence 2枚 + pair
    // 111m 2p3p4p 5p6p7p 8p9p + ロン1p(両面4p or 1p?)
    // Wait: 2p3p4p 5p6p7p + 8p9p(2tiles) = let me recalculate...
    // 14-tile hand: 1m1m1m 2p3p4p 5p6p7p 9p + 8p9p? No...
    // Simple: 1m1m1m 2m3m4m 5m6m7m 9m9m + ロン9m(tanki) = 11 closed tiles...
    // Actually let me just do a clean example:
    // Closed hand (no melds): 111m=暗刻 + 234p + 567p + 89p + 待ち for 7p or...
    // Let me use: 1m1m1m 1p2p3p 4p5p6p 7p8p 9p9p waiting for 7p(shan) or 9p(tanki)
    // win=9p (tanki) or win=7p... Let's use win=9p (tanki of 9p9p pair)
    const h2 = makeHand(['1m','1m','1m','1p','2p','3p','4p','5p','6p','7p','8p','9p','9p','9p']);
    const ctx2 = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // 30(menzen) + 8(1m老頭暗刻) + 0(123p seq) + 0(456p seq) + 2(単騎9p? or 双碰?)
    // wait: 78p9p → winTile=9p at pos 2, ids[0]%9 = ?
    // 7p=id24(7p→pin offset=9, 7p→id=9+6=15... wait: pin=9, 7p→id=9+7-1=15)
    // Actually: SUIT_OFFSET[pin]=9, 7p: 9+7-1=15, 8p: 16, 9p: 17
    // ids=[15,16,17], pos=2, ids[0]%9=15%9=6 → 辺張！
    // So: 30+8+2(辺張)=40→40符
    // Wait, pair is 9p9p? No, winTile=9p completes the sequence 7p8p9p.
    // But then pair is... let me re-examine the hand.
    // hand: 1m1m1m 1p2p3p 4p5p6p 7p8p 9p9p9p (14 tiles? = 3+3+3+2+3=14? no 3+3+3+3+2=14 ✓)
    // decompose: pair=? if all 9p are triplet, then 9p9p9p=triplet, pair must be elsewhere...
    // 1m1m1m(triplet) 1p2p3p(seq) 4p5p6p(seq) 7p8p(2tiles) 9p9p9p(triplet)
    // 2 tiles left: 7p8p → need to form sequence with winTile
    // But winTile=9p and 9p appears 3 times in hand already...
    // Let me use a cleaner example.

    // Simple: 1m1m1m + 3 sequences + 9p9p (pair), win=9p (tanki)
    const h3 = makeHand(['1m','1m','1m','1p','2p','3p','4p','5p','6p','7p','8p','9p','9p','9p']);
    // This has: 1m×3, 1p2p3p, 4p5p6p, 9p×3 = 3+3+3+3=12 + 7p8p?
    // 14 tiles = 1m×3 + 1p2p3p + 4p5p6p + 7p8p9p + 9p9p? → 3+3+3+3+2 = 14
    // Hmm, 9p appears once in 7p8p9p AND twice as pair = 3 total... possible!
    // decompose: pair=9p(id=17), mentsu=[111m(triplet), 123p(seq), 456p(seq), 789p(seq)]
    // win=9p at pair → tanki
    // fu: 30(menzen) + 8(1m老頭暗刻) + 2(tanki9p) = 40→40符
    assertEqual(calculateFu(h3, t('9p'), ctx2), 40, '老頭牌暗刻1つ+シーケンス3+単騎 ロン=40符');
}

console.log('\n=== calculateFu: 待ち牌符 ===');
{
    // 嵌張(カンチャン): +2符
    // 123m 456m 789m 1p2p3p + 5s5s → wait for 4s or 6s (kanchan 4s6s? No, kanchan is middle of 3)
    // 嵌張: 4s6s(missing 5s) waiting for 5s
    // hand(13): 1m2m3m 4m5m6m 7m8m9m 1p2p3p 4s6s(11 tiles → wait +pair?)
    // Let me think: I need 4 mentsu + 1 pair = 14. Remove 1 tile from complete to get tenpai.
    // Complete: 123m 456m 789m 123p 5s5s (14 tiles) - I need kanchan wait.
    // Kanchan would be: keep 3 sequences as melds and have 4s6s+pair in hand waiting for 5s.
    // 13-tile tenpai: 123m 456m 789m + 4s6s + 2p2p = 13 tiles (kanchan 4s6s wait for 5s)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','4s','6s','2p','2p','5s']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // win=5s (kanchan between 4s and 6s)
    // decomp: pair=2p, mentsu=[123m, 456m, 789m, 456s] winTile=5s at pos 1 → kanchan +2
    // fu: 30(menzen) + 2(kanchan) = 32→40符
    assertEqual(calculateFu(h, t('5s'), ctx), 40, '嵌張待ち=40符');
}
{
    // 辺張（ペンチャン）: +2符
    // 1-2 待ちで3を引く（辺張）
    // 123m 456m 789m 1p2p + 2s2s(pair) waiting for 3p (penchan: 1p2p→3p)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','2s','2s','3p']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // win=3p, ids=[id_1p, id_2p, id_3p]=[9,10,11], pos=2, ids[0]%9=9%9=0 → 辺張！
    // fu: 30(menzen) + 2(penchan) = 32→40符
    assertEqual(calculateFu(h, t('3p'), ctx), 40, '辺張（12→3）待ち=40符');
}
{
    // 辺張（8-9 → 7）
    // 1m2m3m 4m5m6m 7m8m9m + 8p9p + 2s2s → wait for 7p (penchan: 8p9p→7p)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','8p','9p','2s','2s','7p']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // win=7p, ids=[id_7p, id_8p, id_9p]=[15,16,17], pos=0, ids[2]%9=17%9=8 → 辺張！
    // fu: 30(menzen) + 2(penchan) = 32→40符
    assertEqual(calculateFu(h, t('7p'), ctx), 40, '辺張（89→7）待ち=40符');
}
{
    // 双碰（シャンポン）: 0符
    // 123m 456m 789m + 1p1p + 3p3p → wait for 1p or 3p (shanpon)
    // 13tiles: 1m2m3m 4m5m6m 7m8m9m 1p1p 3p3p(=11 tiles) + 1 more?
    // Wait: 3seq+2pairs=11 tiles. Need 14 total → 11+3=14 → add one seq
    // 1m2m3m 4m5m6m 7m8m9m 1p2p3p 1s1s 3s3s(=14 tiles) → shanpon 1s or 3s
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1s','1s','3s']);
    // This is 15 tiles... let me redo: 4 mentsu + 2 pairs → shanpon is tenpai
    // 3 seqs + 1 mentsu + 2 pairs = 3+3+3+3+2+2=16? No...
    // shanpon = tenpai with 2 pairs, win on one pair (makes it triplet, other stays pair)
    // 3 mentsu + 2 pairs = 3×3 + 2×2 = 13 tiles = tenpai ✓
    // + win tile (1 of the pairs) = 14 tiles → complete
    const h2 = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','1p','3p','3p','1p']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // win=1p. hand has: 1m2m3m, 4m5m6m, 7m8m9m, 1p×3, 3p×2
    // decomp: pair=3p, mentsu=[123m, 456m, 789m, 111p(triplet)] winTile=1p in triplet → 双碰
    // fu: 30(menzen) + 8(1p=1索老頭暗刻? No, 1p=pin→老頭=rank0→8符) + 0(双碰) = 38→40符
    // Actually 1p is 1筒(一筒), rank=1(0-indexed 0), isTerminalOrHonor → yes → 暗刻8符
    // total: 30+8+0=38→40符
    assertEqual(calculateFu(h2, t('1p'), ctx), 40, '双碰待ち=40符（刻子符あり）');
}

console.log('\n=== calculateFu: 雀頭符 ===');
{
    // 役牌（中）雀頭: +2符
    // 123m 456m 789m 1p2p3p + 7z7z (中雀頭=2符) → tanki 7z
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','7z','7z']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // 30(menzen) + 2(中雀頭) + 2(tanki) = 34→40符
    assertEqual(calculateFu(h, t('7z'), ctx), 40, '中雀頭 単騎=40符');
}
{
    // 自風（東）雀頭(seatWind=1): +2符
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1z','1z']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 2 }; // 東家・南場
    // 1z=東(id=27), seatWind=1 → 26+1=27 ✓ → 2符
    // 30(menzen) + 2(自風東雀頭) + 2(tanki) = 34→40符
    assertEqual(calculateFu(h, t('1z'), ctx), 40, '自風雀頭 単騎=40符');
}
{
    // ダブル東（自風=場風=東）雀頭: +4符
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1z','1z']);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 }; // 東家・東場
    // 30(menzen) + 4(ダブ東雀頭) + 2(tanki) = 36→40符
    assertEqual(calculateFu(h, t('1z'), ctx), 40, 'ダブル東雀頭 単騎=40符');
}

console.log('\n=== calculateFu: 副露暗槓老頭 ===');
{
    // 暗槓（老頭）: 32符
    const ankan = makeAnkan('9m'); // 9m=老頭
    const h = makeHandWithMelds(['1p','2p','3p','4p','5p','6p','7p','8p','9p','2s','2s'], [ankan]);
    const ctx = { isTsumo: false, seatWind: 1, roundWind: 1 };
    // isOpen: ankan.isOpen()=false → 門前 → menzen+10 ✓
    // base=20, menzen=+10, ankan(9m老頭暗槓)=32符, tanki(2s)=2 → 64→70符
    assertEqual(calculateFu(h, t('2s'), ctx), 70, '暗槓（老頭）タンキ待ち ロン=70符');
}

// ============================================================
// 完了サマリ
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`テスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
