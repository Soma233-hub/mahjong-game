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

## 夜間セッション確認記録（2026-05-14 第2回）
- 全テスト通過確認: 367/367 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 79 + 15)
- バグ修正①（ゲームロジック）: 飛び（トビ）チェック追加
  - Game.js `nextRound()` に `players.some(p => p.score <= 0)` 判定を追加
  - 0点・マイナス点プレイヤーが発生したら即 GAME_END（連荘中も対応）
  - TDD: test-edge-cases.js に飛びテスト7件追加（4ケース: 0点・マイナス・全員正・連荘飛び）
- バグ修正②（GUI）: 局終了パネルの「次局へ」ボタン配置バグ修正
  - 修正前: パネル(高220, y=[250,470]) に対してボタンが y=490 で**パネル外**
  - 修正後: パネル高を280に拡大(y=[220,500])、ボタンを y=468 に移動（パネル内）
  - テキスト位置も y=345 → y=335 に微調整
- 改善（GUI）: ラウンド開始時に全プレイヤー手牌を確実に描画
  - `_onNextRound()` で `nextRound()` 呼び出し後、全4プレイヤーの `_renderHand()` を実行
  - P0が親（最初にツモ）の場合、P1/P2/P3の伏せ手牌が未描画になる問題を解消
  - 飛びによる GAME_END 時は描画をスキップするガードも追加

## 夜間セッション確認記録（2026-05-14）
- 全テスト通過確認: 360/360 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 72 + 15)
- バグ発見・修正: f27bba8コミットでテストファイルが未コミットだった問題を修正
  - tests/test-edge-cases.js: 流局テンパイ料テスト32件追加（1人/2人/3人/全員テンパイ/全員ノーテン）
  - tests/test-ai.js: AILevel3テスト15件新規作成・コミット（selectClaimAction・_shantenAfterClaim・selectDrawAction）
  - package.jsonのtest-ai.js参照を正式に復元
- 前セッション(5/13)の修正: test-ai.js参照を一時削除してnpm test修復（313件）→ 本日ファイル本体を作成して再追加

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
- 全テスト通過確認: 305/305 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 37)
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

## 完了タスク（第6週追加 - 午後2026-05-17）
- [x] Yaku.js KOKUSHI_TANKI（国士無双十三面待ち）ダブル役満追加
- [x] Yaku.js CHUURENPOUTOU_PURE（純正九連宝燈）ダブル役満追加
- [x] evaluateYaku 十三面待ち判定・純正九連宝燈判定実装
- [x] Player.js riichiDiscardCount フィールド追加（現物判定用）
- [x] AILevel3.js _safetyVsPlayer 現物判定バグ修正（全捨て牌→リーチ後のみ）
- [x] test-yaku.js 国士無双十三面待ち・純正九連宝燈テスト 16件追加
- [x] test-ai.js riichiDiscardCount・_safetyVsPlayer テスト 6件追加
- [x] 全469テスト通過確認

## 完了タスク（第6週追加）
- [x] 槍槓（チャンカン）RON 完全実装: `_canChankan` / `_processChankanClaims` / `_executeKakan` / `_completePendingKakan`
- [x] `_checkPlayerHasYaku` に `extraContext` 引数追加（isChankan 上書き対応）
- [x] `_calculateWin` の `isChankan` を `this._isChankan` フラグで制御
- [x] tests/test-edge-cases.js 槍槓テスト 17件追加（404テスト全通過）

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
- [x] _processRyuukyoku() テンパイ料（ノーテン罰符）実装
- [x] test-simulation.js 流局・チョンボ連荘判定ミス修正
- [x] tests/test-edge-cases.js 流局テンパイ料テスト32件追加（1人/2人/3人テンパイ・全員テンパイ・全員ノーテン）
- [x] tests/test-ai.js 新規作成: AILevel3テスト15件（selectClaimAction・_shantenAfterClaim・selectDrawAction）
- [x] GameScene.js 流局パネル テンパイプレイヤー表示 / 全員テンパイ表示対応
- [x] GameScene.js 対戦相手副露描画オーバーラップ修正（Player1/2/3）
- [x] Game.js nextRound() 飛び（トビ）チェック追加（score≤0 → GAME_END）
- [x] tests/test-edge-cases.js 飛びテスト7件追加（TDD・Redフェーズ確認済み）367テスト全通過
- [x] GameScene.js 局終了パネル「次局へ」ボタン配置バグ修正（パネル外→パネル内）
- [x] GameScene.js _onNextRound() 全プレイヤー手牌初期描画 + 飛び後描画スキップ対応
- [x] processRon チョンボバグ修正（複数同時ロン+nextRound同期呼び出しで新局手牌汚染）: ガード条件を `state !== CLAIM` に変更
- [x] test-game-flow.js 複数ロン同時宣言回帰テスト2件追加（449テスト全通過）
- [x] 四槓散了ルール完全実装（TDD・Redフェーズ確認済み）
  - Wall.flipKanDora: kanCount > 4 の場合は push しない（防御ガード）
  - Game._checkFourKanRyuukyoku: 計4槓かつ同一プレイヤーでない → _fourKanRyuukyoku = true
  - processMinkan/Ankan/Kakan 後に _checkFourKanRyuukyoku() 呼び出し追加
  - processAnkan/processKakan: _fourKanRyuukyoku 中は槓を拒否
  - processDiscard: _fourKanRyuukyoku 中は _processRyuukyoku() に誘導
  - _processKanDraw: _fourKanRyuukyoku 中はAIツモ和了か即流局
  - test-edge-cases.js 6件追加（463テスト全通過）
- [x] GameScene._findRiichiDiscards: フリテン未チェックバグ修正（AILevel3と同等のフリテン確認追加）
- [x] GameScene._showPlayer0Actions: 四槓散了状態のUI対応（ツモのみ/ヒントテキスト）
- [x] 1000ゲームシミュレーション2回実施: クラッシュ0・チョンボ0・点数保存則違反0 ✅

## 夜間セッション確認記録（2026-05-17）
- チョンボバグ（0.26%）根本原因特定・修正完了 ✅
  - **根本原因**: 複数プレイヤー同時ロン宣言時に、先行 processRon の roundEnd イベント内で
    nextRound() が同期呼び出しされると _startRound() により state=DRAW にリセットされ、
    後続 processRon のガード条件 `ROUND_END||GAME_END` をすり抜けて新局手牌に触れる
  - **修正**: Game.js `processRon` の冒頭ガードを `state !== GAME_STATE.CLAIM` に変更（1行）
  - **回帰テスト**: test-game-flow.js に複数ロン同時宣言テスト2件追加（449テスト）
  - **検証**: 1000ゲームシミュレーション → チョンボ 0 (0.00%/7282ラウンド) ✅
  - GitHub Issue #24 クローズ

## 夕方セッション確認記録（2026-05-17）
- 全テスト通過確認: 447/447 ✅ (19 + 24 + 52 + 118 + 89 + 5 + 125 + 15)
- 1000局シミュレーション実施
  - 総ラウンド7361 / 平均7.36局/ゲーム
  - ツモ1719 (23.4%) / ロン3514 (47.7%) / 流局2109 (28.7%) / チョンボ19 (0.26%)
  - クラッシュ0 / 点数保存則違反0
