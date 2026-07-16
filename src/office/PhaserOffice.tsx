import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { OfficeScene } from './OfficeScene';
import type { Agent, SquadState } from '@/types/state';

interface SupabaseAgent {
  id: string;
  name: string;
  icon: string;
  status: string;
  detail?: string | null;
}

interface PhaserOfficeProps {
  agents: SupabaseAgent[];
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
      antialias: false,
      roundPixels: true,
      backgroundColor: '#1a1420',
      scene: [OfficeScene],
      scale: { mode: Phaser.Scale.NONE },
    });

    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('OfficeScene') as OfficeScene | null;
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
    const scene = game.scene.getScene('OfficeScene') as OfficeScene | null;
    if (!scene || !scene.scene.isActive()) return;

    // Bridge Supabase rows into the SquadState shape the original scene expects.
    // desk is fixed at {1,1} for every agent — OfficeScene auto-grids agents that
    // all share the same desk position (see renderScene's allSameDesk fallback).
    const mapped: Agent[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      status: (a.status as Agent['status']) ?? 'idle',
      desk: { col: 1, row: 1 },
      detail: a.detail ?? '',
    }));

    const state: SquadState | null = agents.length > 0 ? {
      squad: 'izzy',
      status: 'running',
      step: { current: 0, total: 0, label: '' },
      agents: mapped,
      handoff: null,
      startedAt: null,
      updatedAt: new Date().toISOString(),
    } : null;

    scene.events.emit('stateUpdate', state);
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="h-[520px] rounded-lg border border-border overflow-hidden"
    />
  );
}
