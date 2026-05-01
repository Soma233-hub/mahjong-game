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

// ===========================================================================
// 内部ユーティリティ
// ===========================================================================

// 牌ID → suit('man'|'pin'|'sou'|'honor')
function suitOf(id) {
    if (id < 9)  return SUIT.MAN;
    if (id < 18) return SUIT.PIN;
    if (id < 27) return SUIT.SOU;
    return SUIT.HONOR;
}

// 牌ID → number (1-9 for 数牌, 1-7 for 字牌)
function rankOf(id) {
    if (id < 27) return (id % 9) + 1;
    return id - 26; // honor: 1=East,...,7=Chun
}

// 手牌（tiles + melds）から全牌のIDカウント配列を得る
function allTileCounts(hand) {
    const c = new Array(34).fill(0);
    hand.tiles.forEach(t => c[t.id]++);
    hand.melds.forEach(meld => meld.tiles.forEach(t => c[t.id]++));
    return c;
}

// 手牌 tiles のみのIDカウント配列
function tileCounts(hand) {
    const c = new Array(34).fill(0);
    hand.tiles.forEach(t => c[t.id]++);
    return c;
}

/**
 * 手牌の tiles 部分（副露なし）を面子+雀頭に全パターン分解する。
 * 副露分は既に確定しているため tiles のみを対象とする。
 *
 * @returns Array<{ jantaiId: number, groups: Array<{type:'koutsu'|'shuntsu', startId:number}> }>
 */
function decomposeHandTiles(tiles) {
    const counts = new Array(34).fill(0);
    tiles.forEach(t => counts[t.id]++);

    const results = [];

    for (let jId = 0; jId < 34; jId++) {
        if (counts[jId] < 2) continue;
        counts[jId] -= 2;
        _extractAllGroups(counts, [], results, jId);
        counts[jId] += 2;
    }

    return results;
}

function _extractAllGroups(counts, current, results, jantaiId) {
    // 最初の残牌を探す
    let first = -1;
    for (let id = 0; id < 34; id++) {
        if (counts[id] > 0) { first = id; break; }
    }
    if (first < 0) {
        results.push({ jantaiId, groups: current.slice() });
        return;
    }

    // 刻子
    if (counts[first] >= 3) {
        counts[first] -= 3;
        current.push({ type: 'koutsu', startId: first });
        _extractAllGroups(counts, current, results, jantaiId);
        current.pop();
        counts[first] += 3;
    }

    // 順子（数牌のみ）
    const suit = Math.floor(first / 9);
    if (suit < 3 && first % 9 <= 6 && counts[first] >= 1 && counts[first + 1] >= 1 && counts[first + 2] >= 1) {
        counts[first]--;
        counts[first + 1]--;
        counts[first + 2]--;
        current.push({ type: 'shuntsu', startId: first });
        _extractAllGroups(counts, current, results, jantaiId);
        current.pop();
        counts[first]++;
        counts[first + 1]++;
        counts[first + 2]++;
    }
}

/**
 * 手牌（tiles+melds）の全分解パターンを返す。
 * melds はすでに確定した面子として groups に追加する。
 *
 * @returns Array<{ jantaiId: number, groups: Array<{type:'koutsu'|'shuntsu'|'kan', startId:number, isOpen:boolean}> }>
 */
function getAllDecompositions(hand) {
    const meldGroups = hand.melds.map(m => ({
        type: m.isKan() ? 'kan' : (m.type === MELD_TYPE.PON ? 'koutsu' : 'shuntsu'),
        startId: m.tiles[0].id,
        isOpen: m.isOpen(),
    }));

    const tilesDecomp = decomposeHandTiles(hand.tiles);
    return tilesDecomp.map(d => ({
        jantaiId: d.jantaiId,
        groups: [...meldGroups, ...d.groups.map(g => ({ ...g, isOpen: false }))],
    }));
}

// ===========================================================================
// 役判定メイン関数
// ===========================================================================

/**
 * @param {Hand}   hand
 * @param {Tile}   winTile
 * @param {object} context - { isTsumo, isRiichi, isDoubleRiichi, isIppatsu,
 *                             seatWind, roundWind, isHaitei, isHoutei,
 *                             isRinshan, isChankan, isTenhou, isChiihou }
 * @returns {{ yaku: string[], han: number, isMangan: boolean, isYakuman: boolean }}
 */
