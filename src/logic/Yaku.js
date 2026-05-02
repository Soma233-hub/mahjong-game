import { SUIT, HONOR } from '../core/Tile.js';
import { MELD_TYPE } from '../core/Meld.js';

// 役のハン数定義
export const YAKU_HAN = Object.freeze({
    // 1翻
    RIICHI:          { name: 'リーチ',         closed: 1, open: -1 },
    IPPATSU:         { name: '一発',            closed: 1, open: -1 },
    TANYAO:          { name: 'タンヤオ',        closed: 1, open: 1  },
    PINFU:           { name: '平和',            closed: 1, open: -1 },
    IIPEIKO:         { name: '一盃口',          closed: 1, open: -1 },
    TSUMO:           { name: '門前清自摸和',    closed: 1, open: -1 },
    HAKU:            { name: '白',              closed: 1, open: 1  },
    HATSU:           { name: '發',              closed: 1, open: 1  },
    CHUN:            { name: '中',              closed: 1, open: 1  },
    SEAT_WIND:       { name: '自風',            closed: 1, open: 1  },
    ROUND_WIND:      { name: '場風',            closed: 1, open: 1  },
    HAITEI:          { name: 'ハイテイ',        closed: 1, open: 1  },
    HOUTEI:          { name: 'ホウテイ',        closed: 1, open: 1  },
    RINSHAN:         { name: '嶺上開花',        closed: 1, open: 1  },
    CHANKAN:         { name: '槍槓',            closed: 1, open: 1  },
    DOUBLE_RIICHI:   { name: 'ダブルリーチ',    closed: 2, open: -1 },

    // 2翻
    SANSHOKU_DOUJUN: { name: '三色同順',        closed: 2, open: 1  },
    ITTSU:           { name: '一気通貫',        closed: 2, open: 1  },
    CHANTA:          { name: '混全帯么九',      closed: 2, open: 1  },
    TOITOI:          { name: '対々和',          closed: 2, open: 2  },
    SANANKOU:        { name: '三暗刻',          closed: 2, open: 2  },
    SANSHOKU_DOUKOU: { name: '三色同刻',        closed: 2, open: 2  },
    SANKANTSU:       { name: '三槓子',          closed: 2, open: 2  },
    CHIITOI:         { name: '七対子',          closed: 2, open: -1 },
    HONROUTOU:       { name: '混老頭',          closed: 2, open: 2  },
    SHOUSANGEN:      { name: '小三元',          closed: 2, open: 2  },

    // 3翻
    HONITSU:         { name: '混一色',          closed: 3, open: 2  },
    JUNCHAN:         { name: '純全帯么九',      closed: 3, open: 2  },
    RYANPEIKO:       { name: '二盃口',          closed: 3, open: -1 },

    // 6翻
    CHINITSU:        { name: '清一色',          closed: 6, open: 5  },

    // 役満
    TSUUIISOU:       { name: '字一色',          yakuman: true },
    RYUUIISOU:       { name: '緑一色',          yakuman: true },
    KOKUSHI:         { name: '国士無双',        yakuman: true },
    SUUANKOU:        { name: '四暗刻',          yakuman: true },
    TSUMO_SUUANKOU:  { name: '四暗刻単騎',      yakuman: true, double: true },
    DAISANGEN:       { name: '大三元',          yakuman: true },
    SHOUSUUSHII:     { name: '小四喜',          yakuman: true },
    DAISUUSHII:      { name: '大四喜',          yakuman: true, double: true },
    CHUURENPOUTOU:   { name: '九連宝燈',        yakuman: true },
    SUUKANTSU:       { name: '四槓子',          yakuman: true },
    TENHOU:          { name: '天和',            yakuman: true },
    CHIIHOU:         { name: '地和',            yakuman: true },
});

// ============================================================
// 内部ヘルパー
// ============================================================

// 手牌+副露の全牌IDリストを返す
function allTileIds(hand) {
    const ids = hand.tiles.map(t => t.id);
    for (const m of hand.melds) m.tiles.forEach(t => ids.push(t.id));
    return ids;
}

