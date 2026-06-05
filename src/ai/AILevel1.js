import { AIBase } from './AIBase.js';

/**
 * 簡単AI（Lv1）
 * - 副露なし・リーチなし
 * - 常にツモ牌（末尾）をツモ切り
 * - ツモ和了は取る
 */
export class AILevel1 extends AIBase {
    constructor(playerIndex) { super(playerIndex); }

    selectDiscard(player) {
        return player.hand.tiles.length - 1;
    }

    selectClaimAction() {
        return { action: 'pass' };
    }

    selectDrawAction(player, game) {
        if (game.canDeclareWin(this.playerIndex)) {
            return { action: 'tsumo' };
        }
        return { action: 'discard', index: player.hand.tiles.length - 1 };
    }
}