- 発見バグ: チョンボ発生 0.26% (19/7361ラウンド)
  - ツモ由来ではない（500ゲームデバッグで確認済み）
  - RON時に _canRon()→true だが _calculateWin()→null となるケースが存在
- GitHub Issue #24 作成（週次レポート 2026-05-17）

## 午後セッション確認記録（2026-05-17）
- 全テスト通過確認: 469/469 ✅ (19 + 24 + 52 + 134 + 89 + 5 + 125 + 21)
- **役判定強化（優先度1）**: 国士無双十三面待ち・純正九連宝燈 ダブル役満実装（TDD）
  - `KOKUSHI_TANKI`: winTileが対子牌に一致 → double=true（十三面待ち）
  - 同一手でも winTile が非対子牌なら通常 `KOKUSHI`（単騎待ち）
  - `CHUURENPOUTOU_PURE`: winTile除去後の分布が [3,1,1,1,1,1,1,1,3] に一致 → double=true
  - 非純正九連宝燈（余剰牌 ≠ winTile）は通常 `CHUURENPOUTOU`
  - test-yaku.js に 16件追加（国士無双十三面待ち/単騎・純正/非純正）
- **AI守備判断修正（優先度3）**: 現物判定バグ修正（TDD）
  - バグ: 全捨て牌（リーチ前も含む）を現物（100%安全）として扱っていた
  - 修正: `Player.riichiDiscardCount` フィールド追加（`declareRiichi` 時に `discards.length` を保存）
  - `_safetyVsPlayer`: リーチ後捨て牌のみ 100点、リーチ前捨て牌は 50点に変更
  - 筋チェックもリーチ後捨て牌（genbutsuIds）ベースに変更（より正確）
  - Game.js `_startRound` で `riichiDiscardCount = -1` にリセット
  - test-ai.js に 6件追加（riichiDiscardCount 初期値/記録・_safetyVsPlayer 現物判定）

## 午前セッション確認記録（2026-05-17）
- 全テスト通過確認: 447/447 ✅ (19 + 24 + 52 + 118 + 89 + 5 + 125 + 15)
- **スタックオーバーフロー修正完了**（TDD）
  - 原因: `_nextTurn→_processDraw→AI→processDiscard→_processClaims→_nextTurn` の同期再帰
  - 解決: **トランポリンパターン** `_schedule(fn)` 実装 — `_actionQueue`+`_running` フラグで反復に変換
  - 変更: `_startRound`, `_nextTurn`, `processMinkan`, `processAnkan`, `_executeKakan` の 5 箇所
  - TDD: test-edge-cases.js にトランポリンテスト9件追加（Redフェーズ確認済み）
    - `_actionQueue` が配列として初期化される
    - `_schedule` が内側のスケジュールを延期実行する（実行順序テスト）
    - 50,000回連続スケジュールでもスタックオーバーフローなし（ストレステスト）
  - 検証: 200ゲーム・クラッシュ0（従来: 200ゲームで1クラッシュ）
  - 検証: 500ゲーム・クラッシュ0・保存則違反0
  - test-simulation.js: 50ゲーム → 200ゲームに拡大

## 午後セッション確認記録（2026-05-16）
- 全テスト通過確認: 438/438 ✅ (19 + 24 + 52 + 118 + 89 + 5 + 116 + 15)
- バグ修正① (役判定): 四暗刻単騎ツモが通常 SUUANKOU と判定されていた
  - Yaku.js `checkSuuankou` 内の `isTanki` 判定から `!context.isTsumo &&` を削除
  - ツモ/ロン問わず単騎待ち構造を判定するよう修正 → ダブル役満を正しく付与
- バグ修正② (役判定): 三暗刻ロン双碰でロン完成刻子を暗刻として計上していた
  - `checkSanankou(hand, winTile=null, isTsumo=true)` にオプション引数追加
  - ロン時に winTile を含む刻子 (双碰完成) を明刻扱いし closedTriplets から除外
  - `evaluateYaku` 内の呼び出しを `checkSanankou(hand, winTile, context.isTsumo)` に変更
- バグ修正③ (符計算): 双碰ロンで完成した刻子の符を暗刻符 (8/4) で計算していた
  - `decompFu(d, winId, seatWind, roundWind, isTsumo)` に isTsumo 引数追加
  - ロン時に winId と一致する刻子は明刻符 (4/2) で計算するよう修正
  - `calculateFu` 内の呼び出しも更新
- テスト追加 (test-yaku.js): 四暗刻単騎 / 大四喜 / 役満とドラ / 三暗刻ロン双碰 / 小三元 の evaluateYaku 統合テスト 33件
  - 四暗刻単騎ロン → TSUMO_SUUANKOU (double=true)
  - 四暗刻単騎ツモ → TSUMO_SUUANKOU (double=true) ← Bug1 修正で初めて通過
  - 四暗刻双碰ロン → 通常 SUUANKOU (single yakuman)
  - 大四喜 → DAISUUSHII + double=true + 小四喜なし
  - 役満時は han=0, RIICHI などの通常役が yaku リストに含まれない
  - 三暗刻ロン双碰 (暗刻2のみ) → 三暗刻不成立 ← Bug2 修正で通過
  - 三暗刻ロン双碰 (暗刻3 + ロン明刻) → 三暗刻成立
  - 小三元 open: HAKU + HATSU + SHOUSANGEN の複合 (4翻)
  - 小三元 closed ツモ: TSUMO + HAKU + HATSU + SHOUSANGEN
  - 大三元 → DAISANGEN あり・SHOUSANGEN なし
- テスト追加 (test-score.js): 双碰ロン明刻字牌 → 40符 (修正前=50符) の符計算テスト 1件
- 200局シミュレーション確認: クラッシュ0・保存則違反0

## 午前セッション確認記録（2026-05-16）
- 全テスト通過確認: 404/404 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 116 + 15)
- 実装: 槍槓（チャンカン）RON 完全実装（TDD）
  - 背景: Yaku.js には isChankan コンテキストと CHANKAN 役が実装済みだったが、
           Game._calculateWin では isChankan が常に false、加槓時のRON機会チェックも未実装
  - Game.js: `_canChankan(player, tile)` メソッド追加（フリテン判定・待ち確認・役確認）
  - Game.js: `_checkPlayerHasYaku` に `extraContext` 引数追加（isChankan 等の上書きを可能に）
  - Game.js: `processKakan` を改修: 加牌確定前に全他家へ槍槓チェック
    - 槍槓可能者あり → `_processChankanClaims` 経由でクレーム処理
    - 槍槓なし → `_executeKakan` で即時実行（従来同様）
  - Game.js: `_processChankanClaims` 追加（AI即時判断 / 人間は claimNeeded イベント経由）
  - Game.js: `_executeKakan` 抽出（直接実行・保留後完了共通ロジック）
  - Game.js: `_completePendingKakan` 追加（全員パス時の加槓完了）
  - Game.js: `_resolveClaimDecisions` 改修: `_chankan` フラグで槍槓パスを _completePendingKakan へ分岐
  - Game.js: `_calculateWin` の `isChankan: this._isChankan` 使用（常に false を解消）
  - 仕様確認: 槍槓は常に 1翻の役（open: 1）なので「役なし槍槓」は存在しない
  - TDD: test-edge-cases.js に槍槓テスト 17件追加（Redフェーズ確認済み）
    - _canChankan: 待ち牌かつ役あり → true
    - _canChankan: フリテン → false
    - _canChankan: 待ち牌でない → false
    - _canChankan: 開き手でも 槍槓役で true（仕様確認）
    - processKakan → 槍槓 RON 発動（result=RON, winnerIndex, CHANKAN役, RIICHI役）
    - 槍槓なし → 通常加槓完了（meld.type=KAKAN 確認）

