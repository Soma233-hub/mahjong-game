import { AIBase } from './AIBase.js';

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

    selectClaimAction(player, game, discardTile) {
        // TODO: 第6週で実装
        // 1. ロン可能なら和了
        // 2. ポン/チーが向聴数改善 + 役見込みあれば鳴く
        return { action: 'pass' };
    }

    // --- ツモ後のアクション ---

    selectDrawAction(player, game) {
        // TODO: 第6週で実装
        // 1. ツモ和了可能なら和了
        // 2. 暗槓・加槓が有利なら槓
        // 3. リーチ可能かつ有利なら宣言
        // 4. 通常打牌
        const idx = this.selectDiscard(player, game);
        return { action: 'discard', index: idx };
    }

    // --- 内部ユーティリティ ---

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

    _randomDiscard(player) {
        return Math.floor(Math.random() * player.hand.tileCount);
    }
}
