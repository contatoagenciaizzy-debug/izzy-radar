
CREATE TABLE public.squads (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📦'
);
GRANT SELECT ON public.squads TO anon, authenticated;
GRANT ALL ON public.squads TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read squads" ON public.squads FOR SELECT USING (true);

CREATE TABLE public.squad_states (
  squad_id text PRIMARY KEY REFERENCES public.squads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'idle',
  step_current int NOT NULL DEFAULT 0,
  step_total int NOT NULL DEFAULT 0,
  step_label text NOT NULL DEFAULT '',
  started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squad_states TO anon, authenticated;
GRANT ALL ON public.squad_states TO service_role;
ALTER TABLE public.squad_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read squad_states" ON public.squad_states FOR SELECT USING (true);

CREATE TABLE public.agents (
  squad_id text NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  id text NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🤖',
  status text NOT NULL DEFAULT 'idle',
  detail text,
  PRIMARY KEY (squad_id, id)
);
GRANT SELECT ON public.agents TO anon, authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read agents" ON public.agents FOR SELECT USING (true);

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id text NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  time timestamptz NOT NULL DEFAULT now(),
  message text NOT NULL,
  kind text NOT NULL DEFAULT 'status'
);
CREATE INDEX activity_log_squad_time_idx ON public.activity_log (squad_id, time DESC);
GRANT SELECT ON public.activity_log TO anon, authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read activity_log" ON public.activity_log FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

ALTER TABLE public.squad_states REPLICA IDENTITY FULL;
ALTER TABLE public.agents REPLICA IDENTITY FULL;
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;

-- Seed data
INSERT INTO public.squads (id, name, icon) VALUES
  ('conteudo-clientes', 'Conteúdo Multiplataforma', '📱');

INSERT INTO public.squad_states (squad_id, status, step_current, step_total, step_label, started_at, updated_at) VALUES
  ('conteudo-clientes', 'checkpoint', 7, 13, 'Montar PDF', now() - interval '1 hour', now());

INSERT INTO public.agents (squad_id, id, name, icon, status, detail) VALUES
  ('conteudo-clientes', 'thay',  'Thay (SM)',    '✍️', 'working', 'Escrevendo post 3 de 8'),
  ('conteudo-clientes', 'bia',   'Bia (Design)', '🎨', 'done',    'Capa aprovada pelo cliente'),
  ('conteudo-clientes', 'caio',  'Caio (Ads)',   '📈', 'working', 'Subindo campanha'),
  ('conteudo-clientes', 'lia',   'Lia (Vídeo)',  '🎬', 'idle',    'Aguardando roteiro');

INSERT INTO public.activity_log (squad_id, time, message, kind) VALUES
  ('conteudo-clientes', now() - interval '15 minutes', 'Thay SM: idle → working (Escrevendo post 3 de 8)', 'agent'),
  ('conteudo-clientes', now() - interval '16 minutes', 'Bia Design: working → done (Capa aprovada)',       'agent'),
  ('conteudo-clientes', now() - interval '17 minutes', 'Caio Ads: idle → working (Subindo campanha)',      'agent'),
  ('conteudo-clientes', now() - interval '30 minutes', 'Renan: iniciou a Etapa 7/13 (Montar PDF)',         'step'),
  ('conteudo-clientes', now() - interval '45 minutes', 'Checkpoint — aguardando aprovação do cliente',     'checkpoint');
