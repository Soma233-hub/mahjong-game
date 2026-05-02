import { AIBase } from './AIBase.js';
import { evaluateYaku } from '../logic/Yaku.js';

/**
 * Lv.3 AI
 * - 有効牌枚数・受け入れ枚数ベースで打牌選択
 * - 守備判断: 他家のリーチ時は安全牌を優先
 * - ポン/チーの価値評価（向聴数改善 + 役見込み）
 */
export class AILevel3 extends AIBase {
    constructor(playerIndex) {
        super(playerIndex);
    }

    // --- 打牌選択 ---

    selectDiscard(player, game) {
        const opponents = game.players.filter(p => p.index !== player.index && p.isRiichi);
        if (opponents.length > 0) {
            return this._selectSafeTile(player, game);
        }
        return this._selectByEffectiveTiles(player);
    }

    // --- 鳴き選択 ---

    // 他家の捨て牌に対するアクション選択
    selectClaimAction(player, game, discardTile, opts) {
        if (opts && opts.canRon && this._hasYakuOnRon(player, game, discardTile)) {
            return { action: 'ron' };
        }
        return { action: 'pass' };
    }

    _hasYakuOnRon(player, game, tile) {
        player.hand.add(tile);
        const seatWind = player.getSeatWind(game.dealerIndex) + 1;
        const context = {
            isTsumo: false,
            isRiichi: player.isRiichi,
            isDoubleRiichi: player.isDoubleRiichi,
            isIppatsu: player.isIppatsu,
            seatWind,
            roundWind: 1,
            isHaitei: false,
            isHoutei: false,
            isRinshan: false,
            isChankan: false,
            isTenhou: false,
            isChiihou: false,
        };
        const yakuResult = evaluateYaku(player.hand, tile, context);
        player.hand.tiles.pop();
        return yakuResult.isYakuman || yakuResult.yaku.length > 0;
    }

    // --- ツモ後のアクション ---

    selectDrawAction(player, game) {
        if (player.hand.isComplete() && this._hasYakuOnTsumo(player, game)) {
            return { action: 'tsumo' };
        }
        const idx = this.selectDiscard(player, game);
        return { action: 'discard', index: idx };
    }

    _hasYakuOnTsumo(player, game) {
        const winTile = player.hand.tiles[player.hand.tiles.length - 1];
        const seatWind = player.getSeatWind(game.dealerIndex) + 1;
        const context = {
            isTsumo: true,
            isRiichi: player.isRiichi,
            isDoubleRiichi: player.isDoubleRiichi,
            isIppatsu: player.isIppatsu,
            seatWind,
            roundWind: 1,
            isHaitei: game.wall.isEmpty(),
            isHoutei: false,
            isRinshan: game._isRinshan,
            isChankan: false,
            isTenhou: false,
            isChiihou: false,
        };
        const yakuResult = evaluateYaku(player.hand, winTile, context);
        return yakuResult.isYakuman || yakuResult.yaku.length > 0;
    }

    // --- 内部ユーティリティ ---

    // 向聴数優先・有効牌数次優先の打牌インデックス
    _selectByEffectiveTiles(player) {
        const hand = player.hand;
        let bestIdx = 0;
        let bestShanten = Infinity;
        let bestCount = -1;

        for (let i = 0; i < hand.tileCount; i++) {
            const removed = hand.tiles.splice(i, 1)[0];
            const { shanten } = hand.getShantenNumber();
            const eff = hand.getEffectiveTileIds().length;
            hand.tiles.splice(i, 0, removed);
            if (shanten < bestShanten || (shanten === bestShanten && eff > bestCount)) {
                bestShanten = shanten;
                bestCount = eff;
                bestIdx = i;
            }
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

    _randomDiscard(player) {
        return Math.floor(Math.random() * player.hand.tileCount);
    }
}
