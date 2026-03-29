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
    this.stars?.fillStyle(0x0b1320, 1);
    this.stars?.fillRect(0, 0, width, height);
    this.stars?.fillStyle(0x1b2d47, 0.9);
    this.stars?.fillRect(0, height * 0.62, width, height * 0.14);
    this.stars?.fillStyle(0xa8d762, 1);
    this.stars?.fillRect(0, height * 0.74, width, 6);
    this.stars?.fillStyle(0x34632e, 1);
    this.stars?.fillRect(0, height * 0.75, width, 10);
    this.stars?.fillStyle(0x7d4e25, 1);
    this.stars?.fillRect(0, height * 0.78, width, height * 0.22);
    this.stars?.fillStyle(0xa86b33, 1);
    this.stars?.fillRect(0, height * 0.81, width, height * 0.05);
    this.stars?.fillStyle(0xf6ebc9, 1);

    for (let index = 0; index < 80; index += 1) {
      const x = (index * 97 + time * 0.016 * (index % 3 === 0 ? 4 : 2)) % width;
      const y = (index * 53) % height;
      this.stars?.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2);
    }

    this.stars?.fillStyle(0xffd879, 0.14);
    this.stars?.fillRect(width * 0.16, height * 0.08, 90, 90);
    this.stars?.fillStyle(0xf6ebc9, 0.95);
    this.stars?.fillRect(width * 0.18, height * 0.1, 48, 48);

    const shaftWidth = Math.max(80, width * 0.12);
    this.stars?.fillStyle(0x0a1220, 1);
    this.stars?.fillRect(width * 0.44, height * 0.74, shaftWidth, height * 0.26);
  }

  private getApp(): DiggrApp {
    return this.game.registry.get('app') as DiggrApp;
  }
}
