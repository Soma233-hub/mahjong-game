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
- 全テスト通過確認: 266/266 ✅ (14 + 27 + 52 + 85 + 88)
- シミュレーションテスト: 未実装（第6週以降）
- 発見バグ: package.json に test-score.js が含まれていなかった → 修正済み
- GitHub Issue #5 作成（週次レポート 2026-05-02）

## 午後セッション確認記録（2026-05-02）
- 全テスト通過確認: 266/266 ✅ (14 + 27 + 52 + 85 + 88)
- 第5週完了: 点数計算・符計算・Game.js統合
- 新規実装: Score.calculateFu(), Score.calculateScore(), basicPoints()修正, Game._calculateWin()
- テスト数: 88テスト (tests/test-score.js)
- 発見バグ: test-meld.js非決定的テスト修正（human PON pending正常化）
- decomposeClosed export追加（Yaku.js → Score.js で利用）

## 土曜日セッション確認記録（2026-05-02）
- 全テスト通過確認: 178/178 ✅ (14 + 27 + 52 + 85)
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

## 次回作業内容（第6週残り）
- GameScene.js の GUI 実装（Phaser3 で画面描画）
  - 手牌・捨て牌・副露の表示
  - ツモ・打牌・鳴き操作のUI
  - 点数・役表示パネル
- シミュレーション規模拡大（1000局）
- 最終デバッグ・完成

## ファイル構造
```
mahjong-game/
├── index.html
├── package.json          ← "test" スクリプト追加
├── PROGRESS.md
├── tests/
│   ├── test-hand.js        ✅ 14テスト
│   ├── test-game-flow.js   ✅ 24テスト
│   ├── test-meld.js        ✅ 52テスト
│   ├── test-yaku.js        ✅ 85テスト（第4週）
│   ├── test-score.js       ✅ 88テスト（第5週）
│   └── test-simulation.js  ✅ 5テスト（第6週・50ゲームシミュレーション）
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 向聴数・有効牌・待ち牌 検証済み
    │   ├── Meld.js      ✅ 完全実装
    │   ├── Player.js    ✅ checkFuriten 完全実装
    │   └── Game.js      ✅ 副露・カン・点数計算統合完成（_calculateWin）
    ├── logic/
    │   ├── Yaku.js      ✅ 全役判定実装（evaluateYaku・decomposeClosed export）
    │   ├── Score.js     ✅ 符計算・点数計算完全実装（第5週）
    │   └── Dora.js      ✅ 完全実装
    ├── ai/
    │   ├── AIBase.js    ✅ 定義完了
    │   └── AILevel3.js  ✅ 完全強化（ツモ和了・リーチ・守備・チョンボ防止）
    └── scenes/
        ├── BootScene.js    ✅
        ├── GameScene.js    🔄 スタブ（第6週実装予定）
        └── ResultScene.js  ✅ 基本表示
```
