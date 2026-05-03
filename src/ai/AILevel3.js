import { AIBase } from './AIBase.js';
import { evaluateYaku } from '../logic/Yaku.js';

/**
 * Lv.3 AI
 * - ツモ和了自動判定（役確認後に宣言）
 * - リーチ宣言（門前テンパイ・非フリテン）
 * - 暗槓・加槓（リーチ中はスキップ）
 * - 守備判断: 現物 > 壁 > 筋 > デフォルト
 */
export class AILevel3 extends AIBase {
    constructor(playerIndex) {
        super(playerIndex);
    }

    // --- 打牌選択 ---

    selectDiscard(player, game) {
        // リーチ中は最後のツモ牌のみ捨てられる
        if (player.isRiichi) {
            return player.hand.tileCount - 1;
        }
        const riichiOpponents = game.players.filter(
            p => p.index !== player.index && p.isRiichi
        );
        if (riichiOpponents.length > 0) {
            return this._selectSafeTile(player, game, riichiOpponents);
        }
        return this._selectByEffectiveTiles(player);
    }

    // --- 鳴き選択 ---

    selectClaimAction(player, game, discardTile, opts) {
        if (opts && opts.canRon) {
            // 役がある場合のみロン宣言（チョンボ防止）
            player.hand.tiles.push(discardTile);
            const hasYaku = this._hasYaku(player, game, discardTile, false);
            player.hand.tiles.pop();
            if (hasYaku) return { action: 'ron' };
        }
        return { action: 'pass' };
    }

    // --- ツモ後のアクション ---

    selectDrawAction(player, game) {
        // 1. ツモ和了チェック
        if (player.hand.isComplete()) {
            const winTile = player.hand.tiles[player.hand.tiles.length - 1];
            if (this._hasYaku(player, game, winTile, true)) {
                return { action: 'tsumo' };
            }
        }

        // 2. 暗槓・加槓（リーチ中はスキップ）
        if (!player.isRiichi) {
            const ankanIds = player.hand.findAnkanIds();
            if (ankanIds.length > 0) {
                return { action: 'ankan', tileId: ankanIds[0] };
            }
            const kakanOpts = player.hand.findKakanOptions();
            if (kakanOpts.length > 0) {
                return { action: 'kakan', meldIndex: kakanOpts[0].meldIndex };
            }
        }

        // 3. リーチ宣言（門前テンパイ・未リーチ・1000点以上）
        if (!player.isRiichi && player.isMenzen && player.score >= 1000) {
            const riichiIdx = this._findRiichiDiscard(player);
            if (riichiIdx !== null) {
                return { action: 'riichi', index: riichiIdx };
            }
        }

        // 4. 通常打牌
        return { action: 'discard', index: this.selectDiscard(player, game) };
    }

    // --- 内部ユーティリティ ---

    // ツモ和了前の役存在確認
    _hasYaku(player, game, winTile, isTsumo) {
        const seatWind = player.getSeatWind(game.dealerIndex) + 1;
        const context = {
            isTsumo,
            isRiichi:       player.isRiichi,
            isDoubleRiichi: player.isDoubleRiichi,
            isIppatsu:      player.isIppatsu,
            seatWind,
            roundWind:      1,
            isHaitei:       isTsumo && game.wall.isEmpty(),
            isHoutei:       !isTsumo && game.wall.isEmpty(),
            isRinshan:      game._isRinshan,
            isChankan:      false,
            isTenhou:       false,
            isChiihou:      false,
        };
        const { yaku, isYakuman } = evaluateYaku(player.hand, winTile, context);
        return isYakuman || yaku.length > 0;
    }

