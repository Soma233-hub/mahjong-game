export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.players = data.players || [];
    }

    create() {
        // TODO: 第6週でGUI実装
        this.add.text(640, 200, '結果', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);

        this.players.forEach((p, i) => {
            this.add.text(640, 280 + i * 40, `Player${p.index}: ${p.score}点`, {
                fontSize: '24px', color: '#fff',
            }).setOrigin(0.5);
        });

        this.add.text(640, 600, 'クリックで再プレイ', {
            fontSize: '20px', color: '#aaa',
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => this.scene.start('GameScene'));
    }
}
