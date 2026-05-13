/**
 * AILevel3 テスト（第6週）
 * - selectClaimAction: ロン判断 / ポン向聴数改善 / チー向聴数改善 / リーチ守備 / 明槓
 * - _shantenAfterClaim: ポン/チー後向聴数計算・状態復元
 * - selectDiscard: リーチ中 / 有効牌最大化 / 安全牌優先
 * - selectDrawAction: ツモ和了 / 役なし / リーチ宣言 / 通常打牌
 */
import { Tile, SUIT } from '../src/core/Tile.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import { Player } from '../src/core/Player.js';
import { Game, GAME_STATE } from '../src/core/Game.js';
import { AILevel3 } from '../src/ai/AILevel3.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label} ${info}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected ${b}, got ${a})`);
}

// 牌を簡易記法で生成: '1m','9p','3s','4z' など
function t(str) {
    const num = parseInt(str[0]);
    const suitMap = { m: SUIT.MAN, p: SUIT.PIN, s: SUIT.SOU, z: SUIT.HONOR };
    return new Tile(suitMap[str[1]], num);
}

// 軽量モックゲームオブジェクト（4プレイヤー付き）
function makeMockGame(dealerIndex = 0) {
    return {
        dealerIndex,
        wall: { isEmpty: () => false },
        _isRinshan: false,
        players: [
            new Player(0, false),
            new Player(1, false),
            new Player(2, false),
            new Player(3, false),
        ],
    };
}

const ai = new AILevel3(0);

// ============================================================
// selectClaimAction: ロン判断
// ============================================================

console.log('\n[selectClaimAction: ロン - タンヤオ役あり → ron]');
{
    // 13枚テンパイ(タンヤオ): 2m3m4m 5m6m7m 2p3p4p 5s6s7s 5s → 5s待ち
    // discardTile=5s 追加で 5s6s7s + 5s5s 雀頭 → タンヤオ完成
    const player = new Player(1, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),
        t('5m'), t('6m'), t('7m'),
        t('2p'), t('3p'), t('4p'),
        t('5s'), t('6s'), t('7s'),
        t('5s'),
    ];
    player.hand.melds = [];
    player.isRiichi = false;
    player.isMenzen = true;

    const discardTile = t('5s');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canRon: true });
    assertEqual(result.action, 'ron', 'タンヤオ役あり → ron');
}

console.log('\n[selectClaimAction: ロン - 役なし開き手 → pass]');
{
    // 開き手(ポン4z北): 1m2m3m 5p6p7p 3s4s 8s8s + pon4z
    // Player1(席風=南), roundWind=東 → 4z北は役牌でない → 役なし
    const player = new Player(1, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'),
        t('5p'), t('6p'), t('7p'),
        t('3s'), t('4s'),
        t('8s'), t('8s'),
    ];
    player.hand.melds = [
        new Meld(MELD_TYPE.PON, [t('4z'), t('4z'), t('4z')], 0, t('4z')),
    ];
    player.isMenzen = false;
    player.isRiichi = false;
    player.isFuriten = false;
    player.isTemporaryFuriten = false;

    const discardTile = t('2s'); // 3s4s → 2s/5s待ち
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canRon: true });
    assertEqual(result.action, 'pass', '役なし開き手 → pass（チョンボ防止）');
}

console.log('\n[selectClaimAction: ロン - リーチ役あり → ron]');
{
    // リーチ中テンパイ: 1m2m3m 4m5m6m 7m8m9m 1p2p 5s5s → 3p待ち
    // canRon チェックはリーチ中パスより先なので、リーチ役あり → ron
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'),
        t('4m'), t('5m'), t('6m'),
        t('7m'), t('8m'), t('9m'),
        t('1p'), t('2p'),
        t('5s'), t('5s'),
    ];
    player.hand.melds = [];
    player.isRiichi = true;
    player.isDoubleRiichi = false;
    player.isIppatsu = false;
    player.isFuriten = false;
    player.isMenzen = true;

    const discardTile = t('3p');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canRon: true });
    assertEqual(result.action, 'ron', 'リーチ役あり → ron');
}

// ============================================================
// selectClaimAction: リーチ中・他家リーチ中
// ============================================================

console.log('\n[selectClaimAction: 自リーチ中 → pass]');
{
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'), t('4m'), t('5m'),
        t('6m'), t('7m'), t('8m'), t('9m'),
        t('1p'), t('2p'), t('5s'), t('5s'),
    ];
    player.hand.melds = [];
    player.isRiichi = true;

    const discardTile = t('5s');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canPon: true });
    assertEqual(result.action, 'pass', '自リーチ中はポン不可 → pass');
}