## 夜間セッション確認記録（2026-05-15）
- 全テスト通過確認: 387/387 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 99 + 15)
- バグ修正: 天和・地和が常に isTenhou/isChiihou=false になっていた未実装バグを修正
  - Game.js: `_claimsThisRound` フラグ追加（ポン/チー/明槓で true → 地和不成立）
  - `_startRound()` で false にリセット
  - `_calculateWin()` の isTenhou/isChiihou を正しく計算するよう修正
    - 天和: `isTsumo && winnerIndex === dealerIndex && turn === 1`
    - 地和: `isTsumo && winnerIndex !== dealerIndex && !_claimsThisRound && turn <= 4`
  - TDD: test-edge-cases.js に天和/地和テスト20件追加（Redフェーズ確認済み）
- 新機能: `canDeclareWin(playerIndex)` メソッド追加（Game.js）
  - 役チェック込みのツモ和了可否判定（天和/地和条件も考慮）
  - GameScene.js のツモボタン表示条件を `canDeclareWin` に変更（役なし手でボタンが表示される問題を修正）
  - TDD: canDeclareWin テスト3件（天和条件/役なし開き手/タンヤオ閉門）

## 午後セッション確認記録（2026-05-10）
- 全テスト通過確認: 339/339 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 66)
- シミュレーション（50ゲーム）: クラッシュ0・保存則違反0・平均9.2ラウンド
- バグ修正: `GameScene.js` 対戦相手の副露描画オーバーラップ修正
  - Player2（上）: x=360→880（手牌右端 ~853 の右に配置、オーバーラップ解消）
  - Player1（右）: x=1240→1190（手牌と異なる列）, y=100起点（画面内に収まる）
  - Player3（左）: x=42→90（手牌と異なる列）, y=100起点（画面内に収まる）
  - 旧 y ステップ `(sh+2)*5` → `(sh+2)*4` で余白調整（3槓でも y≤584）
- 改善: 流局パネルの「全員テンパイ」表示追加
  - 4人全員テンパイ時は "全員テンパイ" を表示（旧: "テンパイ: P0 P1 P2 P3"）

## 午前セッション確認記録（2026-05-10）
- 全テスト通過確認: 339/339 ✅ (19 + 24 + 52 + 85 + 88 + 5 + 66)
- シミュレーション（50ゲーム）: ツモ135・ロン145・流局229・チョンボ0・クラッシュ0・保存則違反0（509ラウンド / 平均10.2ラウンド）
- 実装: `_processRyuukyoku()` にテンパイ料（ノーテン罰符）を実装
  - テンパイ人数に応じた3000点分配（1:+3000、2:+1500each、3:+1000each）
  - 全員テンパイ/全員ノーテン時は点数移動なし
  - roundEndイベントに `tenpaiIndices` フィールド追加
- バグ修正: `test-simulation.js` の流局・チョンボ時の連荘判定ミスを修正
  - 修正前: 流局・チョンボが親交代扱い（GameScene.jsとの不一致）
  - 修正後: 流局・チョンボも `dealerContinues=true`（GameScene.jsと一致）
  - 平均ラウンド数 4.6 → 10.2 へ増加（連荘が正しく機能した証拠）
- 改善: `GameScene.js` の流局パネルにテンパイプレイヤー表示追加
  - テンパイ: P0 P2 形式 / 全員ノーテン時は「全員ノーテン」表示
- 新規テスト: `tests/test-edge-cases.js` に流局テンパイ料テスト26件追加
  - 1人/2人/3人テンパイの点数分配 + 点数保存則 + roundEndイベント検証
  - 全員テンパイ・全員ノーテン時の移動なし検証

## 夕方セッション確認記録（2026-05-16）
- 全テスト通過確認: 438/438 ✅ (19 + 24 + 52 + 118 + 89 + 5 + 116 + 15)
- 200ゲームシミュレーション: ツモ321・ロン716・流局397・チョンボ0・クラッシュ1・保存則違反0（1434ラウンド）
- 既知バグ発見: スタックオーバーフロー（発生率 ~0.5%）
  - 原因: ゲームループが同期再帰構造（_nextTurn→_processDraw→AI→processDiscard→_processClaims→_nextTurn）
  - 長局（最大16ラウンド×70ターン×約6フレーム ≒ 6720フレーム）でNode.jsデフォルトスタック限界に到達
  - `--stack-size=65536` 指定時は500ゲーム全クラッシュなし（ブラウザ実プレイには影響なし）
  - 対策案: ゲームループを反復処理にリファクタリング（setImmediate/トランポリン）
- GitHub Issue #22 作成（週次レポート 2026-05-16）
- 役ランキング: リーチ31.5%・タンヤオ15.1%・門前清自摸和13.4%・中13.4%・場風11.2%

## 土日夕方セッション確認記録（2026-06-06）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-6 / 6-D 実装完了（スマートフォン対応）**
  - index.html: viewport に maximum-scale=1/user-scalable=no 追加、touch-action:none、apple-mobile-web-app-capable 追加
  - main.js: Phaser Scale Manager（FIT + CENTER_BOTH）でキャンバス自動リサイズ対応
  - **Phase UI-6 全タスク完了 ✅**

## 土日午後セッション確認記録（2026-06-06）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-6 新規策定・6-A〜6-C 実装完了**
  - 【6-A】戦型選択（東風戦/半荘）
    - Game.js: `gameType` オプション追加（'tonpu'=東風戦デフォルト / 'hanchan'=半荘）
    - `_maxRounds` フィールド追加（tonpu=4, hanchan=8）
    - `roundWind` を `Math.floor(round/4)+1` で動的計算（南場で場風牌=南が正しく働く）
    - `nextRound()` の終局判定を `round >= 4` → `round >= _maxRounds` に変更
    - BootScene: 設定UIを4列→5列に拡張（x: 160/400/640/880/1120）
    - 「戦型」トグル追加（東風戦/半荘、x=880 列）
    - `gameSettings.gameType` フィールド追加・セーブデータ互換補完
    - GameScene: `settings.gameType` を `new Game()` に渡すよう更新
  - 【6-B】リーチ中待ち牌ヒント表示
    - GameScene: `_riichiWaitTxt` テキスト追加（y=626, #ffee99）
    - `_updateRiichiWaitHint()` メソッド追加
    - リーチ中: 「待ち: 1m 4m 7m」を黄色テキストで表示
    - `_updateInfoTexts()` から毎ターン更新
    - `_tileShortName(id)` ヘルパー追加（id→"1m"/"2p"/"東"等の短縮表記）
  - 【6-C】オープン手テンパイ時の待ち牌表示
    - 13枚手牌かつ `isTenpai()` の場合「テンパイ: X枚」を緑色で表示
    - 他家ターン中にP0テンパイ状態を可視化

