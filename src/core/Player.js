import { Hand } from './Hand.js';

export const WIND = Object.freeze({ EAST: 0, SOUTH: 1, WEST: 2, NORTH: 3 });

export class Player {
    /**
     * @param {number} index  - 座席番号 0=東 1=南 2=西 3=北
     * @param {boolean} isHuman - 人間プレイヤーか
     */
    constructor(index, isHuman = false) {
        this.index   = index;
        this.isHuman = isHuman;
        this.ai      = null;   // AIインスタンス（isHuman=false時に設定）

        this.hand      = new Hand();
        this.discards  = [];   // 捨て牌リスト（Tileオブジェクト）
        this.score     = 25000; // 初期持ち点

        // リーチ関連
        this.isRiichi       = false;
        this.isDoubleRiichi = false;
        this.riichiTurn     = -1;   // リーチ宣言したターン番号
        this.isMenzen       = true; // 門前か否か（副露で false）

        // フリテン
        this.isFuriten          = false; // 通常フリテン
        this.isTemporaryFuriten = false; // 一時フリテン（次ツモで解消）

        // 一発・ハイテイ等の状態フラグ
        this.isIppatsu = false;
    }

    // ツモ（手牌に加える）
    draw(tile) {
        this.hand.add(tile);
        this.isTemporaryFuriten = false; // ツモで一時フリテン解消
    }

    // 捨て牌
    discard(index) {
        const tile = this.hand.remove(index);
        this.discards.push(tile);
        this.isIppatsu = false;
        return tile;
    }

    // リーチ宣言（discardの前に呼ぶ）
    declareRiichi(turn, isDouble = false) {
        this.isRiichi       = true;
        this.isDoubleRiichi = isDouble;
        this.riichiTurn     = turn;
        this.isIppatsu      = true;
        this.score         -= 1000;
    }

    // フリテン判定（待ち牌が捨て牌にある）
    checkFuriten() {
        const waits = this.hand.getWaitingTileIds();
        if (waits.length === 0) return;
        this.isFuriten = this.discards.some(d => waits.includes(d.id));
    }

    // 自分の席風（局風に応じて変わる）
    getSeatWind(dealerIndex) {
        return (this.index - dealerIndex + 4) % 4;
    }

    toString() {
        return `Player${this.index}(${this.score}点)`;
    }
}