export function evaluateYaku(hand, winTile, context) {
    // winTile を手牌に含めた状態で評価する
    const workHand = { tiles: [...hand.tiles, winTile], melds: hand.melds };
    const isOpen = workHand.melds.some(m => m.isOpen());
    const yakuList = [];
    hand = workHand; // 以降 hand は workHand を参照

    // --- 役満チェック（先に確認）---
    const yakuman = [];

    if (context.isTenhou)  yakuman.push('TENHOU');
    if (context.isChiihou) yakuman.push('CHIIHOU');
    if (checkKokushi(hand, winTile))          yakuman.push('KOKUSHI');
    if (checkSuuankou(hand, context))         yakuman.push('SUUANKOU');
    if (checkDaisangen(hand))                 yakuman.push('DAISANGEN');
    if (checkDaisuushii(hand))                yakuman.push('DAISUUSHII');
    else if (checkShousuushii(hand))          yakuman.push('SHOUSUUSHII');
    if (checkTsuuiisou(hand))                 yakuman.push('TSUUIISOU');
    if (checkRyuuiisou(hand))                 yakuman.push('RYUUIISOU');
    if (checkChuurenpoutou(hand))             yakuman.push('CHUURENPOUTOU');
    if (checkSuukantsu(hand))                 yakuman.push('SUUKANTSU');

    if (yakuman.length > 0) {
        return { yaku: yakuman, han: yakuman.length * 13, isMangan: true, isYakuman: true };
    }

    // --- 通常役 ---
    if (context.isDoubleRiichi) yakuList.push('DOUBLE_RIICHI');
    else if (context.isRiichi)  yakuList.push('RIICHI');
    if (context.isIppatsu)      yakuList.push('IPPATSU');
    if (context.isHaitei)       yakuList.push('HAITEI');
    if (context.isHoutei)       yakuList.push('HOUTEI');
    if (context.isRinshan)      yakuList.push('RINSHAN');
    if (context.isChankan)      yakuList.push('CHANKAN');

    if (checkTsumo(hand, context))    yakuList.push('TSUMO');
    if (checkTanyao(hand))            yakuList.push('TANYAO');
    if (checkPinfu(hand, winTile))    yakuList.push('PINFU');
    if (!isOpen && checkIipeiko(hand)) {
        if (checkRyanpeiko(hand)) yakuList.push('RYANPEIKO');
        else                      yakuList.push('IIPEIKO');
    }

    // 役牌
    if (checkHonorGroup(hand, 27 + HONOR.HAKU - 1))   yakuList.push('HAKU');
    if (checkHonorGroup(hand, 27 + HONOR.HATSU - 1))   yakuList.push('HATSU');
    if (checkHonorGroup(hand, 27 + HONOR.CHUN - 1))    yakuList.push('CHUN');
    if (context.seatWind  && checkHonorGroup(hand, 27 + context.seatWind - 1))  yakuList.push('SEAT_WIND');
    if (context.roundWind && checkHonorGroup(hand, 27 + context.roundWind - 1)) yakuList.push('ROUND_WIND');

    if (checkToitoi(hand))                    yakuList.push('TOITOI');
    if (checkChiitoitsu(hand))                yakuList.push('CHIITOI');
    if (checkSanankou(hand, context))         yakuList.push('SANANKOU');
    if (checkSankantsu(hand))                 yakuList.push('SANKANTSU');
    if (checkSanshokuDoujun(hand))            yakuList.push('SANSHOKU_DOUJUN');
    if (checkSanshokuDoukou(hand))            yakuList.push('SANSHOKU_DOUKOU');
    if (checkIttsu(hand))                     yakuList.push('ITTSU');
    if (checkJunchan(hand))                   yakuList.push('JUNCHAN');
    else if (checkChanta(hand))               yakuList.push('CHANTA');
    if (checkShousangen(hand))                yakuList.push('SHOUSANGEN');
    if (checkHonroutou(hand))                 yakuList.push('HONROUTOU');
    if (checkChinitsu(hand))                  yakuList.push('CHINITSU');
    else if (checkHonitsu(hand))              yakuList.push('HONITSU');

    // ハン数計算
    let han = 0;
    for (const key of yakuList) {
        const def = YAKU_HAN[key];
        if (!def) continue;
        const h = isOpen ? def.open : def.closed;
        if (h > 0) han += h;
    }

    const isMangan = han >= 5;
    return { yaku: yakuList, han, isMangan, isYakuman: false };
}

