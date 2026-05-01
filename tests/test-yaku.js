/**
 * 役判定テスト（第4週）
 * node tests/test-yaku.js で実行
 */
import { Tile, SUIT, HONOR } from '../src/core/Tile.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import {
    evaluateYaku,
    checkTanyao, checkPinfu, checkIipeiko, checkToitoi,
    checkChiitoitsu, checkSanankou, checkSanshokuDoujun, checkIttsu,
    checkChanta, checkJunchan, checkHonitsu, checkChinitsu,
    checkRyanpeiko, checkSanshokuDoukou, checkHonroutou, checkShousangen,
    checkSankantsu,
    checkKokushi, checkSuuankou, checkDaisangen, checkShousuushii,
    checkDaisuushii, checkTsuuiisou, checkRyuuiisou, checkChuurenpoutou,
    checkSuukantsu,
} from '../src/logic/Yaku.js';

let passed = 0;
let failed = 0;

function assert(condition, label, info = '') {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.error(`  ✗ ${label}${info ? ' : ' + info : ''}`);
        failed++;
    }
}

// --- ヘルパー ---
function m(num) { return new Tile(SUIT.MAN,   num); }
function p(num) { return new Tile(SUIT.PIN,   num); }
function s(num) { return new Tile(SUIT.SOU,   num); }
function z(num) { return new Tile(SUIT.HONOR, num); }

function makeHand(tiles, melds = []) {
    const h = new Hand();
    tiles.forEach(tile => h.add(tile));
    melds.forEach(meld => h.melds.push(meld));
    return h;
}

// ポン副露ヘルパー
function ponMeld(tileFunc, num, fromPlayer = 1) {
    const tiles = [tileFunc(num), tileFunc(num), tileFunc(num)];
    return new Meld(MELD_TYPE.PON, tiles, fromPlayer, tileFunc(num));
}
// チー副露ヘルパー
function chiMeld(tileFunc, nums, fromPlayer = 3) {
    const tiles = nums.map(n => tileFunc(n));
    return new Meld(MELD_TYPE.CHI, tiles, fromPlayer, tiles[0]);
}
// 暗槓ヘルパー
function ankanMeld(tileFunc, num) {
    const tiles = [tileFunc(num), tileFunc(num), tileFunc(num), tileFunc(num)];
    return new Meld(MELD_TYPE.ANKAN, tiles, -1, null);
}
// 明槓ヘルパー
function minkanMeld(tileFunc, num, fromPlayer = 1) {
    const tiles = [tileFunc(num), tileFunc(num), tileFunc(num), tileFunc(num)];
    return new Meld(MELD_TYPE.MINKAN, tiles, fromPlayer, tileFunc(num));
}

// =====================================================================
// Hand.isComplete() テスト
// =====================================================================
console.log('\n=== Hand.isComplete() ===');

{
    // 正常ケース1: 通常和了形14枚（4面子+雀頭）
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), p(1),p(2),p(3), s(5),s(5)]);
    assert(h.isComplete(s(5)) === true, '通常形14枚は和了');
}
{
    // 正常ケース2: 七対子形
    const h = makeHand([m(1),m(1), m(3),m(3), m(5),m(5), m(7),m(7), p(2),p(2), p(4),p(4), s(6),s(6)]);
    assert(h.isComplete(s(6)) === true, '七対子形は和了');
}
{
    // 正常ケース3: 国士無双
    const h = makeHand([m(1),m(9), p(1),p(9), s(1),s(9), z(1),z(2),z(3),z(4),z(5),z(6),z(7),z(1)]);
    assert(h.isComplete(z(1)) === true, '国士無双は和了');
}
{
    // 正常ケース4: 副露あり和了形（melds=1 → tiles=11枚で合計14枚）
    const h = makeHand([p(4),p(5),p(6), p(7),p(8),p(9), s(5),s(6),s(7), s(8),s(8)], [ponMeld(m, 3)]);
    assert(h.isComplete(s(8)) === true, '副露あり和了形');
}
{
    // エッジケース1: 13枚（テンパイ前）は false
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), p(1),p(2),p(3), s(5)]);
    assert(h.isComplete(s(5)) === false, '13枚は和了でない（ツモ前）');
}
{
    // エッジケース2: バラバラ14枚は false
    const h = makeHand([m(1),m(3),m(5),m(7), p(2),p(4),p(6),p(8), s(1),s(3),s(5),s(7), z(1),z(2)]);
    assert(h.isComplete(z(2)) === false, 'バラバラは和了でない');
}
{
    // エッジケース3: 和了牌で完成形になるかチェック（winTile=なし和了形）
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(1),p(2),p(3), s(1),s(2),s(3), z(1),z(1)]);
    assert(h.isComplete(z(1)) === true, '清一色に字牌雀頭の通常形');
}