// 閉手牌の全分解パターンを返す
// 戻り値: Array<DecompNormal | DecompChiitoi | DecompKokushi>
// DecompNormal  = { type:'normal',   pair: id, mentsu: [{type:'triplet'|'sequence', ids:[...]}] }
// DecompChiitoi = { type:'chiitoi',  pairs: [id...] }
// DecompKokushi = { type:'kokushi' }
function decomposeClosed(hand) {
    const results = [];
    const baseCounts = new Array(34).fill(0);
    hand.tiles.forEach(t => baseCounts[t.id]++);
    const needed = 4 - hand.melds.length;

    // 七対子（副露なし）
    if (hand.melds.length === 0) {
        const pairs = [];
        for (let i = 0; i < 34; i++) if (baseCounts[i] >= 2) pairs.push(i);
        const kinds = baseCounts.filter(c => c > 0).length;
        if (pairs.length === 7 && kinds === 7) {
            results.push({ type: 'chiitoi', pairs });
        }
    }

    // 国士無双（副露なし）
    if (hand.melds.length === 0) {
        const KS = [0,8,9,17,18,26,27,28,29,30,31,32,33];
        if (KS.every(id => baseCounts[id] > 0) && KS.some(id => baseCounts[id] >= 2)) {
            results.push({ type: 'kokushi' });
        }
    }

    // 通常形 DFS（最小idの牌を順に確定させる）
    const findMentsu = (cnt, mentsuList, pairId) => {
        if (mentsuList.length === needed) {
            if (cnt.every(c => c === 0)) {
                results.push({ type: 'normal', pair: pairId, mentsu: mentsuList });
            }
            return;
        }
        const id = cnt.findIndex(c => c > 0);
        if (id === -1) return;

        // 刻子
        if (cnt[id] >= 3) {
            const next = [...cnt]; next[id] -= 3;
            findMentsu(next, [...mentsuList, { type: 'triplet', ids: [id, id, id] }], pairId);
        }
        // 順子（数牌のみ、7以下から開始）
        const suit = Math.floor(id / 9);
        if (suit < 3 && id % 9 <= 6 && cnt[id+1] > 0 && cnt[id+2] > 0) {
            const next = [...cnt]; next[id]--; next[id+1]--; next[id+2]--;
            findMentsu(next, [...mentsuList, { type: 'sequence', ids: [id, id+1, id+2] }], pairId);
        }
    };

    for (let pairId = 0; pairId < 34; pairId++) {
        if (baseCounts[pairId] >= 2) {
            const cnt = [...baseCounts]; cnt[pairId] -= 2;
            findMentsu(cnt, [], pairId);
        }
    }

    return results;
}

// 副露チーの最小牌IDを返す（三色同順・一気通貫用）
function chiStartId(meld) {
    return meld.tiles.map(t => t.id).sort((a, b) => a - b)[0];
}

// ============================================================
// 個別役判定
// ============================================================

// タンヤオ: 全牌が 2〜8 の数牌
export function checkTanyao(hand) {
    return allTileIds(hand).every(id => {
        const rank = id % 9; // 0=1, 8=9
        return id < 27 && rank > 0 && rank < 8;
    });
}

// ピンフ: 門前・全順子・非役牌雀頭・両面待ち
export function checkPinfu(hand, winTile, context) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const decomps = decomposeClosed(hand);
    const winId = winTile.id;

    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        if (d.mentsu.some(m => m.type !== 'sequence')) continue;

        // 雀頭が役牌でない
        const pairId = d.pair;
        if (pairId >= 31) continue; // 白発中
        if (context.seatWind  && pairId === 26 + context.seatWind)  continue;
        if (context.roundWind && pairId === 26 + context.roundWind) continue;

        // 和了牌を含む面子を特定
        const winMentsu = d.mentsu.find(m => m.ids.includes(winId));
        if (!winMentsu) continue;
        const pos = winMentsu.ids.indexOf(winId);
        if (pos === 1) continue; // 嵌張
        const a = winMentsu.ids[0];
        if (pos === 0 && a % 9 >= 6) continue; // 辺張(89待ち)
        if (pos === 2 && a % 9 === 0) continue; // 辺張(12待ち)

        return true;
    }
    return false;
}