// ===========================================================================
// 個別役判定
// ===========================================================================

export function checkRiichi(context)       { return context.isRiichi; }
export function checkIppatsu(context)      { return context.isIppatsu; }
export function checkTsumo(hand, context)  { return context.isTsumo && hand.melds.every(m => !m.isOpen()); }

export function checkTanyao(hand) {
    const counts = allTileCounts(hand);
    // 老頭牌・字牌（ID: 0,8,9,17,18,26,27-33）に1枚でも残ればNG
    for (let id = 0; id < 34; id++) {
        if (counts[id] === 0) continue;
        const r = rankOf(id);
        const s = suitOf(id);
        if (s === SUIT.HONOR) return false;
        if (r === 1 || r === 9) return false;
    }
    return true;
}

export function checkPinfu(hand, winTile) {
    // 副露不可
    if (hand.melds.some(m => m.isOpen())) return false;

    const decomps = getAllDecompositions(hand);
    for (const { jantaiId, groups } of decomps) {
        // 雀頭が役牌でないこと
        if (jantaiId >= 27) continue; // 字牌雀頭はNG

        // 全面子が順子
        if (groups.some(g => g.type !== 'shuntsu')) continue;

        // 和了牌が両面待ちで入るかチェック
        // winTile が属する順子を探して両面かどうか判定
        if (_isPinfuWait(groups, winTile)) return true;
    }
    return false;
}

function _isPinfuWait(groups, winTile) {
    // winTile が含まれる順子を見つけ、その中での待ちが両面かどうか
    for (const g of groups) {
        if (g.type !== 'shuntsu') continue;
        const s = g.startId;
        // この順子の構成牌: s, s+1, s+2
        if (winTile.id === s || winTile.id === s + 1 || winTile.id === s + 2) {
            // 両面: winTileが s（上辺）か s+2（下辺）かつ端でない
            const rank = rankOf(s);
            if (winTile.id === s     && rank <= 6) return true; // 先端から入る: テンパイ形A+1,A+2で A+3<=9 ならば両面
            if (winTile.id === s + 2 && rank >= 2) return true; // 末尾から入る: テンパイ形A,A+1で A-1>=1 ならば両面
            // カンチャン・単騎はNG
        }
    }
    return false;
}

export function checkIipeiko(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        const shuntsuIds = groups.filter(g => g.type === 'shuntsu').map(g => g.startId).sort((a, b) => a - b);
        for (let i = 0; i < shuntsuIds.length - 1; i++) {
            if (shuntsuIds[i] === shuntsuIds[i + 1]) return true;
        }
    }
    return false;
}

export function checkToitoi(hand) {
    // 七対子形は除く
    if (checkChiitoitsu(hand)) return false;
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        if (groups.every(g => g.type === 'koutsu' || g.type === 'kan')) return true;
    }
    return false;
}

export function checkSanankou(hand, context) {
    // 暗刻(暗槓含む)の数を数える
    // ロン和了の場合、ロン牌で完成した刻子は明刻扱い
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        let ankou = 0;
        for (const g of groups) {
            if (g.type === 'kan' && !g.isOpen) { ankou++; continue; }
            if (g.type === 'koutsu' && !g.isOpen) {
                // ロン牌で完成した刻子は明刻扱い（雀頭以外の刻子にwinTileが含まれる場合）
                // contextにisTsumoがある場合のみ区別（ここでは保守的に処理）
                if (!context.isTsumo && context.winTile && context.winTile.id === g.startId) continue;
                ankou++;
            }
        }
        if (ankou >= 3) return true;
    }
    return false;
}

export function checkChiitoitsu(hand) {
    if (hand.melds.length > 0) return false;
    const c = tileCounts(hand);
    const pairs = c.filter(v => v >= 2).length;
    const kinds = c.filter(v => v > 0).length;
    // 7種7対（4枚持ちを2対にはカウントしない）
    const distinctPairs = c.filter(v => v === 2).length + c.filter(v => v === 4).length; // 4枚は2対に計上しない
    return kinds === 7 && pairs === 7 && c.every(v => v === 0 || v === 2);
}

