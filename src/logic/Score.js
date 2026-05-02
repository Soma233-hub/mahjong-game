// 点数計算
// 基本点 = fu × 2^(han+2)  ← kihouten（切り上げ満貫含む上限あり）
// 非ディーラーロン = kihouten × 4, ディーラーロン = × 6
// ディーラーツモ各 = × 2, 非ディーラーツモ(親) = × 2, (子) = × 1

import { MELD_TYPE } from '../core/Meld.js';
import { decomposeClosed } from './Yaku.js';

// 基本点の上限（真のkihouten値）
const MANGAN_BASE    = 2000;
const HANEMAN_BASE   = 3000;
const BAIMAN_BASE    = 4000;
const SANBAIMAN_BASE = 6000;
const YAKUMAN_BASE   = 8000;

// ---- 内部ヘルパー ----

function isTerminalOrHonor(id) {
    return id >= 27 || id % 9 === 0 || id % 9 === 8;
}

// 副露1つの符
function meldFu(meld) {
    if (meld.type === MELD_TYPE.CHI) return 0;
    const id = meld.tiles[0].id;
    const th = isTerminalOrHonor(id);
    if (meld.type === MELD_TYPE.ANKAN)  return th ? 32 : 16;
    if (meld.type === MELD_TYPE.MINKAN ||
        meld.type === MELD_TYPE.KAKAN)  return th ? 16 : 8;
    // PON (open triplet)
    return th ? 4 : 2;
}

// 一分解における閉刻符・雀頭符・待ち符を返す
// 和了牌を含まない分解は null を返す
function decompFu(d, winId, seatWind, roundWind) {
    if (d.type !== 'normal') return null;

    const inPair   = d.pair === winId;
    const inMentsu = d.mentsu.some(m => m.ids.includes(winId));
    if (!inPair && !inMentsu) return null;

    // 閉刻符（decompose内の刻子は全て閉刻）
    let tripletFu = 0;
    for (const m of d.mentsu) {
        if (m.type === 'triplet') {
            tripletFu += isTerminalOrHonor(m.ids[0]) ? 8 : 4;
        }
    }

    // 雀頭符
    let pairFu = 0;
    const DRAGONS = [31, 32, 33]; // 白=31, 發=32, 中=33
    if (DRAGONS.includes(d.pair)) {
        pairFu = 2;
    } else {
        const sw = seatWind  ? 26 + seatWind  : -1;
        const rw = roundWind ? 26 + roundWind : -1;
        if (d.pair === sw && d.pair === rw) pairFu = 4; // ダブル風雀頭
        else if (d.pair === sw || d.pair === rw) pairFu = 2;
    }

    // 待ち符
    let waitFu = 0;
    if (inPair) {
        waitFu = 2; // 単騎
    } else {
        const wm = d.mentsu.find(m => m.ids.includes(winId));
        if (wm.type === 'triplet') {
            waitFu = 0; // 双碰
        } else {
            const ids = wm.ids; // ソート済みの3枚ID
            const pos = ids.indexOf(winId);
            if (pos === 1) {
                waitFu = 2; // 嵌張
            } else if (pos === 0 && ids[2] % 9 === 8) {
                waitFu = 2; // 辺張（789の7待ち）
            } else if (pos === 2 && ids[0] % 9 === 0) {
                waitFu = 2; // 辺張（123の3待ち）
            }
            // 両面 → 0
        }
    }

    return { tripletFu, pairFu, waitFu };
}

// ---- 公開 API ----

/**
 * 符を計算する
 * @param {Hand}   hand     - 和了牌追加済みの手牌
 * @param {Tile}   winTile  - 和了牌
 * @param {object} context  - { isTsumo, isPinfu, seatWind, roundWind }
 * @returns {number} 符（10の倍数）
 */