console.log('\n[selectClaimAction: 他家リーチ中 → pass]');
{
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'), t('4m'), t('5m'),
        t('6m'), t('7m'), t('8m'), t('9m'),
        t('1p'), t('2p'), t('5s'), t('5s'),
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('5s');
    const game = makeMockGame(0);
    game.players[2].isRiichi = true; // Player2がリーチ中

    const result = ai.selectClaimAction(player, game, discardTile, { canPon: true });
    assertEqual(result.action, 'pass', '他家リーチ中は守備優先 → pass');
}

// ============================================================
// selectClaimAction: ポン向聴数改善
// ============================================================

console.log('\n[selectClaimAction: ポン - 向聴数1→0で宣言]');
{
    // 13枚 shanten=1: [2m3m4m 5m6m7m 2p3p 5s5s 8s8s 1z]
    // ポン8s(idx10,11) → 1z捨て → shanten=0 → 改善 → pon
    const player = new Player(0, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),  // idx 0,1,2
        t('5m'), t('6m'), t('7m'),  // idx 3,4,5
        t('2p'), t('3p'),           // idx 6,7
        t('5s'), t('5s'),           // idx 8,9
        t('8s'), t('8s'),           // idx 10,11
        t('1z'),                    // idx 12
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('8s');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canPon: true });
    assertEqual(result.action, 'pon', 'ポン後shanten 1→0 → pon宣言');
}

console.log('\n[selectClaimAction: ポン - 向聴数0→0で宣言しない]');
{
    // 13枚 shanten=0: [2m3m4m 5m6m7m 8m9m 2p3p4p 1s1s]
    // ポン1s(idx11,12) → bestShanten=0 → 改善なし → pass
    const player = new Player(0, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),  // idx 0,1,2
        t('5m'), t('6m'), t('7m'),  // idx 3,4,5
        t('8m'), t('9m'),           // idx 6,7
        t('2p'), t('3p'), t('4p'), // idx 8,9,10
        t('1s'), t('1s'),           // idx 11,12
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('1s');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canPon: true });
    assertEqual(result.action, 'pass', 'ポン後shanten 0→0 → 改善なし(pass)');
}

// ============================================================
// selectClaimAction: チー向聴数改善
// ============================================================

console.log('\n[selectClaimAction: チー - 向聴数1→0で宣言]');
{
    // 13枚 shanten=1: [5m6m 2p3p4p 5s6s7s 8s8s 9m 1m1m]
    // チー4m(idx0,1=5m6m) → 9m捨て → shanten=0 → 改善 → chi
    const player = new Player(0, false);
    player.hand.tiles = [
        t('5m'), t('6m'),           // idx 0,1
        t('2p'), t('3p'), t('4p'), // idx 2,3,4
        t('5s'), t('6s'), t('7s'), // idx 5,6,7
        t('8s'), t('8s'),           // idx 8,9
        t('9m'),                    // idx 10
        t('1m'), t('1m'),           // idx 11,12
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('4m'); // 4m+5m+6m → 4m5m6m チー
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canChi: true });
    assertEqual(result.action, 'chi', 'チー後shanten 1→0 → chi宣言');
    assert(Array.isArray(result.tileIndices), 'chi時にtileIndicesが返る');
}

console.log('\n[selectClaimAction: チー - 向聴数0→0で宣言しない]');
{
    // 13枚 shanten=0: [2m3m4m 5m6m7m 8m9m 2p3p4p 2s2s]
    // 7m→どのチーもbestShanten=0 → 改善なし → pass
    const player = new Player(0, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),  // idx 0,1,2
        t('5m'), t('6m'), t('7m'),  // idx 3,4,5
        t('8m'), t('9m'),           // idx 6,7
        t('2p'), t('3p'), t('4p'), // idx 8,9,10
        t('2s'), t('2s'),           // idx 11,12
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('7m');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canChi: true });
    assertEqual(result.action, 'pass', 'チー後shanten 0→0 → 改善なし(pass)');
}

// ============================================================
// selectClaimAction: 明槓
// ============================================================

console.log('\n[selectClaimAction: 明槓は常に宣言]');
{
    const player = new Player(0, false);
    player.hand.tiles = [
        t('5m'), t('5m'), t('5m'),
        t('2p'), t('3p'), t('4p'),
        t('5s'), t('6s'), t('7s'),
        t('1z'), t('1z'), t('1z'), t('2z'),
    ];
    player.hand.melds = [];
    player.isRiichi = false;

    const discardTile = t('5m');
    const game = makeMockGame(0);
    const result = ai.selectClaimAction(player, game, discardTile, { canMinkan: true });
    assertEqual(result.action, 'minkan', '明槓は向聴数不問で宣言');
}

