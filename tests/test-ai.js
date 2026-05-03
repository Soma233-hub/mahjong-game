/**
 * AILevel3 単体テスト
 * node tests/test-ai.js で実行
 */
import { AILevel3 } from '../src/ai/AILevel3.js';
import { Player } from '../src/core/Player.js';
import { Tile, SUIT } from '../src/core/Tile.js';

let passed = 0, failed = 0;

function assert(condition, label, info = '') {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.error(`  ✗ ${label}${info ? ' ' + info : ''}`); failed++; }
}
function assertEqual(a, e, label) {
    const ok = JSON.stringify(a) === JSON.stringify(e);
    assert(ok, label, ok ? '' : `(expected ${JSON.stringify(e)}, got ${JSON.stringify(a)})`);
}

const M = SUIT.MAN, P = SUIT.PIN, S = SUIT.SOU, H = SUIT.HONOR;
const t = (suit, num) => new Tile(suit, num);

function makeMockGame(remaining = 20, riichiIndices = []) {
    return {
        wall: { remaining },
        players: [0, 1, 2, 3].map(i => {
            const p = new Player(i);
            p.isRiichi = riichiIndices.includes(i);
            p.discards = [];
            return p;
        }),
    };
}

// ============================
// selectDrawAction: ツモ和了
// ============================
console.log('\n=== selectDrawAction: ツモ和了 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // 完成形14枚: (1m2m3m)(4m5m6m)(7m8m9m)(2m3m4m) + 5m5m
    [1,2,3,4,5,6,7,8,9,2,3,4,5,5].forEach(n => player.hand.add(t(M, n)));
    const g = makeMockGame();
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assertEqual(action.action, 'tsumo', '完成形14枚でツモ和了を選択');
}

// ============================
// selectDrawAction: リーチ宣言
// ============================
console.log('\n=== selectDrawAction: リーチ宣言 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // テンパイ形14枚: (1m2m3m)(4m5m6m)(7m8m9m) + 2p3p + 5p5p + 9z(孤立牌)
    // 9zを捨てると13枚テンパイ(1p/4p待ち)
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(P, 2));
    player.hand.add(t(P, 3));
    player.hand.add(t(P, 5));
    player.hand.add(t(P, 5));
    player.hand.add(t(H, 9)); // 9z 孤立牌
    player.isMenzen = true;
    player.isRiichi = false;
    const g = makeMockGame(20);
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assertEqual(action.action, 'riichi', 'テンパイ門前でリーチ宣言');
    assert(typeof action.index === 'number', 'リーチ打牌インデックスが数値');
}

// ============================
// selectDrawAction: 暗槓
// ============================
console.log('\n=== selectDrawAction: 暗槓 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // 14枚: 1m×4 + (2m3m4m)(5m6m7m) + 9m9m + 1z1z
    [1,1,1,1,2,3,4,5,6,7,9,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(H, 1)); // 1z
    player.hand.add(t(H, 1)); // 1z
    player.isRiichi = false;
    const g = makeMockGame();
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assertEqual(action.action, 'ankan', '4枚揃いで暗槓を選択');
    assert(typeof action.tileId === 'number', '暗槓tileIdが数値');
}

// ============================
// selectDrawAction: 通常打牌
// ============================
console.log('\n=== selectDrawAction: 通常打牌 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // 14枚: バラバラ手（向聴数高い）
    [1,3,5,7,9].forEach(n => player.hand.add(t(M, n)));
    [2,4,6,8].forEach(n => player.hand.add(t(P, n)));
    player.hand.add(t(S, 1));
    player.hand.add(t(S, 3));
    player.hand.add(t(H, 1));
    player.hand.add(t(H, 2));
    player.hand.add(t(H, 3)); // 計14枚
    player.isMenzen = true;
    player.isRiichi = false;
    const g = makeMockGame();
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assertEqual(action.action, 'discard', '非テンパイ手で打牌を選択');
    assert(typeof action.index === 'number', '打牌インデックスが数値');
}

// ============================
// selectDrawAction: 残り牌3枚以下でリーチ不可
// ============================
console.log('\n=== selectDrawAction: 残り牌3枚以下でリーチ不可 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(P, 2));
    player.hand.add(t(P, 3));
    player.hand.add(t(P, 5));
    player.hand.add(t(P, 5));
    player.hand.add(t(H, 9));
    player.isMenzen = true;
    player.isRiichi = false;
    const g = makeMockGame(2); // 残り2枚
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assert(action.action !== 'riichi', '残り牌2枚ではリーチ宣言しない');
}

// ============================
// selectDrawAction: リーチ済みは再宣言しない
// ============================
console.log('\n=== selectDrawAction: リーチ済みは再宣言しない ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(P, 2));
    player.hand.add(t(P, 3));
    player.hand.add(t(P, 5));
    player.hand.add(t(P, 5));
    player.hand.add(t(H, 9));
    player.isRiichi = true; // 既にリーチ済み
    player.isMenzen = true;
    const g = makeMockGame(20);
    g.players[1] = player;
    const action = ai.selectDrawAction(player, g);
    assert(action.action !== 'riichi', 'リーチ済みは再宣言しない');
}