// =====================================================================
// checkTanyao テスト
// =====================================================================
console.log('\n=== checkTanyao ===');
{
    // 正常1: 門前タンヤオ（全中張牌）
    const h = makeHand([m(2),m(3),m(4), m(5),m(6),m(7), p(2),p(3),p(4), p(5),p(6),p(7), s(3),s(3)]);
    assert(checkTanyao(h) === true, '門前タンヤオ（全中張）');
}
{
    // 正常2: 副露タンヤオ
    const h = makeHand([m(5),m(6),m(7), p(5),p(6),p(7), s(4),s(4)], [chiMeld(p, [2,3,4])]);
    assert(checkTanyao(h) === true, '副露タンヤオ');
}
{
    // 正常3: 七対子形でもタンヤオ成立
    const h = makeHand([m(2),m(2), m(4),m(4), m(6),m(6), m(8),m(8), p(3),p(3), p(5),p(5), s(7),s(7)]);
    assert(checkTanyao(h) === true, '七対子タンヤオ');
}
{
    // NG: 1萬含む
    const h = makeHand([m(1),m(2),m(3), m(5),m(6),m(7), p(2),p(3),p(4), p(5),p(6),p(7), s(3),s(3)]);
    assert(checkTanyao(h) === false, '1萬含むはタンヤオでない');
}
{
    // NG: 字牌含む
    const h = makeHand([m(2),m(3),m(4), m(5),m(6),m(7), p(2),p(3),p(4), p(5),p(6),p(7), z(1),z(1)]);
    assert(checkTanyao(h) === false, '字牌含むはタンヤオでない');
}
{
    // NG: 9索含む
    const h = makeHand([m(2),m(3),m(4), m(5),m(6),m(7), p(2),p(3),p(4), s(7),s(8),s(9), s(3),s(3)]);
    assert(checkTanyao(h) === false, '9索含むはタンヤオでない');
}

// =====================================================================
// checkPinfu テスト
// =====================================================================
console.log('\n=== checkPinfu ===');
{
    // 正常1: 全順子・雀頭中張・両面待ち（winTile を含む14枚で呼ぶ）
    // 123m 456m 789p 234s 55p → 14枚
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(7),p(8),p(9), s(2),s(3),s(4), p(5),p(5)]);
    const win = s(4);
    assert(checkPinfu(h, win) === true, '全順子両面待ちはピンフ');
}
{
    // 正常2: 別の両面待ち手（winTile s(6) 含む14枚）
    const h = makeHand([m(2),m(3),m(4), m(5),m(6),m(7), p(3),p(4),p(5), s(6),s(7),s(8), m(9),m(9)]);
    const win = s(6);
    assert(checkPinfu(h, win) === true, '別手形のピンフ');
}
{
    // 正常3: 両面（winTile m(9) 含む14枚）
    const h = makeHand([m(1),m(2),m(3), p(1),p(2),p(3), s(1),s(2),m(7),m(8),m(9), s(5),s(5), s(3)]);
    const win = m(9);
    assert(checkPinfu(h, win) === true, '多面待ちを含む両面ピンフ');
}
{
    // NG1: 雀頭が役牌（中）winTile s(4) 含む14枚
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(7),p(8),p(9), s(2),s(3),s(4), z(7),z(7)]);
    const win = s(4);
    assert(checkPinfu(h, win) === false, '雀頭が役牌（中）はピンフでない');
}
{
    // NG2: 刻子含む（winTile s(4) 含む14枚）
    const h = makeHand([m(1),m(2),m(3), m(5),m(5),m(5), p(7),p(8),p(9), s(2),s(3),s(4), p(4),p(4)]);
    const win = s(4);
    assert(checkPinfu(h, win) === false, '刻子含むはピンフでない');
}
{
    // NG3: カンチャン待ち（s(2),s(4) で 3索待ち、winTile s(3) 含む14枚）
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(7),p(8),p(9), s(2),s(3),s(4), p(5),p(5)]);
    // s(2),s(3),s(4) は順子として成立してしまうので別の形で
    const h2 = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(7),p(8),p(9), s(2),s(4),s(3), p(5),p(5)]);
    const win = s(3);
    // 同じ牌 s(3)=s(3) なのでカンチャン判定は分解依存; ここでは正しく順子に分解される
    // 別パターン: 13m と p(2),p(4) でカンチャン
    const h3 = makeHand([m(4),m(5),m(6), m(7),m(8),m(9), p(1),p(3), p(2), s(1),s(2),s(3), p(5),p(5)]);
    const win3 = p(2);
    assert(checkPinfu(h3, win3) === false, 'カンチャン待ちはピンフでない');
}
{
    // NG4: 単騎待ち → ピンフでない（winTile p(5) 含む14枚）
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(7),p(8),p(9), s(3),s(3),s(4),s(4), p(5)]);
    const win = p(5);
    assert(checkPinfu(h, win) === false, '単騎待ちはピンフでない');
}
{
    // NG5: 副露手はピンフでない（tiles=10枚+meld1つ=13枚、winTile含む）
    const h = makeHand([m(1),m(2),m(3), p(7),p(8),p(9), s(2),s(3),s(4), p(5),p(5)], [chiMeld(m, [4,5,6])]);
    const win = s(4);
    assert(checkPinfu(h, win) === false, '副露手はピンフでない');
}