// ============================================================
// _shantenAfterClaim: 直接テスト（計算精度と状態復元）
// ============================================================

console.log('\n[_shantenAfterClaim: ポン後向聴数=0・状態復元]');
{
    // 13枚: [2m3m4m 5m6m7m 2p3p 5s5s 8s8s 1z]  K=0 shanten=1
    // ポンindices=[10,11](8s8s) → 1z捨て → shanten=0
    const player = new Player(0, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),  // 0,1,2
        t('5m'), t('6m'), t('7m'),  // 3,4,5
        t('2p'), t('3p'),           // 6,7
        t('5s'), t('5s'),           // 8,9
        t('8s'), t('8s'),           // 10,11  ← ポン対象
        t('1z'),                    // 12
    ];
    player.hand.melds = [];

    const beforeLen = player.hand.tiles.length;
    const beforeMeldLen = player.hand.melds.length;
    const result = ai._shantenAfterClaim(player, [10, 11]);

    assertEqual(result, 0, 'ポン8s後の最良向聴数=0');
    assertEqual(player.hand.tiles.length, beforeLen, '状態復元: tiles.length=' + beforeLen);
    assertEqual(player.hand.melds.length, beforeMeldLen, '状態復元: melds.length=' + beforeMeldLen);
    assertEqual(player.hand.tiles[10].id, t('8s').id, '状態復元: tiles[10]は8s');
}

console.log('\n[_shantenAfterClaim: チー後向聴数=0・状態復元]');
{
    // 13枚: [5m6m 2p3p4p 5s6s7s 8s8s 9m 1m1m]  K=0 shanten=1
    // チーindices=[0,1](5m6m) → 9m捨て → shanten=0
    const player = new Player(0, false);
    player.hand.tiles = [
        t('5m'), t('6m'),           // 0,1  ← チー対象
        t('2p'), t('3p'), t('4p'), // 2,3,4
        t('5s'), t('6s'), t('7s'), // 5,6,7
        t('8s'), t('8s'),           // 8,9
        t('9m'),                    // 10
        t('1m'), t('1m'),           // 11,12
    ];
    player.hand.melds = [];

    const beforeLen = player.hand.tiles.length;
    const result = ai._shantenAfterClaim(player, [0, 1]);

    assertEqual(result, 0, 'チー4m5m6m後の最良向聴数=0');
    assertEqual(player.hand.tiles.length, beforeLen, '状態復元: tiles.length=' + beforeLen);
    assertEqual(player.hand.tiles[0].id, t('5m').id, '状態復元: tiles[0]は5m');
}

// ============================================================
// selectDiscard
// ============================================================

console.log('\n[selectDiscard: リーチ中は最後のインデックスを返す]');
{
    const player = new Player(0, false);
    player.isRiichi = true;
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'), t('4m'), t('5m'),
        t('6m'), t('7m'), t('8m'), t('9m'),
        t('1p'), t('2p'), t('3p'), t('4p'),
        t('5p'), // idx=13
    ];
    const game = makeMockGame(0);
    const idx = ai.selectDiscard(player, game);
    assertEqual(idx, 13, 'リーチ中はtileCount-1(=13)を返す');
}

console.log('\n[selectDiscard: 通常時は孤立字牌を捨てる]');
{
    // 14枚: [1z 2m3m4m 5m6m7m 2p3p4p 5s5s 9s9s]
    // 1z除去でshanten=0(最良) → idx=0
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1z'),                    // idx=0 孤立字牌
        t('2m'), t('3m'), t('4m'),
        t('5m'), t('6m'), t('7m'),
        t('2p'), t('3p'), t('4p'),
        t('5s'), t('5s'),
        t('9s'), t('9s'),
    ];
    player.isRiichi = false;
    player.hand.melds = [];
    const game = makeMockGame(0);
    const idx = ai.selectDiscard(player, game);
    assertEqual(idx, 0, '孤立字牌(idx=0)を捨てる');
}