## 土日午前セッション確認記録（2026-06-06）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-5 / 5-D 実装完了（ゲーム統計）**
  - GameScene.js: `_p0Agari` / `_totalRounds` カウンタ追加
    - `_onRoundEnd()` でラウンド数・P0 和了数を毎局積算
    - ResultScene 遷移時に両値を data として渡す（`_onGameEnd` / `_onNextRound`）
  - ResultScene.js: 通算成績パネル追加
    - localStorage `'mahjong_stats'` に対局数/1位数/和了数/ラウンド数/合計得点を累積保存
    - 結果画面下部に「通算 N局  1位率 X%  和了率 X%  平均得点 N点」を表示
    - 精算式位置 y=630→622、再プレイボタン y=680→692（スペース確保）
  - **Phase UI-5 全タスク完了 ✅**

## 夜間セッション確認記録（2026-06-05）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-5 / 5-C 実装完了（AIレベル選択）**
  - AILevel1.js 新規作成（ツモ切り専念・副露なし・ツモ和了のみ取る簡単AI）
  - Game.js: `aiLevel` オプション追加（1→AILevel1, 3→AILevel3, デフォルト3）
  - BootScene.js: 設定UIに「AIレベル」トグルを4列目に追加（標準/簡単）
    - gameSettings.aiLevel フィールド追加・既存セーブデータ互換補完
    - 4列レイアウト（x: 210, 490, 770, 1050）に調整
  - GameScene.js: settings.aiLevel を new Game() に渡すよう更新
  - test-ai.js: AILevel1 テスト8件追加

## 夜間セッション確認記録（2026-06-04）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-5 / 5-B 実装完了（役一覧ポップアップ）**
  - スコアバー右端に「?」ボタン追加（_buildStaticUI, depth=5/6）
  - クリックで `_toggleYakuPopup()` → `_showYakuPopup()` / `_closeYakuPopup()`
  - 3列レイアウト: 1翻役 / 2〜6翻役 / 役満（ダブル役満含む）全43役
  - オーバーレイ背景クリック・右上×ボタン・再度「?」クリックで閉じる
  - `_yakuPopupObjs` 配列でオブジェクト一括管理

## 夜間セッション確認記録（2026-06-03）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-5 / 5-A 実装完了（ゲーム設定画面）**
  - BootScene スタート画面に設定UIを追加（一発 / 裏ドラ / ウマ トグル）
  - 設定値を Phaser3 registry (`gameSettings`) に保存・読み出し
  - Game.js: `useIppatsu` / `useUraDora` オプション追加
    - `_checkPlayerHasYaku`・`_calculateWin` の `isIppatsu` を設定で制御
    - 裏ドラカウントを `useUraDora` で制御
  - GameScene.js: `registry.get('gameSettings')` から設定を読み `new Game(options)` に渡す
  - ResultScene.js: `umaRule` に応じてウマ列表示と精算式注記を切り替え


## 夜間セッション確認記録（2026-06-02）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-4 / 4-E 実装完了（レイアウト最終調整）**
  - ResultScene プレイヤー名: `['自分','P1','P2','P3']` → `['自分','右','対面','左']`（GameSceneと統一）
  - 局終了パネルのスコア行: `P${p.index}:` → `['自分','右','対面','左'][i]:` 形式に変更
  - 流局テンパイ表示: `P${i}` → `['自分','右','対面','左'][i]` に変更
  - **Phase UI-0〜UI-4 全タスク完了 ✅**

## 土日夕方セッション確認記録（2026-05-31）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-4 / 4-A〜4-D 実装完了**
  - 【4-A】テンパイ維持候補ハイライト: `_getTenpaiCandidates(player)` — 14枚保持時に各牌を仮除去しisTenpai()を確認、候補インデックスに水色 tint (0xaaddff) 適用
  - 【4-B】点数フロートテキスト: `_animateScoreFloat(winnerIndex, total)` — 和了者エリアから "+XXXX" テキストが上昇（700ms rise + 300ms hold + 400ms fade）、P0〜P3 各方向への移動パス設定
  - 【4-C】風牌バッジ常時表示: スコアバーに座席風を追加（`自分(東): 25000` 形式）+ テーブル上4箇所に文字バッジ、`_updateWindBadges()` で dealerIndex 基準に動的更新
  - 【4-D】スコアフラッシュアニメーション: `_flashScoreText(i)` — 点数変動時に scale 1.45 → 1.0 の 300ms バウンス、`_prevScores` との差分検出で変動時のみ発火

## 土曜夕方セッション確認記録（2026-05-30）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-3 全4タスク完了**
  - 【3-A】ツモ・打牌音: `_playSfxDraw()`/`_playSfxDiscard()` — square波 880Hz/660Hz クリック音
  - 【3-B】副露SE: `_playSfxMeld()` — 700→500Hz 2音、リーチSE: `_playSfxRiichi()` — 440→880Hz 上昇スイープ
  - 【3-C】和了SE: `_playSfxWin()` — C5-E5-G5-C6 上昇アルペジオ（triangle波 4音）
  - 【3-D】BootScene スタート画面追加: `_initAudio()`（WebAudio AudioContext 初期化）+ `_buildStartScreen()`（音量ON/OFFトグル・ゲーム開始ボタン）
  - `_scheduleNote(freq, duration, startOffset, type, vol, freqEnd)` ヘルパー追加（WebAudio API 直接制御）
  - AudioContext は Phaser3 registry 経由で全 Scene 間共有

## 土曜午後セッション確認記録（2026-05-30）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-2 / 2-C・2-E 実装完了（アニメーション）**
  - 【2-C】副露アニメーション
    - `_animateMeld(playerIndex)`: 新規副露牌が各プレイヤー手牌方向からスライドIN 400ms (Power2.Out)
    - 牌ごとに 40ms delay で順次アニメーション（自然な散らばり感）
    - `_onMeld()` から呼び出し（ポン/チー/明槓/暗槓/加槓 全対応）
  - 【2-E】和了演出
    - `_animateWin(winnerIndex, yakuResult, result, onComplete)`:
      P0 勝利時: 全手牌に金色 tint (0xffdd44)
      役名フラッシュテキスト: scale 0.6→1.0 + alpha 0→1 (200ms Back.Out) → 100ms hold → alpha 0 フェード (200ms)、合計 ~500ms
    - `_onRoundEnd` を `_animateWin` + `_showRoundEndPanel` に分割
    - TSUMO/RON 時は演出後にパネル表示、流局/チョンボは即パネル
- **Phase UI-2 全5タスク完了 ✅**