export function checkSanshokuDoujun(hand) {
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        const shuntsuByRank = {};
        for (const g of groups) {
            if (g.type !== 'shuntsu') continue;
            const suit = Math.floor(g.startId / 9);
            if (suit >= 3) continue; // 字牌順子はありえないが念のため
            const rank = g.startId % 9;
            if (!shuntsuByRank[rank]) shuntsuByRank[rank] = new Set();
            shuntsuByRank[rank].add(suit);
        }
        for (const suits of Object.values(shuntsuByRank)) {
            if (suits.size === 3) return true;
        }
    }
    return false;
}

export function checkIttsu(hand) {
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        for (let suit = 0; suit < 3; suit++) {
            const base = suit * 9;
            const has123 = groups.some(g => g.type === 'shuntsu' && g.startId === base);
            const has456 = groups.some(g => g.type === 'shuntsu' && g.startId === base + 3);
            const has789 = groups.some(g => g.type === 'shuntsu' && g.startId === base + 6);
            if (has123 && has456 && has789) return true;
        }
    }
    return false;
}

// 全面子（副露含む）に幺九牌が含まれるかチェック用
function _groupHasYaochu(g) {
    const id = g.startId;
    if (g.type === 'shuntsu') {
        return rankOf(id) === 1 || rankOf(id + 2) === 9;
    }
    // koutsu/kan
    return rankOf(id) === 1 || rankOf(id) === 9 || suitOf(id) === SUIT.HONOR;
}

export function checkChanta(hand) {
    const decomps = getAllDecompositions(hand);
    for (const { jantaiId, groups } of decomps) {
        // 雀頭が幺九牌
        if (!_isYaochu(jantaiId)) continue;
        // 全面子に幺九牌が含まれる
        if (!groups.every(g => _groupHasYaochu(g))) continue;
        // 字牌が含まれている（純チャンを除外しない）
        // チャンタは字牌含んでいい（純チャンは字牌なし）
        // ただし全面子が老頭牌のみの場合は混老頭（チャンタとは別）
        return true;
    }
    return false;
}

function _isYaochu(id) {
    if (id >= 27) return true; // 字牌
    const r = rankOf(id);
    return r === 1 || r === 9;
}

export function checkJunchan(hand) {
    const decomps = getAllDecompositions(hand);
    for (const { jantaiId, groups } of decomps) {
        // 雀頭が老頭牌（字牌除く）
        if (!_isTerminal(jantaiId)) continue;
        // 全面子に老頭牌が含まれる（字牌含まず）
        if (!groups.every(g => _groupHasTerminal(g))) continue;
        // 字牌なし
        const allIds = [jantaiId, ...groups.flatMap(g => _groupIds(g))];
        if (allIds.some(id => id >= 27)) continue;
        return true;
    }
    return false;
}

function _isTerminal(id) {
    if (id >= 27) return false;
    const r = rankOf(id);
    return r === 1 || r === 9;
}

function _groupHasTerminal(g) {
    if (g.type === 'shuntsu') {
        return rankOf(g.startId) === 1 || rankOf(g.startId + 2) === 9;
    }
    return _isTerminal(g.startId);
}

function _groupIds(g) {
    if (g.type === 'shuntsu') return [g.startId, g.startId + 1, g.startId + 2];
    if (g.type === 'kan') return [g.startId, g.startId, g.startId, g.startId];
    return [g.startId, g.startId, g.startId];
}

export function checkHonitsu(hand) {
    const counts = allTileCounts(hand);
    let foundSuit = -1;
    for (let id = 0; id < 27; id++) {
        if (counts[id] === 0) continue;
        const s = Math.floor(id / 9);
        if (foundSuit < 0) foundSuit = s;
        else if (foundSuit !== s) return false; // 2色以上の数牌
    }
    if (foundSuit < 0) return false; // 数牌が1枚もない（字一色）
    // 字牌が含まれていること（清一色との区別）
    let hasHonor = false;
    for (let id = 27; id < 34; id++) {
        if (counts[id] > 0) { hasHonor = true; break; }
    }
    return hasHonor;
}

