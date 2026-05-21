/**
 * AILevel3 テスト
 * - selectClaimAction: ポン/チー/明槓/ロン/パスの判断
 * - selectDrawAction: ツモ和了・リーチ宣言
 * - _shantenAfterClaim: 副露後向聴数シミュレーション
 */
import { Game, GAME_STATE } from '../src/core/Game.js';
import { Tile, SUIT } from '../src/core/Tile.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import { AILevel3 } from '../src/ai/AILevel3.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.error(`  ✗ ${label}${info ? ' | ' + info : ''}`);
        failed++;
    }
}

// ========================
// selectClaimAction: 他家リーチ中はパス
// ========================
console.log('\n[selectClaimAction: 他家リーチ中はパス]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // P0がリーチ中
    g.players[0].isRiichi = true;

    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,2),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,1),
        new Tile(SUIT.SOU,5),
    ];
    const discardTile = new Tile(SUIT.MAN, 2);
    const result = ai.selectClaimAction(p1, g, discardTile, { canPon: true });
    assert(result.action === 'pass', '他家リーチ中はポン可能でもパス');
}

// ========================
// selectClaimAction: 自身リーチ中はパス
// ========================
console.log('\n[selectClaimAction: 自身リーチ中はパス]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    p1.isRiichi = true;
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,5),
    ];
    const discardTile = new Tile(SUIT.MAN, 5);
    const result = ai.selectClaimAction(p1, g, discardTile, { canPon: true });
    assert(result.action === 'pass', '自身リーチ中は副露不可→パス');
}

// ========================
// selectClaimAction: ポン（向聴数改善時のみ）
// ========================
console.log('\n[selectClaimAction: ポン判断]');
{
    // 1向聴: 2m2m(ポン候補) + 3m4m5m + 7m8m9m + 2p3p(partial) + 5s5s(pair) + 9s(孤立)
    // 2mをポン → 9sを切ると5s5sが雀頭になりテンパイ(0向聴) → 向聴数改善
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,2),
        new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
        new Tile(SUIT.SOU,9),
    ];
    p1.hand.melds = [];
    const discardTile = new Tile(SUIT.MAN, 2);
    const resultPon = ai.selectClaimAction(p1, g, discardTile, { canPon: true });
    assert(resultPon.action === 'pon', 'ポンで向聴数改善する場合はポン宣言');
}
{
    // すでにテンパイ形: ポンしても向聴数改善なし → パス
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    p1.hand.melds = [];
    const discardTile = new Tile(SUIT.SOU, 5);
    const resultPass = ai.selectClaimAction(p1, g, discardTile, { canPon: true });
    // テンパイ状態でポンしても向聴数は変わらない（-1→0になりむしろ悪化）
    assert(resultPass.action === 'pass', 'テンパイ手でポンが向聴数改善しない場合はパス');
}

// ========================
// selectClaimAction: チー（向聴数改善時のみ）
// ========================
console.log('\n[selectClaimAction: チー判断]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // 向聴数改善するチー
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,2), new Tile(SUIT.SOU,3),
        new Tile(SUIT.SOU,7), new Tile(SUIT.SOU,9),
    ];
    p1.hand.melds = [];
    const discardTile = new Tile(SUIT.MAN, 1); // 1m → 1m2m3m でチー
    const chiOpts = p1.hand.findChiOptions(discardTile);
    if (chiOpts.length > 0) {
        const result = ai.selectClaimAction(p1, g, discardTile, { canChi: true });
        assert(result.action === 'chi', 'チーで向聴数改善する場合はチー宣言');
    } else {
        assert(false, 'チー候補が見つからない（セットアップ確認要）');
    }
}

// ========================
// selectClaimAction: 明槓は常に宣言
// ========================
console.log('\n[selectClaimAction: 明槓は常に宣言]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,1),
        new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,2), new Tile(SUIT.SOU,3),
        new Tile(SUIT.SOU,7),
    ];
    p1.hand.melds = [];
    const discardTile = new Tile(SUIT.MAN, 1);
    const result = ai.selectClaimAction(p1, g, discardTile, { canMinkan: true });
    assert(result.action === 'minkan', '明槓は向聴数に関わらず常に宣言');
}

