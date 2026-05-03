import { AIBase } from './AIBase.js';

/**
 * Lv.3 AI
 * - ツモ和了・リーチ宣言・暗槓/加槓の自動判断
 * - 役牌ポン・向聴改善チーの自動判断
 * - 守備: 他家リーチ時は安全牌優先
 */
export class AILevel3 extends AIBase {
    constructor(playerIndex) {
        super(playerIndex);
    }

    // --- ツモ後アクション ---

    selectDrawAction(player, game) {
        // 1. ツモ和了
        if (player.hand.isComplete()) return { action: 'tsumo' };

        // 2. 暗槓・加槓（リーチ中は不可）
        if (!player.isRiichi) {
            const ankanIds = player.hand.findAnkanIds();
            if (ankanIds.length > 0) return { action: 'ankan', tileId: ankanIds[0] };

            const kakanOpts = player.hand.findKakanOptions();
            if (kakanOpts.length > 0) return { action: 'kakan', meldIndex: kakanOpts[0].meldIndex };
        }

        // 3. リーチ（門前・未リーチ・十分な残り牌・持ち点1000以上）
        if (player.isMenzen && !player.isRiichi && game.wall.remaining > 3 && player.score >= 1000) {
            const riichiIdx = this._findRiichiDiscard(player);
            if (riichiIdx >= 0) return { action: 'riichi', index: riichiIdx };
        }

        // 4. 通常打牌
        return { action: 'discard', index: this.selectDiscard(player, game) };
    }

    // --- 鳴き選択 ---

    selectClaimAction(player, game, discardTile, opts) {
        if (opts.canRon) return { action: 'ron' };
        if (player.isRiichi) return { action: 'pass' };
        if (opts.canMinkan) return { action: 'minkan' };

        if (opts.canPon && this._shouldPon(player, discardTile)) {
            return { action: 'pon' };
        }

        if (opts.canChi) {
            const options = player.hand.findChiOptions(discardTile);
            if (options.length > 0 && this._shouldChi(player, discardTile, options[0])) {
                return { action: 'chi', tileIndices: options[0] };
            }
        }

        return { action: 'pass' };
    }

    // --- 打牌選択 ---

    selectDiscard(player, game) {
        const opponents = game.players.filter(p => p.index !== player.index && p.isRiichi);
        if (opponents.length > 0) return this._selectSafeTile(player, game);
        return this._selectByEffectiveTiles(player);
    }

    // --- 内部ユーティリティ ---

    // テンパイになる打牌インデックスを返す（最多待ち優先）
    _findRiichiDiscard(player) {
        let bestIdx = -1;
        let bestWaits = 0;

        for (let i = 0; i < player.hand.tileCount; i++) {
            const removed = player.hand.tiles.splice(i, 1)[0];
            if (player.hand.isTenpai()) {
                const waits = player.hand.getWaitingTileIds().length;
                if (waits > bestWaits) {
                    bestWaits = waits;
                    bestIdx = i;
                }
            }
            player.hand.tiles.splice(i, 0, removed);
        }

        return bestIdx;
    }

    // 役牌(白=31,発=32,中=33)または向聴改善するならポン（手牌に実牌があること前提）
    _shouldPon(player, tile) {
        if (player.hand.findPonIndices(tile) === null) return false;
        if (tile.id >= 31) return true; // 三元牌は必ずポン
        return this._ponImprovesShanten(player, tile);
    }

    // ポン後に最良打牌した場合の向聴数が現状より下がるか（副露ボーナス-2を考慮）
    _ponImprovesShanten(player, tile) {
        const before = player.hand.getShantenNumber().shanten;
        const indices = player.hand.findPonIndices(tile);
        if (!indices) return false;

        const [hi, lo] = indices[0] > indices[1]
            ? [indices[0], indices[1]]
            : [indices[1], indices[0]];
        const t1 = player.hand.tiles.splice(hi, 1)[0];
        const t2 = player.hand.tiles.splice(lo, 1)[0];

        // 11枚から最良打牌後10枚 + 副露1個（-2ボーナス）
        let bestAfter = 99;
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const rem = player.hand.tiles.splice(i, 1)[0];
            const s = player.hand.getShantenNumber().shanten - 2;
            if (s < bestAfter) bestAfter = s;
            player.hand.tiles.splice(i, 0, rem);
        }

        player.hand.tiles.splice(lo, 0, t2);
        player.hand.tiles.splice(hi, 0, t1);

        return bestAfter < before;
    }

    // チー後に最良打牌した場合の向聴数が現状より下がるか
    _shouldChi(player, tile, tileIndices) {
        if (!tileIndices) return false;
        const before = player.hand.getShantenNumber().shanten;

        const [hi, lo] = tileIndices[0] > tileIndices[1]
            ? [tileIndices[0], tileIndices[1]]
            : [tileIndices[1], tileIndices[0]];
        const t1 = player.hand.tiles.splice(hi, 1)[0];
        const t2 = player.hand.tiles.splice(lo, 1)[0];

        let bestAfter = 99;
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const rem = player.hand.tiles.splice(i, 1)[0];
            const s = player.hand.getShantenNumber().shanten - 2;
            if (s < bestAfter) bestAfter = s;
            player.hand.tiles.splice(i, 0, rem);
        }

        player.hand.tiles.splice(lo, 0, t2);
        player.hand.tiles.splice(hi, 0, t1);

        return bestAfter < before;
    }

    // 有効牌枚数を最大化する打牌インデックス
    _selectByEffectiveTiles(player) {
        const hand = player.hand;
        let bestIdx = 0;
        let bestCount = -1;

        for (let i = 0; i < hand.tileCount; i++) {
            const removed = hand.tiles.splice(i, 1)[0];
            const eff = hand.getEffectiveTileIds().length;
            hand.tiles.splice(i, 0, removed);
            if (eff > bestCount) { bestCount = eff; bestIdx = i; }
        }
        return bestIdx;
    }

    // 安全牌を返す（他家の捨て牌に含まれる牌を優先）
    _selectSafeTile(player, game) {
        const opponents = game.players.filter(p => p.index !== player.index && p.isRiichi);
        if (opponents.length === 0) return this._selectByEffectiveTiles(player);

        const safeIds = new Set(opponents.flatMap(p => p.discards.map(t => t.id)));
        const safeIdx = player.hand.tiles.findIndex(t => safeIds.has(t.id));
        return safeIdx >= 0 ? safeIdx : this._selectByEffectiveTiles(player);
    }
}