console.log('\n[selectDiscard: 他家リーチ中は現物牌を優先]');
{
    // Player0の手牌: 3m(現物=idx0) + 字牌・端牌
    // Player1: リーチ中、捨て牌=[3m] → 3m=安全度100
    const g = new Game({ allAI: true });
    g.dealerIndex = 0;

    const p0 = g.players[0];
    p0.hand.tiles = [
        t('3m'),                                       // idx=0 現物
        t('1z'), t('2z'), t('3z'), t('4z'), t('5z'), // idx=1-5 字牌
        t('6z'), t('7z'),                             // idx=6,7 字牌
        t('1m'), t('9m'), t('1p'), t('9p'),           // idx=8-11 端牌
        t('1s'), t('9s'),                             // idx=12,13
    ];
    p0.isRiichi = false;

    const p1 = g.players[1];
    p1.isRiichi = true;
    p1.discards = [t('3m')]; // 3mが現物

    const ai0 = new AILevel3(0);
    const idx = ai0.selectDiscard(p0, g);
    assertEqual(idx, 0, '現物牌(3m, idx=0)を最優先で捨てる');
}

// ============================================================
// selectDrawAction
// ============================================================

console.log('\n[selectDrawAction: ツモ和了（タンヤオ+ツモ）]');
{
    // 14枚完成形: 2m3m4m 5m6m7m 2p3p4p 5s6s7s 8s8s
    // → タンヤオ + 門前清自摸和 → hasYaku=true → tsumo
    const player = new Player(0, false);
    player.hand.tiles = [
        t('2m'), t('3m'), t('4m'),
        t('5m'), t('6m'), t('7m'),
        t('2p'), t('3p'), t('4p'),
        t('5s'), t('6s'), t('7s'),
        t('8s'), t('8s'), // idx=13 がツモ牌
    ];
    player.hand.melds = [];
    player.isRiichi = false;
    player.isMenzen = true;
    player.isFuriten = false;

    const game = makeMockGame(0);
    const result = ai.selectDrawAction(player, game);
    assertEqual(result.action, 'tsumo', 'タンヤオ+ツモ → tsumo宣言');
}

console.log('\n[selectDrawAction: ツモ和了（役なし）→ tsumoしない]');
{
    // 完成形だが役なし: 1m2m3m 5p6p7p 3s4s5s 8s8s + pon4z北
    // Player1(席風=南), roundWind=東 → 4z北は役牌でない → 役なし → tsumo宣言しない
    const player = new Player(1, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'),
        t('5p'), t('6p'), t('7p'),
        t('3s'), t('4s'), t('5s'),
        t('8s'), t('8s'), // idx=10 がツモ牌
    ];
    player.hand.melds = [
        new Meld(MELD_TYPE.PON, [t('4z'), t('4z'), t('4z')], 0, t('4z')),
    ];
    player.isRiichi = false;
    player.isMenzen = false;
    player.isFuriten = false;

    const game = makeMockGame(0); // dealerIndex=0 → Player1の席風=南

    assert(player.hand.isComplete(), '役なしテスト前提: isComplete()=true');
    const result = ai.selectDrawAction(player, game);
    assert(result.action !== 'tsumo', '役なし完成形 → tsumo宣言しない (action=' + result.action + ')');
}

console.log('\n[selectDrawAction: テンパイでリーチ宣言]');
{
    // 14枚: 1m2m3m 4m5m6m 7m8m9m 1p2p 5s5s 1z(idx=13)
    // 1z捨てでテンパイ(3p待ち)・非フリテン → riichi宣言
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1m'), t('2m'), t('3m'),
        t('4m'), t('5m'), t('6m'),
        t('7m'), t('8m'), t('9m'),
        t('1p'), t('2p'),
        t('5s'), t('5s'),
        t('1z'), // idx=13 → 捨ててテンパイ
    ];
    player.hand.melds = [];
    player.isRiichi = false;
    player.isMenzen = true;
    player.score = 25000;
    player.discards = [];

    const game = makeMockGame(0);
    const result = ai.selectDrawAction(player, game);
    assertEqual(result.action, 'riichi', 'テンパイ → リーチ宣言');
    assertEqual(result.index, 13, 'リーチ打牌: idx=13(1z)');
}

console.log('\n[selectDrawAction: 通常打牌（テンパイ不可）]');
{
    // 孤立牌14枚: いかなる1枚除去でもテンパイしない → discard
    const player = new Player(0, false);
    player.hand.tiles = [
        t('1m'), t('5m'), t('9m'),
        t('1p'), t('5p'), t('9p'),
        t('1s'), t('5s'), t('9s'),
        t('1z'), t('2z'), t('3z'), t('4z'), t('5z'),
    ];
    player.hand.melds = [];
    player.isRiichi = false;
    player.isMenzen = true;
    player.score = 25000;
    player.discards = [];

    const game = makeMockGame(0);
    const result = ai.selectDrawAction(player, game);
    assertEqual(result.action, 'discard', 'テンパイ不可 → 通常打牌(discard)');
}

// ============================================================
// 結果
// ============================================================
console.log(`\n結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