## 夜間セッション確認記録（2026-05-29）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-2 / 2-A・2-B・2-D 実装完了（アニメーション）**
  - 【2-A】P0 ツモアニメーション
    - `_animateDrawP0()`: 壁エリア(x=1100, y=640) から手牌末尾へ 300ms スライドIN (Power2.Out)
    - `_onDraw()` の P0 分岐で呼び出し（AI手牌は余分な遅延なし）
  - 【2-B】P0 捨て牌アニメーション
    - `_animateDiscardP0()`: 打牌位置から捨て牌ゾーンへ 200ms スライド (Power2.Out)
    - `_lastDiscardPos` を `_onTileClick` / `_showRiichiButton` 内でキャプチャ
    - 通常打牌・リーチ中ツモ切り・リーチ宣言の全パスを網羅
  - 【2-D（一部）】リーチ宣言牌の横向き表示
    - `_renderDiscards()` で `player.riichiDiscardCount` 番目の捨て牌を `rotated:true` で描画
    - 全4プレイヤー共通（既存の rotated 描画オプションを活用）

## 夕方セッション確認記録（2026-05-23）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-1 / 1-D 実装完了（タイルサイズ拡大・全描画箇所調整）**
  - BootScene.js: TW=38→44, TH=52→60, フォント 14px→16px, 角丸半径 4→5
  - GameScene.js: TW/TH 定数更新
  - P1/P3 手牌縦ステップ: TH+TG → TW+TG（13枚×63px=819px が720pxオーバーを解消）
  - P0/P2 副露開始 x: 920/880 → 950（TW=44 で13枚手牌右端~943 とのオーバーラップ解消）
  - P2 捨て牌ゾーン y: 210 → 235（拡大牌と P2 手牌下端との重なり解消）

## 午前セッション確認記録（2026-05-23）
- 全テスト通過確認: 485/485 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 23)
- **Phase UI-1 / 1-A+1-B+1-C 実装完了（タイルテクスチャ動的生成）**
  - 【1-A】BootScene._createTileTexture(suit, number, isRed)
    - HTML5 Canvas で全牌（数牌 27 + 字牌 7 = 34 種）を動的生成
    - 角丸矩形（radius=4）+ スーツ別背景色 + スーツ別文字色 + 数字/漢字テキスト
    - テクスチャキー: `tile_{suit}_{number}`
    - BootScene.create() で一括生成 → Phaser3 テクスチャマネージャにキャッシュ
    - GameScene._drawTile: this.add.rectangle+text → this.add.image に変更
    - _setupHandClick: setFillStyle → setTint/clearTint に変更
  - 【1-B】赤ドラテクスチャ（tile_{suit}_5_r）— 文字色 '#ff4400'
  - 【1-C】裏牌テクスチャ（tile_back）— 暗青背景 + 斜めハッチング

## 夜間セッション確認記録（2026-05-20）
- 全テスト通過確認: 463/463 ✅ (19 + 26 + 52 + 118 + 89 + 5 + 137 + 17)
- **Phase UI-0 全5タスク完了**
  - ①ドラ指示牌表示: `_buildStaticUI` に「ドラ:」ラベル追加、`_updateDoraDisplay()` で小タイル描画。`_updateInfoTexts()` から毎回更新、次局時にクリア。
  - ②勝者名修正: `_onRoundEnd` の `Player${winnerIndex}` → `['自分','右','対面','左'][winnerIndex]` に変更。チョンボも同様修正。
  - ③副露牌横向き: `_drawTile` に `rotated` オプション追加（w/h swap + `txt.setAngle(90)`）。`_getMeldRotatedIndex(meld)` でクレーム牌を `findIndex` で特定し横向き描画。P0/P2（横並び）・P1/P3（縦並び）それぞれタイル幅/高さを動的計算してレイアウト。
  - ④ウマ精算: `ResultScene` を全面改修。10-20ウマ（1位+20, 2位+10, 3位-10, 4位-20）を計算し精算点 = `(持ち点-30000)/1000 + ウマ` を表示。列ヘッダー・精算式注記も追加。
  - ⑤リーチ棒視覚表示: `_updateRiichiSticks()` でリーチ中プレイヤーごとにクリーム色の棒型矩形を描画（P0:横、P1/P3:縦、P2:横）。`_updateInfoTexts()` から毎回更新。

## 夜間セッション確認記録（2026-05-19）
- 全テスト通過確認: 463/463 ✅ (19 + 26 + 52 + 118 + 89 + 5 + 137 + 17)
- 1000ゲームシミュレーション（2回実施）: クラッシュ0・チョンボ0・点数保存則違反0 ✅
  - 1回目: 7255ラウンド / ツモ22.9% / ロン48.5% / 流局28.6%
  - 2回目: 7218ラウンド / ツモ24.5% / ロン48.1% / 流局27.4%
- バグ修正①（Critical）: 四槓散了ルール未実装によるクラッシュ（発生率0.1%）
  - **根本原因**: `Wall.flipKanDora()` が10回以上呼ばれると `deadWall[14+]` = undefined を
    `doraIndicators` に追加。その後 `countDora()` が undefined をデストラクチャリングしてクラッシュ
  - **根本的原因（上位）**: 4槓散了ルール未実装で局が終了せず10槓以上になるケースが発生
  - `Wall.flipKanDora()` 修正: `kanCount <= 4` のときのみ push（防御的ガード）
  - `Game._checkFourKanRyuukyoku()` 追加: 合計4槓かつ同一プレイヤーでない場合に `_fourKanRyuukyoku = true`
  - `Game._fourKanRyuukyoku` フラグ追加（コンストラクタ・`_startRound` でリセット）
  - `processMinkan/Ankan/Kakan` 後に `_checkFourKanRyuukyoku()` を呼び出し
  - `processAnkan/processKakan`: `_fourKanRyuukyoku` 中は槓を拒否（無限槓ループ防止）
  - `processDiscard`: `_fourKanRyuukyoku` 中は捨て牌の代わりに `_processRyuukyoku()` 呼び出し
  - `_processKanDraw`: `_fourKanRyuukyoku` 中はAIがツモ和了できなければ即流局
  - TDD: test-edge-cases.js に6件追加（Redフェーズ確認済み）
    - `flipKanDora` 10回後も undefined なし
    - `_checkFourKanRyuukyoku` 異なるプレイヤー4槓 → true
    - `_checkFourKanRyuukyoku` 1人4槓（四槓子候補）→ false
    - 四槓散了フラグ + 非完成手 → 流局
    - 3槓ではフラグが立たない
- バグ修正②（UX）: `GameScene._findRiichiDiscards` フリテン未チェック
  - 修正前: `player.isFuriten` を確認せずリーチ候補を計算 → フリテン手にリーチボタンが表示
  - 修正後: `isFuriten` 確認 + 各候補牌を除いた待ち牌で個別フリテンチェック（AILevel3と同等）
- 改善: `GameScene._showPlayer0Actions()` 四槓散了状態のUI対応
  - `g._fourKanRyuukyoku` が true のとき: ツモボタンのみ表示・槓ボタン非表示
  - ヒントテキスト: "四槓散了 — ツモ和了のみ可能（それ以外は流局）"