// 一盃口: 門前・同一順子2組
export function checkIipeiko(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const decomps = decomposeClosed(hand);
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const seqs = d.mentsu.filter(m => m.type === 'sequence').map(m => m.ids.join(','));
        const counts = {};
        seqs.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        if (Object.values(counts).some(c => c >= 2)) return true;
    }
    return false;
}

// 二盃口: 門前・同一順子2組×2
export function checkRyanpeiko(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const decomps = decomposeClosed(hand);
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const seqs = d.mentsu.filter(m => m.type === 'sequence').map(m => m.ids.join(','));
        if (seqs.length < 4) continue;
        const counts = {};
        seqs.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        if (Object.values(counts).filter(c => c >= 2).length >= 2) return true;
    }
    return false;
}

// 対々和: 全面子が刻子/槓
export function checkToitoi(hand) {
    if (hand.melds.some(m => m.type === MELD_TYPE.CHI)) return false;
    const decomps = decomposeClosed(hand);
    return decomps.some(d => d.type === 'normal' && d.mentsu.every(m => m.type === 'triplet'));
}

// 三暗刻: 暗刻（暗槓含む）が3つ以上
export function checkSanankou(hand) {
    const decomps = decomposeClosed(hand);
    const ankanCount = hand.melds.filter(m => m.type === MELD_TYPE.ANKAN).length;
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const closedTriplets = d.mentsu.filter(m => m.type === 'triplet').length;
        if (closedTriplets + ankanCount >= 3) return true;
    }
    return false;
}

// 七対子: 7対子（副露なし・7種7対）
export function checkChiitoi(hand) {
    if (hand.melds.length > 0) return false;
    const counts = new Array(34).fill(0);
    hand.tiles.forEach(t => counts[t.id]++);
    const pairs = counts.filter(c => c >= 2).length;
    const kinds = counts.filter(c => c > 0).length;
    return pairs === 7 && kinds === 7;
}

// 混老頭: 全牌が老頭牌（1,9,字牌）
export function checkHonroutou(hand) {
    return allTileIds(hand).every(id => {
        const rank = id % 9;
        return id >= 27 || rank === 0 || rank === 8;
    });
}

// 小三元: 三元牌が2刻子+1雀頭
export function checkShousangen(hand) {
    const DRAGONS = [31, 32, 33];
    const decomps = decomposeClosed(hand);
    const meldDragonCount = hand.melds.filter(m =>
        (m.type === MELD_TYPE.PON || m.isKan()) && DRAGONS.includes(m.tiles[0].id)
    ).length;

    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const closedDragonTriplets = d.mentsu.filter(m =>
            m.type === 'triplet' && DRAGONS.includes(m.ids[0])
        ).length;
        const totalDragonTriplets = meldDragonCount + closedDragonTriplets;
        if (totalDragonTriplets === 2 && DRAGONS.includes(d.pair)) return true;
    }
    return false;
}

// 三槓子: 槓子が3つ以上
export function checkSankantsu(hand) {
    return hand.melds.filter(m => m.isKan()).length >= 3;
}

// 三色同刻: 同数刻子がマン・ピン・ソウにある
export function checkSanshokuDoukou(hand) {
    const decomps = decomposeClosed(hand);
    const meldTripletIds = hand.melds
        .filter(m => m.type === MELD_TYPE.PON || m.isKan())
        .map(m => m.tiles[0].id);

    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const allTripletIds = [
            ...d.mentsu.filter(m => m.type === 'triplet').map(m => m.ids[0]),
            ...meldTripletIds,
        ];
        for (let rank = 0; rank < 9; rank++) {
            if ([0, 1, 2].every(s => allTripletIds.includes(s * 9 + rank))) return true;
        }
    }
    return false;
}

