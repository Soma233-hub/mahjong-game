/**
 * AI基底クラス
 * 全AIレベルはこのクラスを継承して実装する
 */
export class AIBase {
    /**
     * @param {number} playerIndex - このAIのプレイヤーインデックス
     */
    constructor(playerIndex) {
        this.playerIndex = playerIndex;
    }

    /**
     * 打牌する牌のインデックスを選択
     * @param {Player} player   - 自分のプレイヤー情報
     * @param {Game}   game     - ゲーム情報
     * @returns {number} 手牌インデックス
     */
    selectDiscard(player, game) {
        throw new Error('selectDiscard must be implemented');
    }

    /**
     * 他家の打牌に対してアクションを選択
     * @param {Player} player     - 自分のプレイヤー情報
     * @param {Game}   game       - ゲーム情報
     * @param {Tile}   discardTile - 捨てられた牌
     * @returns {{ action: 'pon'|'chi'|'kan'|'ron'|'pass', tiles?: number[] }}
     */
    selectClaimAction(player, game, discardTile) {
        throw new Error('selectClaimAction must be implemented');
    }

    /**
     * ツモ後のアクション（カン・ツモ和了・リーチ）
     * @param {Player} player - 自分のプレイヤー情報
     * @param {Game}   game   - ゲーム情報
     * @returns {{ action: 'discard'|'ankan'|'kakan'|'tsumo'|'riichi', index?: number }}
     */
    selectDrawAction(player, game) {
        throw new Error('selectDrawAction must be implemented');
    }
}
