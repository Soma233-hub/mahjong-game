/**
 * シミュレーションテスト（1000局自動対局）
 * node tests/test-simulation.js で実行
 */
import { Game, ROUND_RESULT } from '../src/core/Game.js';
import { AILevel3 } from '../src/ai/AILevel3.js';
import { scoreLabel } from '../src/logic/Score.js';

const NUM_ROUNDS = 1000;

const stats = {
    total:         0,
    tsumo:         0,
    ron:           0,
    ryuukyoku:     0,
    chombo:        0,
    errors:        0,
    yakumanRounds: 0,
    yaku:          {},
    hanDist:       {},
    labelDist:     {},
    totalPts:      0,
    maxPts:        0,
};

function recordWinStats(result) {
    if (!result.yakuResult) return;
    if (result.yakuResult.isYakuman) stats.yakumanRounds++;
    for (const y of result.yakuResult.yaku) {
        stats.yaku[y.key] = (stats.yaku[y.key] || 0) + 1;
    }
    if (result.han !== undefined) {
        const h = String(result.han);
        stats.hanDist[h] = (stats.hanDist[h] || 0) + 1;
    }
    if (result.han !== undefined && result.fu !== undefined) {
        const lbl = scoreLabel(result.han, result.fu);
        stats.labelDist[lbl] = (stats.labelDist[lbl] || 0) + 1;
    }
    if (result.total !== undefined) {
        stats.totalPts += result.total;
        if (result.total > stats.maxPts) stats.maxPts = result.total;
    }
}

function runOneRound() {
    const game = new Game();
    game.players[0].isHuman = false;
    game.players[0].ai = new AILevel3(0);

    let roundData = null;
    game.on('roundEnd', (data) => { roundData = data; });

    game.startGame();
    return roundData;
}

console.log(`\n=== シミュレーションテスト: ${NUM_ROUNDS}局 ===\n`);

for (let i = 0; i < NUM_ROUNDS; i++) {
    try {
        const result = runOneRound();
        stats.total++;

        if (!result) { stats.errors++; continue; }

        switch (result.result) {
            case ROUND_RESULT.TSUMO:
                stats.tsumo++;
                recordWinStats(result);
                break;
            case ROUND_RESULT.RON:
                stats.ron++;
                recordWinStats(result);
                break;
            case ROUND_RESULT.RYUUKYOKU:
                stats.ryuukyoku++;
                break;
            case ROUND_RESULT.CHOMBO:
                stats.chombo++;
                break;
            default:
                stats.errors++;
        }
    } catch (e) {
        stats.errors++;
        if (stats.errors <= 3) console.error(`  エラー #${stats.errors}: ${e.message}`);
    }
}

// --- 集計出力 ---
const wins = stats.tsumo + stats.ron;
const pct  = (n) => (stats.total > 0 ? ((n / stats.total) * 100).toFixed(1) : '0.0') + '%';
const pctW = (n) => (wins > 0 ? ((n / wins) * 100).toFixed(1) : '0.0') + '%';

console.log('='.repeat(50));
console.log('【対局結果】');
console.log(`  総局数     : ${stats.total}`);
console.log(`  和了局数   : ${wins}  (${pct(wins)})`);
console.log(`    ツモ和了 : ${stats.tsumo}  (${pct(stats.tsumo)})`);
console.log(`    ロン和了 : ${stats.ron}  (${pct(stats.ron)})`);
console.log(`  流局       : ${stats.ryuukyoku}  (${pct(stats.ryuukyoku)})`);
console.log(`  チョンボ   : ${stats.chombo}`);
console.log(`  エラー     : ${stats.errors}`);

if (wins > 0) {
    console.log('\n【和了統計】');
    console.log(`  役満和了  : ${stats.yakumanRounds}  (${pctW(stats.yakumanRounds)})`);
    console.log(`  平均点数  : ${Math.round(stats.totalPts / wins)}点`);
    console.log(`  最高点数  : ${stats.maxPts}点`);

    console.log('\n【点数区分】');
    const order = ['1翻', '2翻', '3翻', '4翻', '満貫', '跳満', '倍満', '三倍満', '役満', '役満×2'];
    const seen = new Set();
    for (const key of order) {
        for (const [lbl, cnt] of Object.entries(stats.labelDist)) {
            if (lbl.startsWith(key) && !seen.has(lbl)) {
                seen.add(lbl);
                console.log(`  ${lbl.padEnd(10)}: ${cnt}  (${pctW(cnt)})`);
            }
        }
    }
    for (const [lbl, cnt] of Object.entries(stats.labelDist)) {
        if (!seen.has(lbl)) {
            console.log(`  ${lbl.padEnd(10)}: ${cnt}  (${pctW(cnt)})`);
        }
    }

    console.log('\n【翻数分布】');
    const hanKeys = Object.keys(stats.hanDist).map(Number).sort((a, b) => a - b);
    for (const h of hanKeys) {
        const cnt = stats.hanDist[String(h)];
        console.log(`  ${String(h).padStart(2)}翻: ${cnt}  (${pctW(cnt)})`);
    }

    console.log('\n【役構成（上位15役）】');
    const yakuEntries = Object.entries(stats.yaku).sort((a, b) => b[1] - a[1]).slice(0, 15);
    for (const [key, cnt] of yakuEntries) {
        console.log(`  ${key.padEnd(20)}: ${cnt}  (${pctW(cnt)})`);
    }
}

console.log('='.repeat(50));

// 正常終了の検証
const errorRate = stats.errors / Math.max(stats.total, 1);
if (errorRate > 0.01) {
    console.error(`\n✗ エラー率が高すぎます: ${(errorRate * 100).toFixed(1)}%`);
    process.exit(1);
}
if (stats.total < NUM_ROUNDS * 0.99) {
    console.error(`\n✗ 完走局数不足: ${stats.total}/${NUM_ROUNDS}`);
    process.exit(1);
}

console.log(`\n✓ シミュレーション完了: ${stats.total}/${NUM_ROUNDS}局 正常終了`);
