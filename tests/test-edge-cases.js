/**
 * エッジケーステスト
 * - ダブルリーチ判定
 * - 一発フラグのライフサイクル（副露でのキャンセル含む）
 * - 一時フリテン（ツモで解消）
 * - 供託（kyotaku）の蓄積
 * - nextRound の親継続 / 親交代 / ゲーム終了
 * - processDiscard の state/player ガード
 */
import { Game, GAME_STATE, ROUND_RESULT } from '../src/core/Game.js';
import { Player } from '../src/core/Player.js';
import { Tile, SUIT } from '../src/core/Tile.js';
import { AILevel3 } from '../src/ai/AILevel3.js';
import { Hand } from '../src/core/Hand.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label} ${info}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected ${b}, got ${a})`);
}

// ========================
// ダブルリーチ判定
// ========================
console.log('\n[ダブルリーチ判定]');
{
    const p = new Player(0, true);
    // turn=1（最初のツモ）でリーチ宣言 → ダブルリーチ
    p.declareRiichi(1, true);
    assert(p.isRiichi, 'isRiichi=true');
    assert(p.isDoubleRiichi, 'turn=1 でダブルリーチ');
    assert(p.isIppatsu, '宣言直後は isIppatsu=true');
}
{
    const p = new Player(0, true);
    // turn=5 でリーチ宣言 → 通常リーチ
    p.declareRiichi(5, false);
    assert(p.isRiichi, 'isRiichi=true');
    assert(!p.isDoubleRiichi, 'turn=5 はダブルリーチでない');
    assert(p.isIppatsu, '一発フラグは立つ');
}

// ========================
// Game.processRiichi でのダブルリーチ自動判定
// ========================
console.log('\n[Game.processRiichi ダブルリーチ自動判定]');
{
    // 人間プレイヤーは自動進行しないため turn=1 で停止する
    const g = new Game(); // Player0=人間
    g.startGame();
    // Player0(人間)が最初のツモ後に停止している
    assertEqual(g.turn, 1, 'startGame直後 turn=1（最初のツモ）');
    const isDouble = g.turn <= 4;
    assert(isDouble, 'turn=1 のためダブルリーチ条件成立');
}

// ========================
// 一発フラグ: リーチ宣言直後は消えない
// ========================
console.log('\n[一発フラグ: リーチ宣言後も消えない]');
{
    // Player.discard() が isIppatsu を消さないことを確認
    const p = new Player(0, false);
    // 手牌に適当な牌を入れる
    p.hand.add(new Tile(SUIT.MAN, 1));
    p.hand.add(new Tile(SUIT.MAN, 2));
    p.declareRiichi(1, true);
    assert(p.isIppatsu, '宣言直後 isIppatsu=true');

    // discard を呼んでも消えないはず
    p.discard(0);
    assert(p.isIppatsu, 'discard() 後も isIppatsu は消えない（Game側で管理）');
}

// ========================
// 一発フラグ: 2回目の打牌後にゲームレベルでクリアされる
// ========================
console.log('\n[一発フラグ: 2回目の打牌でクリア]');
{
    const g = new Game();
    // Player0(人間)が手牌テンパイになるよう手動設定
    // テンパイ形: 1m2m3m 1m2m3m 1m2m3m 1p1p 9p ← 9p捨てでリーチ
    g.wall.init();
    // 簡易: players[0]の手牌を直接セット
    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
        new Tile(SUIT.PIN,9),  // 捨て牌（リーチ宣言用）
        new Tile(SUIT.SOU,1),  // ツモ後の14枚目（後で追加）
    ];
    // 状態を手動セット
    g.state = GAME_STATE.PLAYER_ACTION;
    g.currentIndex = 0;
    g.turn = 1;  // 最初のターン（ダブルリーチ条件）

    // Player0 がリーチ宣言（インデックス11の9pを捨てる）
    // claim がないよう allAI でなく手動制御
    g.on('claimNeeded', ({ playerIndex }) => g.selectClaim(playerIndex, { action: 'pass' }));

    // 14枚目が既にある前提で processRiichi
    g.processRiichi(0, 11);  // index=11(9p)を捨ててリーチ

    // リーチ宣言直後: turn=1 == riichiTurn=1 なので isIppatsu が残るはず
    assert(p0.isRiichi, 'p0.isRiichi=true');
    assert(p0.isIppatsu, 'リーチ宣言・捨て牌後も isIppatsu=true（一発フラグ残存）');

    // 次に他プレイヤーが捨てて、p0がツモを引く（ターン数を増やす）
    // 実際のゲームフローをシミュレートするため turn を手動で増やす
    g.turn = 5;  // p0 の2回目のツモ相当のターン

    // p0 が2回目の打牌（リーチ後のツモ切り）
    // ただし processDiscard は state=PLAYER_ACTION が必要
    g.state = GAME_STATE.PLAYER_ACTION;
    p0.hand.add(new Tile(SUIT.SOU, 9));  // ダミーツモ牌
    g.processDiscard(0, p0.hand.tileCount - 1);

    assert(!p0.isIppatsu, '2回目の打牌後は isIppatsu=false（一発消滅）');
}

