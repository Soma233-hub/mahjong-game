export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.players      = data.players      || [];
        this._p0Agari     = data.p0Agari      ?? 0;
        this._totalRounds = data.totalRounds  ?? 0;
        this._roundLog    = data.roundLog     ?? [];
    }

    // localStorage から通算成績を読み込み、今局分を加算して保存。保存後の stats を返す。
    _updateStats(p0Score, isRank1) {
        let stats = {};
        try { stats = JSON.parse(localStorage.getItem('mahjong_stats') || '{}'); } catch (_) {}
        stats.games    = (stats.games    || 0) + 1;
        stats.rank1    = (stats.rank1    || 0) + (isRank1 ? 1 : 0);
        stats.agari    = (stats.agari    || 0) + this._p0Agari;
        stats.rounds   = (stats.rounds   || 0) + this._totalRounds;
        stats.scoreSum = (stats.scoreSum || 0) + p0Score;
        try { localStorage.setItem('mahjong_stats', JSON.stringify(stats)); } catch (_) {}
        return stats;
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
        const settings = this.registry.get('gameSettings') ?? {};
        const umaRule = settings.umaRule ?? '10-20';
        const umaTable = umaRule === '10-20' ? [20, 10, -10, -20] : [0, 0, 0, 0];

        // 列ヘッダー（左側ランキング: x=80-630）
        [
            [110, '順位'], [220, 'プレイヤー'], [340, '持ち点'],
            [460, 'ウマ'], [570, '精算点'],
        ].forEach(([x, label]) => {
            this.add.text(x, 148, label, {
                fontSize: '14px', color: '#666688', fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        // 罫線（上）
        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x444466, 1);
        gfx.lineBetween(80, 165, 630, 165);

        sorted.forEach((p, rank) => {
            const y      = 210 + rank * 100;
            const col    = rankColors[rank];
            const uma    = umaTable[rank];
            const diff   = (p.score - 30000) / 1000;
            const final_ = diff + uma;
            const finalStr = (final_ >= 0 ? '+' : '') + final_.toFixed(1);
            const umaStr   = umaRule === 'none' ? '−' : (uma >= 0 ? `+${uma}` : `${uma}`);
            const finalCol = final_ >= 0 ? '#88ff88' : '#ff8888';

            this.add.text(110, y, rankLabels[rank], {
                fontSize: '22px', color: col, fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(220, y, playerNames[p.index], {
                fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(340, y, `${p.score}点`, {
                fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(460, y, `ウマ${umaStr}`, {
                fontSize: '16px', color: '#aaaaff', fontFamily: 'monospace',
            }).setOrigin(0.5);

            this.add.text(570, y, finalStr, {
                fontSize: '22px', color: finalCol, fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        // 罫線（下）
        gfx.lineBetween(80, 610, 630, 610);

        // ---- 右側: 局ログパネル（x=650-1240） ----
        gfx.lineStyle(1, 0x444466, 1);
        gfx.lineBetween(650, 90, 650, 610);   // 縦区切り線
        gfx.lineBetween(650, 165, 1240, 165); // 横区切り線（ヘッダー下）

        this.add.text(950, 148, '局ログ', {
            fontSize: '14px', color: '#666688', fontFamily: 'monospace',
        }).setOrigin(0.5);

        const logEntries = this._roundLog.slice(-16); // 最大16局分
        const rowH = Math.min(26, logEntries.length > 0 ? Math.floor(430 / logEntries.length) : 26);
        logEntries.forEach((entry, i) => {
            const ey       = 178 + i * rowH;
            const deltaStr = entry.p0Delta === 0 ? '±0'
                           : entry.p0Delta > 0  ? `+${entry.p0Delta}`
                           : `${entry.p0Delta}`;
            const deltaCol = entry.p0Delta > 0 ? '#88ff88'
                           : entry.p0Delta < 0 ? '#ff8888' : '#888888';

            this.add.text(665, ey, entry.label, {
                fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
            }).setOrigin(0, 0.5);

            this.add.text(735, ey, entry.resultStr, {
                fontSize: '13px', color: '#dddddd', fontFamily: 'monospace',
            }).setOrigin(0, 0.5);

            if (entry.yakuShort) {
                this.add.text(900, ey, entry.yakuShort, {
                    fontSize: '11px', color: '#99bbdd', fontFamily: 'monospace',
                }).setOrigin(0, 0.5);
            }

            this.add.text(1230, ey, deltaStr, {
                fontSize: '13px', color: deltaCol, fontFamily: 'monospace',
            }).setOrigin(1, 0.5);
        });

        // 精算式の注記（左側に配置）
        const formula = umaRule === '10-20'
            ? '(持ち点−30000)÷1000 + ウマ(10-20)'
            : '(持ち点−30000)÷1000  (ウマなし)';
        this.add.text(355, 622, formula, {
            fontSize: '12px', color: '#666688', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 通算成績
        const p0       = this.players.find(p => p.index === 0);
        const p0Score  = p0?.score ?? 25000;
        const isRank1  = sorted[0]?.index === 0;
        const stats    = this._updateStats(p0Score, isRank1);

        const rank1Rate = stats.games  ? (stats.rank1 / stats.games  * 100).toFixed(1) : '0.0';
        const agariRate = stats.rounds ? (stats.agari / stats.rounds * 100).toFixed(1) : '0.0';
        const avgScore  = stats.games  ? Math.round(stats.scoreSum / stats.games) : 0;

        this.add.text(355, 645,
            `通算 ${stats.games}局  1位率 ${rank1Rate}%  和了率 ${agariRate}%  平均 ${avgScore}点`,
            { fontSize: '12px', color: '#888899', fontFamily: 'monospace' }
        ).setOrigin(0.5);

        // 再プレイボタン
        const replayBg  = this.add.rectangle(220, 692, 180, 44, 0x334466);
        const replayTxt = this.add.text(220, 692, '再プレイ', {
            fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        replayBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => replayBg.setFillStyle(0x4455aa))
            .on('pointerout',  () => replayBg.setFillStyle(0x334466))
            .on('pointerdown', () => this.scene.start('GameScene'));

        // 7-D: タイトルへボタン
        const titleBg  = this.add.rectangle(490, 692, 180, 44, 0x334433);
        const titleTxt = this.add.text(490, 692, 'タイトルへ', {
            fontSize: '18px', color: '#ccffcc', fontFamily: 'monospace',
        }).setOrigin(0.5);

        titleBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => titleBg.setFillStyle(0x446644))
            .on('pointerout',  () => titleBg.setFillStyle(0x334433))
            .on('pointerdown', () => this.scene.start('BootScene'));
    }
}
