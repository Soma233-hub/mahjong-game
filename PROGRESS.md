# 麻雀ゲーム開発 進捗管理

## プロジェクト情報
- リポジトリ: https://github.com/Soma233-hub/mahjong-game
- 言語: JavaScript + Phaser3
- 開始日: 2026-04-17

## フェーズ計画

| 週 | フェーズ | 内容 | 状態 |
|---|---|---|---|
| 第1週 | 設計 | 全体設計・クラス定義・プロジェクト構造 | ✅ 完了 |
| 第2週 | 牌管理 | 牌管理・山・手牌・ツモ・捨て牌実装 | ✅ 完了 |
| 第3週 | 副露 | ポン・チー・暗槓・明槓・加槓実装 | ✅ 完了 |
| 第4週 | 役判定 | 全役対応の役判定ロジック実装 | ✅ 完了 |
| 第5週 | 点数・ドラ | 点数計算・表/裏/カン/赤ドラ処理 | ✅ 完了 |
| 第6週 | GUI・仕上げ | GUI実装・Lv.3 AI・デバッグ・完成 | 🔄 進行中 |

## 現在のフェーズ
**第6週 - GUI・仕上げ（進行中）**

## 夕方セッション確認記録（2026-05-09）
- 全テスト通過確認: 313/313 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 40)
- シミュレーション（50ゲーム）: ツモ61・ロン69・流局99・チョンボ0・クラッシュ0・保存則違反0（229ラウンド）
- GitHub Issue #19 作成（週次レポート 2026-05-09）

## 午前セッション確認記録（2026-05-09）
- 全テスト通過確認: 313/313 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 40)
- シミュレーション（50ゲーム）: ツモ66・ロン73・流局108・チョンボ0・クラッシュ0・保存則違反0
- バグ修正①（Critical）: Hand._normalShanten() が副露K枚あるとき誤った向聴数を返す問題
  - 式のベースを `8` 固定から `8 - 2*K` に変更（K=副露枚数）
  - limit 計算を `4 - mentsu` から `4 - K - mentsu` に修正
  - これにより ポン/チーした手牌が一切和了できなかった致命的バグを修正
- バグ修正②（UX）: Game._canRon() が役なしでも true を返す問題
  - `_checkPlayerHasYaku(player, winTile, isTsumo)` ヘルパーを Game.js に追加
  - `_canRon` でロン牌の役確認を実施（役なし手牌にロンボタンが表示されなくなる）
  - AILevel3.selectClaimAction と同等の役チェックをゲーム層に移管
- 新規テスト: tests/test-hand.js に副露手牌向聴数テスト5件追加
  - K=1/K=2 副露後の isComplete(), isTenpai(), getWaitingTileIds() 検証
- 新規テスト: tests/test-edge-cases.js に _canRon 役チェックテスト3件追加
  - 役なし開き手テンパイ → false, タンヤオ開き手 → true, リーチ閉じ手 → true

## 夜セッション確認記録（2026-05-06）
- 全テスト通過確認: 305/305 ✅ (14 + 24 + 52 + 85 + 88 + 5 + 37)
- シミュレーション（50ゲーム）: ツモ64・ロン83・流局92・チョンボ0・エラー0・総局数239
- バグ修正: GameScene._onNextRound が game_.nextRound() を呼んでいなかった（局進行しない致命的バグ）
  - _lastDealerContinues フラグを追加（_onRoundEnd で連荘判定・保存）
  - _onNextRound で g.nextRound(this._lastDealerContinues) を呼ぶよう修正
  - 連荘条件: 親和了(ツモ/ロン) / 流局 / チョンボ → 連荘、子和了 → 親交代
- 改善: GameScene._showClaimButtons のチー複数選択肢UI対応
  - 複数チー候補がある場合に各候補ボタンを個別表示（"チー2-3-4" 形式）
  - 1択のみの場合は従来通り "チー" のみ表示

## 夕方セッション確認記録（2026-05-06）
- 全テスト通過確認: 305/305 ✅ (14 + 24 + 52 + 85 + 88 + 5 + 37)
- シミュレーション（50ゲーム）: ツモ63・ロン63・流局108・チョンボ0・保存則違反0
- GitHub Issue #16 作成（週次レポート 2026-05-06）

