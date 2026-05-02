/**
 * 役判定テスト（第4週）
 * node tests/test-yaku.js で実行
 */
import { Tile, SUIT, HONOR } from '../src/core/Tile.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import {
    evaluateYaku,
    checkTanyao,
    checkPinfu,
    checkIipeiko,
    checkRyanpeiko,
    checkChiitoi,
    checkToitoi,
    checkSanankou,
    checkHonroutou,
    checkShousangen,
    checkSankantsu,
    checkSanshokuDoukou,
    checkSanshokuDoujun,
    checkIttsu,
    checkChanta,
    checkJunchan,
    checkHonitsu,
    checkChinitsu,
    checkHaku,
    checkHatsu,
    checkChun,
    checkDaisangen,
    checkDaisuushii,
    checkShousuushii,
    checkSuuankou,
    checkKokushi,
    checkTsuuiisou,
    checkRyuuiisou,
    checkChuurenpoutou,
    checkSuukantsu,
} from '../src/logic/Yaku.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label}${info ? ' ' + info : ''}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected ${b}, got ${a})`);
}

// 牌を簡易記法で生成: '1m','9p','3s','1z' など
function t(str) {
    const num = parseInt(str[0]);
    const suitMap = { m: SUIT.MAN, p: SUIT.PIN, s: SUIT.SOU, z: SUIT.HONOR };
    return new Tile(suitMap[str[1]], num);
}

// 手牌を生成 (副露なし)
function makeHand(strs) {
    const h = new Hand();
    strs.forEach(s => h.add(t(s)));
    return h;
}

// 手牌+副露を生成
function makeHandWithMelds(closedStrs, melds) {
    const h = new Hand();
    closedStrs.forEach(s => h.add(t(s)));
    melds.forEach(m => h.melds.push(m));
    return h;
}

// ポン副露を生成
function makePon(tileStr, from = 1) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.PON, [tile, tile.copy(), tile.copy()], from, tile.copy());
}

// チー副露を生成
function makeChi(a, b, c, from = 3) {
    const tiles = [t(a), t(b), t(c)];
    return new Meld(MELD_TYPE.CHI, tiles, from, tiles[0].copy());
}

// 暗槓を生成
function makeAnkan(tileStr) {
    const tile = t(tileStr);
    return new Meld(MELD_TYPE.ANKAN, [tile, tile.copy(), tile.copy(), tile.copy()], -1);
}

// ==============================================================
// Hand.isComplete()
// ==============================================================
console.log('\n[Hand.isComplete]');
{
    // 通常和了: 123m 456m 789m 123p 11p (14枚)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    assert(h.isComplete(), '通常和了 → true');
}
{
    // 七対子和了: 1m1m 2m2m 3m3m 4m4m 5m5m 6m6m 7m7m
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','7m']);
    assert(h.isComplete(), '七対子和了 → true');
}
{
    // 国士和了: 1m9m 1p9p 1s9s 1z2z3z4z5z6z7z + 1m
    const h = makeHand(['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z','1m']);
    assert(h.isComplete(), '国士和了 → true');
}
{
    // テンパイ13枚 → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p']);
    assert(!h.isComplete(), 'テンパイ13枚 → false');
}
{
    // 一向聴14枚 → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','3p','1p','1p','5p']);
    assert(!h.isComplete(), '一向聴14枚 → false');
}