// =====================================================================
// checkIipeiko テスト
// =====================================================================
console.log('\n=== checkIipeiko ===');
{
    // 正常1: 123m 123m + ...
    const h = makeHand([m(1),m(2),m(3), m(1),m(2),m(3), p(4),p(5),p(6), s(7),s(8),s(9), z(1),z(1)]);
    assert(checkIipeiko(h) === true, '一盃口（123m×2）');
}
{
    // 正常2: 789p 789p
    const h = makeHand([p(7),p(8),p(9), p(7),p(8),p(9), m(1),m(2),m(3), s(4),s(5),s(6), m(5),m(5)]);
    assert(checkIipeiko(h) === true, '一盃口（789p×2）');
}
{
    // 正常3: 二盃口は一盃口でもある（下位互換チェック）
    // 123m 123m 456p 456p ← 二盃口
    const h = makeHand([m(1),m(2),m(3), m(1),m(2),m(3), p(4),p(5),p(6), p(4),p(5),p(6), s(8),s(8)]);
    assert(checkIipeiko(h) === true, '二盃口形でも一盃口成立');
}
{
    // NG: 同じ刻子はイーペーコーでない
    const h = makeHand([m(1),m(1),m(1), m(4),m(5),m(6), p(4),p(5),p(6), s(7),s(8),s(9), z(1),z(1)]);
    assert(checkIipeiko(h) === false, '刻子はイーペーコーでない');
}
{
    // NG: 副露手はイーペーコーでない
    const h = makeHand([m(1),m(2),m(3), p(4),p(5),p(6), s(7),s(8),s(9), z(1),z(1)], [chiMeld(m, [1,2,3])]);
    assert(checkIipeiko(h) === false, '副露手はイーペーコーでない');
}

// =====================================================================
// checkToitoi テスト
// =====================================================================
console.log('\n=== checkToitoi ===');
{
    // 正常1: 全刻子（門前）
    const h = makeHand([m(1),m(1),m(1), m(5),m(5),m(5), p(3),p(3),p(3), s(7),s(7),s(7), z(1),z(1)]);
    assert(checkToitoi(h) === true, '全刻子門前はトイトイ');
}
{
    // 正常2: ポン3つ
    const h = makeHand([s(1),s(1),s(1), z(2),z(2)], [ponMeld(m, 3), ponMeld(p, 7), ponMeld(s, 9)]);
    assert(checkToitoi(h) === true, 'ポン3つトイトイ');
}
{
    // 正常3: 暗槓あり
    const h = makeHand([m(2),m(2),m(2), p(4),p(4),p(4), s(6),s(6),s(6), z(3),z(3)], [ankanMeld(m, 8)]);
    assert(checkToitoi(h) === true, '暗槓あり全刻子');
}
{
    // NG: 順子含む
    const h = makeHand([m(1),m(2),m(3), m(5),m(5),m(5), p(3),p(3),p(3), s(7),s(7),s(7), z(1),z(1)]);
    assert(checkToitoi(h) === false, '順子含むはトイトイでない');
}
{
    // NG: 七対子形はトイトイでない
    const h = makeHand([m(1),m(1), m(3),m(3), m(5),m(5), m(7),m(7), p(2),p(2), p(4),p(4), s(6),s(6)]);
    assert(checkToitoi(h) === false, '七対子はトイトイでない');
}

// =====================================================================
// checkChiitoitsu テスト
// =====================================================================
console.log('\n=== checkChiitoitsu ===');
{
    // 正常1: 7種7対
    const h = makeHand([m(1),m(1), m(3),m(3), m(5),m(5), m(7),m(7), p(2),p(2), p(4),p(4), s(6),s(6)]);
    assert(checkChiitoitsu(h) === true, '七対子');
}
{
    // 正常2: 字牌含む七対子
    const h = makeHand([m(2),m(2), p(4),p(4), s(6),s(6), z(1),z(1), z(3),z(3), z(5),z(5), z(7),z(7)]);
    assert(checkChiitoitsu(h) === true, '字牌含む七対子');
}
{
    // 正常3: 端牌含む七対子
    const h = makeHand([m(1),m(1), m(9),m(9), p(1),p(1), p(9),p(9), s(1),s(1), s(9),s(9), z(1),z(1)]);
    assert(checkChiitoitsu(h) === true, '端牌含む七対子');
}
{
    // NG: 4枚同じは七対子でない（6種+4枚）
    const h = makeHand([m(1),m(1),m(1),m(1), m(3),m(3), m(5),m(5), m(7),m(7), p(2),p(2), p(4),p(4)]);
    assert(checkChiitoitsu(h) === false, '同牌4枚は七対子でない');
}
{
    // NG: 通常形はチートイでない
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(1),p(2),p(3), s(1),s(2),s(3), z(1),z(1)]);
    assert(checkChiitoitsu(h) === false, '通常形はチートイでない');
}

// =====================================================================
// checkSanankou テスト
// =====================================================================
console.log('\n=== checkSanankou ===');
{
    // 正常1: 3つ暗刻（ロン以外で完成）
    // 111m 333m 555m + 234p + 99s ← 99sロンで三暗刻
    const h = makeHand([m(1),m(1),m(1), m(3),m(3),m(3), m(5),m(5),m(5), p(2),p(3),p(4), s(9),s(9)]);
    const ctx = { isTsumo: false, winTile: s(9) };
    assert(checkSanankou(h, ctx) === true, '3暗刻（ロン・雀頭以外）');
}
{
    // 正常2: ツモで3暗刻（刻子が全部暗刻）
    const h = makeHand([m(1),m(1),m(1), m(3),m(3),m(3), m(5),m(5),m(5), p(2),p(3),p(4), s(9),s(9)]);
    const ctx = { isTsumo: true, winTile: s(9) };
    assert(checkSanankou(h, ctx) === true, '3暗刻（ツモ）');
}
{
    // 正常3: 暗槓あり三暗刻（暗槓+2暗刻）
    const h = makeHand([m(3),m(3),m(3), m(5),m(5),m(5), p(2),p(3),p(4), s(9),s(9)], [ankanMeld(m, 1)]);
    const ctx = { isTsumo: false, winTile: s(9) };
    assert(checkSanankou(h, ctx) === true, '暗槓+2暗刻=三暗刻');
}
{
    // NG: 2暗刻はNG
    const h = makeHand([m(1),m(1),m(1), m(3),m(3),m(3), p(2),p(3),p(4), p(5),p(6),p(7), s(9),s(9)]);
    const ctx = { isTsumo: false, winTile: s(9) };
    assert(checkSanankou(h, ctx) === false, '2暗刻は三暗刻でない');
}

