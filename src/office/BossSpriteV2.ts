import Phaser from 'phaser';
import { PROP_KEYS_V2 } from './assetKeysV2';

const RENAN_SCALE = 0.075;

/**
 * Renan (human head of team) rendered as a floating bust — the generated art has no
 * legs, so instead of walking on the floor he gently hovers/drifts, which reads
 * intentionally as "floating avatar" rather than a broken walk-cycle.
 */
export class BossSpriteV2 {
  private avatar: Phaser.GameObjects.Image;
  private badgeBg: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private driftTween?: Phaser.Tweens.Tween;
  private bobTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    label: string,
    role: string,
    hoverY: number,
    fromX: number,
    toX: number,
  ) {
    const startX = (fromX + toX) / 2;

    this.avatar = scene.add.image(startX, hoverY, PROP_KEYS_V2.renan)
      .setOrigin(0.5, 0.5)
      .setScale(RENAN_SCALE)
      .setDepth(5000);

    this.badgeBg = scene.add.graphics().setDepth(5001);

    // Single compact line — keeps his vertical footprint small so he never
    // overlaps character badges below, even while drifting across columns
    this.nameText = scene.add.text(startX, 0, `👑 ${label} · ${role}`, {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffe8a3',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5, 0).setDepth(5002);

    this.updateLabelPosition();

    this.bobTween = scene.tweens.add({
      targets: this.avatar,
      y: hoverY - 10,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.updateLabelPosition(),
    });

    const distance = Math.abs(toX - fromX);
    const duration = Math.max(distance * 30, 4000);
    this.driftTween = scene.tweens.add({
      targets: this.avatar,
      x: toX,
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.updateLabelPosition(),
    });
  }

  private updateLabelPosition(): void {
    const x = this.avatar.x;
    const topY = this.avatar.y + this.avatar.displayHeight * 0.5 + 4;

    this.nameText.setPosition(x, topY + 3);

    const w = this.nameText.width + 16;
    const h = 20;
    this.badgeBg.clear();
    this.badgeBg.fillStyle(0x3a2410, 0.95);
    this.badgeBg.fillRoundedRect(x - w / 2, topY, w, h, 5);
    this.badgeBg.lineStyle(1, 0xffcc66, 0.5);
    this.badgeBg.strokeRoundedRect(x - w / 2, topY, w, h, 5);
  }

  destroy(): void {
    this.driftTween?.stop();
    this.bobTween?.stop();
    this.avatar.destroy();
    this.badgeBg.destroy();
    this.nameText.destroy();
  }
}
