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
│   ├── test-edge-cases.js  ✅ 125テスト（槍槓17件・天和地和20件・飛び7件・流局テンパイ料・_canRon役チェック・トランポリン9件）
│   └── test-ai.js          ✅ 15テスト（第6週・AILevel3ポン/チー判断・リーチ）
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