// ==============================================================
// checkTanyao
// ==============================================================
console.log('\n[checkTanyao]');
{
    // 234m 456p 678s 33p 22m (副露なし)
    const h = makeHand(['2m','3m','4m','4m','5m','6m','7m','8m','9m','3p','3p','3p','2m','2m']);
    // 実際は: 234m 456m 789m 333p 22m → 9mが入ってる
    // 正しい例: 234m 456p 678s 33m 22p
    const h2 = makeHand(['2m','3m','4m','4p','5p','6p','6s','7s','8s','3m','3m','2p','2p','2p']);
    assert(checkTanyao(h2), 'タンヤオ手 → true');
}
{
    // 1mを含む → false
    const h = makeHand(['1m','2m','3m','4p','5p','6p','6s','7s','8s','3m','3m','2p','2p','2p']);
    assert(!checkTanyao(h), '1m含む → false');
}
{
    // 9pを含む → false
    const h = makeHand(['2m','3m','4m','4p','5p','6p','6s','7s','8s','3m','3m','9p','9p','9p']);
    assert(!checkTanyao(h), '9p含む → false');
}
{
    // 字牌(1z)含む → false
    const h = makeHand(['2m','3m','4m','4p','5p','6p','6s','7s','8s','3m','3m','1z','1z','1z']);
    assert(!checkTanyao(h), '字牌含む → false');
}
{
    // 副露タンヤオ: 手牌23m, ポン555p, チー678s, 345m など
    const h = makeHandWithMelds(
        ['2m','3m','4m','6s','7s','8s','5p','5p'],
        [makePon('5p'), makeChi('3m','4m','5m')]
    );
    // 全部2-8なのでタンヤオ
    assert(checkTanyao(h), '副露タンヤオ → true');
}

