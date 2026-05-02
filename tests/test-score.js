/**
 * 点数計算テスト（第5週）
 * node tests/test-score.js で実行
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

// 牌生成ユーティリティ
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
function makeAnkan(tileStr) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.ANKAN, [tile, tile.copy(), tile.copy(), tile.copy()], -1, null);
}

// ============================================================
// basicPoints テスト
// ============================================================
console.log('\n[basicPoints]');
{
    // 1翻30符: 30 × 2^3 = 240
    assertEqual(basicPoints(1, 30), 240, '1翻30符 → 240');
    // 2翻30符: 30 × 2^4 = 480
    assertEqual(basicPoints(2, 30), 480, '2翻30符 → 480');
    // 3翻30符: 30 × 2^5 = 960
    assertEqual(basicPoints(3, 30), 960, '3翻30符 → 960');
    // 4翻30符: 30 × 2^6 = 1920 < 2000 → 非満貫
    assertEqual(basicPoints(4, 30), 1920, '4翻30符 → 1920（非満貫）');
    // 5翻（満貫）
    assertEqual(basicPoints(5, 30), 2000, '5翻 → 2000（満貫）');
    // 4翻30符でもhan>=5ではないが、3翻70符はbasic=70×32=2240 >= 2000 → 満貫
    assertEqual(basicPoints(3, 70), 2000, '3翻70符 → 2000（基本点>=2000）');
    // 6翻（跳満）
    assertEqual(basicPoints(6, 30), 3000, '6翻 → 3000（跳満）');
    // 8翻（倍満）
    assertEqual(basicPoints(8, 30), 4000, '8翻 → 4000（倍満）');
    // 11翻（三倍満）
    assertEqual(basicPoints(11, 30), 6000, '11翻 → 6000（三倍満）');
    // 13翻（役満）
    assertEqual(basicPoints(13, 30), 8000, '13翻 → 8000（役満）');
    // 26翻（ダブル役満）
    assertEqual(basicPoints(26, 30), 16000, '26翻 → 16000（ダブル役満）');
}

// ============================================================
// scoreLabel テスト
// ============================================================
console.log('\n[scoreLabel]');
{
    assertEqual(scoreLabel(1, 30), '1翻30符', '1翻30符 → 文字列');
    assertEqual(scoreLabel(2, 40), '2翻40符', '2翻40符 → 文字列');
    assertEqual(scoreLabel(5, 30), '満貫',   '5翻 → 満貫');
    assertEqual(scoreLabel(3, 70), '満貫',   '3翻70符 → 満貫（切り上げ）');
    assertEqual(scoreLabel(6, 30), '跳満',   '6翻 → 跳満');
    assertEqual(scoreLabel(8, 30), '倍満',   '8翻 → 倍満');
    assertEqual(scoreLabel(11, 30),'三倍満', '11翻 → 三倍満');
    assertEqual(scoreLabel(13, 30),'役満',   '13翻 → 役満');
}

// ============================================================
// calculateScore テスト
// ============================================================
console.log('\n[calculateScore: 通常点数]');
{
    // 1翻30符 基本点=240
    // 親ロン: 240×6=1440 → 1500
    const r1 = calculateScore(1, 30, true, false);
    assertEqual(r1.payments[0], 1500, '1翻30符 親ロン → 1500');
    assertEqual(r1.total,       1500, '1翻30符 親ロン total → 1500');

    // 親ツモ: 各240×2=480 → 500
    const r2 = calculateScore(1, 30, true, true);
    assertEqual(r2.payments[0], 500,  '1翻30符 親ツモ each → 500');
    assertEqual(r2.total,       1500, '1翻30符 親ツモ total → 1500');

    // 子ロン: 240×4=960 → 1000
    const r3 = calculateScore(1, 30, false, false);
    assertEqual(r3.payments[0], 1000, '1翻30符 子ロン → 1000');
    assertEqual(r3.total,       1000, '1翻30符 子ロン total → 1000');

    // 子ツモ: 親480→500, 子240→300
    const r4 = calculateScore(1, 30, false, true);
    assertEqual(r4.payments[0], 500,  '1翻30符 子ツモ 親払い → 500');
    assertEqual(r4.payments[1], 300,  '1翻30符 子ツモ 子払い → 300');
    assertEqual(r4.total,       1100, '1翻30符 子ツモ total → 1100');

    // 3翻30符 基本点=960
    // 親ロン: 960×6=5760 → 5800
    const r5 = calculateScore(3, 30, true, false);
    assertEqual(r5.payments[0], 5800, '3翻30符 親ロン → 5800');
    // 子ロン: 960×4=3840 → 3900
    const r6 = calculateScore(3, 30, false, false);
    assertEqual(r6.payments[0], 3900, '3翻30符 子ロン → 3900');
}

console.log('\n[calculateScore: 満貫以上]');
{
    // 満貫（基本点2000）
    const m1 = calculateScore(5, 30, true, false);
    assertEqual(m1.payments[0], 12000, '満貫 親ロン → 12000');
    assertEqual(m1.total,       12000, '満貫 親ロン total → 12000');

    const m2 = calculateScore(5, 30, true, true);
    assertEqual(m2.payments[0], 4000,  '満貫 親ツモ each → 4000');
    assertEqual(m2.total,       12000, '満貫 親ツモ total → 12000');

    const m3 = calculateScore(5, 30, false, false);
    assertEqual(m3.payments[0], 8000,  '満貫 子ロン → 8000');

    const m4 = calculateScore(5, 30, false, true);
    assertEqual(m4.payments[0], 4000,  '満貫 子ツモ 親払い → 4000');
    assertEqual(m4.payments[1], 2000,  '満貫 子ツモ 子払い → 2000');
    assertEqual(m4.total,       8000,  '満貫 子ツモ total → 8000');

    // 跳満（基本点3000）
    const h1 = calculateScore(6, 30, true, false);
    assertEqual(h1.payments[0], 18000, '跳満 親ロン → 18000');
    const h2 = calculateScore(6, 30, false, false);
    assertEqual(h2.payments[0], 12000, '跳満 子ロン → 12000');

    // 倍満（基本点4000）
    const b1 = calculateScore(8, 30, true, false);
    assertEqual(b1.payments[0], 24000, '倍満 親ロン → 24000');
    const b2 = calculateScore(8, 30, false, false);
    assertEqual(b2.payments[0], 16000, '倍満 子ロン → 16000');

    // 三倍満（基本点6000）
    const s1 = calculateScore(11, 30, true, false);
    assertEqual(s1.payments[0], 36000, '三倍満 親ロン → 36000');
    const s2 = calculateScore(11, 30, false, false);
    assertEqual(s2.payments[0], 24000, '三倍満 子ロン → 24000');

    // 役満（基本点8000）
    const y1 = calculateScore(13, 30, true, false);
    assertEqual(y1.payments[0], 48000, '役満 親ロン → 48000');
    const y2 = calculateScore(13, 30, false, false);
    assertEqual(y2.payments[0], 32000, '役満 子ロン → 32000');
    const y3 = calculateScore(13, 30, true, true);
    assertEqual(y3.payments[0], 16000, '役満 親ツモ each → 16000');
    const y4 = calculateScore(13, 30, false, true);
    assertEqual(y4.payments[0], 16000, '役満 子ツモ 親払い → 16000');
    assertEqual(y4.payments[1], 8000,  '役満 子ツモ 子払い → 8000');
}

console.log('\n[calculateScore: 本場・供託]');
{
    // 本場ボーナス（ロン）: 1翻30符 2本場 → 1500 + 600 = 2100
    const hb1 = calculateScore(1, 30, true, false, 2);
    assertEqual(hb1.payments[0], 2100, '親ロン 2本場 → 2100');
    assertEqual(hb1.total,       2100, '親ロン 2本場 total → 2100');

    // 本場ボーナス（ツモ）: 1翻30符 1本場 親ツモ → each 600
    const hb2 = calculateScore(1, 30, true, true, 1);
    assertEqual(hb2.payments[0], 600,  '親ツモ 1本場 each → 600');
    assertEqual(hb2.total,       1800, '親ツモ 1本場 total → 1800');

    // 本場ボーナス（子ツモ）: 1翻30符 1本場 → 親600, 子400
    const hb3 = calculateScore(1, 30, false, true, 1);
    assertEqual(hb3.payments[0], 600,  '子ツモ 1本場 親払い → 600');
    assertEqual(hb3.payments[1], 400,  '子ツモ 1本場 子払い → 400');
    assertEqual(hb3.total,       1400, '子ツモ 1本場 total → 1400');

    // 供託（リーチ棒）: 1翻30符 子ロン 3供託 → 1000 + 3000 = 4000
    const kk1 = calculateScore(1, 30, false, false, 0, 3);
    assertEqual(kk1.total, 4000, '子ロン 3供託 total → 4000');
    assertEqual(kk1.payments[0], 1000, '子ロン 3供託 payments[0] → 1000（供託は別）');

    // 本場+供託: 1翻30符 子ロン 1本場 2供託 → 1300 + 2000 = 3300
    const kk2 = calculateScore(1, 30, false, false, 1, 2);
    assertEqual(kk2.payments[0], 1300, '子ロン 1本場2供託 payments → 1300');
    assertEqual(kk2.total,       3300, '子ロン 1本場2供託 total → 3300');
}

// ============================================================
// calculateFu テスト
// ============================================================
console.log('\n[calculateFu: 七対子]');
{
    // 七対子: 25符固定
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','7m']);
    assertEqual(calculateFu(h, t('7m'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 25,
        '七対子 → 25符');
    assertEqual(calculateFu(h, t('7m'), { isTsumo: true, seatWind: 1, roundWind: 1 }), 25,
        '七対子ツモ → 25符（固定）');
}

console.log('\n[calculateFu: 平和]');
{
    // 手牌: 2m3m4m 5m6m7m 2p3p4p 5p6p7p 9s9s (win on 5p=ryanmen)
    const h = makeHand(['2m','3m','4m','5m','6m','7m','2p','3p','4p','5p','6p','7p','9s','9s']);
    // isPinfu=true でツモ→20, ロン→30
    assertEqual(calculateFu(h, t('5p'), { isTsumo: true,  isPinfu: true, seatWind: 1, roundWind: 1 }), 20,
        '平和ツモ → 20符');
    assertEqual(calculateFu(h, t('5p'), { isTsumo: false, isPinfu: true, seatWind: 1, roundWind: 1 }), 30,
        '平和ロン → 30符');
    // isPinfu=false でも同じ手牌・門前ロン: 20+0+0+10=30 → 30
    assertEqual(calculateFu(h, t('5p'), { isTsumo: false, isPinfu: false, seatWind: 1, roundWind: 1 }), 30,
        '全順子門前ロン（isPinfu=false）→ 自然に30符');
}

console.log('\n[calculateFu: 待ち符]');
{
    // 嵌張: 1m2m3m 4m5m6m 5p6p7p 1p3p 9s9s → win on 2p (嵌張)
    // 手牌14枚（winon2p): 1m2m3m 4m5m6m 5p6p7p 1p2p3p 9s9s
    const hKanchan = makeHand(['1m','2m','3m','4m','5m','6m','5p','6p','7p','1p','2p','3p','9s','9s']);
    // 2p(id=10): 1p2p3p seqのpos=1(中) → 嵌張 +2
    // Fu: 20 + 0(9s pair) + 2(嵌張) + 0(sequences) + 10(門前ロン) = 32 → 40
    assertEqual(calculateFu(hKanchan, t('2p'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '嵌張ロン → 40符');

    // 辺張(1-2→3待ち): 1m2m3m 4m5m6m 5p6p7p 1p2p3p 9s9s → win on 3p (辺張)
    const hPenchan = makeHand(['1m','2m','3m','4m','5m','6m','5p','6p','7p','1p','2p','3p','9s','9s']);
    // 3p(id=11): seq[9,10,11] pos=2, first=9, 9%9=0 → 辺張 +2
    // Fu: 20 + 0 + 2(辺張) + 0 + 10 = 32 → 40
    assertEqual(calculateFu(hPenchan, t('3p'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '辺張(1-2→3)ロン → 40符');

    // 辺張(8-9→7待ち): win on 7p
    // 手牌: 1m2m3m 4m5m6m 1p2p3p 7p8p9p 9s9s (8p9p待ち=辺張)
    const hPenchan2 = makeHand(['1m','2m','3m','4m','5m','6m','1p','2p','3p','7p','8p','9p','9s','9s']);
    // 7p(id=15): seq[15,16,17] pos=0, first=15, 15%9=6 ≥ 6 → 辺張 +2
    // Fu: 20 + 0 + 2(辺張) + 0 + 10 = 32 → 40
    assertEqual(calculateFu(hPenchan2, t('7p'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '辺張(8-9→7)ロン → 40符');

    // 単騎: 1m2m3m 4m5m6m 7m8m9m 1p2p3p + 9s → win on 9s (単騎)
    const hTanki = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','9s','9s']);
    // Fu: 20 + 0(9s pair: terminal non-yakuhai) + 2(単騎) + 0 + 10 = 32 → 40
    assertEqual(calculateFu(hTanki, t('9s'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '単騎ロン → 40符');
}

console.log('\n[calculateFu: 面子符]');
{
    // 暗刻（中張牌）+3順子+雀頭: 3m3m3m 1p2p3p 4p5p6p 5s6s7s 9m9m
    // win on 7s (ryanmen: 5s6s wait), tsumo
    const hAnkou1 = makeHand(['3m','3m','3m','1p','2p','3p','4p','5p','6p','5s','6s','7s','9m','9m']);
    // Fu: 20 + 0(9m非役牌) + 0(両面) + 4(暗刻3m中張) + 0 + 2(ツモ) = 26 → 30
    assertEqual(calculateFu(hAnkou1, t('7s'), { isTsumo: true, seatWind: 1, roundWind: 1 }), 30,
        '暗刻(中張)ツモ → 30符');

    // 暗刻（老頭牌）+3順子+雀頭: 1m1m1m 1p2p3p 4p5p6p 5s6s7s 9m9m → menzen ron, ryanmen
    const hAnkou2 = makeHand(['1m','1m','1m','1p','2p','3p','4p','5p','6p','5s','6s','7s','9m','9m']);
    // Fu: 20 + 0(9m) + 0(両面) + 8(暗刻1m老頭) + 0 + 10(門前ロン) = 38 → 40
    assertEqual(calculateFu(hAnkou2, t('7s'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '暗刻(老頭牌)門前ロン → 40符');

    // 老頭牌暗刻×2: 1m1m1m 9m9m9m 1p2p3p 4s5s6s 3p3p → menzen ron, ryanmen
    const hAnkou3 = makeHand(['1m','1m','1m','9m','9m','9m','1p','2p','3p','4s','5s','6s','3p','3p']);
    // Fu: 20 + 0(3p非役牌) + 0(両面) + 8(1m) + 8(9m) + 0 + 10(門前ロン) = 46 → 50
    assertEqual(calculateFu(hAnkou3, t('6s'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 50,
        '老頭牌暗刻×2 門前ロン → 50符');

    // 役牌雀頭（白）+順子+門前ロン+両面:
    // 手牌: 1m2m3m 7m8m9m 1p2p3p 4m5m6m 白白
    const hDragon = makeHand(['1m','2m','3m','7m','8m','9m','1p','2p','3p','4m','5m','6m','5z','5z']);
    // 5z = 白(id=31): headFu=2
    // win on 4m or 3p... let me use 6m (seq 4m5m6m, 6m at pos 2, first=3, 3%9=3≠0→ryanmen)
    // Fu: 20 + 2(白) + 0(両面) + 0(sequences) + 10(門前ロン) = 32 → 40
    assertEqual(calculateFu(hDragon, t('6m'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '役牌雀頭(白)+順子+門前ロン → 40符');
}

console.log('\n[calculateFu: 副露符]');
{
    // PON(4p中張)+順子+ロン+両面: closed=[1s,2s,3s, 4s,5s,6s, 7s,8s,9s, 9m,9m], meld=PON(4p)
    const hPon = makeHandWithMelds(
        ['1s','2s','3s','4s','5s','6s','7s','8s','9s','9m','9m'],
        [makePon('4p')]
    );
    // win on 6s by ron (ryanmen: 4s5s wait... wait let me re-check)
    // 4s5s6s (win on 6s): seq, 6s at pos2, first=21, 21%9=3≠0 → ryanmen ✓
    // Fu: 20 + 0(9m老頭非役牌) + 0(両面) + 0(sequences) + 2(PON 4p中張 open) + 0(open,no menzen) = 22 → 30
    assertEqual(calculateFu(hPon, t('6s'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 30,
        'PON(中張)+順子 ロン → 30符');

    // PON(1m老頭)+順子+ロン: closed=[1p,2p,3p, 4p,5p,6p, 7p,8p,9p, 9s,9s], meld=PON(1m)
    const hPonTerm = makeHandWithMelds(
        ['1p','2p','3p','4p','5p','6p','7p','8p','9p','9s','9s'],
        [makePon('1m')]
    );
    // Fu: 20 + 0(9s老頭非役牌) + 0 + 0(seq) + 4(PON 1m老頭 open) + 0 = 24 → 30
    assertEqual(calculateFu(hPonTerm, t('7p'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 30,
        'PON(老頭)+順子 ロン → 30符');

    // ANKAN(1m老頭)+順子+門前ロン:
    // closed=[1p,2p,3p, 4p,5p,6p, 4s,5s,6s, 9m,9m], meld=ANKAN(1m)
    const hAnkan = makeHandWithMelds(
        ['1p','2p','3p','4p','5p','6p','4s','5s','6s','9m','9m'],
        [makeAnkan('1m')]
    );
    // ANKANは isOpen()=false → 門前扱い、門前ロン+10
    // Fu: 20 + 0(9m老頭非役牌) + 0(両面4s5s→3sOr6s) + 0(sequences) + 32(ANKAN 1m老頭) + 10(門前ロン) = 62 → 70
    assertEqual(calculateFu(hAnkan, t('6s'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 70,
        'ANKAN(老頭)+順子 門前ロン → 70符');
}

console.log('\n[calculateFu: 双碰待ち]');
{
    // 双碰待ち + 門前ロン:
    // 手牌(14枚): 1p2p3p 4p5p6p 7p8p9p 5m5m5m 9s9s (win on 5m, shanpon pair was 5m5m vs 9s9s)
    const hShanpon = makeHand(['1p','2p','3p','4p','5p','6p','7p','8p','9p','5m','5m','5m','9s','9s']);
    // win on 5m by ron → triplet [4,4,4] includes 5m.id=4 → shanpon ron → minkou (中張) = 2
    // Fu: 20 + 0(9s老頭非役牌 pair) + 0(双碰) + 2(明刻5m中張) + 0(sequences) + 10(門前ロン) = 32 → 40
    assertEqual(calculateFu(hShanpon, t('5m'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '双碰ロン(和了牌刻子=明刻) → 40符');

    // 双碰ツモ: 同じ手牌で tsumo → triplet は暗刻
    // Fu: 20 + 0(pair 9s) + 0(双碰) + 4(暗刻5m中張) + 0(sequences) + 2(ツモ) = 26 → 30
    assertEqual(calculateFu(hShanpon, t('5m'), { isTsumo: true, seatWind: 1, roundWind: 1 }), 30,
        '双碰ツモ(和了牌刻子=暗刻) → 30符');
}

console.log('\n[calculateFu: 連風牌雀頭]');
{
    // 連風牌雀頭（東を自席・場風とも設定）
    // 手牌: 1m2m3m 4m5m6m 7m8m9m 1p2p3p 東東
    const hDoubleWind = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1z','1z']);
    // 1z = 東(id=27): headFu(27, 1, 1): seatWind=1→id=27 ✓, roundWind=1→id=27 ✓ → 4符（連風牌）
    // win on 3p (辺張: seq[9,10,11], 3p at pos2, first=9, 9%9=0 → 辺張 +2)
    // Fu: 20 + 4(連風牌) + 2(辺張) + 0(seq) + 10(門前ロン) = 36 → 40
    assertEqual(calculateFu(hDoubleWind, t('3p'), { isTsumo: false, seatWind: 1, roundWind: 1 }), 40,
        '連風牌雀頭+辺張+門前ロン → 40符');
}

// ============================================================
// 結果
// ============================================================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
