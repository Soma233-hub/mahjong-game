export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        // TODO: 第6週でアセット読み込みを追加
    }

    create() {
        this.scene.start('GameScene');
    }
}
