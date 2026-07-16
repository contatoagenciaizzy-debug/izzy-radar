import Phaser from 'phaser';
import { avatarKeys, type CharacterName } from './assetKeys';

/**
 * A special non-desk character that walks back and forth across the floor,
 * representing the human head of the team (not an AI agent — no desk, no status badge).
 */
export class BossSprite {
  private avatar: Phaser.GameObjects.Image;
  private badgeBg: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;
  private walkTween?: Phaser.Tweens.Tween;
  private frameTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    characterName: CharacterName,
    label: string,
    role: string,
    walkY: number,
    walkFromX: number,
    walkToX: number,
  ) {
    const keys = avatarKeys(characterName);

    this.avatar = scene.add.image(walkFromX, walkY, keys.talk)
      .setOrigin(0.5, 1)
      .setScale(0.62)
      .setDepth(5000);

    this.badgeBg = scene.add.graphics();
    this.nameText = scene.add.text(walkFromX, 0, `👑 ${label}`, {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffe8a3',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0.5, 0).setDepth(5002);

    this.roleText = scene.add.text(walkFromX, 0, role, {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'normal',
      color: '#d9d0e8',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5, 0).setDepth(5002);

    this.badgeBg.setDepth(5001);

    this.updateLabelPosition();

    // Idle "breathing" animation: alternate talk/blink frames
    let frame = 0;
    this.frameTimer = scene.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        frame = (frame + 1) % 2;
        this.avatar.setTexture(frame === 0 ? keys.talk : keys.blink);
      },
    });

    // Walk back and forth along the floor, flipping to face the direction of travel
    const distance = Math.abs(walkToX - walkFromX);
    const duration = Math.max(distance * 22, 2500); // ~22ms per pixel, min 2.5s per leg

    this.avatar.setFlipX(walkToX < walkFromX);

    this.walkTween = scene.tweens.add({
      targets: this.avatar,
      x: walkToX,
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      onYoyo: () => this.onDirectionChange(),
      onRepeat: () => this.onDirectionChange(),
      onUpdate: () => this.updateLabelPosition(),
    });
  }

  private onDirectionChange(): void {
    // Facing follows travel direction: flip when heading back toward start
    this.avatar.setFlipX(!this.avatar.flipX);
  }

  private updateLabelPosition(): void {
    const x = this.avatar.x;
    const topY = this.avatar.y - this.avatar.displayHeight - 46;

    this.nameText.setPosition(x, topY + 5);
    this.roleText.setPosition(x, topY + 24);

    const w = Math.max(this.nameText.width, this.roleText.width) + 20;
    const h = 40;
    this.badgeBg.clear();
    this.badgeBg.fillStyle(0x3a2410, 0.95);
    this.badgeBg.fillRoundedRect(x - w / 2, topY, w, h, 5);
    this.badgeBg.lineStyle(1, 0xffcc66, 0.5);
    this.badgeBg.strokeRoundedRect(x - w / 2, topY, w, h, 4);
  }

  destroy(): void {
    this.walkTween?.stop();
    this.frameTimer?.destroy();
    this.avatar.destroy();
    this.badgeBg.destroy();
    this.nameText.destroy();
    this.roleText.destroy();
  }
}
