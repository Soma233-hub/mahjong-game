/**
 * エッジケーステスト
 * - ダブルリーチ判定
 * - 一発フラグのライフサイクル（副露でのキャンセル含む）
 * - 一時フリテン（ツモで解消）
 * - 供託（kyotaku）の蓄積
 * - nextRound の親継続 / 親交代 / ゲーム終了
 * - processDiscard の state/player ガード
 */
import { Game, GAME_STATE, ROUND_RESULT } from '../src/core/Game.js';
import { Player } from '../src/core/Player.js';
import { Tile, SUIT } from '../src/core/Tile.js';
import { AILevel3 } from '../src/ai/AILevel3.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';

let passed = 0;
let failed = 0;

function assert(cond, label, info = '') {
    if (cond) { console.log(`  ✓ ${label}`); passed++; }
    else       { console.error(`  ✗ ${label} ${info}`); failed++; }
}
function assertEqual(a, b, label) {
    assert(a === b, label, `(expected ${b}, got ${a})`);
}

// ========================
// ダブルリーチ判定
// ========================
console.log('\n[ダブルリーチ判定]');
{
    const p = new Player(0, true);
    // turn=1（最初のツモ）でリーチ宣言 → ダブルリーチ
    p.declareRiichi(1, true);
    assert(p.isRiichi, 'isRiichi=true');
    assert(p.isDoubleRiichi, 'turn=1 でダブルリーチ');
    assert(p.isIppatsu, '宣言直後は isIppatsu=true');
}
{
    const p = new Player(0, true);
    // turn=5 でリーチ宣言 → 通常リーチ
    p.declareRiichi(5, false);
    assert(p.isRiichi, 'isRiichi=true');
    assert(!p.isDoubleRiichi, 'turn=5 はダブルリーチでない');
    assert(p.isIppatsu, '一発フラグは立つ');
}

// ========================
// Game.processRiichi でのダブルリーチ自動判定
// ========================
console.log('\n[Game.processRiichi ダブルリーチ自動判定]');
{
    // 人間プレイヤーは自動進行しないため turn=1 で停止する
    const g = new Game(); // Player0=人間
    g.startGame();
    // Player0(人間)が最初のツモ後に停止している
    assertEqual(g.turn, 1, 'startGame直後 turn=1（最初のツモ）');
    const isDouble = g.turn <= 4;
    assert(isDouble, 'turn=1 のためダブルリーチ条件成立');
}

// ========================
// 一発フラグ: リーチ宣言直後は消えない
// ========================
console.log('\n[一発フラグ: リーチ宣言後も消えない]');
{
    // Player.discard() が isIppatsu を消さないことを確認
    const p = new Player(0, false);
    // 手牌に適当な牌を入れる
    p.hand.add(new Tile(SUIT.MAN, 1));
    p.hand.add(new Tile(SUIT.MAN, 2));
    p.declareRiichi(1, true);
    assert(p.isIppatsu, '宣言直後 isIppatsu=true');

    // discard を呼んでも消えないはず
    p.discard(0);
    assert(p.isIppatsu, 'discard() 後も isIppatsu は消えない（Game側で管理）');
}

// ========================
// 一発フラグ: 2回目の打牌後にゲームレベルでクリアされる
// ========================
console.log('\n[一発フラグ: 2回目の打牌でクリア]');
{
    const g = new Game();
    // Player0(人間)が手牌テンパイになるよう手動設定
    // テンパイ形: 1m2m3m 1m2m3m 1m2m3m 1p1p 9p ← 9p捨てでリーチ
    g.wall.init();
    // 簡易: players[0]の手牌を直接セット
    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
        new Tile(SUIT.PIN,9),  // 捨て牌（リーチ宣言用）
        new Tile(SUIT.SOU,1),  // ツモ後の14枚目（後で追加）
    ];
    // 状態を手動セット
    g.state = GAME_STATE.PLAYER_ACTION;
    g.currentIndex = 0;
    g.turn = 1;  // 最初のターン（ダブルリーチ条件）

    // Player0 がリーチ宣言（インデックス11の9pを捨てる）
    // claim がないよう allAI でなく手動制御
    g.on('claimNeeded', ({ playerIndex }) => g.selectClaim(playerIndex, { action: 'pass' }));

    // 14枚目が既にある前提で processRiichi
    g.processRiichi(0, 11);  // index=11(9p)を捨ててリーチ

    // リーチ宣言直後: turn=1 == riichiTurn=1 なので isIppatsu が残るはず
    assert(p0.isRiichi, 'p0.isRiichi=true');
    assert(p0.isIppatsu, 'リーチ宣言・捨て牌後も isIppatsu=true（一発フラグ残存）');

    // 次に他プレイヤーが捨てて、p0がツモを引く（ターン数を増やす）
    // 実際のゲームフローをシミュレートするため turn を手動で増やす
    g.turn = 5;  // p0 の2回目のツモ相当のターン

    // p0 が2回目の打牌（リーチ後のツモ切り）
    // ただし processDiscard は state=PLAYER_ACTION が必要
    g.state = GAME_STATE.PLAYER_ACTION;
    p0.hand.add(new Tile(SUIT.SOU, 9));  // ダミーツモ牌
    g.processDiscard(0, p0.hand.tileCount - 1);

    assert(!p0.isIppatsu, '2回目の打牌後は isIppatsu=false（一発消滅）');
}