export function checkChinitsu(hand) {
    const counts = allTileCounts(hand);
    for (let id = 27; id < 34; id++) {
        if (counts[id] > 0) return false; // 字牌あり
    }
    let foundSuit = -1;
    for (let id = 0; id < 27; id++) {
        if (counts[id] === 0) continue;
        const s = Math.floor(id / 9);
        if (foundSuit < 0) foundSuit = s;
        else if (foundSuit !== s) return false;
    }
    return foundSuit >= 0;
}

export function checkRyanpeiko(hand) {
    if (hand.melds.some(m => m.isOpen())) return false;
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        const shuntsuIds = groups.filter(g => g.type === 'shuntsu').map(g => g.startId).sort((a, b) => a - b);
        if (shuntsuIds.length < 4) continue;
        // 4つの順子の中に2ペアあるかチェック
        const used = new Array(shuntsuIds.length).fill(false);
        let pairs = 0;
        for (let i = 0; i < shuntsuIds.length; i++) {
            if (used[i]) continue;
            for (let j = i + 1; j < shuntsuIds.length; j++) {
                if (!used[j] && shuntsuIds[i] === shuntsuIds[j]) {
                    used[i] = used[j] = true;
                    pairs++;
                    break;
                }
            }
        }
        if (pairs >= 2) return true;
    }
    return false;
}

export function checkSanshokuDoukou(hand) {
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        const koutsus = groups.filter(g => g.type === 'koutsu' || g.type === 'kan');
        const byRank = {};
        for (const g of koutsus) {
            if (g.startId >= 27) continue; // 字牌
            const r = rankOf(g.startId);
            if (!byRank[r]) byRank[r] = new Set();
            byRank[r].add(Math.floor(g.startId / 9));
        }
        for (const suits of Object.values(byRank)) {
            if (suits.size === 3) return true;
        }
    }
    return false;
}

export function checkHonroutou(hand) {
    const counts = allTileCounts(hand);
    for (let id = 0; id < 34; id++) {
        if (counts[id] === 0) continue;
        if (!_isYaochu(id)) return false; // 中張牌あり
    }
    // 字牌が含まれていること（清老頭との区別は不要 – 清老頭は存在しない役）
    return true;
}

// 役牌（三元牌・風牌）の刻子/槓子が存在するか
export function checkHonorGroup(hand, honorId) {
    for (const meld of hand.melds) {
        if ((meld.type === MELD_TYPE.PON || meld.isKan()) && meld.tiles[0].id === honorId) return true;
    }
    // 手牌内の刻子
    const c = tileCounts(hand);
    return c[honorId] >= 3;
}

export function checkShousangen(hand) {
    const dragonIds = [27 + HONOR.HAKU - 1, 27 + HONOR.HATSU - 1, 27 + HONOR.CHUN - 1];
    const decomps = getAllDecompositions(hand);
    for (const { jantaiId, groups } of decomps) {
        const koutsus = groups.filter(g => g.type === 'koutsu' || g.type === 'kan');
        const dragonKoutsuCount = koutsus.filter(g => dragonIds.includes(g.startId)).length;
        const dragonJantai = dragonIds.includes(jantaiId);
        if (dragonKoutsuCount === 2 && dragonJantai) return true;
    }
    return false;
}

export function checkSankantsu(hand) {
    const kanCount = hand.melds.filter(m => m.isKan()).length;
    return kanCount >= 3;
}

// ===========================================================================
// 役満
// ===========================================================================

export function checkKokushi(hand, winTile) {
    if (hand.melds.length > 0) return false;
    const YAOCHU_IDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
    const c = tileCounts(hand);
    const kinds = YAOCHU_IDS.filter(id => c[id] > 0).length;
    const hasPair = YAOCHU_IDS.some(id => c[id] >= 2);
    return kinds === 13 && hasPair;
}

