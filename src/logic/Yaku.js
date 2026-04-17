import { SUIT, HONOR } from '../core/Tile.js';
import { MELD_TYPE } from '../core/Meld.js';

// 役のハン数定義
export const YAKU_HAN = Object.freeze({
    // 1翻
    RIICHI:         { name: 'リーチ',       closed: 1, open: -1 },
    IPPATSU:        { name: '一発',          closed: 1, open: -1 },
    TANYAO:         { name: 'タンヤオ',      closed: 1, open: 1  },
    PINFU:          { name: '平和',          closed: 1, open: -1 },
    IIPEIKO:        { name: '一盃口',        closed: 1, open: -1 },
    TSUMO:          { name: '門前清自摸和',  closed: 1, open: -1 },
    HAKU:           { name: '白',            closed: 1, open: 1  },
    HATSU:          { name: '發',            closed: 1, open: 1  },
    CHUN:           { name: '中',            closed: 1, open: 1  },
    SEAT_WIND:      { name: '自風',          closed: 1, open: 1  },
    ROUND_WIND:     { name: '場風',          closed: 1, open: 1  },
    HAITEI:         { name: 'ハイテイ',      closed: 1, open: 1  },
    HOUTEI:         { name: 'ホウテイ',      closed: 1, open: 1  },
    RINSHAN:        { name: '嶺上開花',      closed: 1, open: 1  },
    CHANKAN:        { name: '槍槓',          closed: 1, open: 1  },
    DOUBLE_RIICHI:  { name: 'ダブルリーチ',  closed: 2, open: -1 },

    // 2翻
    SANSHOKU_DOUJUN:{ name: '三色同順',      closed: 2, open: 1  },
    ITTSU:          { name: '一気通貫',      closed: 2, open: 1  },
    CHANTA:         { name: '混全帯么九',    closed: 2, open: 1  },
    TOITOI:         { name: '対々和',        closed: 2, open: 2  },
    SANANKOU:       { name: '三暗刻',        closed: 2, open: 2  },
    SANSHOKU_DOUKOU:{ name: '三色同刻',      closed: 2, open: 2  },
    SANKANTSU:      { name: '三槓子',        closed: 2, open: 2  },
    CHIITOI:        { name: '七対子',        closed: 2, open: -1 },
    HONROUTOU:      { name: '混老頭',        closed: 2, open: 2  },
    SHOUSANGEN:     { name: '小三元',        closed: 2, open: 2  },

    // 3翻
    HONITSU:        { name: '混一色',        closed: 3, open: 2  },
    JUNCHAN:        { name: '純全帯么九',    closed: 3, open: 2  },
    RYANPEIKO:      { name: '二盃口',        closed: 3, open: -1 },

    // 6翻
    CHINITSU:       { name: '清一色',        closed: 6, open: 5  },

    // 役満
    TSUUIISOU:      { name: '字一色',        yakuman: true },
    RYUUIISOU:      { name: '緑一色',        yakuman: true },
    KOKUSHI:        { name: '国士無双',      yakuman: true },
    SUUANKOU:       { name: '四暗刻',        yakuman: true },
    DAISANGEN:      { name: '大三元',        yakuman: true },
    SHOUSUUSHII:    { name: '小四喜',        yakuman: true },
    DAISUUSHII:     { name: '大四喜',        yakuman: true },
    TSUMO_SUUANKOU: { name: '四暗刻単騎',   yakuman: true, double: true },
    SUUKANTSU:      { name: '四槓子',        yakuman: true },
    CHUURENPOUTOU:  { name: '九連宝燈',      yakuman: true },
    TENHOU:         { name: '天和',          yakuman: true },
    CHIIHOU:        { name: '地和',          yakuman: true },
});

/**
 * 役判定メイン関数
 * @param {Hand}   hand        - 手牌
 * @param {Tile}   winTile     - 和了牌
 * @param {object} context     - { isTsumo, isRiichi, isDoubleRiichi, isIppatsu,
 *                                 seatWind, roundWind, isHaitei, isHoutei,
 *                                 isRinshan, isChankan, isTenhou, isChiihou }
 * @returns {{ yaku: string[], han: number, isMangan: boolean, isYakuman: boolean }}
 */
export function evaluateYaku(hand, winTile, context) {
    // TODO: 第4週で実装
    return { yaku: [], han: 0, isMangan: false, isYakuman: false };
}

// --- 個別役判定（第4週に実装） ---

export function checkRiichi(context)        { return context.isRiichi; }
export function checkIppatsu(context)       { return context.isIppatsu; }
export function checkTsumo(hand, context)   { return context.isTsumo && hand.melds.every(m => !m.isOpen()); }
export function checkTanyao(hand)           { /* TODO */ return false; }
export function checkPinfu(hand, winTile)   { /* TODO */ return false; }
export function checkIipeiko(hand)          { /* TODO */ return false; }
export function checkToitoi(hand)           { /* TODO */ return false; }
export function checkSanankou(hand, context){ /* TODO */ return false; }
export function checkChiitoitsu(hand)       { /* TODO */ return false; }
export function checkSanshokuDoujun(hand)   { /* TODO */ return false; }
export function checkIttsu(hand)            { /* TODO */ return false; }
export function checkChanta(hand)           { /* TODO */ return false; }
export function checkJunchan(hand)          { /* TODO */ return false; }
export function checkHonitsu(hand)          { /* TODO */ return false; }
export function checkChinitsu(hand)         { /* TODO */ return false; }
export function checkKokushi(hand, winTile) { /* TODO */ return false; }
export function checkSuuankou(hand, context){ /* TODO */ return false; }
export function checkDaisangen(hand)        { /* TODO */ return false; }
export function checkDaisuushii(hand)       { /* TODO */ return false; }
export function checkShousuushii(hand)      { /* TODO */ return false; }
export function checkTsuuiisou(hand)        { /* TODO */ return false; }
export function checkRyuuiisou(hand)        { /* TODO */ return false; }
export function checkChuurenpoutou(hand)    { /* TODO */ return false; }
export function checkSuukantsu(hand)        { /* TODO */ return false; }
