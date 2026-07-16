import Phaser from 'phaser';
import { PROP_KEYS_V2, characterKeyForIndex, CHARACTER_PATHS_V2 } from './assetKeysV2';

const DESK_SCALE = 0.19;
const AVATAR_SCALE = 0.155;

export interface AgentV2 {
  id: string;
  name: string;
  icon: string;
  status: string;
  detail?: string | null;
}

const STATUS_COLORS: Record<string, number> = {
  idle: 0xbbbbdd,
  working: 0x60b0ff,
  done: 0x70ff90,
  checkpoint: 0xffcc33,
  delivering: 0x60b0ff,
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'ocioso',
  working: 'trabalhando',
  done: 'concluído',
  checkpoint: 'checkpoint',
  delivering: 'entregando',
};

export class AgentSpriteV2 {
  private scene: Phaser.Scene;
  private avatar: Phaser.GameObjects.Image;
  private desk: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private badgeBg: Phaser.GameObjects.Graphics;
  private statusDot: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private detailText: Phaser.GameObjects.Text;
  private breatheTween?: Phaser.Tweens.Tween;
  private agent: AgentV2;

  constructor(scene: Phaser.Scene, x: number, y: number, characterIndex: number, agent: AgentV2) {
    this.scene = scene;
    this.agent = agent;
    const characterKey = characterKeyForIndex(characterIndex);

    this.desk = scene.add.image(x, y, PROP_KEYS_V2.desk)
      .setOrigin(0.5, 0.72)
      .setScale(DESK_SCALE)
      .setDepth(y + 1);

    const avatarY = y - this.desk.displayHeight * 0.42;
    this.avatar = scene.add.image(x, avatarY, `v2_char_${characterKey}`)
      .setOrigin(0.5, 0.62)
      .setScale(AVATAR_SCALE)
      .setDepth(y);

    this.breatheTween = scene.tweens.add({
      targets: this.avatar,
      scaleY: AVATAR_SCALE * 1.02,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const headTopY = avatarY - this.avatar.displayHeight * 0.62;
    const badgeHeight = 62;
    const labelY = headTopY - 8 - badgeHeight;
    this.badgeBg = scene.add.graphics();

    this.nameText = scene.add.text(x, labelY + 5, agent.name, {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
      resolution: 2,
    }).setOrigin(0.5, 0).setDepth(901);

    this.statusDot = scene.add.graphics();

    this.statusText = scene.add.text(x, labelY + 24, STATUS_LABELS[agent.status] ?? agent.status, {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: this.getStatusHexColor(agent.status),
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5, 0).setDepth(901);

    this.detailText = scene.add.text(x, labelY + 42, agent.detail ?? '', {
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'normal',
      color: '#ffcc99',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
      wordWrap: { width: 170 },
    }).setOrigin(0.5, 0).setDepth(901);

    this.drawLabelBackground(x, labelY);
    this.drawStatusDot(x, labelY + 22, agent.status);

    this.avatar.setInteractive({ useHandCursor: true });
    this.desk.setInteractive({ useHandCursor: true });
    const emitClick = () => this.scene.events.emit('agentClicked', this.agent.id);
    this.avatar.on('pointerdown', emitClick);
    this.desk.on('pointerdown', emitClick);
  }

  private getStatusHexColor(status: string): string {
    const num = STATUS_COLORS[status] ?? STATUS_COLORS.idle;
    return '#' + num.toString(16).padStart(6, '0');
  }

  private drawLabelBackground(x: number, labelY: number): void {
    const nameW = Math.max(this.nameText.width, this.statusText.width + 18, this.detailText.width);
    const bgW = nameW + 20;
    const bgH = 62;
    this.badgeBg.fillStyle(0x1a1225, 0.95);
    this.badgeBg.fillRoundedRect(x - bgW / 2, labelY, bgW, bgH, 6);
    this.badgeBg.lineStyle(1, 0xE9571C, 0.5);
    this.badgeBg.strokeRoundedRect(x - bgW / 2, labelY, bgW, bgH, 6);
    this.badgeBg.setDepth(900);
  }

  private drawStatusDot(x: number, _statusY: number, status: string): void {
    const dotColor = STATUS_COLORS[status] ?? STATUS_COLORS.idle;
    const textW = Math.max(this.statusText.width, 24);
    this.statusDot.fillStyle(dotColor, 1);
    this.statusDot.fillCircle(x - textW / 2 - 5, this.statusText.y + this.statusText.height / 2, 3);
    this.statusDot.setDepth(901);
  }

  updateStatus(agent: AgentV2): void {
    const statusChanged = this.agent.status !== agent.status;
    const detailChanged = this.agent.detail !== agent.detail;
    if (!statusChanged && !detailChanged) return;
    this.agent = agent;

    if (statusChanged) {
      this.statusText.setText(STATUS_LABELS[agent.status] ?? agent.status);
      this.statusText.setColor(this.getStatusHexColor(agent.status));

      this.statusDot.clear();
      const dotColor = STATUS_COLORS[agent.status] ?? STATUS_COLORS.idle;
      const textW = Math.max(this.statusText.width, 24);
      this.statusDot.fillStyle(dotColor, 1);
      this.statusDot.fillCircle(
        this.statusText.x - textW / 2 - 5,
        this.statusText.y + this.statusText.height / 2,
        3,
      );

      if (agent.status === 'done') {
        this.playCompletionBurst();
      }
    }

    if (detailChanged) {
      this.detailText.setText(agent.detail ?? '');
    }
  }

  private playCompletionBurst(): void {
    const burst = this.scene.add.text(this.avatar.x, this.avatar.y - this.avatar.displayHeight * 0.6, '✓', {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#5ee89a',
      stroke: '#0d3a24',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setDepth(950).setScale(0.4).setAlpha(0);

    this.scene.tweens.add({
      targets: burst,
      alpha: 1,
      scale: 1,
      y: burst.y - 30,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: burst,
          alpha: 0,
          y: burst.y - 20,
          delay: 500,
          duration: 400,
          onComplete: () => burst.destroy(),
        });
      },
    });
  }

  destroy(): void {
    this.breatheTween?.stop();
    this.desk.destroy();
    this.avatar.destroy();
    this.nameText.destroy();
    this.badgeBg.destroy();
    this.statusDot.destroy();
    this.statusText.destroy();
    this.detailText.destroy();
  }
}

export function preloadCharacterTextures(scene: Phaser.Scene): void {
  for (const [key, path] of Object.entries(CHARACTER_PATHS_V2)) {
    scene.load.image(`v2_char_${key}`, path);
  }
}
