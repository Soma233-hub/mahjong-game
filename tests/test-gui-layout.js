/**
 * GUI レイアウト計算ユニットテスト
 * node tests/test-gui-layout.js で実行
 */
import {
    handPositions, discardPosition, meldTilePositions,
    CW, CH, TW, TH, SW, SH, GAP, DRAW_GAP,
} from '../src/ui/Layout.js';

let passed = 0, failed = 0;

function assert(condition, label, info = '') {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.error(`  ✗ ${label} ${info}`); failed++; }
}

// ──────────────────────────────────────────────────────────────────
// handPositions
// ──────────────────────────────────────────────────────────────────

console.log('\n[handPositions - P0 (bottom)]');
{
    const pos = handPositions(0, 13);
    assert(pos.length === 13, 'P0 13枚 → 13ポジション');
    assert(pos.every(p => p.y > CH * 0.75),
        'P0 hand tiles are in bottom quarter',
        `(minY=${Math.min(...pos.map(p => p.y)).toFixed(0)})`);
    assert(pos.every(p => p.angle === 0), 'P0 angle=0');

    // 均等間隔
    const dx = pos[1].x - pos[0].x;
    assert(pos.slice(1).every((p, i) => Math.abs(p.x - pos[i].x - dx) < 0.5),
        'P0 tiles evenly spaced');

    // キャンバス内
    assert(pos.every(p => p.x > 0 && p.x < CW), 'P0 tiles within canvas width');

    // 中央寄り（誤差100px以内）
    const midX = (pos[0].x + pos[12].x) / 2;
    assert(Math.abs(midX - CW / 2) < 100, 'P0 hand roughly centered',
        `(midX=${midX.toFixed(0)})`);
}

console.log('\n[handPositions - P0 draw tile gap]');
{
    const pos = handPositions(0, 14, true);
    assert(pos.length === 14, 'P0 14枚 → 14ポジション');
    const regularGap = pos[1].x - pos[0].x;
    const drawGap    = pos[13].x - pos[12].x;
    assert(drawGap > regularGap + DRAW_GAP - 1,
        'ツモ牌は通常タイルより大きいギャップ',
        `(drawGap=${drawGap.toFixed(0)}, regularGap=${regularGap.toFixed(0)})`);
}

console.log('\n[handPositions - P0 meld offset]');
{
    const pos0 = handPositions(0, 13, false, 0);
    const pos1 = handPositions(0, 11, false, 1);
    // meld分だけ手牌エリアが左寄りか、または右端マージンが確保されているか
    // (副露がある場合は手牌が左寄りになる)
    assert(pos1[0].x <= pos0[0].x + 10,
        'meld有りの場合 手牌開始x ≤ meld無しの場合',
        `(noMeld=${pos0[0].x.toFixed(0)}, oneMeld=${pos1[0].x.toFixed(0)})`);
}

console.log('\n[handPositions - P1 (right)]');
{
    const pos = handPositions(1, 13);
    assert(pos.length === 13, 'P1 13枚 → 13ポジション');
    assert(pos.every(p => p.x > CW * 0.85),
        'P1 hand tiles are on the right',
        `(minX=${Math.min(...pos.map(p => p.x)).toFixed(0)})`);
    assert(pos.every(p => Math.abs(p.angle - Math.PI / 2) < 0.01),
        'P1 angle=PI/2');
    assert(pos[1].y > pos[0].y, 'P1 tiles go downward');
    assert(pos.every(p => p.y > 0 && p.y < CH), 'P1 tiles within canvas height');
}

console.log('\n[handPositions - P2 (top)]');
{
    const pos = handPositions(2, 13);
    assert(pos.length === 13, 'P2 13枚 → 13ポジション');
    assert(pos.every(p => p.y < CH * 0.15),
        'P2 hand tiles are at top',
        `(maxY=${Math.max(...pos.map(p => p.y)).toFixed(0)})`);
    assert(pos.every(p => Math.abs(p.angle - Math.PI) < 0.01), 'P2 angle=PI');
    assert(pos.every(p => p.x > 0 && p.x < CW), 'P2 tiles within canvas width');
}

console.log('\n[handPositions - P3 (left)]');
{
    const pos = handPositions(3, 13);
    assert(pos.length === 13, 'P3 13枚 → 13ポジション');
    assert(pos.every(p => p.x < CW * 0.15),
        'P3 hand tiles are on the left',
        `(maxX=${Math.max(...pos.map(p => p.x)).toFixed(0)})`);
    assert(pos.every(p => Math.abs(p.angle + Math.PI / 2) < 0.01),
        'P3 angle=-PI/2');
    assert(pos.every(p => p.y > 0 && p.y < CH), 'P3 tiles within canvas height');
}