    // リーチ可能な打牌インデックスを探す（テンパイ＆非フリテン）
    _findRiichiDiscard(player) {
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const removed = player.hand.tiles.splice(i, 1)[0];
            const tenpai = player.hand.isTenpai();
            if (tenpai) {
                const waits = player.hand.getWaitingTileIds();
                const furiten = player.discards.some(d => waits.includes(d.id));
                player.hand.tiles.splice(i, 0, removed);
                if (!furiten) return i;
            } else {
                player.hand.tiles.splice(i, 0, removed);
            }
        }
        return null;
    }

    // 向聴数最小化優先、同値なら有効牌枚数最大化
    _selectByEffectiveTiles(player) {
        const hand = player.hand;
        let bestIdx = 0;
        let bestShanten = 100;
        let bestCount = -1;
        for (let i = 0; i < hand.tileCount; i++) {
            const removed = hand.tiles.splice(i, 1)[0];
            const { shanten } = hand.getShantenNumber();
            const eff = (shanten <= bestShanten) ? hand.getEffectiveTileIds().length : 0;
            hand.tiles.splice(i, 0, removed);
            if (shanten < bestShanten ||
                (shanten === bestShanten && eff > bestCount)) {
                bestShanten = shanten;
                bestCount = eff;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    // 全リーチ相手に対する最小安全度最大の牌を選ぶ
    _selectSafeTile(player, game, riichiOpponents) {
        let bestIdx = 0;
        let bestScore = -1;
        for (let i = 0; i < player.hand.tiles.length; i++) {
            const tile = player.hand.tiles[i];
            let minSafety = 100;
            for (const opp of riichiOpponents) {
                const s = this._safetyVsPlayer(tile, opp, game);
                if (s < minSafety) minSafety = s;
            }
            if (minSafety > bestScore) { bestScore = minSafety; bestIdx = i; }
        }
        return bestIdx;
    }

    // 特定のリーチ相手に対する牌の安全度 (0-100)
    _safetyVsPlayer(tile, riichiPlayer, game) {
        const discardIds = new Set(riichiPlayer.discards.map(d => d.id));

        // 現物（リーチ後に相手が捨てた牌）
        if (discardIds.has(tile.id)) return 100;

        // 字牌: 3枚以上見えていれば比較的安全
        if (tile.isHonor()) {
            return this._countSeen(tile.id, game) >= 3 ? 80 : 20;
        }

        // 筋
        const sujiScore = this._checkSuji(tile, discardIds);
        if (sujiScore > 0) return sujiScore;

        // 壁
        const kabeScore = this._checkKabe(tile, game);
        if (kabeScore > 0) return kabeScore;

        return 30;
    }

    // 全プレイヤーの捨て牌+副露で見えている枚数
    _countSeen(tileId, game) {
        let count = 0;
        for (const p of game.players) {
            count += p.discards.filter(d => d.id === tileId).length;
            for (const m of p.hand.melds) {
                count += m.tiles.filter(t => t.id === tileId).length;
            }
        }
        return count;
    }

    // 筋安全度: ±3筋が現物なら比較的安全
    _checkSuji(tile, discardIds) {
        const id = tile.id;
        const suitBase = Math.floor(id / 9) * 9;
        const rank = id - suitBase; // 0-8
        const sujiA = suitBase + (rank - 3);
        const sujiB = suitBase + (rank + 3);
        const hasSujiA = rank >= 3 && discardIds.has(sujiA);
        const hasSujiB = rank <= 5 && discardIds.has(sujiB);
        if (hasSujiA && hasSujiB) return 70;
        if (hasSujiA || hasSujiB) return 55;
        return 0;
    }

    // 壁安全度: 隣接牌が4枚全て見えていれば順子成立不能
    _checkKabe(tile, game) {
        const id = tile.id;
        const suitBase = Math.floor(id / 9) * 9;
        const rank = id - suitBase;
        if ((rank > 0 && this._countSeen(suitBase + rank - 1, game) >= 4) ||
            (rank < 8 && this._countSeen(suitBase + rank + 1, game) >= 4)) {
            return 65;
        }
        return 0;
    }

    _randomDiscard(player) {
        return Math.floor(Math.random() * player.hand.tileCount);
    }
}
