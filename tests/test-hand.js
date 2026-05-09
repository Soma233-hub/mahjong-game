/**
 * Hand クラス単体テスト
 * node tests/test-hand.js で実行
 */
import { Tile, SUIT } from '../src/core/Tile.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';

let passed = 0;
let failed = 0;

function assert(condition, label, info = '') {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.error(`  ✗ ${label} ${info}`);
        failed++;
    }
}

function assertEqual(actual, expected, label) {
    const ok = actual === expected;
    assert(ok, label, ok ? '' : `(expected ${expected}, got ${actual})`);
}

// --- ヘルパー: 牌を簡易記法で生成 ---
// '1m','9p','7z' など → Tile
function t(str) {
    const num = parseInt(str[0]);
    const suitChar = str[1];
    const suitMap = { m: SUIT.MAN, p: SUIT.PIN, s: SUIT.SOU, z: SUIT.HONOR };
    return new Tile(suitMap[suitChar], num);
}

function makeHand(tileStrs) {
    const h = new Hand();
    tileStrs.forEach(s => h.add(t(s)));
    return h;
}

// ========================
// 七対子
// ========================
console.log('\n[七対子 向聴数]');
{
    // 完成: 1m1m 2m2m 3m3m 4m4m 5m5m 6m6m 7m7m → -1
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','7m']);
    assertEqual(h._chiitoiShanten(), -1, '七対子 完成 → -1');
}
{
    // 6対子+1種 → 0
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','8m']);
    assertEqual(h._chiitoiShanten(), 0, '七対子 テンパイ(6対子) → 0');
}
{
    // 1対子のみ → 5
    const h = makeHand(['1m','1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','4p']);
    assertEqual(h._chiitoiShanten(), 5, '七対子 1対子 → 5');
}

// ========================
// 国士無双
// ========================
console.log('\n[国士無双 向聴数]');
{
    // 完成: 1m9m1p9p1s9s東南西北白發中 + 1m
    const h = makeHand(['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z','1m']);
    assertEqual(h._kokushiShanten(), -1, '国士無双 完成 → -1');
}
{
    // 13種揃い対子なし → 0
    const h = makeHand(['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z','2m']);
    assertEqual(h._kokushiShanten(), 0, '国士無双 13種対子なし → 0');
}

// ========================
// 通常手 向聴数
// ========================
console.log('\n[通常手 向聴数]');
{
    // 完成形: 123m 456m 789m 123p 11p
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    const s = h._normalShanten();
    assertEqual(s, -1, '通常手 完成 → -1');
}
{
    // テンパイ: 123m 456m 789m 12p 11p (待ち3p)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','1p','1p']);
    const s = h._normalShanten();
    assertEqual(s, 0, '通常手 テンパイ → 0');
}
{
    // 一向聴: 123m 456m 789m 1p 11p (1塔子不足)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','1p','1p']);
    // 12枚しかないのでisTenpaiは正しく使えないが向聴数だけテスト
    // 13枚に: 2p追加 → テンパイのはず
    h.add(t('2p'));
    const s = h._normalShanten();
    assertEqual(s, 0, '通常手 123m456m789m 12p 11p テンパイ → 0');
}
{
    // バラバラ13枚 → 向聴数は高い
    const h = makeHand(['1m','3m','5m','7m','9m','1p','3p','5p','7p','9p','1s','3s','5s']);
    const s = h._normalShanten();
    assert(s >= 3, `バラバラ配牌 向聴数 >= 3 (got ${s})`);
}

// ========================
// getShantenNumber 統合
// ========================
console.log('\n[getShantenNumber 統合]');
{
    // 七対子テンパイ
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','8m']);
    const { shanten, type } = h.getShantenNumber();
    assertEqual(shanten, 0, '七対子テンパイ shanten=0');
    assertEqual(type, 'chiitoi', '七対子テンパイ type=chiitoi');
}
{
    // 通常完成
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    const { shanten, type } = h.getShantenNumber();
    assertEqual(shanten, -1, '通常完成 shanten=-1');
    assertEqual(type, 'normal', '通常完成 type=normal');
}

// ========================
// 有効牌・待ち牌
// ========================
console.log('\n[有効牌・待ち牌]');
{
    // テンパイ: 123m 456m 789m 12p 11p 待ち3p
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','1p','1p']);
    const waits = h.getWaitingTileIds();
    // 3p のid: pin=9, 3p → 9+2=11
    assert(waits.includes(11), '待ち牌に3p(id=11)が含まれる');
}

