# 麻雀ゲーム開発 進捗管理

## プロジェクト情報
- リポジトリ: https://github.com/Soma233-hub/mahjong-game
- 言語: JavaScript + Phaser3
- 開始日: 2026-04-17

## フェーズ計画

| 週 | フェーズ | 内容 | 状態 |
|---|---|---|---|
| 第1週 | 設計 | 全体設計・クラス定義・プロジェクト構造 | 🔄 進行中 |
| 第2週 | 牌管理 | 牌管理・山・手牌・ツモ・捨て牌実装 | ⬜ 未着手 |
| 第3週 | 副露 | ポン・チー・暗槓・明槓・加槓実装 | ⬜ 未着手 |
| 第4週 | 役判定 | 全役対応の役判定ロジック実装 | ⬜ 未着手 |
| 第5週 | 点数・ドラ | 点数計算・表/裏/カン/赤ドラ処理 | ⬜ 未着手 |
| 第6週 | GUI・仕上げ | GUI実装・Lv.3 AI・デバッグ・完成 | ⬜ 未着手 |

## 現在のフェーズ
**第1週 - 全体設計（進行中）**

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

### 第1週 残タスク
- [ ] Hand._normalShanten のアルゴリズム精度検証
- [ ] Game._processClaims の実装（第3週へ）

## 次回作業内容（第2週）
- ツモ・捨て牌の完全な流れをテスト
- Hand.getShantenNumber の単体テスト（具体的な手牌で検証）
- Game のターン管理を AI と接続
- Player.checkFuriten の完全実装

## ファイル構造
```
mahjong-game/
├── index.html
├── package.json
├── PROGRESS.md
└── src/
    ├── main.js
    ├── core/
    │   ├── Tile.js      ✅ 完全実装
    │   ├── Wall.js      ✅ 完全実装
    │   ├── Hand.js      ✅ 向聴数含む実装
    │   ├── Meld.js      ✅ 定義完了
    │   ├── Player.js    ✅ 定義完了
    │   └── Game.js      ✅ 骨格完了
    ├── logic/
    │   ├── Yaku.js      🔄 スケルトン（第4週実装予定）
    │   ├── Score.js     🔄 スケルトン（第5週実装予定）
    │   └── Dora.js      ✅ 完全実装
    ├── ai/
    │   ├── AIBase.js    ✅ 定義完了
    │   └── AILevel3.js  🔄 スケルトン（第6週実装予定）
    └── scenes/
        ├── BootScene.js    ✅
        ├── GameScene.js    🔄 スタブ（第6週実装予定）
        └── ResultScene.js  ✅ 基本表示
```