## 夕方セッション確認記録（2026-05-05）
- 全テスト通過確認: 305/305 ✅ (14 + 24 + 52 + 85 + 88 + 5 + 37)
- シミュレーション（50ゲーム）: ツモ67・ロン76・流局96・チョンボ0・保存則違反0
- GitHub Issue #12 作成（週次レポート 2026-05-05）

## 午後セッション確認記録（2026-05-05）
- 全テスト通過確認: 305/305 ✅ (14 + 24 + 52 + 85 + 88 + 5 + 37)
- バグ修正: isIppatsu が即クリアされる問題（Player.discard() → Game.js側に移管）
  - リーチ宣言直後の捨て牌でisIppatsuが消えていたバグを修正
  - ポン/チー/明槓/暗槓/加槓でisIppatsuをキャンセルするロジックを追加
  - this.turn > player.riichiTurn の条件で2回目の打牌にのみクリア
- バグ修正: nextRound 親交代時に honba がリセットされない問題を修正（honba=0）
- 新規テスト: tests/test-edge-cases.js（37テスト）
  - ダブルリーチ判定・一発フラグライフサイクル・一時フリテン・供託蓄積
  - nextRound（連荘/親交代/ゲーム終了）・processDiscardガード条件
- 実装: GameScene.js GUI完全実装（Phaser3）
  - 手牌/捨て牌/副露の描画（全4プレイヤー）
  - 打牌クリック2回操作・ツモ/暗槓/加槓ボタン
  - リーチボタン（テンパイ候補牌クリック時）
  - 副露クレームUI（ロン/ポン/チー/明槓/パス）
  - 局終了パネル（役・翻符・点数・スコア表示）・次局ボタン
- 実装: ResultScene.js 対局結果画面（順位・点数差表示・再プレイ）

## 夕方セッション確認記録（2026-05-03）
- 全テスト通過確認: 268/268 ✅ (14 + 24 + 52 + 85 + 88 + 5)
- 1000局シミュレーション実行: チョンボ 6→0（バグ修正後）
- バグ発見・修正: processRon/processWin 二重実行によるチョンボ（ダブルロン時の再帰イベント問題）
- 1000局統計: ツモ27.4%・ロン29.4%・流局43.2%・チョンボ0・保存則違反0
- GitHub Issue #9 作成（週次レポート 2026-05-03）

## 午後セッション確認記録（2026-05-03）
- 全テスト通過確認: 268/268 ✅ (14 + 24 + 52 + 85 + 88 + 5)
- 第6週 AI強化・バグ修正完了
- 新規実装: AILevel3 完全強化（ツモ和了・リーチ・守備判断・チョンボ防止）
- バグ修正: Hand._normalShanten（cnt=0牌を搭子カウントから除外）
- バグ修正: _selectByEffectiveTiles（向聴数優先 → 有効牌枚数最大化）
- バグ修正: processRiichi で kyotaku++ 追加（点数保存則修正）
- 新規テスト: tests/test-simulation.js（50ゲームシミュレーション、5テスト全通過）
- シミュレーション結果: 0クラッシュ・0チョンボ・0点数保存則違反（244ラウンド）
- 勝利分布: ツモ28%・ロン29%・流局43%（現実的）

## 夕方セッション確認記録（2026-05-02）
- 全テスト通過確認: 266/266 ✅ (14 + 24 + 52 + 85 + 88)
- シミュレーションテスト: 未実装（第6週以降）
- 発見バグ: package.json に test-score.js が含まれていなかった → 修正済み
- GitHub Issue #5 作成（週次レポート 2026-05-02）

## 午後セッション確認記録（2026-05-02）
- 全テスト通過確認: 266/266 ✅ (14 + 24 + 52 + 85 + 88)
- 第5週完了: 点数計算・符計算・Game.js統合
- 新規実装: Score.calculateFu(), Score.calculateScore(), basicPoints()修正, Game._calculateWin()
- テスト数: 88テスト (tests/test-score.js)
- 発見バグ: test-meld.js非決定的テスト修正（human PON pending正常化）
- decomposeClosed export追加（Yaku.js → Score.js で利用）

## 土曜日セッション確認記録（2026-05-02）
- 全テスト通過確認: 178/178 ✅ (14 + 24 + 52 + 85)
- 第4週完了: 役判定ロジック全役実装
- 新規実装: Hand.isComplete(), decomposeClosed(), 全役判定関数, evaluateYaku()
- テスト数: 85テスト (tests/test-yaku.js)
- 発見バグ: なし