// ==============================================================
// checkPinfu
// ==============================================================
console.log('\n[checkPinfu]');
{
    // ピンフ: 123m 456m 789m 23p 55p + ロン4p (両面)
    // 手牌14枚: 123m 456m 789m 234p 55p (winTile=4p)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','3p','4p','5p','5p']);
    const winTile = t('4p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(checkPinfu(h, winTile, ctx), 'ピンフ 両面待ち → true');
}
{
    // 刻子を含む: 111m 456m 789m 23p 55p + ロン4p → false
    const h = makeHand(['1m','1m','1m','4m','5m','6m','7m','8m','9m','2p','3p','4p','5p','5p']);
    const winTile = t('4p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(!checkPinfu(h, winTile, ctx), '刻子あり → false');
}
{
    // 役牌雀頭(中): 123m 456m 789m 23p 77z + ロン4p → false (7z=中は役牌)
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','3p','4p','7z','7z']);
    const winTile = t('4p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(!checkPinfu(h, winTile, ctx), '中雀頭 → false');
}
{
    // 嵌張待ち: 123m 456m 789m 24p 55p + ロン3p → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2p','4p','3p','5p','5p']);
    const winTile = t('3p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(!checkPinfu(h, winTile, ctx), '嵌張待ち → false');
}
{
    // 辺張待ち: 123m 456m 789m 12p 55p + ロン3p → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','5p','5p']);
    const winTile = t('3p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(!checkPinfu(h, winTile, ctx), '辺張待ち(12p→3p) → false');
}
{
    // 副露あり → false
    const h = makeHandWithMelds(
        ['4m','5m','6m','7m','8m','9m','2p','3p','4p','5p','5p'],
        [makeChi('1m','2m','3m')]
    );
    const winTile = t('4p');
    const ctx = { isTsumo: false, seatWind: HONOR.SOUTH, roundWind: HONOR.EAST };
    assert(!checkPinfu(h, winTile, ctx), '副露あり → false');
}

// ==============================================================
// checkIipeiko
// ==============================================================
console.log('\n[checkIipeiko]');
{
    // 一盃口: 123m 123m 456p 789s 11p
    const h = makeHand(['1m','2m','3m','1m','2m','3m','4p','5p','6p','7s','8s','9s','1p','1p']);
    assert(checkIipeiko(h), '一盃口 → true');
}
{
    // 通常手 → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    assert(!checkIipeiko(h), '通常手 → false');
}
{
    // 副露あり → false
    const h = makeHandWithMelds(
        ['1m','2m','3m','1m','2m','3m','4p','5p','6p','1p','1p'],
        [makeChi('7s','8s','9s')]
    );
    assert(!checkIipeiko(h), '副露あり → false');
}

// ==============================================================
// checkRyanpeiko
// ==============================================================
console.log('\n[checkRyanpeiko]');
{
    // 二盃口: 123m 123m 456p 456p 11s
    const h = makeHand(['1m','2m','3m','1m','2m','3m','4p','5p','6p','4p','5p','6p','1s','1s']);
    assert(checkRyanpeiko(h), '二盃口 → true');
}
{
    // 一盃口のみ → false
    const h = makeHand(['1m','2m','3m','1m','2m','3m','4p','5p','6p','7s','8s','9s','1p','1p']);
    assert(!checkRyanpeiko(h), '一盃口のみ → false');
}

// ==============================================================
// checkChiitoi (七対子)
// ==============================================================
console.log('\n[checkChiitoi]');
{
    const h = makeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','7m','7m']);
    assert(checkChiitoi(h), '七対子 → true');
}
{
    // 同一4枚 → false (7種必要)
    const h = makeHand(['1m','1m','1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m']);
    assert(!checkChiitoi(h), '4枚同一→7種未満→ false');
}
{
    // 副露あり → false
    const h = makeHandWithMelds(
        ['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m'],
        [makePon('7m')]
    );
    assert(!checkChiitoi(h), '副露あり → false');
}

// ==============================================================
// checkToitoi (対々和)
// ==============================================================
console.log('\n[checkToitoi]');
{
    // 全刻子: 111m 222m 333m 444m 55m
    const h = makeHand(['1m','1m','1m','2m','2m','2m','3m','3m','3m','4m','4m','4m','5m','5m']);
    assert(checkToitoi(h), '全刻子 門前 → true');
}
{
    // ポン副露+閉手刻子
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','2m','2m','3m','3m'],
        [makePon('4m'), makePon('5m')]
    );
    assert(checkToitoi(h), 'ポン副露+閉刻子 → true');
}
{
    // 順子あり → false
    const h = makeHand(['1m','2m','3m','2m','2m','2m','3m','3m','3m','4m','4m','4m','5m','5m']);
    assert(!checkToitoi(h), '順子あり → false');
}

// ==============================================================
// checkSanankou (三暗刻)
// ==============================================================
console.log('\n[checkSanankou]');
{
    // 三暗刻: 111m 222m 333m + チー456p + 5m5m (副露チーがあっても暗刻3つ)
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','2m','2m','3m','3m','3m','5m','5m'],
        [makeChi('4p','5p','6p')]
    );
    assert(checkSanankou(h), '三暗刻 + チー → true');
}
{
    // 暗槓込みの三暗刻
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','2m','2m','5m','5m'],
        [makeAnkan('3m'), makeChi('4p','5p','6p')]
    );
    assert(checkSanankou(h), '暗槓+2暗刻=三暗刻 → true');
}
{
    // 暗刻2つ → false
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','2m','2m','5m','5m'],
        [makePon('3m'), makeChi('4p','5p','6p')]
    );
    assert(!checkSanankou(h), '暗刻2+ポン1 → false');
}

// ==============================================================
// checkHonroutou (混老頭)
// ==============================================================
console.log('\n[checkHonroutou]');
{
    // 111m 999m 111z 999p 11s
    const h = makeHand(['1m','1m','1m','9m','9m','9m','1z','1z','1z','9p','9p','9p','1s','1s']);
    assert(checkHonroutou(h), '混老頭 → true');
}
{
    // 2mを含む → false
    const h = makeHand(['1m','1m','1m','2m','2m','2m','1z','1z','1z','9p','9p','9p','1s','1s']);
    assert(!checkHonroutou(h), '2m含む → false');
}

// ==============================================================
// 役牌 (白・發・中・場風・自風)
// ==============================================================
console.log('\n[役牌]');
{
    // 白(5z)の刻子
    const h = makeHand(['5z','5z','5z','1m','2m','3m','4p','5p','6p','7s','8s','9s','1m','1m']);
    assert(checkHaku(h), '白刻子 → true');
}
{
    // 發(6z)の刻子
    const h = makeHand(['6z','6z','6z','1m','2m','3m','4p','5p','6p','7s','8s','9s','1m','1m']);
    assert(checkHatsu(h), '發刻子 → true');
}
{
    // 中(7z)の刻子
    const h = makeHand(['7z','7z','7z','1m','2m','3m','4p','5p','6p','7s','8s','9s','1m','1m']);
    assert(checkChun(h), '中刻子 → true');
}
{
    // 白が2枚のみ → false
    const h = makeHand(['5z','5z','1m','2m','3m','4p','5p','6p','7s','8s','9s','1m','1m','1m']);
    assert(!checkHaku(h), '白2枚のみ → false');
}
{
    // ポン副露の白
    const h = makeHandWithMelds(
        ['1m','2m','3m','4p','5p','6p','7s','8s','9s','1m','1m'],
        [makePon('5z')]
    );
    assert(checkHaku(h), 'ポン白 → true');
}

// ==============================================================
// checkSanshokuDoujun (三色同順)
// ==============================================================
console.log('\n[checkSanshokuDoujun]');
{
    // 123m 123p 123s 456m 11m
    const h = makeHand(['1m','2m','3m','1p','2p','3p','1s','2s','3s','4m','5m','6m','1m','1m']);
    assert(checkSanshokuDoujun(h), '三色同順 → true');
}
{
    // 123m 123p 456s → false (sが456)
    const h = makeHand(['1m','2m','3m','1p','2p','3p','4s','5s','6s','4m','5m','6m','1m','1m']);
    assert(!checkSanshokuDoujun(h), '3色が揃わない → false');
}
{
    // 副露で三色同順: チー123p + チー123s + 手牌123m
    const h = makeHandWithMelds(
        ['1m','2m','3m','4m','5m','6m','1m','1m'],
        [makeChi('1p','2p','3p'), makeChi('1s','2s','3s')]
    );
    assert(checkSanshokuDoujun(h), '副露+門前で三色同順 → true');
}

// ==============================================================
// checkIttsu (一気通貫)
// ==============================================================
console.log('\n[checkIttsu]');
{
    // 123m 456m 789m 123p 11p
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    assert(checkIttsu(h), '一気通貫(門前) → true');
}
{
    // 123m 456p 789m → false (456が別色)
    const h = makeHand(['1m','2m','3m','4p','5p','6p','7m','8m','9m','1p','2p','3p','1s','1s']);
    assert(!checkIttsu(h), '中断色違い → false');
}
{
    // 副露チーで一気通貫
    const h = makeHandWithMelds(
        ['1m','2m','3m','4m','5m','6m','1p','2p','3p','1p','1p'],
        [makeChi('7m','8m','9m')]
    );
    assert(checkIttsu(h), '副露で一気通貫 → true');
}

// ==============================================================
// checkChanta (混全帯么九)
// ==============================================================
console.log('\n[checkChanta]');
{
    // 123m 789p 111z 9s9s (雀頭9s)
    const h = makeHand(['1m','2m','3m','7p','8p','9p','1z','1z','1z','9s','9s','9s','1s','1s']);
    // 全面子に老頭牌+順子あり
    assert(checkChanta(h), 'チャンタ(字牌あり順子あり) → true');
}
{
    // 純数牌のチャンタ → false (純チャンになる・字牌なし)
    // 123m 789p 123s 9m9m
    const h = makeHand(['1m','2m','3m','7p','8p','9p','1s','2s','3s','9m','9m','9m','1p','1p']);
    // 全部数牌で字牌なし → チャンタの要件は満たす（字牌なしチャンタは純チャン）
    // checkChantaは字牌なしでもtrueを返すべき（純チャンの上位互換ではないので）
    // 仕様: チャンタは字牌を含む。字牌なしは純チャン。
    // → checkChantaはtrueを返さない（pure junchan case）
    assert(!checkChanta(h), '字牌なし純数牌 → チャンタfalse(純チャン)');
}
{
    // 副露チャンタ: チー123m + ポン白 + 789s + 9p9p
    const h = makeHandWithMelds(
        ['7s','8s','9s','9p','9p','9p','1p','1p'],
        [makeChi('1m','2m','3m'), makePon('5z')]
    );
    assert(checkChanta(h), '副露チャンタ → true');
}

// ==============================================================
// checkJunchan (純全帯么九)
// ==============================================================
console.log('\n[checkJunchan]');
{
    // 123m 789p 123s 9m9m
    const h = makeHand(['1m','2m','3m','7p','8p','9p','1s','2s','3s','9m','9m','9m','1p','1p']);
    assert(checkJunchan(h), '純チャン → true');
}
{
    // 字牌あり → false (チャンタになる)
    const h = makeHand(['1m','2m','3m','7p','8p','9p','1z','1z','1z','9s','9s','9s','1s','1s']);
    assert(!checkJunchan(h), '字牌あり → 純チャンfalse');
}

// ==============================================================
// checkHonitsu (混一色)
// ==============================================================
console.log('\n[checkHonitsu]');
{
    // 123m 456m 789m 111z 9m9m
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1z','1z','1z','9m','9m']);
    assert(checkHonitsu(h), '混一色(万子+字牌) → true');
}
{
    // 123m 456p → false (2色)
    const h = makeHand(['1m','2m','3m','4p','5p','6p','7m','8m','9m','1z','1z','1z','9m','9m']);
    assert(!checkHonitsu(h), '2色含む → false');
}
{
    // 副露混一色
    const h = makeHandWithMelds(
        ['1m','2m','3m','4m','5m','6m','9m','9m'],
        [makePon('1z'), makePon('2z')]
    );
    assert(checkHonitsu(h), '副露混一色 → true');
}

// ==============================================================
// checkChinitsu (清一色)
// ==============================================================
console.log('\n[checkChinitsu]');
{
    // 123m 456m 789m 234m 1m1m
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','2m','3m','4m','1m','1m']);
    assert(checkChinitsu(h), '清一色(万子のみ) → true');
}
{
    // 字牌含む → false
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1z','1z','1z','1m','1m']);
    assert(!checkChinitsu(h), '字牌含む → false');
}

// ==============================================================
// checkDaisangen (大三元)
// ==============================================================
console.log('\n[checkDaisangen]');
{
    // 白発中すべて刻子
    const h = makeHandWithMelds(
        ['5z','5z','5z','6z','6z','6z','7z','7z'],
        [makePon('7z'), makePon('1m')]
    );
    // 手牌に白x3,発x3、副露に中x3 → 大三元
    const h2 = makeHandWithMelds(
        ['5z','5z','5z','6z','6z','6z','1m','1m'],
        [makePon('7z'), makePon('1p')]
    );
    assert(checkDaisangen(h2), '大三元(白発+ポン中) → true');
}
{
    // 白発刻子のみ → false
    const h = makeHandWithMelds(
        ['5z','5z','5z','6z','6z','6z','1m','1m'],
        [makePon('1p'), makeChi('1s','2s','3s')]
    );
    assert(!checkDaisangen(h), '白発のみ → false');
}

// ==============================================================
// checkShousuushii (小四喜)
// ==============================================================
console.log('\n[checkShousuushii]');
{
    // 東南西刻子 + 北雀頭
    const h = makeHandWithMelds(
        ['1z','1z','1z','2z','2z','2z','4z','4z'],
        [makePon('3z'), makePon('5z')]
    );
    // 東x3 南x3 ポン西 ポン白... これは違う。
    // 東=1z 南=2z 西=3z 北=4z
    // 小四喜: 東南西3刻子+北雀頭
    const h2 = makeHandWithMelds(
        ['1z','1z','1z','2z','2z','2z','4z','4z'],
        [makePon('3z'), makePon('5m')]
    );
    assert(checkShousuushii(h2), '小四喜(東南西刻子+北雀頭) → true');
}
{
    // 東南西北すべて刻子 → 大四喜(小四喜でない)
    const h = makeHandWithMelds(
        ['1z','1z','1z','2z','2z','2z','5m','5m'],
        [makePon('3z'), makePon('4z')]
    );
    assert(!checkShousuushii(h), '大四喜の場合→小四喜false');
}

// ==============================================================
// checkDaisuushii (大四喜)
// ==============================================================
console.log('\n[checkDaisuushii]');
{
    // 東南西北すべて刻子
    const h = makeHandWithMelds(
        ['1z','1z','1z','2z','2z','2z','5m','5m'],
        [makePon('3z'), makePon('4z')]
    );
    assert(checkDaisuushii(h), '大四喜 → true');
}
{
    // 東南西刻子+北雀頭 → false
    const h = makeHandWithMelds(
        ['1z','1z','1z','2z','2z','2z','4z','4z'],
        [makePon('3z'), makePon('5m')]
    );
    assert(!checkDaisuushii(h), '小四喜→大四喜false');
}

// ==============================================================
// checkSuuankou (四暗刻)
// ==============================================================
console.log('\n[checkSuuankou]');
{
    // 門前全刻子: 111m 222m 333m 444m + 55p
    const h = makeHand(['1m','1m','1m','2m','2m','2m','3m','3m','3m','4m','4m','4m','5p','5p']);
    assert(checkSuuankou(h), '四暗刻 → true');
}
{
    // 暗槓3+暗刻1
    const h = makeHandWithMelds(
        ['1m','1m','1m','5p','5p'],
        [makeAnkan('2m'), makeAnkan('3m'), makeAnkan('4m')]
    );
    assert(checkSuuankou(h), '暗槓3+暗刻1=四暗刻 → true');
}
{
    // ポン副露あり → false
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','2m','2m','3m','3m','3m','5p','5p'],
        [makePon('4m')]
    );
    assert(!checkSuuankou(h), 'ポン副露あり → false');
}