// =====================================================================
// checkSanshokuDoujun テスト
// =====================================================================
console.log('\n=== checkSanshokuDoujun ===');
{
    // 正常1: 123m 123p 123s
    const h = makeHand([m(1),m(2),m(3), p(1),p(2),p(3), s(1),s(2),s(3), m(5),m(6),m(7), z(1),z(1)]);
    assert(checkSanshokuDoujun(h) === true, '三色同順（123）');
}
{
    // 正常2: 789m 789p 789s
    const h = makeHand([m(7),m(8),m(9), p(7),p(8),p(9), s(7),s(8),s(9), m(2),m(3),m(4), z(2),z(2)]);
    assert(checkSanshokuDoujun(h) === true, '三色同順（789）');
}
{
    // 正常3: 副露含む三色同順
    const h = makeHand([p(4),p(5),p(6), s(4),s(5),s(6), m(3),m(3)], [chiMeld(m, [4,5,6])]);
    assert(checkSanshokuDoujun(h) === true, '副露三色同順（456）');
}
{
    // NG: 2色のみ
    const h = makeHand([m(1),m(2),m(3), p(1),p(2),p(3), m(4),m(5),m(6), p(7),p(8),p(9), z(1),z(1)]);
    assert(checkSanshokuDoujun(h) === false, '2色のみは三色同順でない');
}
{
    // NG: 同じ数字でない
    const h = makeHand([m(1),m(2),m(3), p(2),p(3),p(4), s(3),s(4),s(5), m(7),m(8),m(9), z(1),z(1)]);
    assert(checkSanshokuDoujun(h) === false, '異なる数字は三色同順でない');
}

// =====================================================================
// checkIttsu テスト
// =====================================================================
console.log('\n=== checkIttsu ===');
{
    // 正常1: 123m 456m 789m
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), p(2),p(3),p(4), s(5),s(5)]);
    assert(checkIttsu(h) === true, '一気通貫（萬子）');
}
{
    // 正常2: ピン子で一気通貫
    const h = makeHand([p(1),p(2),p(3), p(4),p(5),p(6), p(7),p(8),p(9), m(3),m(4),m(5), z(2),z(2)]);
    assert(checkIttsu(h) === true, '一気通貫（筒子）');
}
{
    // 正常3: 副露込みの一気通貫
    const h = makeHand([s(4),s(5),s(6), s(7),s(8),s(9), m(3),m(3)], [chiMeld(s, [1,2,3])]);
    assert(checkIttsu(h) === true, '副露一気通貫（索子）');
}
{
    // NG: 123456789がない
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(8), p(2),p(3),p(4), s(5),s(5)]);
    assert(checkIttsu(h) === false, '789がない（888）は一気通貫でない');
}

// =====================================================================
// checkChanta テスト
// =====================================================================
console.log('\n=== checkChanta ===');
{
    // 正常1: 全面子に幺九牌（字牌含む）
    // 123m 789p 111z + 幺九含む面子 + 端牌雀頭
    const h = makeHand([m(1),m(2),m(3), p(7),p(8),p(9), z(1),z(1),z(1), s(1),s(2),s(3), m(9),m(9)]);
    assert(checkChanta(h) === true, '混全帯么九');
}
{
    // 正常2: 副露あり混チャンタ
    const h = makeHand([p(7),p(8),p(9), s(1),s(2),s(3), m(9),m(9)], [ponMeld(z, 1)]);
    assert(checkChanta(h) === true, '副露混チャンタ');
}
{
    // NG: 中張牌のみの面子がある
    const h = makeHand([m(2),m(3),m(4), p(7),p(8),p(9), z(1),z(1),z(1), s(1),s(2),s(3), m(9),m(9)]);
    assert(checkChanta(h) === false, '中張牌面子ありはチャンタでない');
}

// =====================================================================
// checkJunchan テスト
// =====================================================================
console.log('\n=== checkJunchan ===');
{
    // 正常1: 全面子に老頭牌（字牌なし）
    const h = makeHand([m(1),m(2),m(3), m(7),m(8),m(9), p(1),p(2),p(3), s(7),s(8),s(9), m(9),m(9)]);
    // ↑ 789m が2つあるので無効、別の形で
    const h2 = makeHand([m(1),m(2),m(3), p(7),p(8),p(9), s(1),s(2),s(3), m(7),m(8),m(9), p(9),p(9)]);
    assert(checkJunchan(h2) === true, '純全帯么九');
}
{
    // 正常2: 副露あり純チャンタ
    const h = makeHand([p(7),p(8),p(9), s(1),s(2),s(3), m(9),m(9)], [chiMeld(m, [1,2,3])]);
    assert(checkJunchan(h) === true, '副露純チャンタ');
}
{
    // NG: 字牌含む（混チャン止まり）
    const h = makeHand([m(1),m(2),m(3), p(7),p(8),p(9), z(1),z(1),z(1), s(1),s(2),s(3), m(9),m(9)]);
    assert(checkJunchan(h) === false, '字牌含む純チャンタはNG（混チャン）');
}

