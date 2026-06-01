export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.players = data.players || [];
    }

    create() {
        // 背景
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // タイトル
        this.add.text(640, 70, '対局結果', {
            fontSize: '42px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 順位ソート（高い順、同点は席順）
        const sorted = [...this.players].sort((a, b) => b.score - a.score || a.index - b.index);

        const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#aaaaaa'];
        const rankLabels = ['1位', '2位', '3位', '4位'];
        const playerNames = ['自分', '右', '対面', '左'];
        const umaTable = [20, 10, -10, -20];

        // 列ヘッダー
        [
            [160, '順位'], [380, 'プレイヤー'], [610, '持ち点'],
            [810, 'ウマ'], [1020, '精算点'],
        ].forEach(([x, label]) => {
            this.add.text(x, 148, label, {
                fontSize: '15px', color: '#666688', fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        // 罫線（上）
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x444466, 1);
        gfx.lineBetween(100, 165, 1180, 165);

        sorted.forEach((p, rank) => {
            const y      = 210 + rank * 100;
            const col    = rankColors[rank];
            const uma    = umaTable[rank];
            const diff   = (p.score - 30000) / 1000;
            const final_ = diff + uma;
            const finalStr = (final_ >= 0 ? '+' : '') + final_.toFixed(1);
            const umaStr   = uma >= 0 ? `+${uma}` : `${uma}`;
            const finalCol = final_ >= 0 ? '#88ff88' : '#ff8888';

            this.add.text(160, y, rankLabels[rank], {
                fontSize: '26px', color: col, fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(380, y, playerNames[p.index], {
                fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(610, y, `${p.score}点`, {
                fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(810, y, `ウマ${umaStr}`, {
                fontSize: '18px', color: '#aaaaff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(1020, y, finalStr, {
                fontSize: '26px', color: finalCol, fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        // 罫線（下）
        gfx.lineBetween(100, 610, 1180, 610);

        // 精算式の注記
        this.add.text(640, 630, '精算点 = (持ち点 − 30000) ÷ 1000 + ウマ (10-20)',  {
            fontSize: '13px', color: '#666688', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 再プレイボタン
        const btnBg  = this.add.rectangle(640, 680, 200, 50, 0x334466);
        const btnTxt = this.add.text(640, 680, '再プレイ', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        btnBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => btnBg.setFillStyle(0x4455aa))
            .on('pointerout',  () => btnBg.setFillStyle(0x334466))
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}
