/**
 * 副露処理テスト（第3週）
 * node tests/test-meld.js で実行
 */
import { Tile, SUIT } from '../src/core/Tile.js';
import { Hand } from '../src/core/Hand.js';
import { Meld, MELD_TYPE } from '../src/core/Meld.js';
import { Game, GAME_STATE } from '../src/core/Game.js';
import { Player } from '../src/core/Player.js';

let passed = 0;
let failed = 0;

function assert(condition, label, info = '') {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.error(`  ✗ ${label}${info ? ' ' + info : ''}`);
        failed++;
    }
}

function assertEqual(actual, expected, label) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    assert(ok, label, ok ? '' : `(expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// 牌を簡易記法で生成: '1m','9p','3s','1z' など
function t(str) {
    const num = parseInt(str[0]);
    const suitMap = { m: SUIT.MAN, p: SUIT.PIN, s: SUIT.SOU, z: SUIT.HONOR };
    return new Tile(suitMap[str[1]], num);
}

function makeHand(strs) {
    const h = new Hand();
    strs.forEach(s => h.add(t(s)));
    return h;
}

// ============================================================
// Hand.findPonIndices
// ============================================================
console.log('\n[findPonIndices]');
{
    const h = makeHand(['1m', '2m', '1m', '3m']);
    const idx = h.findPonIndices(t('1m'));
    assert(idx !== null, '1m×2枚 → null でない');
    assert(idx.length === 2, '結果は2インデックス');
    assert(h.tiles[idx[0]].id === t('1m').id, 'インデックス0が1m');
    assert(h.tiles[idx[1]].id === t('1m').id, 'インデックス1が1m');
}
{
    const h = makeHand(['1m', '2m', '3m']);
    const idx = h.findPonIndices(t('1m'));
    assert(idx === null || idx.length < 2, '1枚しかない場合はnull');
}
{
    const h = makeHand(['1m', '1m', '1m']);
    const idx = h.findPonIndices(t('1m'));
    assert(idx !== null && idx.length === 2, '3枚あっても2インデックスを返す');
}

// ============================================================
// Hand.findChiOptions
// ============================================================
console.log('\n[findChiOptions]');
{
    // 手牌に2m,3m → 1mを捨てた牌として → チーできる [2m,3m]
    const h = makeHand(['2m', '3m', '7p']);
    const opts = h.findChiOptions(t('1m'));
    assert(opts.length >= 1, '1m: 2m+3m でチー可能');
}
{
    // 手牌に1m,3m → 2mでチー可能（1m+3m）
    const h = makeHand(['1m', '3m', '5p']);
    const opts = h.findChiOptions(t('2m'));
    assert(opts.length >= 1, '2m: 1m+3m でチー可能');
}
{
    // 手牌に1m,2m → 3mでチー可能
    const h = makeHand(['1m', '2m', '5p']);
    const opts = h.findChiOptions(t('3m'));
    assert(opts.length >= 1, '3m: 1m+2m でチー可能');
}
{
    // 字牌はチー不可
    const h = makeHand(['1z', '2z', '3z']);
    const opts = h.findChiOptions(t('1z'));
    assert(opts.length === 0, '字牌はチー不可');
}
{
    // 関係ない手牌
    const h = makeHand(['4m', '5m', '9p']);
    const opts = h.findChiOptions(t('1m'));
    assert(opts.length === 0, '構成できない場合は空');
}

// ============================================================
// Hand.findMinkanIndices
// ============================================================
console.log('\n[findMinkanIndices]');
{
    const h = makeHand(['1m', '1m', '1m', '2m']);
    const idx = h.findMinkanIndices(t('1m'));
    assert(idx !== null && idx.length === 3, '3枚で明槓候補あり');
}
{
    const h = makeHand(['1m', '1m', '2m']);
    const idx = h.findMinkanIndices(t('1m'));
    assert(idx === null, '2枚では明槓不可');
}

// ============================================================
// Hand.findAnkanIds
// ============================================================
console.log('\n[findAnkanIds]');
{
    const h = makeHand(['1m', '1m', '1m', '1m', '2m', '3m']);
    const ids = h.findAnkanIds();
    assert(ids.includes(t('1m').id), '1m×4枚で暗槓可能');
}
{
    const h = makeHand(['1m', '1m', '1m', '2m']);
    const ids = h.findAnkanIds();
    assert(!ids.includes(t('1m').id), '3枚では暗槓不可');
}

// ============================================================
// Hand.findKakanOptions
// ============================================================
console.log('\n[findKakanOptions]');
{
    const h = makeHand(['1m', '5p']);
    const ponTiles = [t('5p'), t('5p'), t('5p')];
    h.melds.push(new Meld(MELD_TYPE.PON, ponTiles, 1, t('5p')));
    const opts = h.findKakanOptions();
    assert(opts.length === 1, 'ポン済みで手牌に同牌あり → 加槓オプション1つ');
    assert(opts[0].meldIndex === 0, 'meldIndex=0');
}
{
    const h = makeHand(['1m', '2m']);
    h.melds.push(new Meld(MELD_TYPE.PON, [t('5p'), t('5p'), t('5p')], 1, t('5p')));
    const opts = h.findKakanOptions();
    assert(opts.length === 0, '手牌に同牌なし → 加槓不可');
}

// ============================================================
// Game.processPon
// ============================================================
console.log('\n[Game.processPon]');
{
    const g = new Game();
    // プレイヤー2の手牌に 2m×2 を置く
    g.players[2].hand.tiles = [t('2m'), t('2m'), t('3m'), t('4m'), t('5m'),
                                t('6m'), t('7m'), t('8m'), t('9m'), t('1p'),
                                t('2p'), t('3p'), t('4p')];
    g.lastDiscard       = t('2m');
    g.lastDiscardPlayer = 0;
    g.state             = GAME_STATE.CLAIM;

    g.processPon(2);

    const p2 = g.players[2];
    assert(p2.hand.melds.length === 1, 'ポン後 meld 1つ');
    assertEqual(p2.hand.melds[0].type, MELD_TYPE.PON, 'meld type = pon');
    assert(p2.hand.melds[0].tiles.length === 3, 'ポン牌3枚');
    assert(!p2.isMenzen, 'isMenzen=false');
    // 手牌: 13-2=11枚、AIが自動打牌して10枚になるはず
    assert(p2.hand.tileCount === 10, `AI自動打牌後10枚 (got ${p2.hand.tileCount})`);
}

// ============================================================
// Game.processChi
// ============================================================
console.log('\n[Game.processChi]');
{
    const g = new Game();
    // プレイヤー1（プレイヤー0の左隣）の手牌に 2m,3m を置く
    g.players[1].hand.tiles = [t('2m'), t('3m'), t('4m'), t('5m'), t('6m'),
                                t('7m'), t('8m'), t('9m'), t('1p'), t('2p'),
                                t('3p'), t('4p'), t('5p')];
    g.lastDiscard       = t('1m');
    g.lastDiscardPlayer = 0;
    g.state             = GAME_STATE.CLAIM;

    // 手牌インデックス0(2m),1(3m) でチー
    g.processChi(1, [0, 1]);

    const p1 = g.players[1];
    assert(p1.hand.melds.length === 1, 'チー後 meld 1つ');
    assertEqual(p1.hand.melds[0].type, MELD_TYPE.CHI, 'meld type = chi');
    assert(p1.hand.melds[0].tiles.length === 3, 'チー牌3枚(ソート済み)');
    assert(!p1.isMenzen, 'isMenzen=false');
    assert(p1.hand.tileCount === 10, `AI自動打牌後10枚 (got ${p1.hand.tileCount})`);
}

// ============================================================
// Game.processMinkan
// ============================================================
console.log('\n[Game.processMinkan]');
{
    const g = new Game();
    // プレイヤー2の手牌に 3p×3
    g.players[2].hand.tiles = [t('3p'), t('3p'), t('3p'), t('1m'), t('2m'),
                                t('3m'), t('4m'), t('5m'), t('6m'), t('7m'),
                                t('8m'), t('9m'), t('1s')];
    g.lastDiscard       = t('3p');
    g.lastDiscardPlayer = 0;
    g.state             = GAME_STATE.CLAIM;

    const dorasBefore = g.wall.doraIndicators.length;
    g.processMinkan(2);

    const p2 = g.players[2];
    assert(p2.hand.melds.length === 1, '明槓後 meld 1つ');
    assertEqual(p2.hand.melds[0].type, MELD_TYPE.MINKAN, 'meld type = minkan');
    assert(p2.hand.melds[0].tiles.length === 4, '明槓牌4枚');
    assert(g.wall.doraIndicators.length === dorasBefore + 1, 'カンドラが1枚追加');
    // 明槓後に嶺上ツモ+AI打牌 → 手牌10枚
    assert(p2.hand.tileCount === 10, `嶺上ツモ+AI打牌後10枚 (got ${p2.hand.tileCount})`);
}

// ============================================================
// Game.processAnkan
// ============================================================
console.log('\n[Game.processAnkan]');
{
    const g = new Game();
    g.wall.init(); // 嶺上牌を有効化
    // プレイヤー0（人間）の手牌に 7s×4 + 残り10枚
    const tiles = [t('7s'), t('7s'), t('7s'), t('7s'),
                   t('1m'), t('2m'), t('3m'), t('4m'), t('5m'),
                   t('6m'), t('7m'), t('8m'), t('9m'), t('1p')];
    g.players[0].hand.tiles = tiles;
    g.currentIndex = 0;
    g.state = GAME_STATE.PLAYER_ACTION;

    const dorasBefore = g.wall.doraIndicators.length;
    g.processAnkan(0, t('7s').id);

    const p0 = g.players[0];
    assert(p0.hand.melds.length === 1, '暗槓後 meld 1つ');
    assertEqual(p0.hand.melds[0].type, MELD_TYPE.ANKAN, 'meld type = ankan');
    assert(p0.hand.melds[0].tiles.length === 4, '暗槓牌4枚');
    assert(g.wall.doraIndicators.length === dorasBefore + 1, 'カンドラが1枚追加');
    // 暗槓後に嶺上ツモ → 手牌11枚（10+1）、人間なのでそこで止まる
    assert(p0.hand.tileCount === 11, `嶺上ツモ後11枚 (got ${p0.hand.tileCount})`);
    assertEqual(g.state, GAME_STATE.PLAYER_ACTION, '状態=PLAYER_ACTION(人間打牌待ち)');
}

// ============================================================
// Game.processKakan
// ============================================================
console.log('\n[Game.processKakan]');
{
    const g = new Game();
    g.wall.init(); // 嶺上牌を有効化
    const p0 = g.players[0];
    // ポン済み状態を作る: 手牌10枚 + pon meld
    p0.hand.tiles = [t('5p'), t('1m'), t('2m'), t('3m'), t('4m'),
                     t('6m'), t('7m'), t('8m'), t('9m'), t('1s')];
    p0.hand.melds = [new Meld(MELD_TYPE.PON, [t('8p'), t('8p'), t('8p')], 1, t('8p'))];
    p0.isMenzen = false;

    // ツモ（8p を引いた想定）
    p0.hand.tiles.unshift(t('8p')); // 先頭に追加して11枚
    g.currentIndex = 0;
    g.state = GAME_STATE.PLAYER_ACTION;

    const dorasBefore = g.wall.doraIndicators.length;
    g.processKakan(0, 0); // meldIndex=0 (ポン)

    assert(p0.hand.melds.length === 1, '加槓後もmeld 1つ');
    assertEqual(p0.hand.melds[0].type, MELD_TYPE.KAKAN, 'meld type = kakan');
    assert(p0.hand.melds[0].tiles.length === 4, '加槓牌4枚');
    assert(g.wall.doraIndicators.length === dorasBefore + 1, 'カンドラが1枚追加');
    // 加槓後に嶺上ツモ → 手牌11枚
    assert(p0.hand.tileCount === 11, `嶺上ツモ後11枚 (got ${p0.hand.tileCount})`);
}

// ============================================================
// _processClaims: 請求なしのケース
// ============================================================
console.log('\n[_processClaims: 請求なし]');
{
    const g = new Game();
    g.startGame();
    // ゲームが起動し、AIが打牌した後 CLAIM 状態になっているはずなので
    // 単純に lastDiscard を設定して _processClaims を呼ぶ
    // (全員パスなので次ターンへ進むことを確認)
    // startGame() では人間のアクション待ちなので手動で discard する
    // プレイヤー0（人間）の最初のアクション
    if (g.state === GAME_STATE.PLAYER_ACTION && g.currentIndex === 0) {
        g.processDiscard(0, 0);
        // CLAIMが残っている場合はhuman判断待ち（_claimContextあり）のみ許容
        // AIチェーン後にPlayer0がPON/CHI可能になるケースは正常動作
        const claimOk = g.state !== GAME_STATE.CLAIM || g._claimContext !== null;
        assert(claimOk, '全員パスでCLAIMから抜けた（またはhuman pending正常）');
    } else {
        assert(false, 'startGame後にプレイヤー0がPLAYER_ACTION待ちでない');
    }
}

// ============================================================
// 一時フリテン（ロンスルー時）
// ============================================================
console.log('\n[一時フリテン: ロンスルー]');
{
    const g = new Game();
    const p1 = g.players[1];
    // プレイヤー1をテンパイ状態にする: 123m 456m 789m 12p 待ち3p
    p1.hand.tiles = [t('1m'), t('2m'), t('3m'), t('4m'), t('5m'), t('6m'),
                     t('7m'), t('8m'), t('9m'), t('1p'), t('2p'), t('1s'), t('2s')];
    // 上記はテンパイでない。簡単なテンパイ手: 123m456m789m 12p 1s → 待ち3p, 3s のような形
    // より単純: 123m 456m 789m 11p で待ち1pペア確定形にする
    // 2向聴以上はロンすら引っかからないので、ここでは_canRon のロジックを直接テスト

    // 簡単なテストケース: player.isFuriten が付与されるか
    // → ロン可能な hand を設定してスルー
    p1.hand.tiles = [t('1m'), t('2m'), t('3m'), t('4m'), t('5m'), t('6m'),
                     t('7m'), t('8m'), t('9m'), t('1p'), t('2p'), t('1s'), t('1s')];
    // isTenpai を確認
    const waits1 = p1.hand.getWaitingTileIds();
    // 3p(id=11) が待ちにあるかチェック
    const threePin = t('3p').id;

    if (!waits1.includes(threePin)) {
        // 手牌を調整: 13枚で 3p 待ちのテンパイ
        p1.hand.tiles = [t('1m'), t('2m'), t('3m'), t('4m'), t('5m'), t('6m'),
                         t('7m'), t('8m'), t('9m'), t('1p'), t('2p'), t('5s'), t('5s')];
    }

    const waits2 = p1.hand.getWaitingTileIds();
    if (waits2.includes(threePin)) {
        assert(!p1.isTemporaryFuriten, 'ロンスルー前はフリテンなし');

        // _canRon をテスト
        const canRon = g._canRon(p1, t('3p'));
        assert(canRon, 'テンパイ中に3pが捨てられたらロン可能');

        // ロンスルー: _claimContext を手動設定して_resolveClaimDecisions を呼ぶ
        g._claimContext = {
            decisions: { 1: { action: 'pass' } },
            allOptions: { 1: { canRon: true, canPon: false, canMinkan: false, canChi: false } },
            discarderIdx: 0,
            tile: t('3p'),
        };
        g._resolveClaimDecisions();

        assert(p1.isTemporaryFuriten, 'ロンスルー後に一時フリテンが付与される');
    } else {
        assert(false, 'テンパイ手の設定失敗 - テスト手を見直す必要あり');
    }
}

// ============================================================
// リーチ中のフリテン（スルーで永続）
// ============================================================
console.log('\n[リーチ中フリテン]');
{
    const g = new Game();
    const p2 = g.players[2];
    p2.isRiichi = true;
    p2.hand.tiles = [t('1m'), t('2m'), t('3m'), t('4m'), t('5m'), t('6m'),
                     t('7m'), t('8m'), t('9m'), t('1p'), t('2p'), t('5s'), t('5s')];

    const waits = p2.hand.getWaitingTileIds();
    const threePin = t('3p').id;

    if (waits.includes(threePin)) {
        g._claimContext = {
            decisions: { 2: { action: 'pass' } },
            allOptions: { 2: { canRon: true, canPon: false, canMinkan: false, canChi: false } },
            discarderIdx: 1,
            tile: t('3p'),
        };
        g._resolveClaimDecisions();

        assert(p2.isFuriten, 'リーチ中スルー → 永続フリテン付与');
        assert(!p2.isTemporaryFuriten, '一時フリテンではなく永続フリテン');
    } else {
        assert(false, 'リーチフリテンテスト: テンパイ手の設定失敗');
    }
}

// ============================================================
// processDiscard が MELD_ACTION でも動作
// ============================================================
console.log('\n[MELD_ACTION での打牌]');
{
    const g = new Game();
    const p0 = g.players[0];
    p0.hand.tiles = [t('1m'), t('2m'), t('3m'), t('4m'), t('5m'),
                     t('6m'), t('7m'), t('8m'), t('9m'), t('1p'), t('5s')];
    g.currentIndex = 0;
    g.state = GAME_STATE.MELD_ACTION;

    g.processDiscard(0, 0); // 1m を捨てる
    assert(g.state !== GAME_STATE.MELD_ACTION, 'MELD_ACTIONから打牌してCLAIMへ移行');
    assert(p0.hand.tileCount === 10, `打牌後10枚 (got ${p0.hand.tileCount})`);
}

// ============================================================
// 結果
// ============================================================
console.log(`\n結果: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