// ──────────────────────────────────────────────────────────────────
// discardPosition
// ──────────────────────────────────────────────────────────────────

console.log('\n[discardPosition - P0]');
{
    const p0 = discardPosition(0, 0);
    assert(p0.y > CH / 2, 'P0 discard[0] はセンター下', `(y=${p0.y})`);
    assert(p0.angle === 0, 'P0 discard angle=0');
    assert(p0.x > 0 && p0.x < CW, 'P0 discard[0] x はキャンバス内');

    const p5 = discardPosition(0, 5);
    assert(Math.abs(p0.y - p5.y) < 1, 'P0 捨て牌0〜5は同じ行', `(y0=${p0.y},y5=${p5.y})`);
    assert(p5.x > p0.x, 'P0 discard[5].x > discard[0].x (左から右へ)');

    const p6 = discardPosition(0, 6);
    assert(p6.y > p0.y, 'P0 2行目は1行目より下', `(row0=${p0.y},row1=${p6.y})`);
    assert(Math.abs(p6.x - p0.x) < 1, 'P0 discard[6].x == discard[0].x (同列)');
}

console.log('\n[discardPosition - P2]');
{
    const p0 = discardPosition(2, 0);
    assert(p0.y < CH / 2, 'P2 discard[0] はセンター上', `(y=${p0.y})`);
    assert(Math.abs(p0.angle - Math.PI) < 0.01, 'P2 discard angle=PI');

    const p6 = discardPosition(2, 6);
    assert(p6.y < p0.y, 'P2 2行目は1行目より上方向（センターへ）',
        `(row0y=${p0.y},row1y=${p6.y})`);
}

console.log('\n[discardPosition - P1]');
{
    const p0 = discardPosition(1, 0);
    assert(p0.x > CW / 2, 'P1 discard[0] はセンター右', `(x=${p0.x})`);
    assert(Math.abs(p0.angle - Math.PI / 2) < 0.01, 'P1 discard angle=PI/2');
}

console.log('\n[discardPosition - P3]');
{
    const p0 = discardPosition(3, 0);
    assert(p0.x < CW / 2, 'P3 discard[0] はセンター左', `(x=${p0.x})`);
    assert(Math.abs(p0.angle + Math.PI / 2) < 0.01, 'P3 discard angle=-PI/2');
}

// ──────────────────────────────────────────────────────────────────
// meldTilePositions
// ──────────────────────────────────────────────────────────────────

console.log('\n[meldTilePositions - P0]');
{
    const pos = meldTilePositions(0, 0, 0, 3);
    assert(pos.length === 3, 'P0 ポン副露 → 3ポジション');
    assert(pos.every(p => p.x > CW / 2), 'P0 副露はセンター右');
    assert(pos.every(p => p.y > CH * 0.75), 'P0 副露は画面下部');
    assert(pos.every(p => p.angle === 0), 'P0 副露 angle=0');
}
{
    const pos0 = meldTilePositions(0, 0, 0, 3);
    const pos1 = meldTilePositions(0, 1, 3, 3);
    assert(pos1[0].x < pos0[0].x, '2番目の副露は1番目より左から始まる');
    assert(pos1[pos1.length - 1].x < pos0[0].x,
        '2番目の副露は1番目の開始点より全体的に左');
}
{
    const pos = meldTilePositions(0, 0, 0, 4);
    assert(pos.length === 4, 'P0 カン副露 → 4ポジション');
}

console.log('\n[meldTilePositions - P1]');
{
    const pos = meldTilePositions(1, 0, 0, 3);
    assert(pos.length === 3, 'P1 副露 → 3ポジション');
    assert(pos.every(p => p.x > CW * 0.85), 'P1 副露は画面右端');
    assert(Math.abs(pos[0].angle - Math.PI / 2) < 0.01, 'P1 副露 angle=PI/2');
}

console.log('\n[meldTilePositions - P2]');
{
    const pos = meldTilePositions(2, 0, 0, 3);
    assert(pos.length === 3, 'P2 副露 → 3ポジション');
    assert(pos.every(p => p.y < CH * 0.15), 'P2 副露は画面上部');
    assert(Math.abs(pos[0].angle - Math.PI) < 0.01, 'P2 副露 angle=PI');
}

console.log('\n[meldTilePositions - P3]');
{
    const pos = meldTilePositions(3, 0, 0, 3);
    assert(pos.length === 3, 'P3 副露 → 3ポジション');
    assert(pos.every(p => p.x < CW * 0.15), 'P3 副露は画面左端');
    assert(Math.abs(pos[0].angle + Math.PI / 2) < 0.01, 'P3 副露 angle=-PI/2');
}

// ──────────────────────────────────────────────────────────────────
console.log(`\nテスト結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