// ========================
// selectClaimAction: ロン（役あり）
// ========================
console.log('\n[selectClaimAction: ロン判断]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    g.dealerIndex = 0;
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // タンヤオ役あり完成形（13枚でロン待ち）
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,4), new Tile(SUIT.SOU,5),
        new Tile(SUIT.SOU,8),
    ];
    p1.hand.melds = [];
    p1.isRiichi = false;
    p1.isFuriten = false;
    p1.isTemporaryFuriten = false;
    const discardTile = new Tile(SUIT.SOU, 8); // 双碰待ち相手牌
    const result = ai.selectClaimAction(p1, g, discardTile, { canRon: true });
    assert(result.action === 'ron', '役あり手でロン可能 → ロン宣言');
}
{
    // 役なし開き手（タンヤオ不成立）→ ロン不可
    const g = new Game({ allAI: true });
    g.wall.init();
    g.dealerIndex = 0;
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // 開き手で役なし
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,4),
        new Tile(SUIT.SOU,7), new Tile(SUIT.SOU,7),
    ];
    p1.hand.melds = [new Meld(MELD_TYPE.CHI, [
        new Tile(SUIT.SOU,7), new Tile(SUIT.SOU,8), new Tile(SUIT.SOU,9),
    ], 0, new Tile(SUIT.SOU,7))];
    p1.isMenzen = false;
    p1.isRiichi = false;
    p1.isFuriten = false;
    p1.isTemporaryFuriten = false;
    const discardTile = new Tile(SUIT.SOU, 5); // 3s4s→5sでチー後待ち
    const result = ai.selectClaimAction(p1, g, discardTile, { canRon: true });
    assert(result.action === 'pass', '役なし開き手でロン可能 → パス（チョンボ防止）');
}

// ========================
// _shantenAfterClaim: ポン後向聴数シミュレーション
// ========================
console.log('\n[_shantenAfterClaim: ポン後向聴数]');
{
    // 同じ1向聴手で _shantenAfterClaim が正しく 0 を返すか確認
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,2),
        new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
        new Tile(SUIT.SOU,9),
    ];
    p1.hand.melds = [];
    const ponIndices = p1.hand.findPonIndices(new Tile(SUIT.MAN, 2));
    assert(ponIndices !== null, 'ポン候補インデックスあり');
    const shantenBefore = p1.hand.getShantenNumber().shanten;
    const shantenAfter = ai._shantenAfterClaim(p1, ponIndices);
    assert(shantenAfter < shantenBefore, `ポン後向聴数改善 (${shantenBefore} → ${shantenAfter})`);
    // 状態が元に戻っていること確認
    assert(p1.hand.tiles.length === 13, 'ポンシミュレーション後に手牌枚数が元に戻る');
    assert(p1.hand.melds.length === 0, 'ポンシミュレーション後に副露数が元に戻る');
}

// ========================
// selectDrawAction: ツモ和了
// ========================
console.log('\n[selectDrawAction: ツモ和了]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    g.dealerIndex = 0;
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // タンヤオ完成: 2m3m4m 5m6m7m 2p3p4p 5s6s7s 8s8s
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,6), new Tile(SUIT.SOU,7),
        new Tile(SUIT.SOU,8), new Tile(SUIT.SOU,8),
    ];
    p1.hand.melds = [];
    p1.isRiichi = false;
    p1.isFuriten = false;
    const result = ai.selectDrawAction(p1, g);
    assert(result.action === 'tsumo', 'ツモ完成・役あり → ツモ和了宣言');
}

// ========================
// selectDrawAction: リーチ宣言
// ========================
console.log('\n[selectDrawAction: リーチ宣言]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    g.dealerIndex = 0;
    const ai = new AILevel3(1);
    const p1 = g.players[1];
    // 1向聴（テンパイ1牌捨てでリーチ可能）
    // 1m2m3m 4m5m6m 7m8m9m 1p2p 5s5s ← 2p捨てで3p待ちテンパイ
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
        new Tile(SUIT.SOU,1), // 最後のツモ牌（不要牌）
    ];
    p1.hand.melds = [];
    p1.isRiichi = false;
    p1.isMenzen = true;
    p1.isFuriten = false;
    p1.score = 25000;
    const result = ai.selectDrawAction(p1, g);
    assert(result.action === 'riichi', '門前テンパイ・非フリテン → リーチ宣言');
    assert(typeof result.index === 'number', 'リーチ宣言に打牌インデックスあり');
}