// =====================================================================
// checkHonitsu テスト
// =====================================================================
console.log('\n=== checkHonitsu ===');
{
    // 正常1: 萬子+字牌
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), z(1),z(1),z(1), z(2),z(2)]);
    assert(checkHonitsu(h) === true, '混一色（萬子+字牌）');
}
{
    // 正常2: 筒子+字牌
    const h = makeHand([p(2),p(3),p(4), p(5),p(6),p(7), p(8),p(9),p(8), z(3),z(3),z(3), z(5),z(5)]);
    // ↑ p(8)が3枚になるので888p
    const h2 = makeHand([p(2),p(3),p(4), p(5),p(6),p(7), p(8),p(8),p(8), z(3),z(3),z(3), z(5),z(5)]);
    assert(checkHonitsu(h2) === true, '混一色（筒子+字牌）');
}
{
    // 正常3: 副露混一色
    const h = makeHand([s(2),s(3),s(4), s(5),s(6),s(7), z(7),z(7)], [ponMeld(z, 1)]);
    assert(checkHonitsu(h) === true, '副露混一色（索子）');
}
{
    // NG: 2色の数牌が混在
    const h = makeHand([m(1),m(2),m(3), p(4),p(5),p(6), m(7),m(8),m(9), z(1),z(1),z(1), z(2),z(2)]);
    assert(checkHonitsu(h) === false, '2色数牌は混一色でない');
}
{
    // NG: 清一色（字牌なし）は混一色でない
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), m(1),m(2),m(3), m(1),m(1)]);
    assert(checkHonitsu(h) === false, '清一色形は混一色でない');
}

// =====================================================================
// checkChinitsu テスト
// =====================================================================
console.log('\n=== checkChinitsu ===');
{
    // 正常1: 全萬子
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), m(1),m(2),m(3), m(1),m(1)]);
    assert(checkChinitsu(h) === true, '清一色（萬子）');
}
{
    // 正常2: 全筒子
    const h = makeHand([p(2),p(3),p(4), p(5),p(6),p(7), p(8),p(8),p(8), p(1),p(2),p(3), p(9),p(9)]);
    assert(checkChinitsu(h) === true, '清一色（筒子）');
}
{
    // 正常3: 副露清一色
    const h = makeHand([s(1),s(2),s(3), s(4),s(5),s(6), s(9),s(9)], [chiMeld(s, [7,8,9])]);
    assert(checkChinitsu(h) === true, '副露清一色（索子）');
}
{
    // NG: 字牌含む
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), m(7),m(8),m(9), z(1),z(1),z(1), m(1),m(1)]);
    assert(checkChinitsu(h) === false, '字牌含む清一色はNG');
}

// =====================================================================
// checkRyanpeiko テスト
// =====================================================================
console.log('\n=== checkRyanpeiko ===');
{
    // 正常1: 123m×2 456p×2
    const h = makeHand([m(1),m(2),m(3), m(1),m(2),m(3), p(4),p(5),p(6), p(4),p(5),p(6), s(8),s(8)]);
    assert(checkRyanpeiko(h) === true, '二盃口（123m×2, 456p×2）');
}
{
    // 正常2: 789s×2 234p×2
    const h = makeHand([s(7),s(8),s(9), s(7),s(8),s(9), p(2),p(3),p(4), p(2),p(3),p(4), m(5),m(5)]);
    assert(checkRyanpeiko(h) === true, '二盃口（789s×2, 234p×2）');
}
{
    // 正常3: 同色二盃口
    const h = makeHand([m(1),m(2),m(3), m(1),m(2),m(3), m(7),m(8),m(9), m(7),m(8),m(9), p(5),p(5)]);
    assert(checkRyanpeiko(h) === true, '同色二盃口');
}
{
    // NG: 一盃口のみ（1対）
    const h = makeHand([m(1),m(2),m(3), m(1),m(2),m(3), p(4),p(5),p(6), s(7),s(8),s(9), z(1),z(1)]);
    assert(checkRyanpeiko(h) === false, '一盃口のみは二盃口でない');
}
{
    // NG: 副露手は二盃口でない
    const h = makeHand([m(1),m(2),m(3), p(4),p(5),p(6), p(4),p(5),p(6), s(8),s(8)], [chiMeld(m, [1,2,3])]);
    assert(checkRyanpeiko(h) === false, '副露手は二盃口でない');
}

