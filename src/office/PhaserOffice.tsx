import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { OfficeSceneV2 } from './OfficeSceneV2';
import type { AgentV2 } from './AgentSpriteV2';

interface PhaserOfficeProps {
  agents: AgentV2[];
  onAgentClick?: (agentId: string) => void;
}

export function PhaserOffice({ agents, onAgentClick }: PhaserOfficeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onAgentClickRef = useRef(onAgentClick);
  onAgentClickRef.current = onAgentClick;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const container = containerRef.current;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: w,
      height: h,
      pixelArt: false,
      antialias: true,
      roundPixels: true,
      backgroundColor: '#0c0a14',
      scene: [OfficeSceneV2],
      scale: { mode: Phaser.Scale.NONE },
    });

    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('OfficeSceneV2') as OfficeSceneV2 | null;
      scene?.events.on('agentClicked', (agentId: string) => {
        onAgentClickRef.current?.(agentId);
      });
    });

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) game.scale.resize(width, height);
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene('OfficeSceneV2') as OfficeSceneV2 | null;
    if (!scene || !scene.scene.isActive()) return;
    scene.events.emit('agentsUpdate', agents);
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="h-[520px] rounded-lg border border-border overflow-hidden"
    />
  );
}
