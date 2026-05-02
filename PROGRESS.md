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
**第4週 - 役判定ロジック（完了）→ 第5週へ**

## 土日午前セッション確認記録（2026-05-02）
- 全テスト通過確認: 214/214 ✅
- 実装追加: Game._canRon に evaluateYaku 統合（役なし=ロン不可）
- 次回: 第5週 点数計算・ドラ処理

## 夜間セッション確認記録（2026-05-01）
- 全テスト通過確認: 214/214 ✅
- 実装完了: Yaku.js 全役 / Hand.isComplete() / _normalShanten(extraMentsu)
- 発見バグ修正: _isPinfuWait の先端/末尾条件が逆になっていたバグを修正

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
- [x] tests/test-yaku.js 作成（121テスト・全役網羅）
- [x] Hand.isComplete() 実装（14枚和了形・副露考慮）
- [x] Hand._normalShanten(extraMentsu) に副露対応パラメータ追加
- [x] Yaku.js 全役実装:
  - 基本役: タンヤオ・ピンフ・一盃口・門前清自摸和・リーチ・一発・ダブルリーチ
  - 役牌: 白・發・中・自風・場風
  - 特殊役: ハイテイ・ホウテイ・嶺上開花・槍槓
  - 複合役: 対々和・七対子・三暗刻・三槓子・三色同順・三色同刻・一気通貫
  - 混合役: 混全帯么九・純全帯么九・小三元・混老頭・混一色・清一色・二盃口
  - 役満: 天和・地和・国士無双・四暗刻・大三元・大四喜・小四喜・字一色・緑一色・九連宝燈・四槓子
- [x] evaluateYaku() 統合関数（役満優先・ハン数計算）
- [x] 全214テスト通過確認（93+121=214）

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
- [x] 単体テストで主要ロジックが正常動作している（214/214通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（_isPinfuWait 先端/末尾条件修正）

## 第3週 品質チェックリスト
- [x] 単体テストで主要ロジックが正常動作している（93/93通過）
- [x] コンソールエラーがない
- [x] 前フェーズの既知バグが解消されている（processDiscard MELD_ACTION 対応済み）

## 次回作業内容（第5週）
- Score.js 実装（点数計算・符計算）
  - calculateFu: 符計算（門前・副露・待ち形・刻子/槓子ごとの符）
  - calculateScore: 基本点・各プレイヤーへの点数分配
  - 満貫/跳満/倍満/三倍満/役満の点数適用
- Dora.js との統合（表ドラ・裏ドラ・カンドラ・赤ドラ）
- Game._canRon に役チェックを統合（evaluateYaku 使用・役なし=ロン不可）
- Game.processWin に evaluateYaku・calculateScore を統合
- フリテン・流局検証
- tests/test-score.js 作成（TDD）

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
│   └── test-yaku.js      ✅ 121テスト（全役・役満）
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 向聴数・有効牌・待ち牌・isComplete 実装済み
    │   ├── Meld.js      ✅ 完全実装
    │   ├── Player.js    ✅ checkFuriten 完全実装
    │   └── Game.js      ✅ 副露処理・_processClaims・カン処理完成
    ├── logic/
    │   ├── Yaku.js      ✅ 全役実装（evaluateYaku・全役チェック関数）
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
