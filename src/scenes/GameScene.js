import { Game, GAME_STATE } from '../core/Game.js';

export default class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.game_ = new Game();

        this._bindGameEvents();
        this._drawStaticUI();
        this.game_.startGame();
    }

    // --- ゲームイベントとUIの橋渡し ---

    _bindGameEvents() {
        this.game_.on('draw',      data => this._onDraw(data));
        this.game_.on('discard',   data => this._onDiscard(data));
        this.game_.on('meld',      data => this._onMeld(data));
        this.game_.on('roundEnd',  data => this._onRoundEnd(data));
        this.game_.on('gameEnd',   data => this._onGameEnd(data));
    }

    _onDraw({ playerIndex, tile }) {
        this._renderHand(playerIndex);
        if (playerIndex !== 0) {
            // AIターン（TODO: 第6週）
            setTimeout(() => this._runAITurn(playerIndex), 300);
        }
        // 人間プレイヤー: 手牌クリックで打牌（TODO: 第6週）
    }

    _onDiscard({ playerIndex, tile }) {
        this._renderDiscards(playerIndex);
    }

    _onMeld({ playerIndex }) {
        this._renderHand(playerIndex);
    }

    _onRoundEnd({ result }) {
        // TODO: 結果表示
        this.add.text(640, 360, `局終了: ${result}`, {
            fontSize: '32px', color: '#fff',
        }).setOrigin(0.5);
    }

    _onGameEnd({ players }) {
        this.scene.start('ResultScene', { players });
    }

    // --- AI処理 ---

    _runAITurn(playerIndex) {
        const player = this.game_.players[playerIndex];
        const ai = player.ai;
        if (!ai) {
            // AIが未設定の場合は暫定でランダム打牌
            this.game_.processDiscard(playerIndex, 0);
            return;
        }
        const action = ai.selectDrawAction(player, this.game_);
        if (action.action === 'discard') {
            this.game_.processDiscard(playerIndex, action.index);
        }
        // TODO: リーチ・槓対応
    }

    // --- 描画（スタブ）---

    _drawStaticUI() {
        // TODO: 第6週でGUI実装
        this.add.text(16, 16, '麻雀ゲーム', { fontSize: '20px', color: '#fff' });
    }

    _renderHand(playerIndex) {
        // TODO: 第6週で実装
    }

    _renderDiscards(playerIndex) {
        // TODO: 第6週で実装
    }
}