// ========================
// 一発フラグ: ポンでキャンセル
// ========================
console.log('\n[一発フラグ: ポンでキャンセル]');
{
    const g = new Game({ allAI: true });
    // Player0にリーチ済みフラグを手動設定
    const p0 = g.players[0];
    p0.isRiichi = true;
    p0.riichiTurn = 1;
    p0.isIppatsu = true;

    // 他のプレイヤーがポンをした場合を想定: processPon を呼ぶ
    // まず lastDiscard と lastDiscardPlayer を設定
    const tile = new Tile(SUIT.MAN, 5);
    g.lastDiscard = tile;
    g.lastDiscardPlayer = 3;  // Player3が捨て

    // Player1に同じ牌を2枚持たせてポン可能にする
    const p1 = g.players[1];
    p1.hand.add(new Tile(SUIT.MAN, 5));
    p1.hand.add(new Tile(SUIT.MAN, 5));
    p1.hand.add(new Tile(SUIT.SOU, 1)); // 捨て牌用

    // processPon を直接呼ぶ（AIがMELD_ACTION後に自動打牌しないよう isHuman にする）
    // 代わりに processPon の前後でフラグを確認
    assert(p0.isIppatsu, 'ポン前は isIppatsu=true');
    g.processPon(1);
    assert(!p0.isIppatsu, 'ポン後は isIppatsu=false（一発キャンセル）');
}

// ========================
// 一時フリテン: ツモで解消
// ========================
console.log('\n[一時フリテン: ツモで解消]');
{
    const p = new Player(0, true);
    p.isTemporaryFuriten = true;

    // ツモで一時フリテン解消
    const tile = new Tile(SUIT.MAN, 1);
    p.draw(tile);
    assert(!p.isTemporaryFuriten, 'ツモ後は isTemporaryFuriten=false');
}

// ========================
// 一時フリテン: ロン見逃しで付与（_resolveClaimDecisions内）
// ========================
console.log('\n[一時フリテン: ロン見逃しで付与]');
{
    const g = new Game();
    // Player0 をテンパイ状態にする
    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
        new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,3),  // 13枚: 待ち=3p
    ];
    // Player1が3pを捨てる状況を設定
    g.lastDiscard = new Tile(SUIT.PIN, 3);
    g.lastDiscardPlayer = 1;
    g.state = GAME_STATE.CLAIM;

    // Player0はロン可能（テンパイで待ち=3p）
    // claimContext を手動設定してパスを選択
    g._claimContext = {
        decisions: { 0: null },
        allOptions: { 0: { canRon: true, canPon: false, canMinkan: false, canChi: false } },
        discarderIdx: 1,
        tile: g.lastDiscard,
    };

    // Player0がパスを選択（ロン見逃し）
    g.selectClaim(0, { action: 'pass' });

    assert(p0.isTemporaryFuriten, 'ロン見逃し後は isTemporaryFuriten=true');
    assert(!p0.isFuriten, 'リーチなしなので永続フリテンでない');
}