// ==============================================================
// checkKokushi (国士無双)
// ==============================================================
console.log('\n[checkKokushi]');
{
    // 国士完成
    const h = makeHand(['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z','1m']);
    assert(checkKokushi(h), '国士完成 → true');
}
{
    // 国士テンパイ → false
    const h = makeHand(['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z','2m']);
    assert(!checkKokushi(h), '国士テンパイ → false');
}

// ==============================================================
// checkTsuuiisou (字一色)
// ==============================================================
console.log('\n[checkTsuuiisou]');
{
    // 全字牌: 111z 222z 333z 444z 55z
    const h = makeHand(['1z','1z','1z','2z','2z','2z','3z','3z','3z','4z','4z','4z','5z','5z']);
    assert(checkTsuuiisou(h), '字一色 → true');
}
{
    // 数牌含む → false
    const h = makeHand(['1z','1z','1z','2z','2z','2z','3z','3z','3z','4z','4z','4z','1m','1m']);
    assert(!checkTsuuiisou(h), '数牌含む → false');
}

// ==============================================================
// checkRyuuiisou (緑一色)
// ==============================================================
console.log('\n[checkRyuuiisou]');
{
    // 234s 234s 666s 88s 6z6z6z (發)
    const h = makeHand(['2s','3s','4s','2s','3s','4s','6s','6s','6s','8s','8s','6z','6z','6z']);
    assert(checkRyuuiisou(h), '緑一色 → true');
}
{
    // 1sを含む → false
    const h = makeHand(['1s','2s','3s','2s','3s','4s','6s','6s','6s','8s','8s','6z','6z','6z']);
    assert(!checkRyuuiisou(h), '1s含む → false');
}

