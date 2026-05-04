// Pure layout calculation functions for the mahjong game board.
// Canvas: CW x CH (1280 x 720).
// All returned coordinates are (x, y) center of each tile in world space.

export const CW = 1280;
export const CH = 720;
export const TW = 40;        // large tile width  (P0 hand)
export const TH = 56;        // large tile height
export const SW = 26;        // small tile width  (discards, opponent hands)
export const SH = 36;        // small tile height
export const GAP = 2;        // gap between adjacent tiles
export const DRAW_GAP = 8;   // extra gap before the freshly drawn tile

// ──────────────────────────────────────────────────────────────────
// handPositions
// Returns array of {x, y, angle} for each tile in a player's hand.
//   playerIndex : 0=bottom 1=right 2=top 3=left
//   tileCount   : number of tiles currently in hand
//   hasDrawTile : true when last tile is the freshly drawn tile (drawn with extra gap)
//   meldCount   : number of open melds (affects P0 available width)
// ──────────────────────────────────────────────────────────────────
export function handPositions(playerIndex, tileCount, hasDrawTile = false, meldCount = 0) {
    const positions = [];
    if (tileCount === 0) return positions;

    if (playerIndex === 0) {
        // Bottom (human): horizontal, large tiles, centered.
        // Right side reserved for melds.
        const meldSpace    = meldCount > 0 ? meldCount * (3 * SW + GAP * 3 + 8) + 10 : 0;
        const availWidth   = CW - 60 - meldSpace;
        const regularCount = hasDrawTile ? tileCount - 1 : tileCount;
        const regularWidth = regularCount > 0
            ? regularCount * TW + (regularCount - 1) * GAP
            : 0;
        const startX = 30 + (availWidth - regularWidth) / 2 + TW / 2;
        const y      = CH - TH / 2 - 20;   // 672 for default sizes

        for (let i = 0; i < tileCount; i++) {
            const isDrawTile = hasDrawTile && i === tileCount - 1;
            const x = isDrawTile
                ? startX + regularCount * (TW + GAP) - GAP + DRAW_GAP + TW / 2
                : startX + i * (TW + GAP);
            positions.push({ x, y, angle: 0 });
        }

    } else if (playerIndex === 1) {
        // Right: rotated 90°, small tiles stacked vertically.
        const totalH = tileCount * SW + (tileCount - 1) * GAP;
        const startY = CH / 2 - totalH / 2 + SW / 2;
        const x      = CW - SW / 2 - 4;
        for (let i = 0; i < tileCount; i++) {
            positions.push({ x, y: startY + i * (SW + GAP), angle: Math.PI / 2 });
        }

    } else if (playerIndex === 2) {
        // Top: rotated 180°, small tiles, right-to-left.
        const totalW = tileCount * SW + (tileCount - 1) * GAP;
        const startX = CW / 2 + totalW / 2 - SW / 2;
        const y      = SH / 2 + 4;
        for (let i = 0; i < tileCount; i++) {
            positions.push({ x: startX - i * (SW + GAP), y, angle: Math.PI });
        }

    } else {
        // Left (P3): rotated -90°, small tiles stacked vertically (inverted).
        const totalH = tileCount * SW + (tileCount - 1) * GAP;
        const startY = CH / 2 + totalH / 2 - SW / 2;
        const x      = SW / 2 + 4;
        for (let i = 0; i < tileCount; i++) {
            positions.push({ x, y: startY - i * (SW + GAP), angle: -Math.PI / 2 });
        }
    }

    return positions;
}

// ──────────────────────────────────────────────────────────────────
// discardPosition
// Returns {x, y, angle} for the discard tile at the given index.
// Discards for each player face the center of the board.
// ──────────────────────────────────────────────────────────────────
export function discardPosition(playerIndex, discardIndex) {
    const col = discardIndex % 6;
    const row = Math.floor(discardIndex / 6);

    if (playerIndex === 0) {
        // Bottom: 6-column grid going right then down.
        return {
            x: 570 + col * (SW + GAP),
            y: 450 + row * (SH + GAP),
            angle: 0,
        };

    } else if (playerIndex === 1) {
        // Right: 3-column grid (rotated 90°).
        // "column" goes upward (x decreases), "row" goes downward (y increases).
        const c = discardIndex % 3;
        const r = Math.floor(discardIndex / 3);
        return {
            x: 870 - r * (SW + GAP),
            y: 280 + c * (SH + GAP),
            angle: Math.PI / 2,
        };

    } else if (playerIndex === 2) {
        // Top: 6-column grid mirrored; rows go upward away from center.
        return {
            x: 710 - col * (SW + GAP),
            y: 270 - row * (SH + GAP),
            angle: Math.PI,
        };

    } else {
        // Left (P3): 3-column grid (rotated -90°).
        const c = discardIndex % 3;
        const r = Math.floor(discardIndex / 3);
        return {
            x: 410 + r * (SW + GAP),
            y: 280 + c * (SH + GAP),
            angle: -Math.PI / 2,
        };
    }
}

// ──────────────────────────────────────────────────────────────────
// meldTilePositions
// Returns array of {x, y, angle} for each tile in a meld.
//   meldIndex  : 0-based index of this meld
//   meldOffset : total tile count of all melds before this one (positioning offset)
//   tileCount  : 3 or 4
// ──────────────────────────────────────────────────────────────────
export function meldTilePositions(playerIndex, meldIndex, meldOffset, tileCount) {
    const positions = [];

    if (playerIndex === 0) {
        // Bottom right: tiles flow rightward from the right edge.
        const y = CH - SH / 2 - 8;
        for (let i = 0; i < tileCount; i++) {
            const j = meldOffset + i;
            positions.push({ x: CW - 8 - j * (SW + GAP) - SW / 2, y, angle: 0 });
        }

    } else if (playerIndex === 1) {
        // Right side: tiles flow downward from the top.
        const x = CW - SH / 2 - 4;
        for (let i = 0; i < tileCount; i++) {
            const j = meldOffset + i;
            positions.push({ x, y: 4 + j * (SW + GAP) + SW / 2, angle: Math.PI / 2 });
        }

    } else if (playerIndex === 2) {
        // Top: tiles flow rightward from the left edge.
        const y = SH / 2 + 4;
        for (let i = 0; i < tileCount; i++) {
            const j = meldOffset + i;
            positions.push({ x: 4 + j * (SW + GAP) + SW / 2, y, angle: Math.PI });
        }

    } else {
        // Left (P3): tiles flow upward from the bottom.
        const x = SH / 2 + 4;
        for (let i = 0; i < tileCount; i++) {
            const j = meldOffset + i;
            positions.push({ x, y: CH - 4 - j * (SW + GAP) - SW / 2, angle: -Math.PI / 2 });
        }
    }

    return positions;
}
