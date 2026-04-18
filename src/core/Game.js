import { Wall } from './Wall.js';
import { Player } from './Player.js';
import { AILevel3 } from '../ai/AILevel3.js';

export const GAME_STATE = Object.freeze({
    INIT:        'init',
    DEAL:        'deal',
    DRAW:        'draw',         // プレイヤーがツモ
    PLAYER_ACTION: 'player_action', // 打牌・リーチ・暗槓
    CLAIM:       'claim',        // 他家の鳴き・ロン受付
    MELD_ACTION: 'meld_action',  // 鳴き後の打牌
    KAN_DRAW:    'kan_draw',     // 嶺上ツモ
    ROUND_END:   'round_end',    // 局終了
    GAME_END:    'game_end',     // 半荘終了
});

export const ROUND_RESULT = Object.freeze({
    TSUMO:     'tsumo',    // ツモ和了
    RON:       'ron',      // ロン和了
    RYUUKYOKU: 'ryuukyoku', // 流局
    CHOMBO:    'chombo',   // チョンボ
});

export class Game {
    constructor() {
        this.wall    = new Wall();
        // プレイヤー0が人間、1-3がAI
        this.players = [
            new Player(0, true),
            new Player(1, false),
            new Player(2, false),
            new Player(3, false),
        ];
        // AIインスタンスを非人間プレイヤーにセット
        for (let i = 1; i <= 3; i++) {
            this.players[i].ai = new AILevel3(i);
        }

        this.state       = GAME_STATE.INIT;
        this.round       = 0;    // 局番号（0=東1局, 3=東4局）
        this.dealerIndex = 0;    // 親のプレイヤーインデックス
        this.turn        = 0;    // ターンカウンタ（リーチ一発判定用）
        this.currentIndex = 0;   // 現在手番のプレイヤーインデックス
        this.honba       = 0;    // 本場数
        this.kyotaku     = 0;    // 供託リーチ棒（1本=1000点）

        this.lastDiscard     = null; // 最後に捨てられた牌
        this.lastDiscardPlayer = -1; // 捨てたプレイヤーのインデックス

        this.eventListeners = {}; // イベントリスナー（UIとの橋渡し）
    }

    // --- ゲーム開始・局管理 ---

    startGame() {
        this.round       = 0;
        this.dealerIndex = 0;
        this.honba       = 0;
        this.kyotaku     = 0;
        this.players.forEach(p => p.score = 25000);
        this._startRound();
    }

    _startRound() {
        this.wall.init();
        this.players.forEach(p => {
            p.hand.tiles  = [];
            p.hand.melds  = [];
            p.discards    = [];
            p.isRiichi    = false;
            p.isDoubleRiichi = false;
            p.isFuriten   = false;
            p.isTemporaryFuriten = false;
            p.isIppatsu   = false;
            p.isMenzen    = true;
        });

        // 配牌
        for (let i = 0; i < 4; i++) {
            const tiles = this.wall.deal(13);
            tiles.forEach(t => this.players[i].hand.add(t));
            this.players[i].hand.sort();
        }

        // 親が1枚ツモ
        this.currentIndex = this.dealerIndex;
        this.turn = 0;
        this.state = GAME_STATE.DRAW;
        this._processDraw();
    }

    // --- ターン処理 ---

    _processDraw() {
        const player = this.players[this.currentIndex];
        const tile = this.wall.draw();
        if (!tile) {
            this._processRyuukyoku();
            return;
        }
        player.draw(tile);
        this.turn++;
        this.state = GAME_STATE.PLAYER_ACTION;
        this.emit('draw', { playerIndex: this.currentIndex, tile });

        // AIプレイヤーは自動で行動する
        if (!player.isHuman && player.ai) {
            this._processAIAction(player);
        }
    }

    _processAIAction(player) {
        const action = player.ai.selectDrawAction(player, this);
        if (action.action === 'discard') {
            this.processDiscard(player.index, action.index);
        }
        // TODO: 第3週でリーチ・暗槓を追加
    }

    // プレイヤーが打牌する（人間からの入力またはAIの選択）
    processDiscard(playerIndex, tileIndex) {
        if (this.state !== GAME_STATE.PLAYER_ACTION) return;
        if (playerIndex !== this.currentIndex) return;

        const player = this.players[playerIndex];
        const tile = player.discard(tileIndex);
        this.lastDiscard      = tile;
        this.lastDiscardPlayer = playerIndex;

        this.state = GAME_STATE.CLAIM;
        this.emit('discard', { playerIndex, tile });

        // 鳴き・ロン確認（TODO: 第3週・第4週で実装）
        this._processClaims();
    }

    // リーチ宣言
    processRiichi(playerIndex, tileIndex) {
        const player = this.players[playerIndex];
        const isDouble = this.turn <= 4; // 第1ツモ以内でダブルリーチ
        player.declareRiichi(this.turn, isDouble);
        this.processDiscard(playerIndex, tileIndex);
    }

    // 暗槓
    processAnkan(playerIndex, tileId) {
        // TODO: 第3週で実装
    }

    // 加槓
    processKakan(playerIndex, meldIndex) {
        // TODO: 第3週で実装
    }

    _processClaims() {
        // TODO: 第3週（ポン・チー・カン）・第4週（ロン）で実装
        // 暫定: スキップして次ツモへ
        this._nextTurn();
    }

    _nextTurn() {
        this.currentIndex = (this.currentIndex + 1) % 4;
        this.state = GAME_STATE.DRAW;
        this._processDraw();
    }

    // 流局処理
    _processRyuukyoku() {
        // TODO: テンパイ/ノーテン精算
        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', { result: 'ryuukyoku' });
    }

    // 和了処理（ツモ/ロン）
    processWin(winnerIndex, ronDiscarderIndex = -1) {
        // TODO: 第4週（役判定）・第5週（点数計算）で実装
        this.state = GAME_STATE.ROUND_END;
        this.emit('roundEnd', { result: ronDiscarderIndex < 0 ? 'tsumo' : 'ron', winnerIndex });
    }

    // --- 局回し ---

    nextRound(dealerContinues = false) {
        if (!dealerContinues) {
            this.dealerIndex = (this.dealerIndex + 1) % 4;
            this.round++;
        } else {
            this.honba++;
        }

        if (this.round >= 4) {
            this._checkGameEnd();
            return;
        }
        this._startRound();
    }

    _checkGameEnd() {
        // 東風戦: 4局終了でゲーム終了（トビ・オーラス延長は TODO）
        this.state = GAME_STATE.GAME_END;
        this.emit('gameEnd', { players: this.players });
    }

    // --- イベント ---

    on(event, cb) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(cb);
    }

    emit(event, data) {
        (this.eventListeners[event] || []).forEach(cb => cb(data));
    }
}
