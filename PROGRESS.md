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
| 第5週 | 点数・ドラ | 点数計算・表/裏/カン/赤ドラ処理 | ⬜ 未着手 |
| 第6週 | GUI・仕上げ | GUI実装・Lv.3 AI・デバッグ・完成 | ⬜ 未着手 |

## 現在のフェーズ
**第5週 - 点数計算・ドラ処理（着手予定）**

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

## 第4週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（178/178通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（全役判定・役満判定 検証済み）

## 第3週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（93/93通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（processDiscard MELD_ACTION 対応済み）

## 次回作業内容（第5週）
- Score.js 点数計算実装
  - calculateFu: 符計算（雀頭・面子・待ち牌・和了方法による符）
  - calculateScore: 基本点・翻数・符から点数計算（切り上げ満貫含む）
  - 子・親の点数分配ロジック
  - Mangan/Haneman/Baiman/Sanbaiman/Yakuman 判定
- Dora.js との統合（表ドラ・裏ドラ・カンドラ・赤ドラ加算）
- Game.processWin に evaluateYaku + calculateScore を統合
- フリテン・流局の検証強化
- tests/test-score.js 作成（符計算・点数計算テスト）

## ファイル構造
```
mahjong-game/
├── index.html
├── package.json          ← "test" スクリプト追加
├── PROGRESS.md
├── tests/
│   ├── test-hand.js      ✅ 14テスト
│   ├── test-game-flow.js ✅ 27テスト
│   ├── test-meld.js      ✅ 52テスト
│   └── test-yaku.js      ✅ 85テスト（第4週）
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 向聴数・有効牌・待ち牌 検証済み
    │   ├── Meld.js      ✅ 完全実装
    │   ├── Player.js    ✅ checkFuriten 完全実装
    │   └── Game.js      ✅ 副露処理・_processClaims・カン処理完成
    ├── logic/
    │   ├── Yaku.js      ✅ 全役判定実装（evaluateYaku・decomposeClosed）
    │   ├── Score.js     🔄 スケルトン（第5週実装予定）
    │   └── Dora.js      ✅ 完全実装
    ├── ai/
    │   ├── AIBase.js    ✅ 定義完了
    │   └── AILevel3.js  🔄 有効牌ベース打牌・安全牌選択 動作中
    └── scenes/
        ├── BootScene.js    ✅
        ├── GameScene.js    🔄 スタブ（第6週実装予定）
        └── ResultScene.js  ✅ 基本表示
```
