export default class ResultScene extends Phaser.Scene {
    constructor() { super('ResultScene'); }

    init(data) {
        this.players      = data.players      || [];
        this._p0Agari     = data.p0Agari      ?? 0;
        this._totalRounds = data.totalRounds  ?? 0;
        this._roundLog    = data.roundLog     ?? [];
        this._logPopupObjs = [];
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
            const umaStr   = umaRule === 'none' ? '−' : (uma >= 0 ? `+${uma}` : `${uma}`);
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
        const formula = umaRule === '10-20'
            ? '精算点 = (持ち点 − 30000) ÷ 1000 + ウマ (10-20)'
            : '精算点 = (持ち点 − 30000) ÷ 1000  (ウマなし)';
        this.add.text(640, 622, formula, {
            fontSize: '13px', color: '#666688', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 通算成績
        const p0       = this.players.find(p => p.index === 0);
        const p0Score  = p0?.score ?? 25000;
        const isRank1  = sorted[0]?.index === 0;
        const stats    = this._updateStats(p0Score, isRank1);

        const rank1Rate = stats.games  ? (stats.rank1 / stats.games  * 100).toFixed(1) : '0.0';
        const agariRate = stats.rounds ? (stats.agari / stats.rounds * 100).toFixed(1) : '0.0';
        const avgScore  = stats.games  ? Math.round(stats.scoreSum / stats.games) : 0;

        this.add.text(640, 645,
            `通算 ${stats.games}局  1位率 ${rank1Rate}%  和了率 ${agariRate}%  平均得点 ${avgScore}点`,
            { fontSize: '12px', color: '#888899', fontFamily: 'monospace' }
        ).setOrigin(0.5);

        // 8-D: 局ログボタン
        const logBg  = this.add.rectangle(190, 692, 200, 50, 0x334455);
        const logTxt = this.add.text(190, 692, '局ログ ▼', {
            fontSize: '20px', color: '#aaddff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        logBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => logBg.setFillStyle(0x446688))
            .on('pointerout',  () => logBg.setFillStyle(0x334455))
            .on('pointerdown', () => this._showRoundLogPopup());

        // 再プレイボタン
        const replayBg  = this.add.rectangle(490, 692, 200, 50, 0x334466);
        const replayTxt = this.add.text(490, 692, '再プレイ', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5);

        replayBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => replayBg.setFillStyle(0x4455aa))
            .on('pointerout',  () => replayBg.setFillStyle(0x334466))
            .on('pointerdown', () => this.scene.start('GameScene'));

        // 7-D: タイトルへボタン
        const titleBg  = this.add.rectangle(790, 692, 200, 50, 0x334433);
        const titleTxt = this.add.text(790, 692, 'タイトルへ', {
            fontSize: '20px', color: '#ccffcc', fontFamily: 'monospace',
        }).setOrigin(0.5);

        titleBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => titleBg.setFillStyle(0x446644))
            .on('pointerout',  () => titleBg.setFillStyle(0x334433))
            .on('pointerdown', () => this.scene.start('BootScene'));
    }

    // 8-D: 局別結果ポップアップ表示
    _showRoundLogPopup() {
        this._closeRoundLogPopup();

        const PW = 860, PH = 560;
        const PX = 640, PY = 360;
        const PL = PX - PW / 2;  // 210
        const PT = PY - PH / 2;  // 80

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.78).setInteractive();
        const panel   = this.add.rectangle(PX, PY, PW, PH, 0x0d0d1e).setStrokeStyle(2, 0x556688);

        const title = this.add.text(PX, PT + 28, '局ごとの結果', {
            fontSize: '20px', color: '#ffee44', fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 閉じるボタン
        const closeBg  = this.add.rectangle(PL + PW - 28, PT + 24, 38, 30, 0x553333);
        const closeTxt = this.add.text(PL + PW - 28, PT + 24, '×', {
            fontSize: '18px', color: '#ff8888', fontFamily: 'monospace',
        }).setOrigin(0.5);
        closeBg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._closeRoundLogPopup());
        overlay.on('pointerdown', () => this._closeRoundLogPopup());

        // 列ヘッダー
        const COL = [PL + 55, PL + 230, PL + 490, PL + 690, PL + 820];
        const HDR_Y = PT + 62;
        const headers = [['局', '#aaaaaa'], ['結果', '#aaaaaa'], ['得点変動', '#aaaaaa'], ['残点', '#aaaaaa']];
        headers.forEach(([lbl, col], i) => {
            this.add.text(COL[i], HDR_Y, lbl, {
                fontSize: '13px', color: col, fontFamily: 'monospace',
            }).setOrigin(0.5);
        });

        const gfx = this.add.graphics();
        gfx.lineStyle(1, 0x334455);
        gfx.lineBetween(PL + 12, HDR_Y + 14, PL + PW - 12, HDR_Y + 14);

        // データ行
        const playerNames = ['自分', '右', '対面', '左'];
        const windChars   = ['東', '南', '西', '北'];
        let ry = HDR_Y + 28;

        const rowObjs = [];
        for (const entry of this._roundLog) {
            const wind   = windChars[Math.floor(entry.round / 4)] ?? '?';
            const num    = (entry.round % 4) + 1;
            const roundLabel = `${wind}${num}局`;

            let resultLabel;
            if (entry.result === 'tsumo') {
                resultLabel = entry.winnerIndex === 0 ? 'ツモ和了' : `${playerNames[entry.winnerIndex]}ツモ`;
            } else if (entry.result === 'ron') {
                if (entry.winnerIndex === 0)      resultLabel = 'ロン和了';
                else if (entry.discarderIndex === 0) resultLabel = `振込→${playerNames[entry.winnerIndex]}`;
                else                              resultLabel = `${playerNames[entry.winnerIndex]}ロン`;
            } else if (entry.result === 'ryuukyoku') {
                resultLabel = '流局';
            } else {
                resultLabel = 'チョンボ';
            }

            const deltaStr = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
            const deltaCol = entry.delta > 0 ? '#88ff88' : entry.delta < 0 ? '#ff8888' : '#aaaaaa';
            const scoreStr = `${entry.p0ScoreAfter}`;

            rowObjs.push(
                this.add.text(COL[0], ry, roundLabel, { fontSize: '14px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5),
                this.add.text(COL[1], ry, resultLabel, { fontSize: '13px', color: '#dddddd', fontFamily: 'monospace' }).setOrigin(0.5),
                this.add.text(COL[2], ry, deltaStr,    { fontSize: '14px', color: deltaCol,  fontFamily: 'monospace' }).setOrigin(0.5),
                this.add.text(COL[3], ry, scoreStr,    { fontSize: '13px', color: '#aabbcc', fontFamily: 'monospace' }).setOrigin(0.5),
            );
            ry += 25;
        }

        if (this._roundLog.length === 0) {
            rowObjs.push(this.add.text(PX, PT + 120, '（ログなし）', {
                fontSize: '14px', color: '#666677', fontFamily: 'monospace',
            }).setOrigin(0.5));
        }

        this._logPopupObjs = [overlay, panel, title, closeBg, closeTxt, gfx, ...rowObjs];
    }

    // 8-D: ポップアップ閉じる
    _closeRoundLogPopup() {
        this._logPopupObjs.forEach(o => o.destroy());
        this._logPopupObjs = [];
    }
}