export function calculateFu(hand, winTile, context) {
    const { isTsumo, seatWind, roundWind } = context;
    const isOpen = hand.melds.some(m => m.isOpen());
    const winId  = winTile.id;

    // 七対子: 固定25符
    if (hand.melds.length === 0) {
        const counts = new Array(34).fill(0);
        hand.tiles.forEach(t => counts[t.id]++);
        if (counts.filter(c => c >= 2).length === 7 &&
            counts.filter(c => c > 0).length  === 7) return 25;
    }

    // 平和: 門前ツモ=20符、門前ロン=30符
    if (context.isPinfu) return isTsumo ? 20 : 30;

    // 共通加算
    const menzenBonus = (!isTsumo && !isOpen) ? 10 : 0; // 門前ロン
    const tsumoFu     = isTsumo ? 2 : 0;
    const openMeldFu  = hand.melds.reduce((s, m) => s + meldFu(m), 0);

    // 分解ごとに符を計算し最大を選択
    const decomps = decomposeClosed(hand);
    let maxFu = 0;

    for (const d of decomps) {
        const extra = decompFu(d, winId, seatWind, roundWind);
        if (!extra) continue;

        const raw = 20 + menzenBonus + tsumoFu + openMeldFu
                    + extra.tripletFu + extra.pairFu + extra.waitFu;
        const fu = Math.ceil(raw / 10) * 10;
        if (fu > maxFu) maxFu = fu;
    }

    // フォールバック（分解が見つからない場合）
    if (maxFu === 0) {
        maxFu = Math.ceil((20 + menzenBonus + tsumoFu + openMeldFu) / 10) * 10;
    }

    return maxFu;
}

/**
 * 基本点を計算する（kihouten: fu × 2^(han+2)、上限キャップ含む）
 * @param {number} han
 * @param {number} fu
 * @returns {number} 基本点
 */
export function basicPoints(han, fu) {
    if (han >= 26) return YAKUMAN_BASE * 2;  // ダブル役満
    if (han >= 13) return YAKUMAN_BASE;
    if (han >= 11) return SANBAIMAN_BASE;
    if (han >= 8)  return BAIMAN_BASE;
    if (han >= 6)  return HANEMAN_BASE;

    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_BASE || han >= 5) return MANGAN_BASE; // 切り上げ満貫含む
    return base;
}

/**
 * 点数を計算する
 * @param {number}  han       - 翻数（役満=13, ダブル役満=26）
 * @param {number}  fu        - 符
 * @param {boolean} isDealer  - 和了者が親か
 * @param {boolean} isTsumo   - ツモ和了か
 * @param {number}  honba     - 本場数
 * @param {number}  kyotaku   - 供託リーチ棒（本数）
 * @returns {{ total: number, payments: number[] }}
 *   payments（tsumo親）: [各子の支払い]
 *   payments（tsumo子）: [親の支払い, 各子の支払い]
 *   payments（ron）:     [放銃者の支払い]
 */
export function calculateScore(han, fu, isDealer, isTsumo, honba = 0, kyotaku = 0) {
    const base       = basicPoints(han, fu);
    const kyotakuPts = kyotaku * 1000;

    let total, payments;

    if (isTsumo) {
        if (isDealer) {
            // 親ツモ: 子3人が各 base×2 支払い
            const each = roundUp100(base * 2) + honba * 100;
            total    = each * 3 + kyotakuPts;
            payments = [each]; // 子1人あたりの支払い
        } else {
            // 子ツモ: 親=base×2, 子=base×1
            const dealerPay    = roundUp100(base * 2) + honba * 100;
            const nonDealerPay = roundUp100(base * 1) + honba * 100;
            total    = dealerPay + nonDealerPay * 2 + kyotakuPts;
            payments = [dealerPay, nonDealerPay]; // [親支払い, 子1人あたり支払い]
        }
    } else {
        // ロン
        if (isDealer) {
            const pay = roundUp100(base * 6) + honba * 300;
            total    = pay + kyotakuPts;
            payments = [pay];
        } else {
            const pay = roundUp100(base * 4) + honba * 300;
            total    = pay + kyotakuPts;
            payments = [pay];
        }
    }

    return { total, payments };
}

// 100の倍数に切り上げ
export function roundUp100(n) { return Math.ceil(n / 100) * 100; }

// 点数ラベル（翻符表示用）
export function scoreLabel(han, fu) {
    if (han >= 26) return '役満×2';
    if (han >= 13) return '役満';
    if (han >= 11) return '三倍満';
    if (han >= 8)  return '倍満';
    if (han >= 6)  return '跳満';
    const base = fu * Math.pow(2, han + 2);
    if (base >= MANGAN_BASE || han >= 5) return '満貫';
    return `${han}翻${fu}符`;
}