## 夜間セッション確認記録（2026-05-18）
- 全テスト通過確認: 457/457 ✅ (19 + 26 + 52 + 118 + 89 + 5 + 131 + 17)
- 実装: リーチ後暗槓（Ankan after Riichi）完全実装（TDD）
  - **背景**: GameScene がリーチ中に暗槓ボタンを完全ブロック・AIもスキップしていた（ルール違反）
  - **正しいルール**: 待ちが変わらない暗槓はリーチ中でも可能
  - `Game._canAnkanDuringRiichi(player, tileId)` 追加
    - リーチ中でない → 常に true（早期 return）
    - リーチ中: 13枚リーチ手の待ちと暗槓後10枚手の待ちを比較し、同一なら true
    - 手牌・副露は呼び出し後に完全復元
  - `Game.processAnkan()` に リーチ中ガード追加
    - `isRiichi && !_canAnkanDuringRiichi(player, tileId)` → return
  - `GameScene._showPlayer0Actions()` 修正
    - `validAnkans` を `isRiichi ? filter(_canAnkan) : all` で計算
    - リーチ中でも有効暗槓があれば暗槓ボタンを表示
    - ヒントテキスト: 有効暗槓あり → "リーチ中 — 暗槓可 / ツモ切りのみ"
  - `AILevel3.selectDrawAction()` 修正
    - 暗槓チェックをリーチ中も行い、`_canAnkanDuringRiichi` で有効な場合は ankan を返す
    - 加槓は引き続きリーチ中スキップ
  - TDD: test-edge-cases.js に6件追加、test-ai.js に2件追加（計+8件）
    - Redフェーズ確認済み (`_canAnkanDuringRiichi is not a function` エラー)

## UI強化計画（第7〜9週）
参考: https://github.com/kobalab/Majiang（電脳麻将）

### Phase UI-0: 残タスク完了（第6週 現行ルーティン継続）
既存ルーティン（平日夜・土日3セッション）で消化する。

| タスク | 対象ファイル | 状態 |
|--------|------------|------|
| ①ドラ指示牌表示 | GameScene._buildStaticUI, game_.wall.doraIndicators | ✅ 完了 |
| ②勝者名修正 | GameScene._onRoundEnd（Player0→自分） | ✅ 完了 |
| ③副露牌横向き | _renderMelds, _drawTile rotated option | ✅ 完了 |
| ④ウマ精算 | ResultScene, calcUma helper（10-20ウマ） | ✅ 完了 |
| ⑤リーチ棒視覚表示 | GameScene._buildStaticUI | ✅ 完了 |

Phase UI-0 完了後、トリガープロンプトを Phase UI-1 内容に切り替える。

> Phase UI-1遷移通知済み: 2026-05-23

---

### Phase UI-1: タイルグラフィック刷新（第7週）
**目的**: テキスト文字 → 絵として認識できる牌へ（Majiangの牌画像相当をPhaser3内で動的生成）

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 1-A | タイルテクスチャ動的生成（角丸・枠線・スーツ別彩色） | BootScene.js, _createTileTexture() | ✅ 完了 |
| 1-B | 赤ドラ視覚区別（5m/5p/5s を赤数字で描画） | BootScene.js | ✅ 完了 |
| 1-C | 裏牌テクスチャ（斜めハッチングまたは単色） | BootScene.js | ✅ 完了 |
| 1-D | タイルサイズ拡大（TW=38→44, TH=52→60）と全描画箇所調整 | GameScene.js 定数 | ✅ 完了 |

---

### Phase UI-2: アニメーション実装（第8週）
**目的**: Phaser3 Tweens で牌の動きに流れを出す（Majiangの600msアニメーション相当）

| 工程 | 内容 | 実装方法 | 状態 |
|------|------|---------|------|
| 2-A | ツモアニメーション | 山（右端）→ 手牌末尾へスライドIN 300ms | ✅ 完了 |
| 2-B | 捨て牌アニメーション | 手牌 → 捨て牌ゾーンへスライド 200ms | ✅ 完了 |
| 2-C | 副露アニメーション | ポン/チーで牌が集まる 400ms | ✅ 完了 |
| 2-D | リーチ宣言演出 | リーチ宣言牌を捨て牌ゾーンで横向き表示 | ✅ 完了 |
| 2-E | 和了演出 | 手牌ハイライト + 役名フラッシュ 500ms | ✅ 完了 |

---

### Phase UI-3: 音響実装（第9週前半）
**目的**: SE で臨場感を出す（Phaser3 Sound Manager / WebAudio API）

| 工程 | 内容 | 状態 |
|------|------|------|
| 3-A | 牌音（ツモ・打牌のカチッ音、WebAudioトーン生成） | ✅ 完了 |
| 3-B | 副露・リーチ宣言SE | ✅ 完了 |
| 3-C | 和了SE（ツモ/ロン） | ✅ 完了 |
| 3-D | BootSceneに音量ON/OFFトグル | ✅ 完了 |

---

### Phase UI-4: UX改善・仕上げ（第9週後半）
**目的**: プレイしやすさの最終調整

| 工程 | 内容 | 状態 |
|------|------|------|
| 4-A | テンパイ時の有効牌ハイライト（薄いオーバーレイ） | ✅ 完了 |
| 4-B | 点数移動フロートテキスト（+3900点が飛ぶ演出） | ✅ 完了 |
| 4-C | プレイヤー風牌アイコン（東南西北）の常時表示 | ✅ 完了 |
| 4-D | スコアバーのリアルタイム更新アニメーション | ✅ 完了 |
| 4-E | ブラウザ実機テスト・レイアウト最終調整 | ✅ 完了 |

---

### Phase UI-5: ゲームシステム強化（第10週〜）
**目的**: プレイヤーがルールをカスタマイズできるようにする

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 5-A | ゲーム設定画面（一発/裏ドラ/ウマ ON/OFF） | BootScene.js, Game.js, ResultScene.js | ✅ 完了 |
| 5-B | 役一覧ポップアップ（ゲーム中「?」ボタンで参照） | GameScene.js | ✅ 完了 |
| 5-C | AIレベル選択（Lv1=簡単 / Lv3=標準） | BootScene.js, Game.js | ✅ 完了 |
| 5-D | ゲーム統計（対局数・和了率・平均得点を localStorage 保存） | ResultScene.js | ✅ 完了 |

---

### Phase UI-6: ゲームプレイ深化（第11週〜）
**目的**: 戦型拡張・情報表示強化でプレイ体験を向上

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 6-A | 戦型選択（東風戦/半荘） | BootScene.js, Game.js, GameScene.js | ✅ 完了 |
| 6-B | リーチ中待ち牌ヒント表示 | GameScene.js | ✅ 完了 |
| 6-C | オープン手テンパイ待ち牌表示 | GameScene.js | ✅ 完了 |
| 6-D | スマートフォン対応（キャンバスリサイズ） | index.html, main.js | ✅ 完了 |

---

### Phase UI-7: 観戦モード & QoL強化（第12週〜）
**目的**: AllAI自動対局観戦・手牌ソート・UX改善

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 7-A | 観戦モード（AllAI自動対局観戦・BootSceneに「観戦」ボタン） | BootScene.js, GameScene.js | ✅ 完了 |
| 7-B | 手牌自動ソートボタン（P0手牌を数牌→字牌順に並べ替え） | GameScene.js, Hand.js | ✅ 完了 |
| 7-C | 本場・供託の視覚表示（棒グラフまたはカウンター） | GameScene.js | ✅ 完了 |
| 7-D | タイトル画面への「戻る」ボタン（ResultScene） | ResultScene.js | ✅ 完了 |

