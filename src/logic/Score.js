// 点数計算
// 基本点 = fu × 2^(han+2)、役満基本点 = 8000
// 支払い: 親ロン = base×6, 子ロン = base×4, 親ツモ各 = base×2, 子ツモ親 = base×2 / 他 = base×1

import { MELD_TYPE } from '../core/Meld.js';
import { decomposeClosed } from './Yaku.js';

const MANGAN_BASE    = 2000;
const HANEMAN_BASE   = 3000;
const BAIMAN_BASE    = 4000;
const SANBAIMAN_BASE = 6000;
const YAKUMAN_BASE   = 8000;

// 老頭牌・字牌判定
function isTermOrHonor(id) {
    return id >= 27 || id % 9 === 0 || id % 9 === 8;
}

// 雀頭符: 役牌のみ2符（連風牌は4符）
function headFu(pairId, seatWind, roundWind) {
    if (pairId >= 31) return 2; // 三元牌
    const isSeatWind  = seatWind  && pairId === 26 + seatWind;
    const isRoundWind = roundWind && pairId === 26 + roundWind;
    if (isSeatWind && isRoundWind) return 4; // 連風牌
    if (isSeatWind || isRoundWind) return 2;
    return 0;
}

// 暗刻符
function closedTripletFu(id) { return isTermOrHonor(id) ? 8 : 4; }

// 明刻符（双碰ロン含む）
function openTripletFu(id)   { return isTermOrHonor(id) ? 4 : 2; }

// 副露（PON/MINKAN/KAKAN/ANKAN）の符
function meldFu(meld) {
    const id0      = meld.tiles[0].id;
    const terminal = isTermOrHonor(id0);
    switch (meld.type) {
        case MELD_TYPE.ANKAN:  return terminal ? 32 : 16;
        case MELD_TYPE.MINKAN: return terminal ? 16 : 8;
        case MELD_TYPE.KAKAN:  return terminal ? 16 : 8;
        case MELD_TYPE.PON:    return terminal ? 4  : 2;
        default:               return 0; // CHI
    }
}

// 待ち符: 単騎/嵌張/辺張=2、両面/双碰=0
function waitFu(d, winId) {
    if (d.pair === winId) return 2; // 単騎
    const winMentsu = d.mentsu.find(m => m.ids.includes(winId));
    if (!winMentsu) return 0;
    if (winMentsu.type === 'triplet') return 0; // 双碰
    const pos   = winMentsu.ids.indexOf(winId);
    const first = winMentsu.ids[0];
    if (pos === 1) return 2;                          // 嵌張
    if (pos === 0 && first % 9 >= 6) return 2;        // 辺張 (78→9待ち)
    if (pos === 2 && first % 9 === 0) return 2;       // 辺張 (12→3待ち)
    return 0; // 両面
}

/**
 * 符を計算する
 * @param {Hand}   hand    - 手牌（和了牌追加済み14枚相当）
 * @param {Tile}   winTile - 和了牌
 * @param {object} context - { isTsumo, seatWind?, roundWind?, isPinfu? }
 * @returns {number} 符（10の倍数 or 25固定）
 */
export function calculateFu(hand, winTile, context) {
    const { isTsumo, seatWind = 0, roundWind = 0, isPinfu = false } = context;
    const winId  = winTile.id;
    const isOpen = hand.melds.some(m => m.isOpen());

    // 七対子: 25符固定
    const cnt = new Array(34).fill(0);
    hand.tiles.forEach(t => cnt[t.id]++);
    if (hand.melds.length === 0 &&
        cnt.filter(c => c >= 2).length === 7 &&
        cnt.filter(c => c > 0).length === 7) {
        return 25;
    }

    // 平和特例（呼び出し側が evaluateYaku 結果を渡す）
    if (isPinfu) return isTsumo ? 20 : 30;

    const decomps = decomposeClosed(hand);
    let best = 0;

    for (const d of decomps) {
        if (d.type !== 'normal') continue;

        const hFu = headFu(d.pair, seatWind, roundWind);
        const wFu = waitFu(d, winId);
        let fu = 20 + hFu + wFu;

        // 閉手面子符（双碰ロンの場合、和了牌を含む刻子は明刻）
        for (const m of d.mentsu) {
            if (m.type === 'sequence') continue;
            if (!isTsumo && m.ids.includes(winId)) {
                fu += openTripletFu(m.ids[0]);  // 双碰ロン → 明刻
            } else {
                fu += closedTripletFu(m.ids[0]); // 暗刻
            }
        }

        // 副露符（PON/MINKAN/KAKAN/ANKAN）
        for (const meld of hand.melds) fu += meldFu(meld);

        // 和了方法符
        if (!isOpen && !isTsumo) {
            fu += 10; // 門前ロン
        } else if (isTsumo) {
            fu += 2;  // ツモ
        }

        best = Math.max(best, fu);
    }

    if (best === 0) return 30;
    return roundUp10(best);
}

/**
 * 点数を計算する
 * @param {number} han       - 翻数（役満=13、ダブル役満=26）
 * @param {number} fu        - 符
 * @param {boolean} isDealer - 和了者が親か
 * @param {boolean} isTsumo  - ツモ和了か
 * @param {number} honba     - 本場数
 * @param {number} kyotaku   - 供託リーチ棒（本数）
 * @returns {{ total: number, payments: number[] }}
 *   ron:           payments[0] = ロン放銃者の支払い
 *   dealer tsumo:  payments[0] = 各子の支払い（3人同額）
 *   non-dealer tsumo: payments[0] = 親の支払い, payments[1] = 各子の支払い
 */
export function calculateScore(han, fu, isDealer, isTsumo, honba = 0, kyotaku = 0) {
    const base = basicPoints(han, fu);
    let payments;

    if (isDealer) {
        payments = isTsumo
            ? [roundUp100(base * 2)]
            : [roundUp100(base * 6)];
    } else {
        payments = isTsumo
            ? [roundUp100(base * 2), roundUp100(base)]
            : [roundUp100(base * 4)];
    }

    // 本場ボーナス
    if (isTsumo) {
        payments = payments.map(p => p + 100 * honba);
    } else {
        payments[0] += 300 * honba;
    }

    // 合計（本場込み基本点 + 供託）
    let base_total;
    if (isDealer && isTsumo) {
        base_total = payments[0] * 3;
    } else if (!isDealer && isTsumo) {
        base_total = payments[0] + payments[1] * 2;
    } else {
        base_total = payments[0];
    }
    const total = base_total + kyotaku * 1000;

    return { total, payments };
}

// 基本点（役満はYAKUMAN_BASE=8000、ダブル役満=16000）
export function basicPoints(han, fu) {
    if (han >= 26) return YAKUMAN_BASE * 2;
    if (han >= 13) return YAKUMAN_BASE;
    if (han >= 11) return SANBAIMAN_BASE;
    if (han >= 8)  return BAIMAN_BASE;
    if (han >= 6)  return HANEMAN_BASE;
    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_BASE || han >= 5) return MANGAN_BASE;
    return base;
}

// 10の倍数に切り上げ（符用）
function roundUp10(n) { return Math.ceil(n / 10) * 10; }

// 100の倍数に切り上げ（点数用）
export function roundUp100(n) { return Math.ceil(n / 100) * 100; }

// 点数表示文字列
export function scoreLabel(han, fu) {
    if (han >= 13) return '役満';
    if (han >= 11) return '三倍満';
    if (han >= 8)  return '倍満';
    if (han >= 6)  return '跳満';
    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_BASE || han >= 5) return '満貫';
    return `${han}翻${fu}符`;
}