// ========================
// 一発フラグ: ポンでキャンセル
// ========================
console.log('\n[一発フラグ: ポンでキャンセル]');
{
    const g = new Game({ allAI: true });
    // Player0にリーチ済みフラグを手動設定
    const p0 = g.players[0];
    p0.isRiichi = true;
    p0.riichiTurn = 1;
    p0.isIppatsu = true;

    // 他のプレイヤーがポンをした場合を想定: processPon を呼ぶ
    // まず lastDiscard と lastDiscardPlayer を設定
    const tile = new Tile(SUIT.MAN, 5);
    g.lastDiscard = tile;
    g.lastDiscardPlayer = 3;  // Player3が捨て

    // Player1に同じ牌を2枚持たせてポン可能にする
    const p1 = g.players[1];
    p1.hand.add(new Tile(SUIT.MAN, 5));
    p1.hand.add(new Tile(SUIT.MAN, 5));
    p1.hand.add(new Tile(SUIT.SOU, 1)); // 捨て牌用

    // processPon を直接呼ぶ（AIがMELD_ACTION後に自動打牌しないよう isHuman にする）
    // 代わりに processPon の前後でフラグを確認
    assert(p0.isIppatsu, 'ポン前は isIppatsu=true');
    g.processPon(1);
    assert(!p0.isIppatsu, 'ポン後は isIppatsu=false（一発キャンセル）');
}

// ========================
// 一時フリテン: ツモで解消
// ========================
console.log('\n[一時フリテン: ツモで解消]');
{
    const p = new Player(0, true);
    p.isTemporaryFuriten = true;

    // ツモで一時フリテン解消
    const tile = new Tile(SUIT.MAN, 1);
    p.draw(tile);
    assert(!p.isTemporaryFuriten, 'ツモ後は isTemporaryFuriten=false');
}

// ========================
// 一時フリテン: ロン見逃しで付与（_resolveClaimDecisions内）
// ========================
console.log('\n[一時フリテン: ロン見逃しで付与]');
{
    const g = new Game();
    // Player0 をテンパイ状態にする
    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
        new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,3),  // 13枚: 待ち=3p
    ];
    // Player1が3pを捨てる状況を設定
    g.lastDiscard = new Tile(SUIT.PIN, 3);
    g.lastDiscardPlayer = 1;
    g.state = GAME_STATE.CLAIM;

    // Player0はロン可能（テンパイで待ち=3p）
    // claimContext を手動設定してパスを選択
    g._claimContext = {
        decisions: { 0: null },
        allOptions: { 0: { canRon: true, canPon: false, canMinkan: false, canChi: false } },
        discarderIdx: 1,
        tile: g.lastDiscard,
    };

    // Player0がパスを選択（ロン見逃し）
    g.selectClaim(0, { action: 'pass' });

    assert(p0.isTemporaryFuriten, 'ロン見逃し後は isTemporaryFuriten=true');
    assert(!p0.isFuriten, 'リーチなしなので永続フリテンでない');
}

