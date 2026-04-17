// 点数計算
// 参考: 基本点 = fu × 2^(han+2), 役満 = 8000基本点

const MANGAN_LIMIT   = 8000;
const HANEMAN_LIMIT  = 12000;
const BAIMAN_LIMIT   = 16000;
const SANBAIMAN_LIMIT = 24000;
const YAKUMAN_LIMIT  = 32000;

/**
 * 点数を計算する
 * @param {number} han   - 翻数
 * @param {number} fu    - 符
 * @param {boolean} isDealer - 和了者が親か
 * @param {boolean} isTsumo  - ツモ和了か
 * @param {number} honba     - 本場数
 * @param {number} kyotaku   - 供託リーチ棒（本数）
 * @returns {{ total: number, payments: number[] }}
 *          payments: [dealer, nonDealer] または [tsumo_dealer, tsumo_non] の支払い額
 */
export function calculateScore(han, fu, isDealer, isTsumo, honba = 0, kyotaku = 0) {
    // TODO: 第5週で実装
    return { total: 0, payments: [0, 0] };
}

/**
 * 符を計算する
 * @param {Hand}   hand      - 手牌
 * @param {Tile}   winTile   - 和了牌
 * @param {object} context   - { isTsumo, isPinfu, seatWind, roundWind, waitType }
 * @returns {number} 符（10の倍数に切り上げ）
 */
export function calculateFu(hand, winTile, context) {
    // TODO: 第5週で実装
    return 30;
}

// 基本点（役満以外）
export function basicPoints(han, fu) {
    if (han >= 13) return YAKUMAN_LIMIT;
    if (han >= 11) return SANBAIMAN_LIMIT;
    if (han >= 8)  return BAIMAN_LIMIT;
    if (han >= 6)  return HANEMAN_LIMIT;

    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_LIMIT || han >= 5) return MANGAN_LIMIT;
    return base;
}

// 切り上げ（100の倍数）
export function roundUp100(n) { return Math.ceil(n / 100) * 100; }

// 点数表示文字列
export function scoreLabel(han, fu) {
    if (han >= 13) return '役満';
    if (han >= 11) return '三倍満';
    if (han >= 8)  return '倍満';
    if (han >= 6)  return '跳満';
    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_LIMIT || han >= 5) return '満貫';
    return `${han}翻${fu}符`;
}
