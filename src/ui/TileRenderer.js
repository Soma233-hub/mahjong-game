import { SUIT, HONOR } from '../core/Tile.js';

// Tile → 表示文字列（例: "1m" "5p(赤)" "東"）
export function getTileLabel(tile) {
    if (tile.suit === SUIT.HONOR) {
        const names = ['', '東', '南', '西', '北', '白', '發', '中'];
        return names[tile.number];
    }
    const s = { man: 'm', pin: 'p', sou: 's' }[tile.suit];
    return `${tile.number}${s}${tile.isRed ? '●' : ''}`;
}

// 牌の色（man=赤系・pin=青系・sou=緑系・字牌=黄/紫）
export function getTileColor(tile) {
    if (tile.suit === SUIT.HONOR) {
        if (tile.number >= 5) return '#cc0000'; // 三元牌: 赤
        return '#996600';                        // 風牌: 茶
    }
    if (tile.suit === SUIT.MAN) return '#cc0000';
    if (tile.suit === SUIT.PIN) return '#0055cc';
    return '#007700'; // sou
}

// ツモ牌かどうか（手牌末尾 = ツモ牌）
export function isDrawnTile(hand, index) {
    return index === hand.tiles.length - 1;
}

// プレイヤー座席ごとのレイアウト設定を返す
// returns: { handX, handY, handAngle, discardX, discardY, nameX, nameY, scoreX, scoreY }
export function getPlayerLayout(playerIndex) {
    // PlayerIndex: 0=下(人間), 1=右(AI), 2=上(AI), 3=左(AI)
    const layouts = [
        // Player 0: 下
        {
            handX: 120, handY: 666, handAngle: 0,
            discardX: 350, discardY: 530,
            nameX: 40, nameY: 680, scoreX: 40, scoreY: 698,
            meldX: 1100, meldY: 666,
        },
        // Player 1: 右
        {
            handX: 1248, handY: 560, handAngle: 90,
            discardX: 960, discardY: 350,
            nameX: 1230, nameY: 90, scoreX: 1230, scoreY: 108,
            meldX: 1248, meldY: 130,
        },
        // Player 2: 上
        {
            handX: 1160, handY: 54, handAngle: 180,
            discardX: 720, discardY: 175,
            nameX: 1240, nameY: 36, scoreX: 1240, scoreY: 54,
            meldX: 180, meldY: 54,
        },
        // Player 3: 左
        {
            handX: 32, handY: 160, handAngle: 270,
            discardX: 310, discardY: 350,
            nameX: 50, nameY: 90, scoreX: 50, scoreY: 108,
            meldX: 32, meldY: 590,
        },
    ];
    return layouts[playerIndex];
}

// 捨て牌表示位置（最大24枚: 8列×3行）
export function getDiscardPosition(playerIndex, discardIndex) {
    const col = discardIndex % 6;
    const row = Math.floor(discardIndex / 6);
    const TW = 30, TH = 40, GAP = 2;

    const offsets = [
        // Player 0: 下 → 左→右, 上→下
        { x: 370 + col * (TW + GAP), y: 520 - row * (TH + GAP) },
        // Player 1: 右 → 下→上, 左→右（縦配置）
        { x: 960 + row * (TH + GAP), y: 360 + col * (TW + GAP) },
        // Player 2: 上 → 右→左, 下→上
        { x: 870 - col * (TW + GAP), y: 175 + row * (TH + GAP) },
        // Player 3: 左 → 上→下, 右→左（縦配置）
        { x: 305 - row * (TH + GAP), y: 235 - col * (TW + GAP) },
    ];
    return offsets[playerIndex];
}