// =====================================================================
// checkSanshokuDoukou テスト
// =====================================================================
console.log('\n=== checkSanshokuDoukou ===');
{
    // 正常1: 333m 333p 333s
    const h = makeHand([m(3),m(3),m(3), p(3),p(3),p(3), s(3),s(3),s(3), m(5),m(6),m(7), z(1),z(1)]);
    assert(checkSanshokuDoukou(h) === true, '三色同刻（333）');
}
{
    // 正常2: 副露で三色同刻
    const h = makeHand([s(5),s(5),s(5), m(4),m(5),m(6), z(1),z(1)], [ponMeld(m, 5), ponMeld(p, 5)]);
    assert(checkSanshokuDoukou(h) === true, '副露三色同刻（555）');
}
{
    // NG: 2色のみ
    const h = makeHand([m(3),m(3),m(3), p(3),p(3),p(3), m(4),m(5),m(6), p(4),p(5),p(6), z(1),z(1)]);
    assert(checkSanshokuDoukou(h) === false, '2色のみは三色同刻でない');
}

// =====================================================================
// checkHonroutou テスト
// =====================================================================
console.log('\n=== checkHonroutou ===');
{
    // 正常1: 全老頭牌+字牌
    const h = makeHand([m(1),m(1),m(1), m(9),m(9),m(9), p(1),p(1),p(1), z(1),z(1),z(1), s(9),s(9)]);
    assert(checkHonroutou(h) === true, '混老頭');
}
{
    // 正常2: 副露混老頭
    const h = makeHand([p(9),p(9),p(9), z(2),z(2),z(2), s(1),s(1)], [ponMeld(m, 1), ponMeld(z, 5)]);
    assert(checkHonroutou(h) === true, '副露混老頭');
}
{
    // NG: 中張牌含む
    const h = makeHand([m(1),m(1),m(1), m(5),m(5),m(5), p(1),p(1),p(1), z(1),z(1),z(1), s(9),s(9)]);
    assert(checkHonroutou(h) === false, '中張牌含むは混老頭でない');
}

// =====================================================================
// checkShousangen テスト
// =====================================================================
console.log('\n=== checkShousangen ===');
{
    // 正常1: 白發刻子 + 中雀頭
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7), m(1),m(2),m(3), p(4),p(5),p(6)]);
    assert(checkShousangen(h) === true, '小三元（白發刻子+中雀頭）');
}
{
    // 正常2: 白中刻子 + 發雀頭
    const h = makeHand([z(5),z(5),z(5), z(7),z(7),z(7), z(6),z(6), m(1),m(2),m(3), p(4),p(5),p(6)]);
    assert(checkShousangen(h) === true, '小三元（白中刻子+發雀頭）');
}
{
    // NG: 大三元（雀頭が三元牌でない）はshousangenでなく daisangen
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7),z(7), m(1),m(2),m(3), p(4),p(4)]);
    assert(checkShousangen(h) === false, '大三元は小三元でない');
}
{
    // NG: 三元牌が2刻子のみ
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), m(1),m(2),m(3), p(4),p(5),p(6), s(7),s(7)]);
    assert(checkShousangen(h) === false, '三元牌2刻子は小三元でない');
}

// =====================================================================
// checkSankantsu テスト
// =====================================================================
console.log('\n=== checkSankantsu ===');
{
    // 正常1: 暗槓×3
    const h = makeHand([m(5),m(6),m(7), z(1),z(1)], [ankanMeld(m, 1), ankanMeld(p, 3), ankanMeld(s, 7)]);
    assert(checkSankantsu(h) === true, '暗槓×3 三槓子');
}
{
    // 正常2: 明槓×2 + 暗槓×1
    const h = makeHand([m(5),m(6),m(7), z(1),z(1)], [minkanMeld(m, 2), minkanMeld(p, 4), ankanMeld(s, 8)]);
    assert(checkSankantsu(h) === true, '明槓×2+暗槓×1 三槓子');
}
{
    // NG: 槓×2のみ
    const h = makeHand([m(1),m(1),m(1), m(5),m(6),m(7), z(1),z(1)], [ankanMeld(m, 3), ankanMeld(p, 5)]);
    assert(checkSankantsu(h) === false, '槓×2は三槓子でない');
}

// =====================================================================
// 役満: checkKokushi テスト
// =====================================================================
console.log('\n=== checkKokushi ===');
{
    // 正常1: 幺九13種+東(重複)
    const h = makeHand([m(1),m(9), p(1),p(9), s(1),s(9), z(1),z(2),z(3),z(4),z(5),z(6),z(7), z(1)]);
    assert(checkKokushi(h, z(1)) === true, '国士無双（東重複）');
}
{
    // 正常2: 幺九13種+中(重複)
    const h = makeHand([m(1),m(9), p(1),p(9), s(1),s(9), z(1),z(2),z(3),z(4),z(5),z(6),z(7), z(7)]);
    assert(checkKokushi(h, z(7)) === true, '国士無双（中重複）');
}
{
    // 正常3: 国士無双十三面待ち（全種類）
    // 幺九13種が全て2枚以上 → 実質は14枚でも1枚重複のみ成立
    const h = makeHand([m(1),m(9), p(1),p(9), s(1),s(9), z(1),z(2),z(3),z(4),z(5),z(6),z(7), m(9)]);
    assert(checkKokushi(h, m(9)) === true, '国士無双（9萬重複）');
}
{
    // NG: 幺九1種欠け
    const h = makeHand([m(1),m(9), p(1),p(9), s(1),s(9), z(1),z(2),z(3),z(4),z(5),z(6), z(1),z(1)]);
    assert(checkKokushi(h, z(1)) === false, '幺九1種欠けは国士でない');
}