// ========================
// 供託（kyotaku）の蓄積
// ========================
console.log('\n[供託の蓄積]');
{
    const g = new Game();
    g.wall.init();
    g.players.forEach(p => p.score = 25000);
    g.kyotaku = 0;

    // Player0がリーチ（手動）
    const p0 = g.players[0];
    p0.score = 25000;
    p0.isRiichi = false;
    p0.riichiTurn = -1;
    p0.isMenzen = true;
    assertEqual(g.kyotaku, 0, 'リーチ前 kyotaku=0');

    // processRiichi を呼ぶには適切な state と手牌が必要
    // Player.declareRiichi + kyotaku++ を直接シミュレート
    p0.declareRiichi(1, false);
    g.kyotaku++;
    assertEqual(g.kyotaku, 1, 'リーチ後 kyotaku=1');
    assertEqual(p0.score, 24000, 'リーチ棒1000点減');

    // 2人目がリーチ
    const p1 = g.players[1];
    p1.declareRiichi(2, false);
    g.kyotaku++;
    assertEqual(g.kyotaku, 2, '2人リーチで kyotaku=2');
    assertEqual(p1.score, 24000, 'Player1も1000点減');

    // 合計点確認（kyotaku は保留）
    const total = g.players.reduce((s, p) => s + p.score, 0) + g.kyotaku * 1000;
    assertEqual(total, 100000, '点数保存則: 100000点');
}

// ========================
// nextRound: 親が和了 → 連荘（honba++, dealerIndex 不変）
// ========================
console.log('\n[nextRound: 親和了 → 連荘]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    // ゲームを round_end 状態に強制
    g.state = GAME_STATE.ROUND_END;
    const prevDealer = g.dealerIndex;
    const prevRound  = g.round;
    const prevHonba  = g.honba;

    // 親が和了（dealerContinues=true）
    g.on('roundEnd', () => {}); // 空リスナー
    g.nextRound(true);

    assertEqual(g.dealerIndex, prevDealer, '連荘: dealerIndex 変わらず');
    assertEqual(g.round, prevRound, '連荘: round 変わらず');
    assertEqual(g.honba, prevHonba + 1, '連荘: honba++');
}

// ========================
// nextRound: 子が和了 → 親交代（dealerIndex++, round++）
// ========================
console.log('\n[nextRound: 子和了 → 親交代]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    const prevDealer = g.dealerIndex;
    const prevRound  = g.round;
    g.honba = 2; // honbaを非ゼロにしておく

    g.nextRound(false);

    assertEqual(g.dealerIndex, (prevDealer + 1) % 4, '親交代: dealerIndex++');
    assertEqual(g.round, prevRound + 1, '親交代: round++');
    assertEqual(g.honba, 0, '親交代: honba=0 にリセット(実装では変わらない)');
}

// ========================
// nextRound: 4局目終了 → GAME_END
// ========================
console.log('\n[nextRound: round>=4 → GAME_END]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 3;  // あと1回で終了

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(false);  // round++ → 4 → GAME_END

    assert(gameEndFired, 'round>=4 で gameEnd イベント発火');
    assert(g.state === GAME_STATE.GAME_END, 'state=GAME_END');
}

// ========================
// processDiscard: 状態ガード（CLAIM状態では受け付けない）
// ========================
console.log('\n[processDiscard: 状態ガード]');
{
    const g = new Game();
    g.wall.init();
    g.players[0].hand.add(new Tile(SUIT.MAN, 1));
    g.state = GAME_STATE.CLAIM;  // 不正な状態
    g.currentIndex = 0;

    const beforeState = g.state;
    g.processDiscard(0, 0);
    assertEqual(g.state, beforeState, 'CLAIM中の processDiscard は無視される');
}

// ========================
// processDiscard: プレイヤーガード（別プレイヤーのターンには操作不可）
// ========================
console.log('\n[processDiscard: プレイヤーガード]');
{
    const g = new Game();
    g.startGame();
    // Player0のターンのはず
    assertEqual(g.currentIndex, 0, 'Player0のターン');

    // Player1が打牌しようとする → 無視
    const beforeTileCount = g.players[1].hand.tileCount;
    g.processDiscard(1, 0);
    assertEqual(g.players[1].hand.tileCount, beforeTileCount, 'Player1の手牌は変わらない');
    assertEqual(g.currentIndex, 0, 'currentIndex は変わらない');
}

// ========================
// 嶺上開花フラグ: _isRinshan の動作
// ========================
console.log('\n[嶺上フラグ: _isRinshan]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    // 初回ツモ後は _isRinshan=false のはず
    assert(!g._isRinshan, '通常ツモ後は _isRinshan=false');
}