// 三色同順: 同数順子がマン・ピン・ソウにある
export function checkSanshokuDoujun(hand) {
    const decomps = decomposeClosed(hand);
    const meldChiStarts = hand.melds
        .filter(m => m.type === MELD_TYPE.CHI)
        .map(chiStartId);

    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const allSeqStarts = [
            ...d.mentsu.filter(m => m.type === 'sequence').map(m => m.ids[0]),
            ...meldChiStarts,
        ];
        for (let rank = 0; rank < 7; rank++) {
            if ([0, 1, 2].every(s => allSeqStarts.includes(s * 9 + rank))) return true;
        }
    }
    return false;
}

// 一気通貫: 同一色で123・456・789
export function checkIttsu(hand) {
    const decomps = decomposeClosed(hand);
    const meldChiStarts = hand.melds
        .filter(m => m.type === MELD_TYPE.CHI)
        .map(chiStartId);

    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        const allSeqStarts = [
            ...d.mentsu.filter(m => m.type === 'sequence').map(m => m.ids[0]),
            ...meldChiStarts,
        ];
        for (let s = 0; s < 3; s++) {
            const base = s * 9;
            if ([0, 3, 6].every(r => allSeqStarts.includes(base + r))) return true;
        }
    }
    return false;
}

// 面子・雀頭が老頭牌を含むか（チャンタ・純チャン用）
function blockHasTerminalOrHonor(type, ids) {
    if (type === 'triplet') {
        const id = ids[0];
        return id >= 27 || id % 9 === 0 || id % 9 === 8;
    }
    // sequence: first or last is terminal (no honor in sequence)
    return ids[0] % 9 === 0 || ids[2] % 9 === 8;
}

// 混全帯么九（チャンタ）: 全面子と雀頭に老頭牌・字牌含む＋順子あり＋字牌あり
export function checkChanta(hand) {
    const ids = allTileIds(hand);
    if (!ids.some(id => id >= 27)) return false; // 字牌なしは純チャン

    const meldOk = hand.melds.every(m => {
        if (m.type === MELD_TYPE.CHI) {
            const sorted = m.tiles.map(t => t.id).sort((a, b) => a - b);
            return sorted[0] % 9 === 0 || sorted[2] % 9 === 8;
        }
        const id0 = m.tiles[0].id;
        return id0 >= 27 || id0 % 9 === 0 || id0 % 9 === 8;
    });
    if (!meldOk) return false;

    const decomps = decomposeClosed(hand);
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        if (!blockHasTerminalOrHonor('triplet', [d.pair, d.pair, d.pair])) continue;
        if (!d.mentsu.every(m => blockHasTerminalOrHonor(m.type, m.ids))) continue;
        const hasSeq = d.mentsu.some(m => m.type === 'sequence') ||
                       hand.melds.some(m => m.type === MELD_TYPE.CHI);
        if (!hasSeq) continue;
        return true;
    }
    return false;
}

// 純全帯么九（純チャン）: 全面子と雀頭に 1,9 含む＋順子あり＋字牌なし
export function checkJunchan(hand) {
    const ids = allTileIds(hand);
    if (ids.some(id => id >= 27)) return false; // 字牌なし

    const meldOk = hand.melds.every(m => {
        if (m.type === MELD_TYPE.CHI) {
            const sorted = m.tiles.map(t => t.id).sort((a, b) => a - b);
            return sorted[0] % 9 === 0 || sorted[2] % 9 === 8;
        }
        const id0 = m.tiles[0].id;
        return id0 % 9 === 0 || id0 % 9 === 8;
    });
    if (!meldOk) return false;

    const decomps = decomposeClosed(hand);
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        if (d.pair % 9 !== 0 && d.pair % 9 !== 8) continue;
        if (!d.mentsu.every(m => blockHasTerminalOrHonor(m.type, m.ids))) continue;
        const hasSeq = d.mentsu.some(m => m.type === 'sequence') ||
                       hand.melds.some(m => m.type === MELD_TYPE.CHI);
        if (!hasSeq) continue;
        return true;
    }
    return false;
}