// =====================================================================
// 役満: checkSuuankou テスト
// =====================================================================
console.log('\n=== checkSuuankou ===');
{
    // 正常1: 4暗刻ツモ
    const h = makeHand([m(1),m(1),m(1), p(3),p(3),p(3), s(5),s(5),s(5), z(1),z(1),z(1), m(9),m(9)]);
    const ctx = { isTsumo: true };
    assert(checkSuuankou(h, ctx) === true, '四暗刻ツモ');
}
{
    // 正常2: 暗槓3つ+暗刻1つ
    const h = makeHand([p(3),p(3),p(3), m(9),m(9)], [ankanMeld(m, 1), ankanMeld(s, 5), ankanMeld(z, 1)]);
    const ctx = { isTsumo: true };
    assert(checkSuuankou(h, ctx) === true, '暗槓×3+暗刻×1=四暗刻');
}
{
    // NG: ロンは四暗刻でない（単騎以外）
    const h = makeHand([m(1),m(1),m(1), p(3),p(3),p(3), s(5),s(5),s(5), z(1),z(1),z(1), m(9),m(9)]);
    const ctx = { isTsumo: false };
    assert(checkSuuankou(h, ctx) === false, '四暗刻（非単騎ロン）はNG');
}

// =====================================================================
// 役満: checkDaisangen テスト
// =====================================================================
console.log('\n=== checkDaisangen ===');
{
    // 正常1: 白發中 全刻子
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7),z(7), m(1),m(2),m(3), p(4),p(4)]);
    assert(checkDaisangen(h) === true, '大三元');
}
{
    // 正常2: 副露で大三元
    const h = makeHand([z(7),z(7),z(7), m(1),m(2),m(3), p(4),p(4)], [ponMeld(z, 5), ponMeld(z, 6)]);
    assert(checkDaisangen(h) === true, '副露大三元');
}
{
    // NG: 白刻子+發刻子のみ（中なし）
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7), m(1),m(2),m(3), p(4),p(5),p(6)]);
    assert(checkDaisangen(h) === false, '三元牌2刻子は大三元でない');
}

// =====================================================================
// 役満: checkDaisuushii / checkShousuushii テスト
// =====================================================================
console.log('\n=== checkDaisuushii / checkShousuushii ===');
{
    // 大四喜: 東南西北 全刻子
    const h = makeHand([z(1),z(1),z(1), z(2),z(2),z(2), z(3),z(3),z(3), z(4),z(4),z(4), m(5),m(5)]);
    assert(checkDaisuushii(h) === true, '大四喜');
    assert(checkShousuushii(h) === false, '大四喜形は小四喜でない');
}
{
    // 小四喜: 東南西刻子 + 北雀頭
    const h = makeHand([z(1),z(1),z(1), z(2),z(2),z(2), z(3),z(3),z(3), m(1),m(2),m(3), z(4),z(4)]);
    assert(checkShousuushii(h) === true, '小四喜');
    assert(checkDaisuushii(h) === false, '小四喜形は大四喜でない');
}
{
    // NG: 風牌2刻子のみ
    const h = makeHand([z(1),z(1),z(1), z(2),z(2),z(2), m(1),m(2),m(3), p(4),p(5),p(6), z(4),z(4)]);
    assert(checkDaisuushii(h) === false, '風牌2刻子は大四喜でない');
    assert(checkShousuushii(h) === false, '風牌2刻子は小四喜でない');
}

// =====================================================================
// 役満: checkTsuuiisou テスト
// =====================================================================
console.log('\n=== checkTsuuiisou ===');
{
    // 正常1: 全字牌
    const h = makeHand([z(1),z(1),z(1), z(2),z(2),z(2), z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7)]);
    assert(checkTsuuiisou(h) === true, '字一色');
}
{
    // 正常2: 七対子形の字一色
    const h = makeHand([z(1),z(1), z(2),z(2), z(3),z(3), z(4),z(4), z(5),z(5), z(6),z(6), z(7),z(7)]);
    assert(checkTsuuiisou(h) === true, '字一色（七対子形）');
}
{
    // NG: 数牌含む
    const h = makeHand([z(1),z(1),z(1), z(2),z(2),z(2), z(5),z(5),z(5), z(6),z(6),z(6), m(1),m(1)]);
    assert(checkTsuuiisou(h) === false, '数牌含む字一色はNG');
}

// =====================================================================
// 役満: checkRyuuiisou テスト
// =====================================================================
console.log('\n=== checkRyuuiisou ===');
{
    // 正常1: 2346s + 8s + 發
    const h = makeHand([s(2),s(3),s(4), s(2),s(3),s(4), s(6),s(6),s(6), z(6),z(6),z(6), s(8),s(8)]);
    assert(checkRyuuiisou(h) === true, '緑一色（發あり）');
}
{
    // 正常2: 2346s + 8s のみ（發なし）
    const h = makeHand([s(2),s(3),s(4), s(6),s(6),s(6), s(8),s(8),s(8), s(2),s(3),s(4), s(4),s(4)]);
    assert(checkRyuuiisou(h) === true, '緑一色（發なし）');
}
{
    // NG: 1索含む（緑でない牌）
    const h = makeHand([s(1),s(2),s(3), s(2),s(3),s(4), s(6),s(6),s(6), z(6),z(6),z(6), s(8),s(8)]);
    assert(checkRyuuiisou(h) === false, '1索含む緑一色はNG');
}