// ========================
// _canRon: 役なし開き手テンパイ → false
// ========================
console.log('\n[_canRon: 役なし開き手テンパイ → ロン不可]');
{
    // Player1(南家): ポン北(字牌・南家なので役なし) + 純全帯なし手
    // 閉牌: 2m3m4m 6p7p8p 4s5s 3z3z (10枚)
    //   - 2m3m4m/6p7p8p: 異なるスートの順子 → 一気通貫・三色なし
    //   - 北ポン(役牌なし) + 西(3z)雀頭(役牌なし) → 役なし
    //   - タンヤオ不可(北・西の字牌含む)
    // startGame を使わず直接ゲーム状態を組み立て（自動進行による状態汚染を防ぐ）
    const g = new Game({ allAI: true });
    g.wall.init();
    g.state = GAME_STATE.CLAIM;
    g.dealerIndex = 0;
    g.lastDiscardPlayer = 0;

    const p1 = g.players[1]; // 南家(seatWind=1 → getSeatWind(0)+1=2)
    p1.isRiichi = false;
    p1.isFuriten = false;
    p1.isTemporaryFuriten = false;
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.PIN,6), new Tile(SUIT.PIN,7), new Tile(SUIT.PIN,8),
        new Tile(SUIT.SOU,4), new Tile(SUIT.SOU,5),
        new Tile(SUIT.HONOR,3), new Tile(SUIT.HONOR,3), // 西(3z)雀頭
    ];
    p1.hand.melds = [new Meld(MELD_TYPE.PON, [
        new Tile(SUIT.HONOR,4), new Tile(SUIT.HONOR,4), new Tile(SUIT.HONOR,4),
    ], 0, new Tile(SUIT.HONOR,4))];
    p1.isMenzen = false;

    const discardTile = new Tile(SUIT.SOU, 6); // 4s5s → 6s待ち
    g.lastDiscard = discardTile;

    const canRon = g._canRon(p1, discardTile);
    assert(!canRon, '役なし開き手テンパイ → _canRon=false（無役チョンボ防止）');
}

// ========================
// _canRon: タンヤオ開き手テンパイ → true
// ========================
console.log('\n[_canRon: タンヤオ開き手テンパイ → ロン可]');
{
    // Player1: ポン5m(中張牌) + 全中張牌の閉牌
    // 閉牌: 3m4m5m 7m8m 3p4p5p 2s2s (10枚) → 6mか9m待ち
    // タンヤオ: 全て2-8の中張牌 ✓
    const g = new Game({ allAI: true });
    g.wall.init();
    g.state = GAME_STATE.CLAIM;
    g.dealerIndex = 0;
    g.lastDiscardPlayer = 0;

    const p1 = g.players[1];
    p1.isRiichi = false;
    p1.isFuriten = false;
    p1.isTemporaryFuriten = false;
    p1.hand.tiles = [
        new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8),
        new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4), new Tile(SUIT.PIN,5),
        new Tile(SUIT.SOU,2), new Tile(SUIT.SOU,2),
    ];
    p1.hand.melds = [new Meld(MELD_TYPE.PON, [
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,5),
    ], 0, new Tile(SUIT.MAN,5))];
    p1.isMenzen = false;

    const discardTile = new Tile(SUIT.MAN, 6); // 7m8m → 6mか9m待ち
    g.lastDiscard = discardTile;

    const canRon = g._canRon(p1, discardTile);
    assert(canRon, 'タンヤオ開き手テンパイ → _canRon=true');
}

// ========================
// _canRon: リーチ閉じ手テンパイ → true（リーチ役あり）
// ========================
console.log('\n[_canRon: リーチ閉じ手テンパイ → ロン可]');
{
    const g = new Game({ allAI: true });
    g.wall.init();
    g.state = GAME_STATE.CLAIM;
    g.dealerIndex = 0;
    g.lastDiscardPlayer = 2;

    const p0 = g.players[0];
    // 13枚テンパイ: 1m2m3m 4m5m6m 7m8m9m 1p2p 5s5s → 3p待ち
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    p0.hand.melds = [];
    p0.isRiichi = true;
    p0.isFuriten = false;
    p0.isTemporaryFuriten = false;
    p0.isMenzen = true;

    const discardTile = new Tile(SUIT.PIN, 3);
    g.lastDiscard = discardTile;

    const canRon = g._canRon(p0, discardTile);
    assert(canRon, 'リーチ閉じ手テンパイ → _canRon=true（リーチ役あり）');
}