export function checkSuuankou(hand, context) {
    const decomps = getAllDecompositions(hand);
    for (const { groups } of decomps) {
        const ankou = groups.filter(g => {
            if (g.isOpen) return false;
            return g.type === 'koutsu' || g.type === 'kan';
        }).length;
        // ロン和了の場合、4暗刻は単騎待ち以外不成立（ここでは単騎判定は省略、基本形のみ）
        if (ankou >= 4 && context.isTsumo) return true;
        if (ankou >= 4 && !context.isTsumo) {
            // 単騎待ちかどうか（雀頭がwinTile）をcontextで確認
            // contextにwinTileがある場合のみ単騎判定
            if (context.winTile) {
                // 雀頭 == winTile であれば単騎 → 四暗刻成立
                // getAllDecompositions では jantaiId がある
                // この groups の分解でjantaiIdを取得できないので context.winTile == jantaiId をチェック
                // ここでは decomps から jantaiId も参照
                continue; // 後で jantaiId 付きで再チェック
            }
        }
    }
    // jantaiId 付きで再チェック（ロン単騎対応）
    for (const { jantaiId, groups } of decomps) {
        const ankou = groups.filter(g => !g.isOpen && (g.type === 'koutsu' || g.type === 'kan')).length;
        if (ankou >= 4) {
            if (context.isTsumo) return true;
            // ロン: 単騎待ちのみ成立（jantaiId == winTile.id）
            if (context.winTile && context.winTile.id === jantaiId) return true;
        }
    }
    return false;
}

export function checkDaisangen(hand) {
    const dragonIds = [27 + HONOR.HAKU - 1, 27 + HONOR.HATSU - 1, 27 + HONOR.CHUN - 1];
    let count = 0;
    for (const meld of hand.melds) {
        if ((meld.type === MELD_TYPE.PON || meld.isKan()) && dragonIds.includes(meld.tiles[0].id)) count++;
    }
    const c = tileCounts(hand);
    for (const id of dragonIds) {
        if (c[id] >= 3) count++;
    }
    return count >= 3;
}

export function checkDaisuushii(hand) {
    const windIds = [27, 28, 29, 30]; // 東南西北
    let count = 0;
    for (const meld of hand.melds) {
        if ((meld.type === MELD_TYPE.PON || meld.isKan()) && windIds.includes(meld.tiles[0].id)) count++;
    }
    const c = tileCounts(hand);
    for (const id of windIds) {
        if (c[id] >= 3) count++;
    }
    return count >= 4;
}

export function checkShousuushii(hand) {
    const windIds = [27, 28, 29, 30];
    let koutsuCount = 0;
    let jantaiCount = 0;
    const decomps = getAllDecompositions(hand);
    for (const { jantaiId, groups } of decomps) {
        koutsuCount = groups.filter(g => windIds.includes(g.startId) && (g.type === 'koutsu' || g.type === 'kan')).length;
        jantaiCount = windIds.includes(jantaiId) ? 1 : 0;
        if (koutsuCount === 3 && jantaiCount === 1) return true;
    }
    return false;
}

export function checkTsuuiisou(hand) {
    const counts = allTileCounts(hand);
    for (let id = 0; id < 27; id++) {
        if (counts[id] > 0) return false;
    }
    return true;
}

export function checkRyuuiisou(hand) {
    const counts = allTileCounts(hand);
    for (let id = 0; id < 34; id++) {
        if (counts[id] === 0) continue;
        const t = { suit: suitOf(id), number: rankOf(id) };
        // 緑一色に使える牌: 2346索8索 + 發(id=32)
        if (t.suit === SUIT.HONOR && id === 27 + HONOR.HATSU - 1) continue; // 發
        if (t.suit === SUIT.SOU && [2, 3, 4, 6, 8].includes(t.number)) continue;
        return false;
    }
    return true;
}

export function checkChuurenpoutou(hand) {
    if (hand.melds.length > 0) return false;
    const c = tileCounts(hand);
    // 全牌が同一数牌スート
    let suit = -1;
    for (let id = 0; id < 27; id++) {
        if (c[id] === 0) continue;
        const s = Math.floor(id / 9);
        if (suit < 0) suit = s;
        else if (suit !== s) return false;
    }
    if (suit < 0) return false; // 字牌のみ
    // 字牌なし
    for (let id = 27; id < 34; id++) {
        if (c[id] > 0) return false;
    }
    const base = suit * 9;
    // 1112345678999 + 任意1枚 の形
    // 最低限: 1が3枚以上、9が3枚以上、2-8が各1枚以上
    if (c[base] < 3 || c[base + 8] < 3) return false;
    for (let i = 1; i <= 7; i++) {
        if (c[base + i] < 1) return false;
    }
    // 合計14枚
    let total = 0;
    for (let i = 0; i < 9; i++) total += c[base + i];
    return total === 14;
}

export function checkSuukantsu(hand) {
    return hand.melds.filter(m => m.isKan()).length >= 4;
}