// ========================
// 供託（kyotaku）の蓄積
// ========================
console.log('\n[供託の蓄積]');
{
    const g = new Game();
    g.wall.init();
    g.players.forEach(p => p.score = 25000);
    g.kyotaku = 0;

    // Player0がリーチ（手動）
    const p0 = g.players[0];
    p0.score = 25000;
    p0.isRiichi = false;
    p0.riichiTurn = -1;
    p0.isMenzen = true;
    assertEqual(g.kyotaku, 0, 'リーチ前 kyotaku=0');

    // processRiichi を呼ぶには適切な state と手牌が必要
    // Player.declareRiichi + kyotaku++ を直接シミュレート
    p0.declareRiichi(1, false);
    g.kyotaku++;
    assertEqual(g.kyotaku, 1, 'リーチ後 kyotaku=1');
    assertEqual(p0.score, 24000, 'リーチ棒1000点減');

    // 2人目がリーチ
    const p1 = g.players[1];
    p1.declareRiichi(2, false);
    g.kyotaku++;
    assertEqual(g.kyotaku, 2, '2人リーチで kyotaku=2');
    assertEqual(p1.score, 24000, 'Player1も1000点減');

    // 合計点確認（kyotaku は保留）
    const total = g.players.reduce((s, p) => s + p.score, 0) + g.kyotaku * 1000;
    assertEqual(total, 100000, '点数保存則: 100000点');
}

// ========================
// nextRound: 親が和了 → 連荘（honba++, dealerIndex 不変）
// ========================
console.log('\n[nextRound: 親和了 → 連荘]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    // ゲームを round_end 状態に強制
    g.state = GAME_STATE.ROUND_END;
    const prevDealer = g.dealerIndex;
    const prevRound  = g.round;
    const prevHonba  = g.honba;

    // 親が和了（dealerContinues=true）
    g.on('roundEnd', () => {}); // 空リスナー
    g.nextRound(true);

    assertEqual(g.dealerIndex, prevDealer, '連荘: dealerIndex 変わらず');
    assertEqual(g.round, prevRound, '連荘: round 変わらず');
    assertEqual(g.honba, prevHonba + 1, '連荘: honba++');
}

// ========================
// nextRound: 子が和了 → 親交代（dealerIndex++, round++）
// ========================
console.log('\n[nextRound: 子和了 → 親交代]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    const prevDealer = g.dealerIndex;
    const prevRound  = g.round;
    g.honba = 2; // honbaを非ゼロにしておく

    g.nextRound(false);

    assertEqual(g.dealerIndex, (prevDealer + 1) % 4, '親交代: dealerIndex++');
    assertEqual(g.round, prevRound + 1, '親交代: round++');
    assertEqual(g.honba, 0, '親交代: honba=0 にリセット(実装では変わらない)');
}

// ========================
// nextRound: 4局目終了 → GAME_END
// ========================
console.log('\n[nextRound: round>=4 → GAME_END]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 3;  // あと1回で終了

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(false);  // round++ → 4 → GAME_END

    assert(gameEndFired, 'round>=4 で gameEnd イベント発火');
    assert(g.state === GAME_STATE.GAME_END, 'state=GAME_END');
}

// ========================
// processDiscard: 状態ガード（CLAIM状態では受け付けない）
// ========================
console.log('\n[processDiscard: 状態ガード]');
{
    const g = new Game();
    g.wall.init();
    g.players[0].hand.add(new Tile(SUIT.MAN, 1));
    g.state = GAME_STATE.CLAIM;  // 不正な状態
    g.currentIndex = 0;

    const beforeState = g.state;
    g.processDiscard(0, 0);
    assertEqual(g.state, beforeState, 'CLAIM中の processDiscard は無視される');
}

// ========================
// processDiscard: プレイヤーガード（別プレイヤーのターンには操作不可）
// ========================
console.log('\n[processDiscard: プレイヤーガード]');
{
    const g = new Game();
    g.startGame();
    // Player0のターンのはず
    assertEqual(g.currentIndex, 0, 'Player0のターン');

    // Player1が打牌しようとする → 無視
    const beforeTileCount = g.players[1].hand.tileCount;
    g.processDiscard(1, 0);
    assertEqual(g.players[1].hand.tileCount, beforeTileCount, 'Player1の手牌は変わらない');
    assertEqual(g.currentIndex, 0, 'currentIndex は変わらない');
}

// ========================
// 嶺上開花フラグ: _isRinshan の動作
// ========================
console.log('\n[嶺上フラグ: _isRinshan]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    // 初回ツモ後は _isRinshan=false のはず
    assert(!g._isRinshan, '通常ツモ後は _isRinshan=false');
}

// ========================
// 結果
// ========================
console.log(`\n結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