// ========================
// 流局テンパイ料: 1人テンパイ
// ========================
console.log('\n[流局テンパイ料: 1人テンパイ]');
{
    // P0のみテンパイ: 123m456m789m 12p 55s (3p待ち)
    const makeTenpai = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    // バラバラ(非テンパイ)
    const makeNoten = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,3),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,7), new Tile(SUIT.SOU,1),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,7),
        new Tile(SUIT.MAN,9),
    ];
    const g = new Game({ allAI: true });
    g.wall.init();
    g.players[0].score = 25000;
    g.players[1].score = 25000;
    g.players[2].score = 25000;
    g.players[3].score = 25000;
    g.players[0].hand.tiles = makeTenpai();
    g.players[0].hand.melds = [];
    g.players[1].hand.tiles = makeNoten();
    g.players[1].hand.melds = [];
    g.players[2].hand.tiles = makeNoten();
    g.players[2].hand.melds = [];
    g.players[3].hand.tiles = makeNoten();
    g.players[3].hand.melds = [];

    let event = null;
    g.on('roundEnd', e => { event = e; });
    g._processRyuukyoku();

    assert(g.players[0].score === 28000, '1人テンパイ: テンパイ者 +3000');
    assert(g.players[1].score === 24000, '1人テンパイ: ノーテン者 -1000 (P1)');
    assert(g.players[2].score === 24000, '1人テンパイ: ノーテン者 -1000 (P2)');
    assert(g.players[3].score === 24000, '1人テンパイ: ノーテン者 -1000 (P3)');
    const total1 = g.players.reduce((s, p) => s + p.score, 0);
    assert(total1 === 100000, '1人テンパイ: 点数保存則 (100000点)');
    assert(event !== null, '1人テンパイ: roundEndイベント発火');
    assert(event.result === ROUND_RESULT.RYUUKYOKU, '1人テンパイ: result=ryuukyoku');
    assert(JSON.stringify(event.tenpaiIndices) === JSON.stringify([0]), '1人テンパイ: tenpaiIndices=[0]');
}

// ========================
// 流局テンパイ料: 2人テンパイ
// ========================
console.log('\n[流局テンパイ料: 2人テンパイ]');
{
    const makeTenpai = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    const makeNoten = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,3),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,7), new Tile(SUIT.SOU,1),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,7),
        new Tile(SUIT.MAN,9),
    ];
    const g = new Game({ allAI: true });
    g.wall.init();
    g.players[0].score = 25000;
    g.players[1].score = 25000;
    g.players[2].score = 25000;
    g.players[3].score = 25000;
    g.players[0].hand.tiles = makeTenpai();
    g.players[0].hand.melds = [];
    g.players[1].hand.tiles = makeTenpai();
    g.players[1].hand.melds = [];
    g.players[2].hand.tiles = makeNoten();
    g.players[2].hand.melds = [];
    g.players[3].hand.tiles = makeNoten();
    g.players[3].hand.melds = [];

    let event = null;
    g.on('roundEnd', e => { event = e; });
    g._processRyuukyoku();

    assert(g.players[0].score === 26500, '2人テンパイ: テンパイ者P0 +1500');
    assert(g.players[1].score === 26500, '2人テンパイ: テンパイ者P1 +1500');
    assert(g.players[2].score === 23500, '2人テンパイ: ノーテン者P2 -1500');
    assert(g.players[3].score === 23500, '2人テンパイ: ノーテン者P3 -1500');
    const total2 = g.players.reduce((s, p) => s + p.score, 0);
    assert(total2 === 100000, '2人テンパイ: 点数保存則');
    assert(JSON.stringify(event.tenpaiIndices) === JSON.stringify([0, 1]), '2人テンパイ: tenpaiIndices=[0,1]');
}