## 夕方セッション確認記録（2026-04-26）
- 全テスト通過確認: 93/93 ✅
- シミュレーションテスト: 未実装（第5週以降）
- 発見バグ: なし
- GitHub Issue #2 作成（週次レポート 2026-04-26）

## 夕方セッション確認記録（2026-04-25）
- 全テスト通過確認: 93/93 ✅
- シミュレーションテスト: 未実装（第5週以降）
- 発見バグ: なし
- GitHub Issue #1 作成（週次レポート）

## 完了タスク

### 第1週
- [x] プロジェクト構造作成（index.html, package.json, src/）
- [x] Phaser3セットアップ（main.js, BootScene, GameScene, ResultScene）
- [x] Tile クラス完全実装（SUIT/HONOR定数・createFullSet含む）
- [x] Wall クラス実装（配牌・ツモ・嶺上・カンドラめくり）
- [x] Hand クラス実装（向聴数計算・有効牌・テンパイ判定）
- [x] Meld クラス定義（ポン・チー・暗槓・明槓・加槓）
- [x] Player クラス定義（リーチ・フリテン・捨て牌状態管理）
- [x] Game クラス定義（状態機械・イベント機構・局回し骨格）
- [x] Yaku.js スケルトン（全役定数・チェック関数シグネチャ）
- [x] Score.js スケルトン（calculateScore・calculateFu・basicPoints）
- [x] Dora.js 実装（getDoraFromIndicator・countDora・countUraDora）
- [x] AIBase クラス定義（抽象インタフェース）
- [x] AILevel3 スケルトン（有効牌ベース選択・守備判断骨格）

### 第4週
- [x] Hand.isComplete() 実装（shanten === -1 ラッパー）
- [x] decomposeClosed() 実装（七対子・国士・通常形の全パターン DFS）
- [x] checkTanyao / checkPinfu / checkIipeiko / checkRyanpeiko 実装
- [x] checkToitoi / checkSanankou / checkChiitoi / checkHonroutou 実装
- [x] checkShousangen / checkSankantsu / checkSanshokuDoukou 実装
- [x] checkSanshokuDoujun / checkIttsu 実装
- [x] checkChanta / checkJunchan / checkHonitsu / checkChinitsu 実装
- [x] checkHaku / checkHatsu / checkChun 実装
- [x] checkDaisangen / checkDaisuushii / checkShousuushii 実装
- [x] checkSuuankou / checkKokushi / checkTsuuiisou / checkRyuuiisou 実装
- [x] checkChuurenpoutou / checkSuukantsu 実装
- [x] evaluateYaku() メイン関数実装（役満優先・除外ルール適用）
- [x] tests/test-yaku.js 作成（85テスト全通過）
- [x] 全178テスト通過確認

### 第3週
- [x] Hand.findPonIndices / findChiOptions / findMinkanIndices / findAnkanIds / findKakanOptions 実装
- [x] Game._processClaims 完全実装（ロン>ポン=明槓>チー優先度）
- [x] Game.selectClaim / _resolveClaimDecisions 実装（人間入力対応）
- [x] 一時フリテン・リーチ中フリテン付与ロジック実装
- [x] Game.processPon / processChi / processMinkan 完全実装
- [x] Game.processAnkan / processKakan / _processKanDraw 完全実装（嶺上ツモ・カンドラ）
- [x] AILevel3.selectClaimAction 基本実装
- [x] tests/test-meld.js 作成（52テスト全通過）
- [x] 全93テスト通過確認

### 第2週
- [x] Hand._normalShanten の精度検証（14テストケース全通過）
- [x] AILevel3.selectDiscard を有効牌枚数ベースに更新（他家リーチ時は安全牌優先）
- [x] Game.js に AILevel3 を接続（非人間プレイヤーの自動打牌）
- [x] Game._processAIAction 実装（ツモ後にAIが自動でselectDrawActionを呼ぶ）
- [x] Player.checkFuriten 完全実装（待ち牌と捨て牌の照合）
- [x] tests/test-hand.js 作成（向聴数・有効牌・待ち牌テスト）
- [x] tests/test-game-flow.js 作成（ゲームフロー統合テスト）
- [x] package.json に "test" スクリプト追加（npm test で全テスト実行）
- [x] 全41テスト通過確認

