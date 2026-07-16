import Phaser from 'phaser';
import { PROP_KEYS_V2, PROP_PATHS_V2 } from './assetKeysV2';
import { AgentSpriteV2, preloadCharacterTextures, type AgentV2 } from './AgentSpriteV2';
import { BossSpriteV2 } from './BossSpriteV2';

const CELL_W = 260;
const CELL_H = 250;
const MARGIN = 90;
const TOP_AREA_H = 260;
const LOUNGE_H = 230;

const DEMO_AGENTS: AgentV2[] = [
  { id: '1', name: 'Thay (SM)', icon: '', status: 'working', detail: 'Escrevendo post 3 de 8' },
  { id: '2', name: 'Bia (Design)', icon: '', status: 'done', detail: 'Capa aprovada' },
  { id: '3', name: 'Caio (Ads)', icon: '', status: 'working', detail: 'Subindo campanha' },
  { id: '4', name: 'Lia (Vídeo)', icon: '', status: 'working', detail: 'Montando reel' },
];

export class OfficeSceneV2 extends Phaser.Scene {
  private agentSprites: Map<string, AgentSpriteV2> = new Map();
  private boss?: BossSpriteV2;
  private bgGraphics?: Phaser.GameObjects.Graphics;
  private decorations: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'OfficeSceneV2' });
  }

  preload(): void {
    for (const [key, path] of Object.entries(PROP_PATHS_V2)) {
      this.load.image(key, path);
    }
    preloadCharacterTextures(this);

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('Failed to load asset:', file.key, file.url);
    });
  }

  create(): void {
    this.textures.list && Object.values(this.textures.list).forEach((tex) => {
      if (tex.key !== '__DEFAULT' && tex.key !== '__MISSING') {
        tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    });

    this.events.on('agentsUpdate', (agents: AgentV2[] | null) => {
      this.renderScene(agents && agents.length > 0 ? agents : DEMO_AGENTS);
    });

    this.renderScene(DEMO_AGENTS);
  }

  private renderScene(agents: AgentV2[]): void {
    const cols = Math.min(agents.length, 3) || 1;
    const laidOut = agents.map((a, i) => ({
      agent: a,
      col: (i % cols) + 1,
      row: Math.floor(i / cols) + 1,
    }));

    const maxCol = cols;
    const maxRow = Math.max(1, Math.ceil(agents.length / cols));

    const roomW = Math.max(maxCol * CELL_W + MARGIN * 2, 700);
    const roomH = TOP_AREA_H + maxRow * CELL_H + LOUNGE_H;

    this.clearScene();
    this.drawBackground(roomW, roomH);
    this.placeDecorations(roomW, roomH);

    for (let i = 0; i < laidOut.length; i++) {
      const { agent, col, row } = laidOut[i];
      const x = (col - 1) * CELL_W + MARGIN + CELL_W / 2;
      const y = TOP_AREA_H + (row - 1) * CELL_H + CELL_H * 0.62;
      const sprite = new AgentSpriteV2(this, x, y, i, agent);
      this.agentSprites.set(agent.id, sprite);
    }

    const hoverY = TOP_AREA_H * 0.14;
    this.boss = new BossSpriteV2(this, 'Renan', 'Head do Time', hoverY, MARGIN + 220, roomW - MARGIN - 100);

    const cam = this.cameras.main;
    const scaleX = cam.width / (roomW + 32);
    const scaleY = cam.height / (roomH + 32);
    const zoom = Math.min(scaleX, scaleY, 1.6);
    cam.setZoom(zoom);
    cam.centerOn(roomW / 2, roomH / 2);
  }

  private drawBackground(roomW: number, roomH: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a1030, 0x1a1030, 0x0c0a14, 0x0c0a14, 1);
    g.fillRect(0, 0, roomW, roomH);
    g.setDepth(-5);
    this.bgGraphics = g;

    const skyline = this.add.image(roomW / 2, 0, PROP_KEYS_V2.skyline)
      .setOrigin(0.5, 0)
      .setDepth(-4);
    skyline.setDisplaySize(roomW, TOP_AREA_H * 1.15);

    const fade = this.add.graphics().setDepth(-3);
    fade.fillGradientStyle(0x0c0a14, 0x0c0a14, 0x0c0a14, 0x0c0a14, 0, 0, 1, 1);
    fade.fillRect(0, TOP_AREA_H - 50, roomW, 50);

    const floor = this.add.graphics().setDepth(-4);
    floor.fillStyle(0x141020, 1);
    floor.fillRect(0, TOP_AREA_H, roomW, roomH - TOP_AREA_H);

    const border = this.add.graphics().setDepth(1000);
    border.lineStyle(2, 0xE9571C, 0.35);
    border.strokeRect(0, 0, roomW, roomH);
  }

  private placeDecorations(roomW: number, roomH: number): void {
    const add = (obj: Phaser.GameObjects.GameObject) => { this.decorations.push(obj); return obj; };

    const logo = this.add.image(24, 20, PROP_KEYS_V2.logo).setOrigin(0, 0).setDepth(10);
    logo.setDisplaySize(220, 73);
    add(logo);

    const panelA = this.add.image(roomW - 60, 90, PROP_KEYS_V2.neonPanelA).setOrigin(0.5, 0).setDepth(10);
    panelA.setScale(0.09);
    add(panelA);

    const robot = this.add.image(roomW - 70, roomH - 30, PROP_KEYS_V2.robot).setOrigin(0.5, 1).setDepth(roomH - 30);
    robot.setScale(0.09);
    add(robot);

    const centerX = roomW / 2;
    const loungeY = roomH - 40;

    const rug = this.add.image(centerX, loungeY - 20, PROP_KEYS_V2.rug).setOrigin(0.5, 0.5).setDepth(-1);
    rug.setScale(0.22);
    add(rug);

    const couch = this.add.image(centerX, loungeY, PROP_KEYS_V2.couch).setOrigin(0.5, 1).setDepth(loungeY);
    couch.setScale(0.19);
    add(couch);

    const plant1 = this.add.image(MARGIN * 0.5, roomH - 30, PROP_KEYS_V2.plant).setOrigin(0.5, 1).setDepth(roomH - 30);
    plant1.setScale(0.1);
    add(plant1);

    const plant2 = this.add.image(roomW - MARGIN * 0.5, TOP_AREA_H + 30, PROP_KEYS_V2.plant).setOrigin(0.5, 1).setDepth(TOP_AREA_H + 30);
    plant2.setScale(0.08);
    add(plant2);
  }

  private clearScene(): void {
    for (const sprite of this.agentSprites.values()) sprite.destroy();
    this.agentSprites.clear();
    this.boss?.destroy();
    this.boss = undefined;
    for (const obj of this.decorations) obj.destroy();
    this.decorations = [];
    this.bgGraphics?.destroy();
    this.children.removeAll(true);
  }
}