// ========================
// 副露あり手牌の向聴数（K>=1 のシャンテン補正）
// ========================
console.log('\n[副露あり手牌の向聴数]');
{
    // K=1 ポン後: 11閉牌で3面子+1雀頭 → isComplete()=true
    // ポン牌: 8m×3, 閉牌: 3m4m5m 6m7m8m 3p4p5p 2s2s (11枚)
    const h = new Hand();
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8)],
        0, new Tile(SUIT.MAN,8)));
    for (const [s,n] of [[SUIT.MAN,3],[SUIT.MAN,4],[SUIT.MAN,5],
                          [SUIT.MAN,6],[SUIT.MAN,7],[SUIT.MAN,8],
                          [SUIT.PIN,3],[SUIT.PIN,4],[SUIT.PIN,5],
                          [SUIT.SOU,2],[SUIT.SOU,2]]) {
        h.tiles.push(new Tile(s, n));
    }
    assert(h.isComplete(), 'K=1 副露後 11閉牌 3面子+雀頭 → isComplete()=true');
}
{
    // K=1 ポン後: 10閉牌でテンパイ → isTenpai()=true
    // ポン牌: 8m×3, 閉牌: 3m4m5m 7m8m 3p4p5p 2s2s (10枚, 6mか9mを待つ)
    const h = new Hand();
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8)],
        0, new Tile(SUIT.MAN,8)));
    for (const [s,n] of [[SUIT.MAN,3],[SUIT.MAN,4],[SUIT.MAN,5],
                          [SUIT.MAN,7],[SUIT.MAN,8],
                          [SUIT.PIN,3],[SUIT.PIN,4],[SUIT.PIN,5],
                          [SUIT.SOU,2],[SUIT.SOU,2]]) {
        h.tiles.push(new Tile(s, n));
    }
    assert(h.isTenpai(), 'K=1 副露後 10閉牌 テンパイ形 → isTenpai()=true');
}
{
    // K=1 ポン後 テンパイ: 待ち牌(6mまたは9m)が正しく検出される
    const h = new Hand();
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,8)],
        0, new Tile(SUIT.MAN,8)));
    for (const [s,n] of [[SUIT.MAN,3],[SUIT.MAN,4],[SUIT.MAN,5],
                          [SUIT.MAN,7],[SUIT.MAN,8],
                          [SUIT.PIN,3],[SUIT.PIN,4],[SUIT.PIN,5],
                          [SUIT.SOU,2],[SUIT.SOU,2]]) {
        h.tiles.push(new Tile(s, n));
    }
    const waits = h.getWaitingTileIds();
    const id6m = new Tile(SUIT.MAN, 6).id; // man6 = id 5
    const id9m = new Tile(SUIT.MAN, 9).id; // man9 = id 8
    assert(waits.includes(id6m) || waits.includes(id9m),
        `K=1 副露後テンパイ: 待ち牌6m(id=${id6m})か9m(id=${id9m})が含まれる`);
}
{
    // K=2 ポン×2後: 8閉牌で2面子+1雀頭 → isComplete()=true
    // ポン×2: 8m, 9m, 閉牌: 3m4m5m 3p4p5p 7s7s (8枚)
    const h = new Hand();
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,8),new Tile(SUIT.MAN,8),new Tile(SUIT.MAN,8)],
        0, new Tile(SUIT.MAN,8)));
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,9),new Tile(SUIT.MAN,9),new Tile(SUIT.MAN,9)],
        1, new Tile(SUIT.MAN,9)));
    for (const [s,n] of [[SUIT.MAN,3],[SUIT.MAN,4],[SUIT.MAN,5],
                          [SUIT.PIN,3],[SUIT.PIN,4],[SUIT.PIN,5],
                          [SUIT.SOU,7],[SUIT.SOU,7]]) {
        h.tiles.push(new Tile(s, n));
    }
    assert(h.isComplete(), 'K=2 副露後 8閉牌 2面子+雀頭 → isComplete()=true');
}
{
    // K=2 ポン×2後: 7閉牌でテンパイ → isTenpai()=true
    // ポン×2: 8m, 9m, 閉牌: 3m4m5m 3p4p 7s7s (7枚, 2pか5pを待つ)
    const h = new Hand();
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,8),new Tile(SUIT.MAN,8),new Tile(SUIT.MAN,8)],
        0, new Tile(SUIT.MAN,8)));
    h.melds.push(new Meld(MELD_TYPE.PON,
        [new Tile(SUIT.MAN,9),new Tile(SUIT.MAN,9),new Tile(SUIT.MAN,9)],
        1, new Tile(SUIT.MAN,9)));
    for (const [s,n] of [[SUIT.MAN,3],[SUIT.MAN,4],[SUIT.MAN,5],
                          [SUIT.PIN,3],[SUIT.PIN,4],
                          [SUIT.SOU,7],[SUIT.SOU,7]]) {
        h.tiles.push(new Tile(s, n));
    }
    assert(h.isTenpai(), 'K=2 副露後 7閉牌 テンパイ形 → isTenpai()=true');
}

// ========================
// 結果
// ========================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
