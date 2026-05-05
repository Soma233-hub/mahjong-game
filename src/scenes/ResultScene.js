export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.players = data.players || [];
    }

    create() {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // タイトル
        this.add.text(640, 80, '対局結果', {
            fontSize: '42px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 順位ソート（高い順）
        const sorted = [...this.players].sort((a, b) => b.score - a.score);

        const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#aaaaaa'];
        const rankLabels = ['1位', '2位', '3位', '4位'];

        sorted.forEach((p, rank) => {
            const y   = 200 + rank * 100;
            const col = rankColors[rank];

            // 順位
            this.add.text(300, y, rankLabels[rank], {
                fontSize: '26px', color: col, fontFamily: 'monospace',
            }).setOrigin(0.5);

            // プレイヤー名
            const names = ['自分 (Player0)', 'Player1', 'Player2', 'Player3'];
            this.add.text(500, y, names[p.index], {
                fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            // 点数（30000点基準の差）
            const diff   = p.score - 30000;
            const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
            const diffCol = diff >= 0 ? '#88ff88' : '#ff8888';

            this.add.text(750, y, `${p.score}点`, {
                fontSize: '26px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(950, y, `(${diffStr})`, {
                fontSize: '22px', color: diffCol, fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        // 罫線
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x444466, 1);
        gfx.lineBetween(200, 165, 1080, 165);
        gfx.lineBetween(200, 580, 1080, 580);

        // 再プレイボタン
        const btnBg  = this.add.rectangle(640, 640, 200, 50, 0x334466);
        const btnTxt = this.add.text(640, 640, '再プレイ', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        btnBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => btnBg.setFillStyle(0x4455aa))
            .on('pointerout',  () => btnBg.setFillStyle(0x334466))
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}