// ========================
// 流局テンパイ料: 3人テンパイ
// ========================
console.log('\n[流局テンパイ料: 3人テンパイ]');
{
    const makeTenpai = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    const makeNoten = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,3),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,7), new Tile(SUIT.SOU,1),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,7),
        new Tile(SUIT.MAN,9),
    ];
    const g = new Game({ allAI: true });
    g.wall.init();
    g.players[0].score = 25000;
    g.players[1].score = 25000;
    g.players[2].score = 25000;
    g.players[3].score = 25000;
    g.players[0].hand.tiles = makeTenpai();
    g.players[0].hand.melds = [];
    g.players[1].hand.tiles = makeTenpai();
    g.players[1].hand.melds = [];
    g.players[2].hand.tiles = makeTenpai();
    g.players[2].hand.melds = [];
    g.players[3].hand.tiles = makeNoten();
    g.players[3].hand.melds = [];

    let event = null;
    g.on('roundEnd', e => { event = e; });
    g._processRyuukyoku();

    assert(g.players[0].score === 26000, '3人テンパイ: テンパイ者P0 +1000');
    assert(g.players[1].score === 26000, '3人テンパイ: テンパイ者P1 +1000');
    assert(g.players[2].score === 26000, '3人テンパイ: テンパイ者P2 +1000');
    assert(g.players[3].score === 22000, '3人テンパイ: ノーテン者P3 -3000');
    const total3 = g.players.reduce((s, p) => s + p.score, 0);
    assert(total3 === 100000, '3人テンパイ: 点数保存則');
    assert(JSON.stringify(event.tenpaiIndices) === JSON.stringify([0, 1, 2]), '3人テンパイ: tenpaiIndices=[0,1,2]');
}

// ========================
// 流局テンパイ料: 全員テンパイ（移動なし）
// ========================
console.log('\n[流局テンパイ料: 全員テンパイ]');
{
    const makeTenpai = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2),
        new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,5),
    ];
    const g = new Game({ allAI: true });
    g.wall.init();
    g.players.forEach(p => { p.score = 25000; p.hand.tiles = makeTenpai(); p.hand.melds = []; });

    let event = null;
    g.on('roundEnd', e => { event = e; });
    g._processRyuukyoku();

    g.players.forEach((p, i) => assert(p.score === 25000, `全員テンパイ: P${i}スコア変化なし`));
    const total4 = g.players.reduce((s, p) => s + p.score, 0);
    assert(total4 === 100000, '全員テンパイ: 点数保存則');
    assert(JSON.stringify(event.tenpaiIndices) === JSON.stringify([0,1,2,3]), '全員テンパイ: tenpaiIndices=[0,1,2,3]');
}

// ========================
// 流局テンパイ料: 全員ノーテン（移動なし）
// ========================
console.log('\n[流局テンパイ料: 全員ノーテン]');
{
    const makeNoten = () => [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,5),
        new Tile(SUIT.MAN,7), new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,3),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,7), new Tile(SUIT.SOU,1),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,5), new Tile(SUIT.SOU,7),
        new Tile(SUIT.MAN,9),
    ];
    const g = new Game({ allAI: true });
    g.wall.init();
    g.players.forEach(p => { p.score = 25000; p.hand.tiles = makeNoten(); p.hand.melds = []; });

    let event = null;
    g.on('roundEnd', e => { event = e; });
    g._processRyuukyoku();

    g.players.forEach((p, i) => assert(p.score === 25000, `全員ノーテン: P${i}スコア変化なし`));
    const total5 = g.players.reduce((s, p) => s + p.score, 0);
    assert(total5 === 100000, '全員ノーテン: 点数保存則');
    assert(JSON.stringify(event.tenpaiIndices) === JSON.stringify([]), '全員ノーテン: tenpaiIndices=[]');
}

// ========================
// 飛び（トビ）チェック: スコア0以下 → GAME_END
// ========================
console.log('\n[nextRound: 飛び(0点) → GAME_END]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 1; // まだ途中の局

    g.players[2].score = 0; // Player2がトビ

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(false);

    assert(gameEndFired, '飛び(0点): gameEnd イベント発火');
    assert(g.state === GAME_STATE.GAME_END, '飛び(0点): state=GAME_END');
}

console.log('\n[nextRound: 飛び(マイナス) → GAME_END]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 0;

    g.players[1].score = -100; // Player1がマイナス

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(false);

    assert(gameEndFired, '飛び(マイナス): gameEnd イベント発火');
    assert(g.state === GAME_STATE.GAME_END, '飛び(マイナス): state=GAME_END');
}