// 混一色: 1色の数牌＋字牌
export function checkHonitsu(hand) {
    const ids = allTileIds(hand);
    const suits = new Set(ids.filter(id => id < 27).map(id => Math.floor(id / 9)));
    return suits.size === 1;
}

// 清一色: 1色の数牌のみ
export function checkChinitsu(hand) {
    const ids = allTileIds(hand);
    if (ids.some(id => id >= 27)) return false;
    return new Set(ids.map(id => Math.floor(id / 9))).size === 1;
}

// 役牌（指定IDの刻子/槓があるか）
function hasYakuhaiTriplet(decomps, hand, tileId) {
    if (hand.melds.some(m => (m.type === MELD_TYPE.PON || m.isKan()) && m.tiles[0].id === tileId)) return true;
    return decomps.some(d => d.type === 'normal' && d.mentsu.some(m => m.type === 'triplet' && m.ids[0] === tileId));
}

export function checkHaku(hand)  { return hasYakuhaiTriplet(decomposeClosed(hand), hand, 31); }
export function checkHatsu(hand) { return hasYakuhaiTriplet(decomposeClosed(hand), hand, 32); }
export function checkChun(hand)  { return hasYakuhaiTriplet(decomposeClosed(hand), hand, 33); }

// 大三元: 白発中すべて刻子
export function checkDaisangen(hand) {
    const decomps = decomposeClosed(hand);
    return [31, 32, 33].every(id => hasYakuhaiTriplet(decomps, hand, id));
}

// 大四喜: 東南西北すべて刻子
export function checkDaisuushii(hand) {
    const decomps = decomposeClosed(hand);
    return [27, 28, 29, 30].every(id => hasYakuhaiTriplet(decomps, hand, id));
}

// 小四喜: 3風刻子＋1風雀頭
export function checkShousuushii(hand) {
    if (checkDaisuushii(hand)) return false;
    const WINDS = [27, 28, 29, 30];
    const decomps = decomposeClosed(hand);
    for (const d of decomps) {
        if (d.type !== 'normal') continue;
        if (!WINDS.includes(d.pair)) continue;
        const otherWinds = WINDS.filter(id => id !== d.pair);
        if (otherWinds.every(id => hasYakuhaiTriplet(decomps, hand, id))) return true;
    }
    return false;
}

// 四暗刻: 4閉刻子（副露なし）
export function checkSuuankou(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const ankanCount = hand.melds.filter(m => m.type === MELD_TYPE.ANKAN).length;
    const decomps = decomposeClosed(hand);
    return decomps.some(d => {
        if (d.type !== 'normal') return false;
        return d.mentsu.filter(m => m.type === 'triplet').length + ankanCount === 4;
    });
}

// 国士無双: 1m9m1p9p1s9s+7字 各1枚以上＋1種対子
export function checkKokushi(hand) {
    return decomposeClosed(hand).some(d => d.type === 'kokushi');
}

// 字一色: 全牌が字牌
export function checkTsuuiisou(hand) {
    return allTileIds(hand).every(id => id >= 27);
}

// 緑一色: 全牌が 2s,3s,4s,6s,8s,発
export function checkRyuuiisou(hand) {
    const GREEN = new Set([19, 20, 21, 23, 25, 32]); // 2s,3s,4s,6s,8s,發
    return allTileIds(hand).every(id => GREEN.has(id));
}

// 九連宝燈: 門前清一色 1112345678999 + 任意1枚
export function checkChuurenpoutou(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const tiles = hand.tiles;
    if (tiles.length !== 14) return false;
    const suit = Math.floor(tiles[0].id / 9);
    if (suit >= 3) return false;
    if (!tiles.every(t => Math.floor(t.id / 9) === suit)) return false;

    const counts = new Array(9).fill(0);
    tiles.forEach(t => counts[t.id - suit * 9]++);
    const BASE = [3, 1, 1, 1, 1, 1, 1, 1, 3];
    let extras = 0;
    for (let i = 0; i < 9; i++) {
        if (counts[i] < BASE[i]) return false;
        extras += counts[i] - BASE[i];
    }
    return extras === 1;
}