// ==============================================================
// checkChuurenpoutou (九連宝燈)
// ==============================================================
console.log('\n[checkChuurenpoutou]');
{
    // 1112345678999m + 5m (14枚)
    const h = makeHand(['1m','1m','1m','2m','3m','4m','5m','6m','7m','8m','9m','9m','9m','5m']);
    assert(checkChuurenpoutou(h), '九連宝燈 → true');
}
{
    // 副露あり → false
    const h = makeHandWithMelds(
        ['1m','1m','1m','2m','3m','4m','5m','6m','7m','8m','9m'],
        [makePon('9m')]
    );
    assert(!checkChuurenpoutou(h), '副露あり → false');
}
{
    // テンパイ(13枚) → false
    const h = makeHand(['1m','1m','1m','2m','3m','4m','5m','6m','7m','8m','9m','9m','9m']);
    assert(!checkChuurenpoutou(h), '13枚テンパイ → false');
}

// ==============================================================
// checkSuukantsu (四槓子)
// ==============================================================
console.log('\n[checkSuukantsu]');
{
    // 4つ槓子 (暗槓4)
    const h = makeHandWithMelds(
        ['5m','5m'],
        [makeAnkan('1m'), makeAnkan('2m'), makeAnkan('3m'), makeAnkan('4m')]
    );
    assert(checkSuukantsu(h), '四槓子 → true');
}
{
    // 槓子3つ → false
    const h = makeHandWithMelds(
        ['5m','5m','6m','6m','6m'],
        [makeAnkan('1m'), makeAnkan('2m'), makeAnkan('3m')]
    );
    assert(!checkSuukantsu(h), '三槓子 → false');
}

