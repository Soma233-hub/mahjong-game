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
| 第4週 | 役判定 | 全役対応の役判定ロジック実装 | ⬜ 未着手 |
| 第5週 | 点数・ドラ | 点数計算・表/裏/カン/赤ドラ処理 | ⬜ 未着手 |
| 第6週 | GUI・仕上げ | GUI実装・Lv.3 AI・デバッグ・完成 | ⬜ 未着手 |

## 現在のフェーズ
**第4週 - 役判定ロジック（未着手）**

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

## 第3週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（93/93通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（processDiscard MELD_ACTION 対応済み）

## 次回作業内容（第4週）
- Yaku.js の全役実装
  - 面前役: リーチ・タンヤオ・ピンフ・イーペーコー・三色同順・一気通貫・七対子等
  - 役牌: 白・發・中・場風・自風
  - 特殊役: ツモ・リンシャンカイホウ・チャンタ・三槓子など
  - 役満: 天和・地和・国士・九蓮・四暗刻・大三元・大四喜・清老頭・緑一色・字一色
- Hand.isComplete() 実装（14枚+副露での和了形チェック）
- Game._canRon に役チェックを統合（役なし=ロン不可）
- processWin に役リスト付与
- tests/test-yaku.js 作成

## ファイル構造
```
mahjong-game/
├── index.html
├── package.json          ← "test" スクリプト追加
├── PROGRESS.md
├── tests/
│   ├── test-hand.js      ✅ 14テスト
│   ├── test-game-flow.js ✅ 27テスト
│   └── test-meld.js      ✅ 52テスト
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
    │   ├── Yaku.js      🔄 スケルトン（第4週実装予定）
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