// =====================================================================
// 役満: checkChuurenpoutou テスト
// =====================================================================
console.log('\n=== checkChuurenpoutou ===');
{
    // 正常1: 1112345678999m + 1m
    const h = makeHand([m(1),m(1),m(1), m(2),m(3),m(4), m(5),m(6),m(7), m(8),m(9),m(9),m(9), m(1)]);
    assert(checkChuurenpoutou(h) === true, '九連宝燈（萬子）');
}
{
    // 正常2: 1112345678999p + 5p
    const h = makeHand([p(1),p(1),p(1), p(2),p(3),p(4), p(5),p(6),p(7), p(8),p(9),p(9),p(9), p(5)]);
    assert(checkChuurenpoutou(h) === true, '九連宝燈（筒子）');
}
{
    // NG: 字牌含む
    const h = makeHand([m(1),m(1),m(1), m(2),m(3),m(4), m(5),m(6),m(7), m(8),m(9),m(9),m(9), z(1)]);
    assert(checkChuurenpoutou(h) === false, '字牌含む九連はNG');
}
{
    // NG: 混色
    const h = makeHand([m(1),m(1),m(1), m(2),m(3),m(4), m(5),m(6),p(7), m(8),m(9),m(9),m(9), m(1)]);
    assert(checkChuurenpoutou(h) === false, '混色九連はNG');
}

// =====================================================================
// 役満: checkSuukantsu テスト
// =====================================================================
console.log('\n=== checkSuukantsu ===');
{
    // 正常1: 暗槓×4
    const h = makeHand([z(1),z(1)], [ankanMeld(m, 1), ankanMeld(p, 3), ankanMeld(s, 7), ankanMeld(z, 5)]);
    assert(checkSuukantsu(h) === true, '四槓子（暗槓×4）');
}
{
    // 正常2: 明槓×2+暗槓×2
    const h = makeHand([z(1),z(1)], [minkanMeld(m, 2), minkanMeld(p, 4), ankanMeld(s, 8), ankanMeld(z, 6)]);
    assert(checkSuukantsu(h) === true, '四槓子（明槓×2+暗槓×2）');
}
{
    // NG: 槓×3のみ
    const h = makeHand([m(1),m(1),m(1), z(1),z(1)], [ankanMeld(m, 3), ankanMeld(p, 5), ankanMeld(s, 7)]);
    assert(checkSuukantsu(h) === false, '槓×3は四槓子でない');
}

// =====================================================================
// evaluateYaku 統合テスト
// =====================================================================
console.log('\n=== evaluateYaku（統合）===');
{
    // タンヤオピンフ門前ツモ（3役）: 13枚手牌 + winTile s(8) でevaluateYakuを呼ぶ
    // 234m 567m 345p 67s + 33s → 6索8索両面待ち(winTile=8s)
    const h = makeHand([m(2),m(3),m(4), m(5),m(6),m(7), p(3),p(4),p(5), s(6),s(7), s(3),s(3)]);
    const ctx = { isTsumo: true, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.EAST, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, s(8), ctx);
    assert(result.yaku.includes('TANYAO'), 'タンヤオピンフツモ: タンヤオ含む');
    assert(result.yaku.includes('PINFU'),  'タンヤオピンフツモ: ピンフ含む');
    assert(result.yaku.includes('TSUMO'),  'タンヤオピンフツモ: ツモ含む');
    assert(result.han >= 3, 'タンヤオピンフツモ: 3翻以上');
}
{
    // リーチ一発（2役）
    const h = makeHand([m(1),m(2),m(3), m(4),m(5),m(6), p(1),p(2),p(3), s(1),s(2),s(3), z(1),z(1)]);
    const ctx = { isTsumo: false, isRiichi: true, isDoubleRiichi: false, isIppatsu: true,
                  seatWind: HONOR.EAST, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, z(1), ctx);
    assert(result.yaku.includes('RIICHI'),  'リーチ一発: リーチ含む');
    assert(result.yaku.includes('IPPATSU'), 'リーチ一発: 一発含む');
    assert(result.han >= 2, 'リーチ一発: 2翻以上');
}
{
    // 役満: 大三元
    const h = makeHand([z(5),z(5),z(5), z(6),z(6),z(6), z(7),z(7),z(7), m(1),m(2),m(3), p(4),p(4)]);
    const ctx = { isTsumo: false, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.EAST, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, p(4), ctx);
    assert(result.isYakuman === true, '大三元は役満');
    assert(result.yaku.includes('DAISANGEN'), '大三元: yaku に含む');
}
{
    // 役なし（タンヤオでも役牌でもない副露手）
    const h = makeHand([m(1),m(2),m(3), p(4),p(5),p(6), s(7),s(7)], [chiMeld(m, [4,5,6])]);
    const ctx = { isTsumo: false, isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
                  seatWind: HONOR.EAST, roundWind: HONOR.EAST,
                  isHaitei: false, isHoutei: false, isRinshan: false, isChankan: false,
                  isTenhou: false, isChiihou: false };
    const result = evaluateYaku(h, s(7), ctx);
    assert(result.han === 0, '役なし手は翻数0');
}

// =====================================================================
// 結果
// =====================================================================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