---

### Phase UI-9: 打牌サポート深化（第14週〜）
**目的**: 向聴数・危険牌・残り牌を可視化してプレイヤーの判断をサポート

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 9-A | 向聴数リアルタイム表示（他家ターン中に `{n}向聴` / `テンパイ` を表示） | GameScene.js | ✅ 完了 |
| 9-B | 危険牌ハイライト（他家リーチ時に打牌候補を安全度で色分け） | GameScene.js | ✅ 完了 |
| 9-C | 残り牌ポップアップ（「残牌」ボタンで全34種の残り枚数一覧） | GameScene.js | ✅ 完了 |
| 9-D | ResultScene 得点推移チャート（ラウンドごとのP0スコア折れ線グラフ） | GameScene.js, ResultScene.js | ✅ 完了 |

---

### Phase UI-8: 打牌サポート & 情報表示強化（第13週〜）
**目的**: 打牌判断をサポートするヒント表示でプレイ体験を向上

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 8-A | 有効牌ヒント（14枚時に各牌の ukeire 種類数を牌下に表示） | GameScene.js | ✅ 完了 |
| 8-B | X線モード（観戦/デバッグ用に他家手牌を表示トグル） | GameScene.js | ✅ 完了 |
| 8-C | 和了形表示（局終了パネルに面子分解レイアウトを表示） | GameScene.js | ✅ 完了 |
| 8-D | 連続対局サマリー（ResultScene に局ごとの勝敗ログ表示） | ResultScene.js | ✅ 完了 |

---

