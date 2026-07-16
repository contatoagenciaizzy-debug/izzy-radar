import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type Squad = { id: string; name: string; icon: string };
type SquadState = {
  squad_id: string;
  status: "idle" | "running" | "completed" | "checkpoint" | string;
  step_current: number;
  step_total: number;
  step_label: string;
  started_at: string | null;
  updated_at: string;
};
type Agent = {
  squad_id: string;
  id: string;
  name: string;
  icon: string;
  status: "idle" | "working" | "done" | "checkpoint" | "delivering" | string;
  detail: string | null;
};
type Activity = {
  id: string;
  squad_id: string;
  time: string;
  message: string;
  kind: "status" | "agent" | "handoff" | "step" | "checkpoint" | string;
};

const AGENT_STATUS_COLOR: Record<string, string> = {
  idle: "#8a8aa3",
  working: "#e9571c",
  done: "#3ecf8e",
  checkpoint: "#ef4444",
  delivering: "#a78bfa",
};
const KIND_COLOR: Record<string, string> = {
  status: "#8a8aa3",
  agent: "#e9571c",
  handoff: "#a78bfa",
  step: "#60a5fa",
  checkpoint: "#ef4444",
};

function squadDot(status: string) {
  if (status === "running") return { color: "#3ecf8e", pulse: false };
  if (status === "checkpoint") return { color: "#ef4444", pulse: true };
  if (status === "completed") return { color: "#a78bfa", pulse: false };
  return { color: "#8a8aa3", pulse: false };
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Dashboard() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<SquadState | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [states, setStates] = useState<Record<string, SquadState>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [connected, setConnected] = useState(false);

  // Load squads + all squad states (for sidebar dots)
  useEffect(() => {
    (async () => {
      const { data: sq } = await supabase.from("squads").select("*").order("name");
      const { data: st } = await supabase.from("squad_states").select("*");
      setSquads((sq ?? []) as Squad[]);
      const stMap: Record<string, SquadState> = {};
      (st ?? []).forEach((s: SquadState) => { stMap[s.squad_id] = s; });
      setStates(stMap);
      if (sq && sq.length && !selectedId) setSelectedId(sq[0].id);
    })();

    const ch = supabase
      .channel("all-states")
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_states" }, (payload) => {
        const row = (payload.new ?? payload.old) as SquadState;
        if (!row?.squad_id) return;
        setStates((prev) => ({ ...prev, [row.squad_id]: payload.new as SquadState ?? prev[row.squad_id] }));
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load selected squad data + realtime
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      const [{ data: st }, { data: ag }, { data: act }] = await Promise.all([
        supabase.from("squad_states").select("*").eq("squad_id", selectedId).maybeSingle(),
        supabase.from("agents").select("*").eq("squad_id", selectedId),
        supabase.from("activity_log").select("*").eq("squad_id", selectedId).order("time", { ascending: false }).limit(50),
      ]);
      if (cancelled) return;
      setState((st ?? null) as SquadState | null);
      setAgents((ag ?? []) as Agent[]);
      setActivity((act ?? []) as Activity[]);
    })();

    const filter = `squad_id=eq.${selectedId}`;
    const ch = supabase
      .channel(`squad-${selectedId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_states", filter }, (p) => {
        if (p.new) setState(p.new as SquadState);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agents", filter }, (p) => {
        setAgents((prev) => {
          if (p.eventType === "DELETE") return prev.filter((a) => a.id !== (p.old as Agent).id);
          const n = p.new as Agent;
          const i = prev.findIndex((a) => a.id === n.id);
          if (i === -1) return [...prev, n];
          const copy = [...prev]; copy[i] = n; return copy;
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log", filter }, (p) => {
        setActivity((prev) => [p.new as Activity, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [selectedId]);

  const isCheckpoint = state?.status === "checkpoint";
  const pct = state && state.step_total > 0 ? Math.min(100, (state.step_current / state.step_total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-panel">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-xs font-bold">i</div>
          <h1 className="text-sm font-bold tracking-wide">opensquad <span className="text-muted-foreground font-normal">Dashboard</span></h1>
        </div>
        <div className="text-xs text-muted-foreground">Agência Izzy</div>
      </header>

      {/* Checkpoint banner */}
      {isCheckpoint && (
        <div className="border-b border-border bg-[#3a1414] text-[#fca5a5] px-6 py-2 text-xs flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-danger pulse-danger" />
          Checkpoint — aguardando aprovação
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[240px] border-r border-border bg-panel flex flex-col">
          <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">Squads</div>
          <nav className="flex-1 overflow-y-auto px-2 space-y-1">
            {squads.map((s) => {
              const dot = squadDot(states[s.id]?.status ?? "idle");
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelectedId(s.id); setSelectedAgent(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${active ? "bg-panel-2 border border-accent/40" : "hover:bg-panel-2 border border-transparent"}`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${dot.pulse ? "pulse-danger" : ""}`}
                    style={{ backgroundColor: dot.color }}
                  />
                </button>
              );
            })}
            {squads.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground">Nenhum squad ainda.</div>
            )}
          </nav>
        </aside>

        {/* Center */}
        <main className="flex-1 relative p-6 overflow-y-auto">
          {/* Floating agent card */}
          {selectedAgent && (
            <div className="absolute top-6 right-6 w-[320px] bg-panel-2 border border-accent/60 rounded-lg shadow-xl p-4 z-10">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-panel flex items-center justify-center text-2xl">{selectedAgent.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">{selectedAgent.name}</div>
                    <button onClick={() => setSelectedAgent(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: AGENT_STATUS_COLOR[selectedAgent.status] ?? "#8a8aa3" }}>
                    {selectedAgent.status}
                  </div>
                  {selectedAgent.detail && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-accent">★</span>
                      <span>{selectedAgent.detail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scene placeholder */}
          <div className="h-[420px] rounded-lg border border-dashed border-border bg-panel flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">🏢</div>
              <div className="text-sm font-medium">Cena do escritório — em desenvolvimento</div>
              <div className="text-xs text-muted-foreground mt-1">A visualização pixel art (Phaser) entra aqui.</div>
            </div>
          </div>

          {/* Agents list */}
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Agentes</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAgent(a)}
                  className="flex items-center gap-3 p-3 rounded-md bg-panel border border-border hover:border-accent/60 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-panel-2 flex items-center justify-center text-xl">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs truncate text-muted-foreground">{a.detail ?? "—"}</div>
                  </div>
                  <span className="text-[10px] uppercase" style={{ color: AGENT_STATUS_COLOR[a.status] ?? "#8a8aa3" }}>{a.status}</span>
                </button>
              ))}
              {agents.length === 0 && (
                <div className="text-xs text-muted-foreground p-3">Nenhum agente neste squad.</div>
              )}
            </div>
          </div>
        </main>

        {/* Right: activity */}
        <aside className="w-[260px] border-l border-border bg-panel flex flex-col">
          <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">Atividade</div>
          <div className="flex-1 overflow-y-auto">
            {activity.map((ev) => (
              <div key={ev.id} className="px-4 py-3 border-b border-border/50">
                <div className="flex items-start gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: KIND_COLOR[ev.kind] ?? "#8a8aa3" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-snug">{ev.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{fmtTime(ev.time)}</div>
                  </div>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="text-xs text-muted-foreground p-4">Sem atividade recente.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-panel px-6 py-3 flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-panel-2 flex items-center justify-center text-sm">📋</div>
        <div className="flex-1 min-w-0">
          <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs mt-1.5 text-muted-foreground">
            {state ? `Etapa ${state.step_current}/${state.step_total} — ${state.step_label}` : "Selecione um squad"}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: connected ? "#e9571c" : "#8a8aa3" }}
          />
          <span className={connected ? "text-accent" : "text-muted-foreground"}>{connected ? "conectado" : "conectando..."}</span>
        </div>
      </footer>
    </div>
  );
}