// ============================
// selectClaimAction: ロン
// ============================
console.log('\n=== selectClaimAction: ロン ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    const g = makeMockGame();
    const tile = t(M, 5);
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: true, canPon: false, canMinkan: false, canChi: false });
    assertEqual(action.action, 'ron', 'ロン可能なら常にロン');
}

// ============================
// selectClaimAction: リーチ中はパス
// ============================
console.log('\n=== selectClaimAction: リーチ中はパス ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    player.isRiichi = true;
    const g = makeMockGame();
    const tile = t(M, 5);
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: true, canMinkan: false, canChi: false });
    assertEqual(action.action, 'pass', 'リーチ中はポン不可→パス');
}

// ============================
// selectClaimAction: 役牌ポン（中）
// ============================
console.log('\n=== selectClaimAction: 役牌ポン（中）===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(H, 7)); // 中
    player.hand.add(t(H, 7)); // 中
    player.hand.add(t(P, 1)); // 計12枚
    const g = makeMockGame();
    g.players[1] = player;
    const tile = t(H, 7); // 中(id=33)
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: true, canMinkan: false, canChi: false });
    assertEqual(action.action, 'pon', '中のポンを選択（役牌）');
}

// ============================
// selectClaimAction: 役牌ポン（白）
// ============================
console.log('\n=== selectClaimAction: 役牌ポン（白）===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(H, 5)); // 白
    player.hand.add(t(H, 5)); // 白
    player.hand.add(t(P, 1)); // 計12枚
    const g = makeMockGame();
    g.players[1] = player;
    const tile = t(H, 5); // 白(id=31)
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: true, canMinkan: false, canChi: false });
    assertEqual(action.action, 'pon', '白のポンを選択（役牌）');
}

// ============================
// selectClaimAction: 明槓
// ============================
console.log('\n=== selectClaimAction: 明槓 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    [5,5,5].forEach(n => player.hand.add(t(M, n)));
    [1,2,3,4,6,7,8,9].forEach(n => player.hand.add(t(P, n)));
    player.hand.add(t(H, 1));
    player.hand.add(t(H, 2)); // 計13枚
    const g = makeMockGame();
    g.players[1] = player;
    const tile = t(M, 5);
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: false, canMinkan: true, canChi: false });
    assertEqual(action.action, 'minkan', '明槓可能なら明槓を選択');
}

// ============================
// selectClaimAction: 向聴改善なし→パス
// ============================
console.log('\n=== selectClaimAction: 向聴改善なし→パス ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // 完全な門前テンパイ手 - ポンしても向聴改善しない
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(P, 1));
    player.hand.add(t(P, 2));
    player.hand.add(t(P, 3)); // (1p2p3p) 完成グループ
    // 12枚: 4グループ完成、テンパイに近い手
    const g = makeMockGame();
    g.players[1] = player;
    // 7z をポンするとしても向聴改善しない
    const tile = t(H, 7);
    // 手牌に7z が2枚ない → canPon = false が正しいが、テストのためにoptsをoverrideして実装の判断をチェック
    // 実際の向聴改善判定: findPonIndices が null → _ponImprovesShanten → false → pass
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: true, canMinkan: false, canChi: false });
    // 7zが手牌になく findPonIndices=null → _ponImprovesShanten→false → pass
    assertEqual(action.action, 'pass', '向聴改善なし（ポン候補牌が手牌にない）→パス');
}

// ============================
// selectClaimAction: チーで向聴改善
// ============================
console.log('\n=== selectClaimAction: チーで向聴改善 ===');
{
    const ai = new AILevel3(1);
    const player = new Player(1, false);
    // 手: (1m2m3m)(4m5m6m)(7m8m9m) + 2p3p + 1z1z (12枚)
    // 1pをチー → (1p2p3p)完成 → 向聴改善 → chiを返す
    [1,2,3,4,5,6,7,8,9].forEach(n => player.hand.add(t(M, n)));
    player.hand.add(t(P, 2));
    player.hand.add(t(P, 3));
    player.hand.add(t(H, 1));
    player.hand.add(t(H, 1)); // 計13枚
    const g = makeMockGame();
    g.players[1] = player;
    const tile = t(P, 1); // 1pをチーで(1p2p3p)完成
    const action = ai.selectClaimAction(player, g, tile,
        { canRon: false, canPon: false, canMinkan: false, canChi: true });
    assertEqual(action.action, 'chi', 'チーで向聴改善するなら chi を選択');
    assert(Array.isArray(action.tileIndices) && action.tileIndices.length === 2,
        'chi の tileIndices が2要素配列');
}

console.log('\n==================================================');
console.log(`テスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
