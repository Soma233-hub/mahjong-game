/**
 * シミュレーションテスト: AI同士で複数ゲーム自動対局
 * - ゲームがクラッシュしないこと
 * - 点数保存則（合計100,000点）が維持されること
 * - ツモ和了・ロン和了・流局が正常に発生すること
 */
import { Game, GAME_STATE, ROUND_RESULT } from '../src/core/Game.js';

const GAME_COUNT = 50;
const MAX_ROUNDS = 16; // 1ゲーム最大局数（無限ループ防止）

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) { passed++; console.log(`  ✓ ${msg}`); }
    else           { failed++; console.log(`  ✗ ${msg}`); }
}

// --- 1ゲームを実行して結果を返す ---

function runOneGame() {
    const game = new Game({ allAI: true });
    let roundCount = 0;
    let conservationViolations = 0;
    let error = null;

    const checkConservation = () => {
        const total = game.players.reduce((s, p) => s + p.score, 0)
                      + game.kyotaku * 1000;
        if (total !== 100000) conservationViolations++;
    };

    game.on('roundEnd', ({ result, winnerIndex }) => {
        roundCount++;
        checkConservation();

        if (game.state === GAME_STATE.GAME_END) return;
        if (roundCount >= MAX_ROUNDS) return;

        try {
            const dealerWon =
                (result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON)
                && winnerIndex === game.dealerIndex;
            game.nextRound(dealerWon);
        } catch (e) {
            error = e;
        }
    });

    try {
        game.startGame();
    } catch (e) {
        error = e;
    }

    return {
        completed: error === null,
        roundCount,
        conservationViolations,
        error,
        finalState: game.state,
        players: game.players,
        kyotaku: game.kyotaku,
    };
}

// --- 統計収集 ---

const stats = {
    [ROUND_RESULT.TSUMO]:     0,
    [ROUND_RESULT.RON]:       0,
    [ROUND_RESULT.RYUUKYOKU]: 0,
    [ROUND_RESULT.CHOMBO]:    0,
};
let totalRounds = 0;
let totalConservationViolations = 0;
let crashCount = 0;

console.log(`\n=== シミュレーションテスト: ${GAME_COUNT}局 ===`);

// ラウンド結果カウンタのため roundEnd をグローバルに集計
// 各ゲームでの roundEnd はローカルだが stats は外部で集計する
const gameResults = [];

for (let i = 0; i < GAME_COUNT; i++) {
    // ゲームごとにラウンド結果を収集
    const game = new Game({ allAI: true });
    let roundCount = 0;
    let conservationViolations = 0;
    let gameError = null;

    const checkConservation = () => {
        const total = game.players.reduce((s, p) => s + p.score, 0)
                      + game.kyotaku * 1000;
        if (total !== 100000) conservationViolations++;
    };

    game.on('roundEnd', ({ result, winnerIndex }) => {
        roundCount++;
        stats[result] = (stats[result] || 0) + 1;
        checkConservation();

        if (game.state === GAME_STATE.GAME_END) return;
        if (roundCount >= MAX_ROUNDS) return;

        try {
            const dealerWon =
                (result === ROUND_RESULT.TSUMO || result === ROUND_RESULT.RON)
                && winnerIndex === game.dealerIndex;
            game.nextRound(dealerWon);
        } catch (e) {
            gameError = e;
        }
    });

    try {
        game.startGame();
    } catch (e) {
        gameError = e;
    }

    if (gameError) {
        crashCount++;
        console.log(`  ✗ ゲーム${i + 1} エラー: ${gameError.message}`);
        console.log(`    ${gameError.stack?.split('\n')[1] || ''}`);
    }

    totalRounds += roundCount;
    totalConservationViolations += conservationViolations;
    gameResults.push({ roundCount, conservationViolations, error: gameError });
}

// --- 統計表示 ---

console.log(`\n=== 統計サマリー ===`);
console.log(`  実行ゲーム数:    ${GAME_COUNT}`);
console.log(`  総ラウンド数:    ${totalRounds}`);
console.log(`  平均ラウンド数:  ${(totalRounds / GAME_COUNT).toFixed(1)}`);
console.log(`  ツモ和了:        ${stats.tsumo || 0}回`);
console.log(`  ロン和了:        ${stats.ron || 0}回`);
console.log(`  流局:            ${stats.ryuukyoku || 0}回`);
console.log(`  チョンボ:        ${stats.chombo || 0}回`);
console.log(`  クラッシュ:      ${crashCount}回`);
console.log(`  点数保存則違反:  ${totalConservationViolations}回`);

// --- アサーション ---

console.log(`\n=== テストアサーション ===`);

assert(crashCount === 0,
    `全${GAME_COUNT}ゲームがエラーなし`);

assert(totalConservationViolations === 0,
    `全ラウンドで点数保存則が成立（合計100,000点）`);

assert(totalRounds >= GAME_COUNT * 2,
    `総ラウンド数が${GAME_COUNT * 2}以上（平均2局/ゲーム以上）`);

assert((stats.tsumo || 0) + (stats.ron || 0) > 0,
    'ツモまたはロン和了が1回以上発生');

const totalStatRounds = Object.values(stats).reduce((s, v) => s + v, 0);
assert(totalStatRounds === totalRounds,
    `全ラウンドの結果が集計されている (${totalStatRounds}/${totalRounds})`);

// --- 最終結果 ---

console.log(`\nテスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