// ========================
// Player.riichiDiscardCount
// =================

console.log('\n[Player.riichiDiscardCount: リーチ宣言時の捨て牌数記録]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const p0 = g.players[0];
    // 2枚捨ててからリーチ宣言
    p0.discards.push(new Tile(SUIT.MAN, 3));
    p0.discards.push(new Tile(SUIT.MAN, 7));
    p0.declareRiichi(5, false);
    assert(p0.riichiDiscardCount === 2, 'riichiDiscardCount: リーチ前捨て牌数=2を記録');
    assert(p0.riichiDiscardCount >= 0, 'riichiDiscardCount: リーチ後は>=0');
}
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const p0 = g.players[0];
    assert(p0.riichiDiscardCount === -1, 'riichiDiscardCount: 初期値=-1');
}

// ========================
// _safetyVsPlayer: 現物判定
// ========================
console.log('\n[_safetyVsPlayer: リーチ後現物は100点]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const riichiPlayer = g.players[0];

    // リーチ前に2枚捨て
    const preTile = new Tile(SUIT.MAN, 3);
    riichiPlayer.discards.push(preTile);
    riichiPlayer.discards.push(new Tile(SUIT.MAN, 7));
    riichiPlayer.declareRiichi(5, false); // riichiDiscardCount=2

    // リーチ後に1枚捨て（これが現物）
    const postTile = new Tile(SUIT.PIN, 5);
    riichiPlayer.discards.push(postTile);
    riichiPlayer.isRiichi = true;

    const safety = ai._safetyVsPlayer(postTile, riichiPlayer, g);
    assert(safety === 100, 'リーチ後捨て牌（現物）→ 安全度=100');
}
{
    const g = new Game({ allAI: true });
    g.wall.init();
    const ai = new AILevel3(1);
    const riichiPlayer = g.players[0];

    // リーチ前に捨てた牌
    const preTile = new Tile(SUIT.MAN, 3);
    riichiPlayer.discards.push(preTile);
    riichiPlayer.discards.push(new Tile(SUIT.MAN, 7));
    riichiPlayer.declareRiichi(5, false); // riichiDiscardCount=2
    riichiPlayer.isRiichi = true;

    const safety = ai._safetyVsPlayer(preTile, riichiPlayer, g);
    assert(safety < 100, 'リーチ前捨て牌 → 安全度<100（現物でない）');
    assert(safety >= 40, 'リーチ前捨て牌 → 安全度>=40（比較的安全）');
}

// ========================
// selectDrawAction: リーチ中の有効暗槓を宣言
// ========================
console.log('\n[selectDrawAction: リーチ中暗槓]');
{
    // リーチ中・待ちが変わらない暗槓 → ankan アクション
    // Hand: 2m3m4m + 5m6m7m + 8m9m(待ち7m) + 2p2p + 1z1z1z + drawn:1z(4枚目)
    const g = new Game({ allAI: true });
    g.wall.init();
    g.dealerIndex = 0;
    const ai = new AILevel3(0);
    const p0 = g.players[0];
    p0.isRiichi = true;
    p0.isMenzen = true;
    p0.hand.melds = [];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,2),
        new Tile(SUIT.HONOR,1), new Tile(SUIT.HONOR,1), new Tile(SUIT.HONOR,1),
        new Tile(SUIT.HONOR,1), // 4枚目（ツモ牌）
    ];
    const result = ai.selectDrawAction(p0, g);
    assert(result.action === 'ankan', 'リーチ中・有効暗槓 → AI が ankan を宣言');
    assert(result.tileId === new Tile(SUIT.HONOR, 1).id, 'ankan する牌ID = 東(id=27)');
}

// ========================
// 結果
// ========================
console.log(`\n結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