// ==============================================================
// evaluateYaku 統合テスト
// ==============================================================
console.log('\n[evaluateYaku 統合]');
{
    // タンヤオのみ (門前・ツモ)
    const h = makeHand(['2m','3m','4m','4p','5p','6p','6s','7s','8s','3m','3m','2p','2p','2p']);
    const ctx = { isTsumo: true, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.SOUTH, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, t('2p'), ctx);
    assert(result.yaku.some(y => y.key === 'TANYAO'), 'evaluateYaku: タンヤオ確認');
    assert(result.yaku.some(y => y.key === 'TSUMO'), 'evaluateYaku: ツモ確認');
    assert(result.han >= 2, `evaluateYaku: タンヤオ+ツモ 2翻以上 (got ${result.han})`);
    assert(!result.isYakuman, 'evaluateYaku: 役満でない');
}
{
    // 大三元
    const h = makeHandWithMelds(
        ['5z','5z','5z','6z','6z','6z','1m','1m'],
        [makePon('7z'), makePon('1p')]
    );
    const ctx = { isTsumo: true, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.SOUTH, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, t('1p'), ctx);
    assert(result.isYakuman, 'evaluateYaku: 大三元→役満');
    assert(result.yaku.some(y => y.key === 'DAISANGEN'), 'evaluateYaku: DAISANGEN確認');
}
{
    // 天和
    const h = makeHand(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','1p','1p']);
    const ctx = { isTsumo: true, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.EAST, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: true, isChiihou: false };
    const result = evaluateYaku(h, t('1p'), ctx);
    assert(result.isYakuman, 'evaluateYaku: 天和→役満');
}
{
    // リーチ+ピンフ+タンヤオ
    const h = makeHand(['2m','3m','4m','2p','3p','4p','5s','6s','7s','2m','3m','4m','5p','5p']);
    const ctx = { isTsumo: false, isRiichi: true, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.SOUTH, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, t('4m'), ctx);
    assert(result.yaku.some(y => y.key === 'RIICHI'), 'リーチ+ピンフ+タンヤオ: RIICHI確認');
    assert(result.yaku.some(y => y.key === 'PINFU'), 'リーチ+ピンフ+タンヤオ: PINFU確認');
    assert(result.yaku.some(y => y.key === 'TANYAO'), 'リーチ+ピンフ+タンヤオ: TANYAO確認');
    assert(result.han >= 3, `リーチ+ピンフ+タンヤオ 3翻以上 (got ${result.han})`);
}
{
    // 役なし手（副露手・チー3+ポン1で適用できる役が全くない）
    // チー123m + チー456p + チー789s + ポン2m + 9s9s ロン9s
    // 1mが含まれるためタンヤオ×, 異色のためホニツ×, チーあるためトイトイ×, 一気通貫・三色も×
    const h = makeHandWithMelds(
        ['9s','9s'],
        [makeChi('1m','2m','3m'), makeChi('4p','5p','6p'), makeChi('7s','8s','9s'), makePon('2m')]
    );
    const ctx = { isTsumo: false, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.SOUTH, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, t('9s'), ctx);
    assertEqual(result.han, 0, '役なし手(副露) → han=0');
}

// ==============================================================
// 結果
// ==============================================================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
