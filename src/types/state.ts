// Minimal types for the office scene — mirrors squads/agents shape used by Supabase
export interface AgentDesk {
  col: number;
  row: number;
}

export type AgentStatus =
  | "idle"
  | "working"
  | "delivering"
  | "done"
  | "checkpoint";

export interface Agent {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  gender?: "male" | "female";
  desk: AgentDesk;
  detail?: string;
}

export interface Handoff {
  from: string;
  to: string;
  message: string;
  completedAt: string;
}

export type SquadStatus = "idle" | "running" | "completed" | "checkpoint";

export interface SquadState {
  squad: string;
  status: SquadStatus;
  step: {
    current: number;
    total: number;
    label: string;
  };
  agents: Agent[];
  handoff: Handoff | null;
  startedAt: string | null;
  updatedAt: string;
}
