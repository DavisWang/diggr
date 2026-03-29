import Phaser from 'phaser';
import type { DiggrApp } from '../ui/DiggrApp';

export class TitleScene extends Phaser.Scene {
  static readonly KEY = 'title-scene';

  private stars: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super(TitleScene.KEY);
  }

  create(): void {
    const app = this.getApp();
    this.cameras.main.setBackgroundColor('#0b1320');
    this.stars = this.add.graphics();
    app.sceneDidRender();
  }

  update(time: number): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.stars?.clear();
    this.stars?.fillStyle(0x091220, 1);
    this.stars?.fillRect(0, 0, width, height);
    this.stars?.fillStyle(0xf6ebc9, 1);

    for (let index = 0; index < 80; index += 1) {
      const x = (index * 97 + time * 0.016 * (index % 3 === 0 ? 4 : 2)) % width;
      const y = (index * 53) % height;
      this.stars?.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2);
    }

    this.stars?.fillStyle(0xe1904c, 1);
    this.stars?.fillRect(0, height * 0.76, width, height * 0.24);
    this.stars?.fillStyle(0x6c4321, 1);
    this.stars?.fillRect(0, height * 0.8, width, height * 0.2);
  }

  private getApp(): DiggrApp {
    return this.game.registry.get('app') as DiggrApp;
  }
}