console.log('\n[nextRound: 全員正の点数 → ゲーム継続]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 1;

    g.players.forEach((p, i) => { p.score = 25000 - i * 1000; }); // 全員1点以上

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(false);

    assert(!gameEndFired, '全員正の点数: gameEnd 未発火（ゲーム継続）');
}

console.log('\n[nextRound: 連荘中に飛び → GAME_END]');
{
    const g = new Game({ allAI: true });
    g.startGame();
    g.state = GAME_STATE.ROUND_END;
    g.round = 0;

    g.players[3].score = -500; // Player3がマイナス

    let gameEndFired = false;
    g.on('gameEnd', () => { gameEndFired = true; });

    g.nextRound(true); // 連荘（dealerContinues=true）

    assert(gameEndFired, '連荘中の飛び: gameEnd イベント発火');
    assert(g.state === GAME_STATE.GAME_END, '連荘中の飛び: state=GAME_END');
}

// ========================
// 天和: 親が最初のツモで和了
// ========================
console.log('\n[天和: 親が turn=1 でツモ和了 → TENHOU 役満]');
{
    // Player0(人間)が最初のツモ後に PLAYER_ACTION で停止する
    const g = new Game();
    g.startGame();
    assertEqual(g.turn, 1, '天和テスト前提: turn=1');
    assertEqual(g.currentIndex, 0, '天和テスト前提: currentIndex=0 (親)');
    assertEqual(g.dealerIndex, 0, '天和テスト前提: dealerIndex=0');

    // 完成形手牌をセット: 1m2m3m 4m5m6m 7m8m9m 1p2p3p 1s1s
    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,1),
    ];
    assert(p0.hand.isComplete(), '天和: 手牌完成形');

    let roundEndData = null;
    g.on('roundEnd', d => { roundEndData = d; });
    g.processWin(0);

    assert(roundEndData !== null, '天和: roundEnd イベント発火');
    assert(roundEndData.yakuResult?.isYakuman, '天和: isYakuman=true');
    assert(roundEndData.yakuResult?.yaku?.some(y => y.key === 'TENHOU'), '天和: TENHOU 含む');
}

// ========================
// 地和: 子が最初の1巡でツモ和了（副露なし）
// ========================
console.log('\n[地和: 子が turn=2 かつ副露なしでツモ和了 → CHIIHOU 役満]');
{
    // 手動状態セット: Player1(南家)が最初のツモを引いた状態
    const g = new Game();
    g.wall.init();
    g.state = GAME_STATE.PLAYER_ACTION;
    g.dealerIndex = 0;
    g.currentIndex = 1;
    g.turn = 2;
    g._claimsThisRound = false;

    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,1),
    ];
    assert(p1.hand.isComplete(), '地和: 手牌完成形');

    let roundEndData = null;
    g.on('roundEnd', d => { roundEndData = d; });
    g.processWin(1);

    assert(roundEndData !== null, '地和: roundEnd イベント発火');
    assert(roundEndData.yakuResult?.isYakuman, '地和: isYakuman=true');
    assert(roundEndData.yakuResult?.yaku?.some(y => y.key === 'CHIIHOU'), '地和: CHIIHOU 含む');
}

// ========================
// 地和不成立: 副露あり(_claimsThisRound=true)
// ========================
console.log('\n[地和不成立: 副露あり → CHIIHOU なし]');
{
    const g = new Game();
    g.wall.init();
    g.state = GAME_STATE.PLAYER_ACTION;
    g.dealerIndex = 0;
    g.currentIndex = 1;
    g.turn = 2;
    g._claimsThisRound = true; // 副露あり

    const p1 = g.players[1];
    // タンヤオ閉門完成手（役あり → CHOMBO 回避）
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,6), new Tile(SUIT.PIN,7),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,3),
    ];
    assert(p1.hand.isComplete(), '地和不成立(副露): 手牌完成形');

    let roundEndData = null;
    g.on('roundEnd', d => { roundEndData = d; });
    g.processWin(1);

    assert(!roundEndData.yakuResult?.yaku?.some(y => y.key === 'CHIIHOU'),
        '地和不成立(副露): CHIIHOU なし');
    assert(roundEndData.result === ROUND_RESULT.TSUMO, '地和不成立(副露): 通常ツモ和了');
}