## 平日夜セッション確認記録（2026-06-09）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-8 新規策定・8-A 実装完了（有効牌ヒント）**
  - GameScene.js: `_effectiveHintGfx` リスト追加
  - `_clearEffectiveHints()`: ヒントラベルを一括破棄
  - `_showEffectiveHints(player)`: 14枚手牌の各インデックスに対して ukeire 計算
    - 牌を仮除去 → `getEffectiveTileIds().length` をカウント → 牌を復元
    - 最大値の牌は緑 (#44ff88)、それ以外は灰色 (#888888)でラベル表示（y=700）
  - `_clearActionButtons()` に `_clearEffectiveHints()` 呼び出しを追加
  - `_showPlayer0Actions()` でリーチ中以外に `_showEffectiveHints(p0)` を呼び出し

## 平日夜セッション確認記録（2026-06-08）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-7 残タスク（7-B〜7-D）全完了**
  - 【7-B】手牌自動ソートボタン
    - GameScene.js: `_showPlayer0Actions()` でリーチ中以外に「並替」ボタン追加（x=200, y=662）
    - クリックで `p0.hand.sort()` → `_selectedIdx=-1` → `_renderHand(0)` + `_setupHandClick(p0)` 再セットアップ
    - `_actionButtons` に含まれるため `_clearActionButtons()` で自動消去
  - 【7-C】本場・供託の視覚表示
    - `_honbaKyotakuGfx` リスト追加（毎フレーム `_updateHonbaKyotakuDisplay()` で再描画）
    - 本場: 白い小棒（5×13px）を最大8本並べ、左に「本場:」ラベル（y=368）
    - 供託: 赤い小四角（8×8px）を最大8本並べ、左に「供託:」ラベル（y=386）
    - `_wallTxt` を y=360→348 に移動してスペース確保
    - `_updateInfoTexts()` の kyotakuStr（文字列表示）を削除、視覚表示に統合
  - 【7-D】タイトル画面への「戻る」ボタン
    - ResultScene.js: 再プレイボタンを x=490 に移動
    - 「タイトルへ」ボタン追加（x=790, y=692）、`scene.start('BootScene')` で遷移
  - **Phase UI-7 全タスク完了 ✅**

## 土日午前セッション確認記録（2026-06-07）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-7 新規策定・7-A 実装完了（観戦モード）**
  - BootScene.js: `allAI: false` を gameSettings デフォルトに追加・既存セーブデータ補完
  - BootScene.js: 「観戦 ▶」ボタン追加（x=790, y=570 / `allAI: true` で GameScene 起動）
  - BootScene.js: 「ゲーム開始 ▶」を x=490 に移動（「観戦」ボタンと左右配置）
  - GameScene.js: `this._allAI = settings.allAI ?? false` を追加
  - GameScene.js: `new Game({ allAI: this._allAI })` に渡すよう更新
  - GameScene.js: `_onDraw` で `!this._allAI` ガードを追加（観戦中は P0 操作UIをスキップ）
  - GameScene.js: 観戦モード時に「観戦モード」インジケーターを右下に表示

## 平日夜セッション確認記録（2026-06-12）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-8 / 8-B 実装完了（X線モード）**
  - GameScene.js: `_xrayMode` フラグ追加（初期値 false）
  - `_buildStaticUI()` に常時表示の「X線 OFF/ON」トグルボタン追加（x=1150, y=692 / 幅80）
  - ボタン押下で `_xrayMode` トグル → P1/P2/P3 手牌をリアルタイム再描画
  - P1/P2/P3 の `_renderHandXxx()` で `back: !this._xrayMode` に変更
  - 観戦モード・通常プレイ中どちらでも利用可能

## 土日午前セッション確認記録（2026-06-13）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-8 / 8-C 実装完了（和了形表示）**
  - GameScene.js: `_drawWinHand(winner, y)` メソッド新規追加
    - `decomposeClosed()` で面子分解（通常形/七対子/国士）
    - 閉手を順子・刻子・雀頭グループに分類（最小牌ID順ソート）
    - 副露牌（hand.melds）をグループ末尾に追加
    - 各タイルを 24×33px で中央揃えに描画（depth=35）
    - 和了牌（hand.tiles最終要素）を金色 tint (0xffdd44) でハイライト
  - `_showRoundEndPanel()` 修正:
    - 和了時（TSUMO/RON）: パネル高 280→380px、テキスト y=335→295、ボタン y=468→516
    - タイル行を y=440 に挿入、`_drawWinHand` 戻り値をパネルオブジェクトリストに統合
    - 非和了時（流局/チョンボ）: 既存レイアウト維持（panelH=280）
  - `decomposeClosed` インポートを GameScene.js 先頭に追加

## 土日午前セッション確認記録（2026-06-14）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-8 / 8-D 実装完了（連続対局サマリー）**
  - GameScene.js: `_roundLog[]` と `_p0PrevScore` フィールド追加
    - 各局終了時に `{ roundNum, resultLabel, winnerIndex, delta }` をログに積算
    - `scene.start('ResultScene')` の両箇所に `roundLog` を追加
  - ResultScene.js: 対局ログセクションを結果テーブル下段（y=522〜590）に追加
    - 3列×4行（最大12局）グリッドで各局の結果を表示
    - 自分の得点増減: +緑 / -赤 / ±0 灰色でカラーコーディング
    - 12局超の場合は直近12局を表示し件数を注記
  - **Phase UI-8 全タスク完了 ✅**

## 土日午後セッション確認記録（2026-06-14）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-9 新規策定・全4タスク完了**
  - 【9-A】向聴数リアルタイム表示
    - `_updateRiichiWaitHint()` を拡張: P0 手牌13枚時に `getShantenNumber()` を呼び出し
    - テンパイ (shanten=0): `テンパイ: 1m 4m 7m` を緑色表示（従来同様）
    - 向聴 (shanten>0): `{n}向聴` をグレー表示 (新規)
  - 【9-B】危険牌ハイライト（他家リーチ時の打牌安全度表示）
    - `_showEffectiveHints()` 拡張: リーチ中の他家がいる場合は ukeire 数字の色を安全度で変更
    - 緑 (safety≥70): 比較的安全、黄 (safety≥40): 注意、赤 (safety<40): 危険
    - `_getSafetyScore(tile, riichiPlayer)`: AILevel3 と同等の安全度計算（現物/筋/壁）を GameScene 内に実装
    - `_countSeenTiles(tileId)`: 全捨て牌・副露・ドラ表示牌から見えている枚数をカウント
  - 【9-C】残り牌ポップアップ
    - `_buildStaticUI()` に「残牌」ボタン追加（x=1060, y=692）
    - `_countRemainingTiles()`: 4枚から既見牌を除いた残り枚数を計算（二重カウント防止: claimedTile を除外）
    - `_showRemainingPopup()`: 34種を4行（萬/筒/索/字）グリッドで表示
      - 残り0枚: 薄暗く表示、1枚: 赤、2枚: 黄、3-4枚: 緑
  - 【9-D】ResultScene 得点推移チャート
    - GameScene: `_scoreHistory = [25000]` 追加、各局後に P0 点数を積算
    - `_onGameEnd()` / `_onNextRound()` で `scoreHistory` を ResultScene に渡す
    - ResultScene: 対局ログを左半分（最大8局, 2列）に縮小、右半分に折れ線グラフを追加
      - 25000点基準線（緑点線）、25000以上は緑・未満は赤の折れ線
      - 各ラウンドに小丸マーカー + 最終スコアラベル

## 平日夜セッション確認記録（2026-06-17）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-10 新規策定・10-A・10-B 実装完了**
  - 【10-A】フリテン状態の明示警告
    - `_updateRiichiWaitHint()` 拡張: `isFuriten || isTemporaryFuriten` を確認
    - テンパイ中フリテン: 緑テキスト「テンパイ: Xm」→ 赤テキスト「フリテン(Xm)」
    - リーチ中フリテン: 黄テキスト「待ち: Xm」→ 赤テキスト「フリテン(Xm)」
  - 【10-B】AI速度設定
    - Game.js: `aiDelay` オプション追加（`_processDraw`/`_processKanDraw` に setTimeout 適用）
    - BootScene.js: 設定UI 第2行に「AI速度」トグル追加（遅い=1000ms/普通=350ms/速い=50ms）
      - `gameSettings.aiSpeed` フィールド追加・既存セーブデータ互換補完
    - GameScene.js: `settings.aiSpeed` を `speedMap` で変換し `new Game({ aiDelay })` に渡す

## 平日夜セッション確認記録（2026-06-18）
- 全テスト通過確認: 493/493 ✅ (19 + 26 + 52 + 134 + 89 + 5 + 137 + 31)
- **Phase UI-10 / 10-C・10-D 実装完了（Phase UI-10 全タスク完了）**
  - 【10-C】見逃し通知
    - `_onDiscard` に `tile` 引数追加（Game.js から既に emit されていた）
    - 他家捨て牌がP0待ち牌と一致した場合に「ロン可！」フラッシュ表示
    - フリテン状態 (`isFuriten` / `isTemporaryFuriten`) は除外、観戦モードは非表示
    - `_showMissNotice()`: alpha 0→1 (120ms) → hold 700ms → fade out (600ms)
    - `_clearMissNotice()`: タイマー途中でも即消去
  - 【10-D】音量スライダー
    - `soundEnabled`（boolean）→ `soundVolume`（0〜100）に移行（旧データ自動変換）
    - BootScene: ON/OFF トグル → ◀/▶ ボタン + バーグラフ（10段階 × 10%）
    - GameScene `_scheduleNote()`: `soundVolume/100` でゲイン比例スケーリング
  - **Phase UI-10 全タスク完了 ✅**

## 次回作業内容
- **現在のフォーカス**: Phase UI-10 完了 → 次フェーズ策定
- Phase UI-0 全完了後: 全4トリガーのプロンプトを Phase UI-1 内容に更新
- 最終完成目標: Phase UI-4 完了 = ブラウザ実機テスト通過
---

### Phase UI-10: 最終QoL強化（第15週〜）
**目的**: プレイヤーサポートの細部を磨く（フリテン可視化・AI速度・見逃し通知）

| 工程 | 内容 | 対象ファイル | 状態 |
|------|------|------------|------|
| 10-A | フリテン状態の明示警告（テンパイ中フリテン時に赤字表示） | GameScene.js | ✅ 完了 |
| 10-B | AI速度設定（BootScene設定UIに遅い/普通/速いトグル追加） | BootScene.js, Game.js, GameScene.js | ✅ 完了 |
| 10-C | 見逃し通知（P0テンパイ中に他家が待ち牌を捨てた時の視覚フィードバック） | GameScene.js | ✅ 完了 |
| 10-D | 音量スライダー（現在ON/OFFのみ → 0〜100%の数値制御） | BootScene.js, GameScene.js | ✅ 完了 |

---

## 次回作業内容（第6週残り・更新済み）
- GameScene.js の GUI 改良（ブラウザ実機テスト後）
  - タイル画像アセット導入（現在はテキスト描画）
  - アニメーション・SE追加（第6週制限で保留）
- 最終デバッグ・完成確認（ブラウザ実機テスト）
- 追加検討: 槍槓に対する人間プレイヤーUI（GameScene.js 既存 claimNeeded フローで対応済み）

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
│   ├── test-yaku.js        ✅ 118テスト（第4週 + 午後セッション統合テスト追加: 四暗刻単騎/大四喜/小三元）
│   ├── test-score.js       ✅ 89テスト（第5週 + 符計算エッジケース追加: 双碰ロン明刻40符）
│   ├── test-simulation.js  ✅ 5テスト（第6週・50ゲームシミュレーション）
│   ├── test-edge-cases.js  ✅ 137テスト（槍槓17件・天和地和20件・飛び7件・流局テンパイ料・_canRon役チェック・トランポリン9件・リーチ後暗槓6件・四槓散了6件）
│   └── test-ai.js          ✅ 17テスト（AILevel3ポン/チー判断・リーチ・リーチ中暗槓2件）
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 副露K枚対応向聴数バグ修正済み
    │   ├── Meld.js      ✅ 完全実装
    │   ├── Player.js    ✅ checkFuriten 完全実装 / isIppatsu管理修正
    │   └── Game.js      ✅ 副露・カン・点数計算統合完成 / _canRon役チェック追加 / トランポリン実装
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