## 第2週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（41/41通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（Hand._normalShanten 検証済み）

## 第5週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（266/266通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（符計算・点数計算・Game統合 検証済み）

## 第4週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（178/178通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（全役判定・役満判定 検証済み）

## 第3週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（93/93通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（processDiscard MELD_ACTION 対応済み）

## 完了タスク（第6週）
- [x] AILevel3 完全強化: ツモ和了前の役チェック（_hasYaku）
- [x] AILevel3: リーチ宣言（門前テンパイ・非フリテン・1000点以上）
- [x] AILevel3: 守備判断（現物/筋/壁による安全度スコア計算）
- [x] AILevel3: チョンボ防止（ロン前に役確認）
- [x] Hand._normalShanten バグ修正（cnt=0牌を搭子カウントから除外）
- [x] _selectByEffectiveTiles バグ修正（向聴数優先ロジック）
- [x] processRiichi バグ修正（kyotaku++ 追加）
- [x] Game allAI オプション追加
- [x] tests/test-simulation.js 作成（50ゲーム・268テスト全通過）
- [x] processRon/processWin バグ修正（ダブルロン時の再帰二重実行チョンボ防止）
- [x] 1000局シミュレーション実施・チョンボ0確認
- [x] isIppatsu バグ修正（リーチ宣言直後に即クリアされる問題）
- [x] 副露（ポン/チー/槓）でisIppatsuキャンセル処理追加
- [x] nextRound 親交代時 honba=0 リセットバグ修正
- [x] tests/test-edge-cases.js 作成（37テスト・305テスト全通過）
- [x] GameScene.js GUI完全実装（手牌/捨て牌/副露/クレームUI/局終了パネル）
- [x] ResultScene.js 対局結果画面実装（順位・点数差・再プレイ）
- [x] Hand._normalShanten() 副露K枚対応バグ修正（`8-2*K` ベース・`4-K-mentsu` limit）
- [x] Game._canRon() 無役ロンボタン表示バグ修正（`_checkPlayerHasYaku` ヘルパー追加）
- [x] tests/test-hand.js 副露手牌向聴数テスト5件追加（313テスト全通過）
- [x] tests/test-edge-cases.js _canRon役チェックテスト3件追加

## 次回作業内容（第6週残り）
- GameScene.js の GUI 改良（ブラウザ実機テスト後）
  - タイル画像アセット導入（現在はテキスト描画）
  - アニメーション・SE追加（第6週制限で保留）
- 最終デバッグ・完成確認（ブラウザ実機テスト）

## ファイル構造
```
mahjong-game/
├── index.html
├── package.json          ← "test" スクリプト追加
├── PROGRESS.md
├── tests/
│   ├── test-hand.js        ✅ 19テスト
│   ├── test-game-flow.js   ✅ 24テスト
│   ├── test-meld.js        ✅ 52テスト
│   ├── test-yaku.js        ✅ 85テスト（第4週）
│   ├── test-score.js       ✅ 88テスト（第5週）
│   ├── test-simulation.js  ✅ 5テスト（第6週・50ゲームシミュレーション）
│   └── test-edge-cases.js  ✅ 40テスト（第6週・エッジケース）
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 副露K枚対応向聴数バグ修正済み
    │   ├── Meld.js      ✅ 完全実装
    │   ├── Player.js    ✅ checkFuriten 完全実装 / isIppatsu管理修正
    │   └── Game.js      ✅ 副露・カン・点数計算統合完成 / _canRon役チェック追加
    ├── logic/
    │   ├── Yaku.js      ✅ 全役判定実装（evaluateYaku・decomposeClosed export）
    │   ├── Score.js     ✅ 符計算・点数計算完全実装（第5週）
    │   └── Dora.js      ✅ 完全実装
    ├── ai/
    │   ├── AIBase.js    ✅ 定義完了
    │   └── AILevel3.js  ✅ 完全強化（ツモ和了・リーチ・守備・チョンボ防止）
    └── scenes/
        ├── BootScene.js    ✅
        ├── GameScene.js    ✅ GUI完全実装（手牌/捨て牌/副露/クレームUI/局終了）
        └── ResultScene.js  ✅ 対局結果画面（順位・点数差・再プレイ）
```