// 四槓子: 槓子が4つ
export function checkSuukantsu(hand) {
    return hand.melds.filter(m => m.isKan()).length === 4;
}

// ============================================================
// 役判定メイン関数
// ============================================================

/**
 * @param {Hand}   hand    - 手牌（和了牌追加済み14枚相当）
 * @param {Tile}   winTile - 和了牌
 * @param {object} context - { isTsumo, isRiichi, isDoubleRiichi, isIppatsu,
 *                             seatWind, roundWind,
 *                             isHaitei, isHoutei, isRinshan, isChankan,
 *                             isTenhou, isChiihou }
 * @returns {{ yaku: [{key,name,han}], han: number, isMangan: boolean, isYakuman: boolean }}
 */
export function evaluateYaku(hand, winTile, context) {
    const isOpen = hand.melds.some(m => m.isOpen());
    const yakuList = [];

    const addYaku = (key, def) => {
        const han = isOpen ? def.open : def.closed;
        if (han === -1 || han === undefined) return; // 門前専用・副露時無効
        yakuList.push({ key, name: def.name, han });
    };

    const addYakuman = (key, def) => {
        yakuList.push({ key, name: def.name, han: 0, yakuman: true, double: def.double || false });
    };

    // 役満チェック（通常役より優先）
    if (context.isTenhou)  addYakuman('TENHOU',  YAKU_HAN.TENHOU);
    if (context.isChiihou) addYakuman('CHIIHOU', YAKU_HAN.CHIIHOU);

    if (checkKokushi(hand))                  addYakuman('KOKUSHI',        YAKU_HAN.KOKUSHI);
    if (checkSuuankou(hand)) {
        // 単騎待ちかどうか: winTileが雀頭になっている分解があるか
        const decomps = decomposeClosed(hand);
        const isTanki = !context.isTsumo && decomps.some(d =>
            d.type === 'normal' && d.pair === winTile.id &&
            d.mentsu.every(m => m.type === 'triplet')
        );
        if (isTanki) addYakuman('TSUMO_SUUANKOU', YAKU_HAN.TSUMO_SUUANKOU);
        else         addYakuman('SUUANKOU',        YAKU_HAN.SUUANKOU);
    }
    if (checkDaisangen(hand))                addYakuman('DAISANGEN',   YAKU_HAN.DAISANGEN);
    if (checkDaisuushii(hand))               addYakuman('DAISUUSHII',  YAKU_HAN.DAISUUSHII);
    else if (checkShousuushii(hand))         addYakuman('SHOUSUUSHII', YAKU_HAN.SHOUSUUSHII);
    if (checkTsuuiisou(hand))                addYakuman('TSUUIISOU',   YAKU_HAN.TSUUIISOU);
    if (checkRyuuiisou(hand))                addYakuman('RYUUIISOU',   YAKU_HAN.RYUUIISOU);
    if (checkChuurenpoutou(hand))            addYakuman('CHUURENPOUTOU', YAKU_HAN.CHUURENPOUTOU);
    if (checkSuukantsu(hand))                addYakuman('SUUKANTSU',   YAKU_HAN.SUUKANTSU);

    if (yakuList.some(y => y.yakuman)) {
        return { yaku: yakuList, han: 0, isMangan: false, isYakuman: true };
    }

    // 通常役チェック
    if (context.isDoubleRiichi) addYaku('DOUBLE_RIICHI', YAKU_HAN.DOUBLE_RIICHI);
    else if (context.isRiichi)  addYaku('RIICHI',        YAKU_HAN.RIICHI);
    if (context.isIppatsu)      addYaku('IPPATSU',       YAKU_HAN.IPPATSU);
    if (context.isTsumo && !isOpen) addYaku('TSUMO',     YAKU_HAN.TSUMO);
    if (context.isHaitei)       addYaku('HAITEI',        YAKU_HAN.HAITEI);
    if (context.isHoutei)       addYaku('HOUTEI',        YAKU_HAN.HOUTEI);
    if (context.isRinshan)      addYaku('RINSHAN',       YAKU_HAN.RINSHAN);
    if (context.isChankan)      addYaku('CHANKAN',       YAKU_HAN.CHANKAN);

    if (checkTanyao(hand))      addYaku('TANYAO',        YAKU_HAN.TANYAO);

    const hasChinitsu = checkChinitsu(hand);
    const hasHonitsu  = !hasChinitsu && checkHonitsu(hand);
    if (hasChinitsu)            addYaku('CHINITSU',      YAKU_HAN.CHINITSU);
    else if (hasHonitsu)        addYaku('HONITSU',       YAKU_HAN.HONITSU);

    // 役牌
    if (checkHaku(hand))        addYaku('HAKU',          YAKU_HAN.HAKU);
    if (checkHatsu(hand))       addYaku('HATSU',         YAKU_HAN.HATSU);
    if (checkChun(hand))        addYaku('CHUN',          YAKU_HAN.CHUN);

    if (context.seatWind) {
        const swId = 26 + context.seatWind;
        if (hasYakuhaiTriplet(decomposeClosed(hand), hand, swId)) addYaku('SEAT_WIND', YAKU_HAN.SEAT_WIND);
    }
    if (context.roundWind) {
        const rwId = 26 + context.roundWind;
        if (hasYakuhaiTriplet(decomposeClosed(hand), hand, rwId)) addYaku('ROUND_WIND', YAKU_HAN.ROUND_WIND);
    }

    // 複合役（分解依存）
    const hasRyanpeiko = !isOpen && checkRyanpeiko(hand);
    if (hasRyanpeiko) addYaku('RYANPEIKO', YAKU_HAN.RYANPEIKO);
    else if (!isOpen && checkIipeiko(hand)) addYaku('IIPEIKO', YAKU_HAN.IIPEIKO);

    if (checkPinfu(hand, winTile, context)) addYaku('PINFU', YAKU_HAN.PINFU);

    if (checkChiitoi(hand))     addYaku('CHIITOI',       YAKU_HAN.CHIITOI);

    const hasToitoi = checkToitoi(hand);
    if (hasToitoi)              addYaku('TOITOI',        YAKU_HAN.TOITOI);
    if (checkSanankou(hand))    addYaku('SANANKOU',      YAKU_HAN.SANANKOU);
    if (checkHonroutou(hand))   addYaku('HONROUTOU',     YAKU_HAN.HONROUTOU);
    if (checkShousangen(hand))  addYaku('SHOUSANGEN',    YAKU_HAN.SHOUSANGEN);
    if (checkSankantsu(hand))   addYaku('SANKANTSU',     YAKU_HAN.SANKANTSU);
    if (checkSanshokuDoukou(hand)) addYaku('SANSHOKU_DOUKOU', YAKU_HAN.SANSHOKU_DOUKOU);

    const hasJunchan = checkJunchan(hand);
    const hasChanta  = !hasJunchan && checkChanta(hand);
    if (hasJunchan)             addYaku('JUNCHAN',       YAKU_HAN.JUNCHAN);
    else if (hasChanta)         addYaku('CHANTA',        YAKU_HAN.CHANTA);

    if (checkSanshokuDoujun(hand)) addYaku('SANSHOKU_DOUJUN', YAKU_HAN.SANSHOKU_DOUJUN);
    if (checkIttsu(hand))          addYaku('ITTSU',           YAKU_HAN.ITTSU);

    const totalHan = yakuList.reduce((s, y) => s + (y.han || 0), 0);
    return {
        yaku: yakuList,
        han: totalHan,
        isMangan: totalHan >= 5,
        isYakuman: false,
    };
}

// 後方互換用スタブ（第3週以前のコードが参照する場合のため残置）
export function checkRiichi(context)        { return context.isRiichi; }
export function checkIppatsu(context)       { return context.isIppatsu; }
export function checkTsumo(hand, context)   { return context.isTsumo && !hand.melds.some(m => m.isOpen()); }