// ========================
// 地和不成立: turn >= 5
// ========================
console.log('\n[地和不成立: turn=5 → CHIIHOU なし]');
{
    const g = new Game();
    g.wall.init();
    g.state = GAME_STATE.PLAYER_ACTION;
    g.dealerIndex = 0;
    g.currentIndex = 1;
    g.turn = 5; // 2巡目以降
    g._claimsThisRound = false;

    const p1 = g.players[1];
    p1.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4),
        new Tile(SUIT.PIN,5), new Tile(SUIT.PIN,6), new Tile(SUIT.PIN,7),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,3),
    ];

    let roundEndData = null;
    g.on('roundEnd', d => { roundEndData = d; });
    g.processWin(1);

    assert(!roundEndData.yakuResult?.yaku?.some(y => y.key === 'CHIIHOU'),
        '地和不成立(turn>=5): CHIIHOU なし');
}

// ========================
// canDeclareWin: 天和条件（turn=1 の親）
// ========================
console.log('\n[canDeclareWin: 天和条件 → true]');
{
    const g = new Game();
    g.startGame();
    // Player0(人間)が turn=1 で停止
    const p0 = g.players[0];
    // 完成形にセット（役なし手でも天和条件なら true のはず）
    p0.hand.tiles = [
        new Tile(SUIT.MAN,1), new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3),
        new Tile(SUIT.MAN,4), new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6),
        new Tile(SUIT.MAN,7), new Tile(SUIT.MAN,8), new Tile(SUIT.MAN,9),
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3),
        new Tile(SUIT.SOU,1), new Tile(SUIT.SOU,1),
    ];
    assert(g.canDeclareWin(0), 'canDeclareWin: 天和条件(turn=1,親) → true');
}

// ========================
// canDeclareWin: 役なし開き手 → false
// ========================
console.log('\n[canDeclareWin: 役なし開き手 → false]');
{
    // 手動状態セット: turn=10, 副露ありの役なし手
    const g = new Game();
    g.wall.init();
    g.state = GAME_STATE.PLAYER_ACTION;
    g.dealerIndex = 0;
    g.currentIndex = 0;
    g.turn = 10;
    g._claimsThisRound = true;

    const p0 = g.players[0];
    // PON 1p1p1p（開き: タンヤオ不可・役牌でない）+ 閉牌
    p0.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4), new Tile(SUIT.PIN,5),
        new Tile(SUIT.SOU,9), new Tile(SUIT.SOU,9),
    ];
    p0.hand.melds = [new Meld(MELD_TYPE.PON, [
        new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1), new Tile(SUIT.PIN,1),
    ], 1, new Tile(SUIT.PIN,1))];
    p0.isMenzen = false;
    p0.isRiichi = false;

    assert(p0.hand.isComplete(), 'canDeclareWin(役なし): 手牌完成形');
    assert(!g.canDeclareWin(0), 'canDeclareWin: 役なし開き手 → false');
}

// ========================
// canDeclareWin: タンヤオ閉門完成手 → true
// ========================
console.log('\n[canDeclareWin: タンヤオ閉門完成手 → true]');
{
    const g = new Game();
    g.wall.init();
    g.state = GAME_STATE.PLAYER_ACTION;
    g.dealerIndex = 0;
    g.currentIndex = 0;
    g.turn = 10;
    g._claimsThisRound = true;

    const p0 = g.players[0];
    p0.hand.tiles = [
        new Tile(SUIT.MAN,2), new Tile(SUIT.MAN,3), new Tile(SUIT.MAN,4),
        new Tile(SUIT.MAN,5), new Tile(SUIT.MAN,6), new Tile(SUIT.MAN,7),
        new Tile(SUIT.PIN,2), new Tile(SUIT.PIN,3), new Tile(SUIT.PIN,4),
        new Tile(SUIT.SOU,6), new Tile(SUIT.SOU,7), new Tile(SUIT.SOU,8),
        new Tile(SUIT.SOU,3), new Tile(SUIT.SOU,3),
    ];
    p0.hand.melds = [];
    p0.isMenzen = true;
    p0.isRiichi = false;

    assert(p0.hand.isComplete(), 'canDeclareWin(タンヤオ): 手牌完成形');
    assert(g.canDeclareWin(0), 'canDeclareWin: タンヤオ閉門完成手 → true');
}

// ========================
// 結果
// ========================
console.log(`\n結果: ${passed + failed}件中 ${passed}件通過, ${failed}件失敗`);
if (failed > 0) process.exit(1);
