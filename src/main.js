import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#2d5a27',
    scene: [BootScene, GameScene, ResultScene],
    parent: document.body,
};

new Phaser.Game(config);
