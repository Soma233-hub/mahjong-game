/**
 * ゲームフロー統合テスト
 * node tests/test-game-flow.js で実行
 */
import { Game, GAME_STATE } from '../src/core/Game.js';
import { Tile, SUIT } from '../src/core/Tile.js';

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

// ========================
// Wall テスト
// ========================
console.log('\n[Wall 初期化]');
{
    const g = new Game();
    g.wall.init();
    assertEqual(g.wall.remaining, 122, '山: 136 - 14(王牌) = 122枚');
    assert(g.wall.doraIndicators.length === 1, 'ドラ表示牌1枚初期化');
}

// ========================
// 配牌テスト
// ========================
console.log('\n[配牌]');
{
    const g = new Game();
    g.wall.init();
    for (let i = 0; i < 4; i++) {
        const tiles = g.wall.deal(13);
        tiles.forEach(t => g.players[i].hand.add(t));
    }
    for (let i = 0; i < 4; i++) {
        assertEqual(g.players[i].hand.tileCount, 13, `Player${i} 配牌13枚`);
    }
    assertEqual(g.wall.remaining, 70, '配牌後の山残り70枚');
}

// ========================
// startGame: 人間の番で停止する
// ========================
console.log('\n[startGame]');
{
    const g = new Game();
    g.startGame();
    // 親(Player0=人間)がツモ後に PLAYER_ACTION で待機するのが正常
    assertEqual(g.state, GAME_STATE.PLAYER_ACTION, 'startGame後 state=player_action(人間待ち)');
    assertEqual(g.currentIndex, 0, 'startGame後 currentIndex=0(親)');
    // 親は配牌13枚+ツモ1枚=14枚
    assertEqual(g.players[0].hand.tileCount, 14, '親の手牌14枚(ツモ済)');
}

// ========================
// AI設定
// ========================
console.log('\n[AI設定]');
{
    const g = new Game();
    assert(!g.players[0].ai, 'Player0(人間) AI=null');
    assert(g.players[1].ai !== null, 'Player1 AI設定済み');
    assert(g.players[2].ai !== null, 'Player2 AI設定済み');
    assert(g.players[3].ai !== null, 'Player3 AI設定済み');
}

// ========================
// processDiscard: 人間の打牌 → AIが自動連鎖 → 人間の番に戻る
// ========================
console.log('\n[processDiscard + AIターン連鎖]');
{
    const g = new Game();
    // AI打牌後に人間へclaimNeededが発火した場合は自動パス（テスト用）
    g.on('claimNeeded', ({ playerIndex }) => g.selectClaim(playerIndex, { action: 'pass' }));
    g.startGame();
    // Player0のターン(14枚)
    assertEqual(g.currentIndex, 0, '初回Player0のターン');

    let discardEvents = [];
    g.on('discard', (data) => discardEvents.push(data.playerIndex));

    // Player0が打牌 → AI3人が連鎖打牌 → Player0のツモへ
    g.processDiscard(0, 0);

    // discardイベント: Player0→1→2→3の順で4回 or 山が尽きるまで
    assert(discardEvents[0] === 0, '最初の捨て牌はPlayer0');
    assert(discardEvents.length >= 4, `少なくとも4回捨て牌 (got: ${discardEvents.length})`);

    // Player0の番に戻り、state=player_action(ツモ済)
    assertEqual(g.state, GAME_STATE.PLAYER_ACTION, 'AI連鎖後もPlayer0の番で停止');
    assertEqual(g.currentIndex, 0, 'Player0のターンに戻る');
    assertEqual(g.players[0].hand.tileCount, 14, 'Player0は再ツモ後14枚');

    // 各AIプレイヤーの捨て牌が増えていること
    assert(g.players[1].discards.length >= 1, 'Player1が打牌済み');
    assert(g.players[2].discards.length >= 1, 'Player2が打牌済み');
    assert(g.players[3].discards.length >= 1, 'Player3が打牌済み');
}

// ========================
// checkFuriten
// ========================
console.log('\n[checkFuriten]');
{
    const g = new Game();
    const p = g.players[0];
    const tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
    ];
    tiles.forEach(tile => p.hand.add(tile));

    p.checkFuriten();
    assert(!p.isFuriten, '3pを捨てる前はフリテンでない');

    p.discards.push(new Tile(SUIT.PIN, 3));
    p.checkFuriten();
    assert(p.isFuriten, '3pを捨てたらフリテン');
}

// ========================
// 山枯れ→流局の検知（AIのみゲーム）
// ========================
console.log('\n[流局検知 - Player0もAI扱いでシミュレート]');
{
    const g = new Game();
    // Player0もAI扱いにする（テスト用）
    const { AILevel3 } = await import('../src/ai/AILevel3.js');
    g.players[0].isHuman = false;
    g.players[0].ai = new AILevel3(0);

    let roundEndResult = null;
    g.on('roundEnd', (data) => { roundEndResult = data.result; });

    // _startRoundを直接呼び出す（AIのみなので自動完走）
    g.round = 0;
    g.dealerIndex = 0;
    g.honba = 0;
    g.kyotaku = 0;
    g.players.forEach(p => p.score = 25000);
    g._startRound();

    assert(
        g.state === GAME_STATE.ROUND_END || g.state === GAME_STATE.GAME_END,
        `AIのみゲームは自動完走 (state: ${g.state})`
    );
    assert(roundEndResult === 'ryuukyoku', `流局で終了 (result: ${roundEndResult})`);
}

// ========================
// 結果
// ========================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
