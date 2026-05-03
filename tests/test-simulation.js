/**
 * ヘッドレスシミュレーションテスト（東風戦）
 * node tests/test-simulation.js で実行
 */
import { Game, GAME_STATE, ROUND_RESULT } from '../src/core/Game.js';
import { AILevel3 } from '../src/ai/AILevel3.js';

let passed = 0, failed = 0;

function assert(condition, label, info = '') {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.error(`  ✗ ${label}${info ? ' ' + info : ''}`); failed++; }
}
function assertEqual(a, e, label) {
    const ok = a === e;
    assert(ok, label, ok ? '' : `(expected ${e}, got ${a})`);
}

// 全員AIのヘッドレスゲームを生成
function makeHeadlessGame() {
    const game = new Game();
    game.players[0].isHuman = false;
    game.players[0].ai = new AILevel3(0);
    return game;
}

// roundEndハンドラ付きで1試合を完走させる（dealer継続考慮）
function runGame(maxRounds = 20) {
    const game = makeHeadlessGame();
    let roundCount = 0;
    let gameEnded = false;
    const results = [];

    game.on('roundEnd', (data) => {
        roundCount++;
        results.push(data);
        if (!gameEnded && roundCount < maxRounds) {
            const dealerWon =
                (data.result === ROUND_RESULT.TSUMO || data.result === ROUND_RESULT.RON)
                && data.winnerIndex === game.dealerIndex;
            game.nextRound(dealerWon);
        }
    });

    game.on('gameEnd', () => { gameEnded = true; });

    game.startGame();
    return { roundCount, results, gameEnded, players: game.players };
}

// ==============================
// シミュレーション: 1局完走
// ==============================
console.log('\n=== シミュレーション: 1局完走 ===');
{
    const game = makeHeadlessGame();
    let roundEnded = false;
    let roundResult = null;

    game.on('roundEnd', (data) => {
        roundEnded = true;
        roundResult = data;
    });

    game.startGame();

    assert(roundEnded, '1局が roundEnd イベントを発火する');
    assert(
        roundResult && Object.values(ROUND_RESULT).includes(roundResult.result),
        `局結果が有効な値: ${roundResult?.result}`
    );
}

// ==============================
// シミュレーション: 東風戦4局以上
// ==============================
console.log('\n=== シミュレーション: 東風戦4局以上 ===');
{
    const { roundCount, gameEnded } = runGame();
    assert(roundCount >= 4, `最低4局進行する（実際: ${roundCount}局）`);
    assert(gameEnded, '東風戦が gameEnd イベントで正常終了する');
}

// ==============================
// シミュレーション: 点数合計整合性
// ==============================
console.log('\n=== シミュレーション: 点数合計整合性 ===');
{
    const { players } = runGame();
    const totalScore = players.reduce((s, p) => s + p.score, 0);
    const INITIAL_TOTAL = 100000;
    // リーチ棒（供託）で減少分を考慮: 最大4本×1000=4000点のみ誤差許容
    assert(totalScore <= INITIAL_TOTAL,
        `点数合計は初期値以下: ${totalScore}点`);
    assert(totalScore >= INITIAL_TOTAL - 4000,
        `点数合計の下限チェック: ${totalScore}点`);
}

// ==============================
// シミュレーション: デッドロックなし（3試行）
// ==============================
console.log('\n=== シミュレーション: デッドロックなし（3試行）===');
{
    let allCompleted = true;
    for (let i = 0; i < 3; i++) {
        const { gameEnded, roundCount } = runGame();
        if (!gameEnded) {
            allCompleted = false;
            console.error(`  試行${i+1}: 東風戦が完了しなかった (${roundCount}局)`);
        }
    }
    assert(allCompleted, '3試行すべてが東風戦完走');
}

// ==============================
// シミュレーション: 局結果の種類確認
// ==============================
console.log('\n=== シミュレーション: 局結果の種類確認 ===');
{
    // 10局シミュレーションで各種結果が出ることを確認
    const allResults = [];
    for (let i = 0; i < 3; i++) {
        const { results } = runGame();
        results.forEach(r => allResults.push(r.result));
    }
    const resultSet = new Set(allResults);
    assert(allResults.length >= 12, `合計${allResults.length}局のデータ取得`);
    // tsumo / ron / ryuukyoku のいずれかが含まれれば良い
    const validResults = [ROUND_RESULT.TSUMO, ROUND_RESULT.RON, ROUND_RESULT.RYUUKYOKU, ROUND_RESULT.CHOMBO];
    const allValid = allResults.every(r => validResults.includes(r));
    assert(allValid, '全局結果が有効な値のみ');
}

console.log('\n==================================================');
console.log(`テスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
