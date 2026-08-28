-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- first signed-up user becomes admin, others recruiter
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_any boolean;
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO has_any;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN has_any THEN 'recruiter'::public.app_role ELSE 'admin'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CANDIDATES
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  access_code text NOT NULL UNIQUE,
  position text NOT NULL,
  status text NOT NULL DEFAULT 'nao_iniciado',
  progress integer NOT NULL DEFAULT 0,
  code_active boolean NOT NULL DEFAULT true,
  code_expires_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read candidates" ON public.candidates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'recruiter'));

CREATE TABLE public.candidate_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  section text NOT NULL,
  question_id text NOT NULL DEFAULT 'data',
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, section, question_id)
);
GRANT SELECT ON public.candidate_responses TO authenticated;
GRANT ALL ON public.candidate_responses TO service_role;
ALTER TABLE public.candidate_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read responses" ON public.candidate_responses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'recruiter'));

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
  assessment_status text NOT NULL DEFAULT 'pendente',
  final_score_ai numeric(4,2),
  final_score_hr numeric(4,2),
  recommendation_ai text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read assessments" ON public.assessments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'recruiter'));

CREATE TABLE public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  weight numeric(4,2) NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.evaluation_criteria TO authenticated;
GRANT ALL ON public.evaluation_criteria TO service_role;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read criteria" ON public.evaluation_criteria FOR SELECT TO authenticated USING (true);

CREATE TABLE public.ai_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  criteria_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  interview_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  executive_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation text,
  final_score numeric(4,2),
  generated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_evaluations TO authenticated;
GRANT ALL ON public.ai_evaluations TO service_role;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read ai evals" ON public.ai_evaluations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'recruiter'));

CREATE TABLE public.hr_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  reviewer_id uuid,
  reviewer_name text,
  criteria_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  comments text,
  strengths text,
  attention_points text,
  final_score numeric(4,2),
  final_recommendation text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, reviewer_id)
);
GRANT SELECT ON public.hr_reviews TO authenticated;
GRANT ALL ON public.hr_reviews TO service_role;
ALTER TABLE public.hr_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read hr reviews" ON public.hr_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'recruiter'));

-- SEED: criteria
INSERT INTO public.evaluation_criteria (key, name, weight, description, sort_order) VALUES
 ('negocio','Visão de Negócio e RH',0.20,'Compreensão do contexto, problemas relevantes e conexão entre tecnologia e resultado.',1),
 ('analytics','Analytics e Indicadores',0.25,'Qualidade dos KPIs, fontes de dados, governança e visão executiva.',2),
 ('automacao','Automação e Power Platform',0.20,'Escolha de processos, tecnologia, viabilidade e ganhos esperados.',3),
 ('ia','IA Generativa',0.20,'Relevância, arquitetura, RAG, riscos, LGPD e indicadores de sucesso.',4),
 ('comunicacao','Comunicação e Stakeholders',0.15,'Clareza, estrutura, priorização e visão executiva.',5);

-- SEED: candidates
INSERT INTO public.candidates (id, name, email, access_code, position, status, progress, started_at, submitted_at) VALUES
 ('11111111-1111-4111-8111-000000000001','Ana Lima','ana.lima@exemplo.com','VERO-2026-001','Inteligência e Inovação de RH','avaliado',100, now() - interval '9 days', now() - interval '8 days'),
 ('11111111-1111-4111-8111-000000000002','Bruno Tavares','bruno.tavares@exemplo.com','VERO-2026-002','Inteligência e Inovação de RH','em_avaliacao',100, now() - interval '7 days', now() - interval '6 days'),
 ('11111111-1111-4111-8111-000000000003','Carla Mendes','carla.mendes@exemplo.com','VERO-2026-003','Analytics e Transformação Digital','em_avaliacao',100, now() - interval '6 days', now() - interval '5 days'),
 ('11111111-1111-4111-8111-000000000004','Diego Ferreira','diego.ferreira@exemplo.com','VERO-2026-004','Analytics e Transformação Digital','em_andamento',60, now() - interval '2 days', NULL),
 ('11111111-1111-4111-8111-000000000005','Elisa Rocha','elisa.rocha@exemplo.com','VERO-2026-005','Inteligência e Inovação de RH','enviado',100, now() - interval '4 days', now() - interval '3 days'),
 ('11111111-1111-4111-8111-000000000006','Felipe Souza','felipe.souza@exemplo.com','VERO-2026-006','Analytics e Transformação Digital','em_andamento',20, now() - interval '1 day', NULL),
 ('11111111-1111-4111-8111-000000000007','Gabriela Nunes','gabriela.nunes@exemplo.com','VERO-2026-007','Inteligência e Inovação de RH','nao_iniciado',0, NULL, NULL),
 ('11111111-1111-4111-8111-000000000008','Henrique Alves','henrique.alves@exemplo.com','VERO-2026-A7K9','Analytics e Transformação Digital','nao_iniciado',0, NULL, NULL);

-- SEED: responses (4 arquétipos)
INSERT INTO public.candidate_responses (candidate_id, section, response) VALUES
 ('11111111-1111-4111-8111-000000000001','diagnostico','{"processos":"Mapearia a jornada do colaborador ponta a ponta (atração, admissão, desenvolvimento, desligamento) com workshops de process mining e SIPOC, medindo lead time e retrabalho de cada etapa.","stakeholders":[{"area":"Diretoria de RH","objetivo":"Entender prioridades estratégicas e metas de 2026","prioridade":"Alta"},{"area":"Business Partners","objetivo":"Dores operacionais e demandas recorrentes","prioridade":"Alta"},{"area":"TI / Dados","objetivo":"Arquitetura, acessos e segurança","prioridade":"Média"}],"dados":[{"fonte":"ERP de RH","tipo":"Cadastral e folha","responsavel":"RH Operações","qualidade":"Média","frequencia":"Diária"},{"fonte":"ATS","tipo":"Recrutamento","responsavel":"Talent Acquisition","qualidade":"Boa","frequencia":"Tempo real"},{"fonte":"Pesquisa de clima","tipo":"Engajamento","responsavel":"RH Estratégico","qualidade":"Boa","frequencia":"Trimestral"}],"priorizacao":"Matriz Impacto x Esforço combinada com ROI estimado e risco de compliance. Quick wins entram no primeiro ciclo de 30 dias.","criterios":"Impacto no negócio, esforço técnico, disponibilidade de dado, risco LGPD e patrocínio do stakeholder."}'),
 ('11111111-1111-4111-8111-000000000001','analytics','{"indicadores":[{"indicador":"Turnover voluntário","objetivo":"Antecipar perda de talentos","formula":"Desligamentos voluntários / headcount médio","fonte":"ERP de RH","periodicidade":"Mensal"},{"indicador":"Time to hire","objetivo":"Velocidade de contratação","formula":"Dias entre abertura e aceite","fonte":"ATS","periodicidade":"Semanal"},{"indicador":"Custo por contratação","objetivo":"Eficiência do funil","formula":"Custo total / contratações","fonte":"ATS + Financeiro","periodicidade":"Mensal"}],"fontes":"Camada de ingestão em Azure Data Factory, modelo dimensional no Fabric/Lakehouse e semantic model único no Power BI, com chave mestra de colaborador.","governanca":"Data owners por domínio, dicionário de dados, validação automática de qualidade, RLS por área e classificação de dados sensíveis conforme LGPD.","periodicidade":"Diário","widgets":[{"tipo":"KPI","titulo":"Turnover 12M"},{"tipo":"Gráfico de linha","titulo":"Evolução de headcount"},{"tipo":"Funil","titulo":"Funil de recrutamento"},{"tipo":"Ranking","titulo":"Áreas com maior atrito"}]}'),
 ('11111111-1111-4111-8111-000000000001','automacao','{"automacoes":[{"processo":"Onboarding de novos colaboradores","problema":"Checklist manual em planilhas, atrasos de acesso","motivo":"Alto volume e impacto direto na experiência","tecnologia":"Power Automate","fluxo":"Aceite no ATS → criação de tarefas no Planner → provisionamento de acessos → notificação no Teams","ganho":"Redução de tempo","ganho_valor":"70% menos tempo de ciclo"},{"processo":"Solicitação de férias","problema":"E-mails e aprovações perdidas","motivo":"Processo repetitivo e auditável","tecnologia":"Power Apps","fluxo":"App → validação de saldo → aprovação do gestor → integração ERP","ganho":"Redução de erros","ganho_valor":"90% menos retrabalho"},{"processo":"Relatórios mensais de RH","problema":"Consolidação manual de 6 planilhas","motivo":"Libera 3 dias/mês do time","tecnologia":"Power BI","fluxo":"Ingestão automática → modelo → distribuição por assinatura","ganho":"Ganho financeiro","ganho_valor":"~R$ 90k/ano"}]}'),
 ('11111111-1111-4111-8111-000000000001','ia','{"problema":"Time de RH gasta horas respondendo dúvidas repetitivas de políticas internas e benefícios.","usuarios":"Colaboradores, gestores e RH","solucao":"Assistente conversacional com RAG sobre políticas, CLT interna e benefícios, integrado ao Teams, com citação obrigatória da fonte e escalonamento humano.","arquitetura":["Usuário","Microsoft Teams","API","RAG","Base de Conhecimento","IA Generativa","Microsoft Azure"],"fontes":[{"fonte":"Manual de políticas","tipo":"Documento","sensibilidade":"Interna","responsavel":"RH Estratégico"},{"fonte":"FAQ de benefícios","tipo":"Documento","sensibilidade":"Interna","responsavel":"RH Operações"}],"riscos":"Alucinação, vazamento de dado pessoal, resposta desatualizada e vieses.","mitigacoes":"RAG com citação, curadoria mensal, filtro de PII, human-in-the-loop para temas sensíveis e logs auditáveis.","kpis":[{"kpi":"Taxa de resolução sem humano","meta":"70%"},{"kpi":"Satisfação do usuário","meta":"4,5/5"},{"kpi":"Redução de chamados","meta":"-40%"}]}'),
 ('11111111-1111-4111-8111-000000000001','roadmap','{"d30":[{"iniciativa":"Entrevistas com stakeholders","impacto":"Alto","esforco":"Baixo","responsavel":"Líder de Inteligência","status":"Concluído"},{"iniciativa":"Inventário de dados e fontes","impacto":"Alto","esforco":"Médio","responsavel":"Analista de Dados","status":"Concluído"}],"d60":[{"iniciativa":"Dashboard executivo v1","impacto":"Alto","esforco":"Médio","responsavel":"BI","status":"Em andamento"},{"iniciativa":"Piloto de automação de onboarding","impacto":"Alto","esforco":"Médio","responsavel":"Power Platform","status":"Em andamento"}],"d90":[{"iniciativa":"Assistente de IA em produção","impacto":"Alto","esforco":"Alto","responsavel":"Squad IA","status":"Planejado"},{"iniciativa":"Governança e roadmap 2027","impacto":"Médio","esforco":"Baixo","responsavel":"Liderança","status":"Planejado"}]}'),
 ('11111111-1111-4111-8111-000000000002','diagnostico','{"processos":"Levantaria os fluxos via documentação técnica dos sistemas e logs de uso, criando um diagrama BPMN detalhado.","stakeholders":[{"area":"TI","objetivo":"Acessos e integrações","prioridade":"Alta"}],"dados":[{"fonte":"Banco do ERP","tipo":"Tabelas transacionais","responsavel":"TI","qualidade":"Boa","frequencia":"Tempo real"},{"fonte":"Logs de sistemas","tipo":"Eventos","responsavel":"TI","qualidade":"Média","frequencia":"Diária"}],"priorizacao":"Priorizaria pelo que é tecnicamente viável com os dados já disponíveis.","criterios":"Disponibilidade técnica e complexidade de integração."}'),
 ('11111111-1111-4111-8111-000000000002','analytics','{"indicadores":[{"indicador":"Headcount","objetivo":"Acompanhar quadro","formula":"Contagem de ativos","fonte":"ERP","periodicidade":"Diário"},{"indicador":"Absenteísmo","objetivo":"Medir faltas","formula":"Horas ausentes / horas previstas","fonte":"Ponto","periodicidade":"Mensal"},{"indicador":"Turnover","objetivo":"Medir saídas","formula":"Desligamentos / headcount","fonte":"ERP","periodicidade":"Mensal"}],"fontes":"Pipeline em Python + dbt carregando um data warehouse Postgres, com testes automatizados de schema e freshness.","governanca":"Controle de versão dos modelos, testes dbt e catálogo automatizado.","periodicidade":"Diário","widgets":[{"tipo":"KPI","titulo":"Headcount"},{"tipo":"Gráfico de barras","titulo":"Absenteísmo por área"},{"tipo":"Tabela","titulo":"Detalhe operacional"}]}'),
 ('11111111-1111-4111-8111-000000000002','automacao','{"automacoes":[{"processo":"Extração de dados do ERP","problema":"Exportações manuais em CSV","motivo":"Base para todo o resto","tecnologia":"API","fluxo":"Job agendado → API → data lake → warehouse","ganho":"Redução de esforço manual","ganho_valor":"8h/semana"},{"processo":"Conciliação de ponto","problema":"Divergências detectadas tarde","motivo":"Risco trabalhista","tecnologia":"RPA","fluxo":"Robô lê ponto → compara com escala → gera exceções","ganho":"Redução de erros","ganho_valor":"n/d"},{"processo":"Distribuição de relatórios","problema":"Envio manual","motivo":"Simples de automatizar","tecnologia":"Power Automate","fluxo":"Agendamento → geração → e-mail","ganho":"Redução de tempo","ganho_valor":"n/d"}]}'),
 ('11111111-1111-4111-8111-000000000002','ia','{"problema":"Triagem de currículos consome muito tempo do time técnico.","usuarios":"Recrutadores","solucao":"Modelo de embeddings comparando currículos com a descrição da vaga e ranqueando por similaridade semântica, com fine-tuning leve de prompts.","arquitetura":["Aplicação","API","Base de Dados","IA Generativa"],"fontes":[{"fonte":"Base de currículos","tipo":"Documento","sensibilidade":"Dados pessoais","responsavel":"TA"}],"riscos":"Viés algorítmico no ranqueamento.","mitigacoes":"Revisão humana da lista final.","kpis":[{"kpi":"Tempo de triagem","meta":"-50%"}]}'),
 ('11111111-1111-4111-8111-000000000002','roadmap','{"d30":[{"iniciativa":"Montar pipeline de dados","impacto":"Alto","esforco":"Alto","responsavel":"Eng. de Dados","status":"Planejado"}],"d60":[{"iniciativa":"Warehouse consolidado","impacto":"Alto","esforco":"Alto","responsavel":"Eng. de Dados","status":"Planejado"}],"d90":[{"iniciativa":"Modelo de triagem em produção","impacto":"Médio","esforco":"Alto","responsavel":"Data Science","status":"Planejado"}]}'),
 ('11111111-1111-4111-8111-000000000003','diagnostico','{"processos":"Começaria ouvindo a Diretoria para entender a estratégia e onde RH trava o negócio, depois validaria com os BPs.","stakeholders":[{"area":"Diretoria","objetivo":"Alinhar prioridades e patrocínio","prioridade":"Alta"},{"area":"Gestores de área","objetivo":"Entender dores do dia a dia","prioridade":"Alta"},{"area":"Colaboradores","objetivo":"Percepção de experiência","prioridade":"Média"}],"dados":[{"fonte":"Indicadores atuais de RH","tipo":"Consolidado","responsavel":"RH","qualidade":"Média","frequencia":"Mensal"}],"priorizacao":"Foco no que gera valor percebido pela Diretoria nos primeiros 90 dias, equilibrando quick wins e fundação.","criterios":"Impacto no negócio, visibilidade executiva e viabilidade de curto prazo."}'),
 ('11111111-1111-4111-8111-000000000003','analytics','{"indicadores":[{"indicador":"Turnover","objetivo":"Retenção de talentos","formula":"n/d","fonte":"RH","periodicidade":"Mensal"},{"indicador":"eNPS","objetivo":"Engajamento","formula":"n/d","fonte":"Pesquisa","periodicidade":"Trimestral"}],"fontes":"Consolidaria com apoio da TI, priorizando primeiro os indicadores que a Diretoria já cobra hoje.","governanca":"Definiria donos por indicador e um ritual mensal de validação com o RH.","periodicidade":"Mensal","widgets":[{"tipo":"KPI","titulo":"Turnover"},{"tipo":"KPI","titulo":"eNPS"}]}'),
 ('11111111-1111-4111-8111-000000000003','automacao','{"automacoes":[{"processo":"Onboarding","problema":"Experiência ruim do novo colaborador","motivo":"Primeira impressão impacta retenção","tecnologia":"Power Automate","fluxo":"Entrada → tarefas automáticas → acompanhamento","ganho":"Melhoria de experiência","ganho_valor":""},{"processo":"Avaliação de desempenho","problema":"Ciclo lento e manual","motivo":"Alto impacto na gestão","tecnologia":"Outra","fluxo":"Formulário → consolidação → calibração","ganho":"Redução de tempo","ganho_valor":""}]}'),
 ('11111111-1111-4111-8111-000000000003','ia','{"problema":"Gestores têm dificuldade de dar feedback estruturado.","usuarios":"Gestores","solucao":"Assistente que ajuda o gestor a estruturar feedbacks e planos de desenvolvimento a partir de evidências.","arquitetura":["Usuário","Aplicação","IA Generativa"],"fontes":[],"riscos":"Uso indevido de dados pessoais e dependência da ferramenta.","mitigacoes":"Treinamento dos gestores e política clara de uso.","kpis":[{"kpi":"Adoção pelos gestores","meta":"60%"}]}'),
 ('11111111-1111-4111-8111-000000000003','roadmap','{"d30":[{"iniciativa":"Entrevistas executivas","impacto":"Alto","esforco":"Baixo","responsavel":"Líder","status":"Planejado"},{"iniciativa":"Diagnóstico de maturidade","impacto":"Alto","esforco":"Médio","responsavel":"Líder","status":"Planejado"}],"d60":[{"iniciativa":"Primeiro painel executivo","impacto":"Alto","esforco":"Médio","responsavel":"RH + TI","status":"Planejado"}],"d90":[{"iniciativa":"Plano de transformação 2027","impacto":"Alto","esforco":"Médio","responsavel":"Líder","status":"Planejado"}]}'),
 ('11111111-1111-4111-8111-000000000005','diagnostico','{"processos":"Mapearia os processos de RH com entrevistas rápidas e observação direta das rotinas.","stakeholders":[{"area":"RH Operações","objetivo":"Entender rotinas","prioridade":"Alta"}],"dados":[{"fonte":"Planilhas de controle","tipo":"Operacional","responsavel":"RH","qualidade":"Baixa","frequencia":"Semanal"}],"priorizacao":"Impacto x Esforço.","criterios":"Impacto e esforço."}'),
 ('11111111-1111-4111-8111-000000000005','analytics','{"indicadores":[{"indicador":"Turnover","objetivo":"Retenção","formula":"Saídas / headcount","fonte":"RH","periodicidade":"Mensal"}],"fontes":"Consolidaria as planilhas em uma base única antes de pensar em ferramenta.","governanca":"Um responsável por base e checagem mensal.","periodicidade":"Mensal","widgets":[{"tipo":"KPI","titulo":"Turnover"}]}'),
 ('11111111-1111-4111-8111-000000000005','automacao','{"automacoes":[{"processo":"Admissão documental","problema":"Documentos por e-mail","motivo":"Alto volume","tecnologia":"SharePoint","fluxo":"Upload → validação → arquivamento","ganho":"Redução de tempo","ganho_valor":""}]}'),
 ('11111111-1111-4111-8111-000000000005','ia','{"problema":"Dúvidas repetitivas de benefícios.","usuarios":"Colaboradores","solucao":"FAQ inteligente com IA.","arquitetura":["Usuário","IA Generativa"],"fontes":[],"riscos":"Respostas incorretas.","mitigacoes":"Revisão do RH.","kpis":[]}'),
 ('11111111-1111-4111-8111-000000000005','roadmap','{"d30":[{"iniciativa":"Diagnóstico","impacto":"Alto","esforco":"Baixo","responsavel":"RH","status":"Planejado"}],"d60":[{"iniciativa":"Base única de dados","impacto":"Médio","esforco":"Médio","responsavel":"RH","status":"Planejado"}],"d90":[]}'),
 ('11111111-1111-4111-8111-000000000004','diagnostico','{"processos":"Mapearia processos críticos com foco em dados disponíveis e gargalos operacionais.","stakeholders":[{"area":"RH Operações","objetivo":"Gargalos","prioridade":"Alta"},{"area":"TI","objetivo":"Integrações","prioridade":"Média"}],"dados":[{"fonte":"ERP","tipo":"Cadastral","responsavel":"TI","qualidade":"Boa","frequencia":"Diária"}],"priorizacao":"Impacto x Esforço com foco em quick wins.","criterios":"Impacto, esforço e disponibilidade de dados."}'),
 ('11111111-1111-4111-8111-000000000004','analytics','{"indicadores":[{"indicador":"Time to hire","objetivo":"Velocidade","formula":"Dias até aceite","fonte":"ATS","periodicidade":"Semanal"}],"fontes":"Integração via API do ATS e ERP em um modelo único no Power BI.","governanca":"Owner por indicador.","periodicidade":"Semanal","widgets":[{"tipo":"KPI","titulo":"Time to hire"},{"tipo":"Funil","titulo":"Funil de seleção"}]}'),
 ('11111111-1111-4111-8111-000000000004','automacao','{"automacoes":[{"processo":"Aprovação de vaga","problema":"Aprovações lentas por e-mail","motivo":"Impacto direto no time to hire","tecnologia":"Power Automate","fluxo":"Solicitação → aprovação → abertura no ATS","ganho":"Redução de tempo","ganho_valor":"5 dias"}]}'),
 ('11111111-1111-4111-8111-000000000006','diagnostico','{"processos":"Ainda estruturando a resposta.","stakeholders":[],"dados":[],"priorizacao":"","criterios":""}');

-- SEED: assessments
INSERT INTO public.assessments (candidate_id, assessment_status, final_score_ai, final_score_hr, recommendation_ai) VALUES
 ('11111111-1111-4111-8111-000000000001','avaliado',9.05,8.90,'Forte recomendação'),
 ('11111111-1111-4111-8111-000000000002','em_avaliacao',7.05,NULL,'Recomendação'),
 ('11111111-1111-4111-8111-000000000003','em_avaliacao',6.60,NULL,'Avaliar com ressalvas'),
 ('11111111-1111-4111-8111-000000000005','pendente',5.15,NULL,'Avaliar com ressalvas'),
 ('11111111-1111-4111-8111-000000000004','pendente',NULL,NULL,NULL);

-- SEED: ai evaluations
INSERT INTO public.ai_evaluations (candidate_id, criteria_scores, strengths, weaknesses, interview_questions, executive_summary, recommendation, final_score) VALUES
 ('11111111-1111-4111-8111-000000000001',
  '[{"key":"negocio","score":9,"justification":"Conecta claramente jornada do colaborador, indicadores e impacto no negócio.","strengths":"Leitura de contexto madura","attention":"Poderia quantificar mais o impacto financeiro"},{"key":"analytics","score":9.5,"justification":"KPIs bem definidos com fórmula, fonte e periodicidade, além de governança e RLS.","strengths":"Semantic model único","attention":"Não detalhou SLA de qualidade"},{"key":"automacao","score":9,"justification":"Escolhe processos de alto volume com ganhos quantificados.","strengths":"Ganhos financeiros estimados","attention":"Faltou plano de suporte pós-go-live"},{"key":"ia","score":9,"justification":"Solução com RAG, citação de fonte, LGPD e human-in-the-loop.","strengths":"Preocupação real com risco","attention":"Sem estimativa de custo de inferência"},{"key":"comunicacao","score":8.5,"justification":"Roadmap claro e priorizado para leitura executiva.","strengths":"Estrutura executiva","attention":"Pouca menção a gestão de mudança"}]',
  '["Conecta negócio, dados, automação e IA com fluência","Governança de dados e LGPD tratados desde o desenho","Ganhos quantificados por iniciativa","Roadmap de 90 dias realista e priorizado"]',
  '["Gestão de mudança pouco explorada","Custos de plataforma e inferência não estimados","Plano de sustentação pós-implantação superficial"]',
  '["Como você garantiria adoção do assistente de IA pelos gestores?","Qual seria seu plano B se o dado do ERP não tivesse qualidade suficiente?","Como estimaria o custo total da plataforma nos 12 primeiros meses?","Que indicador você usaria para provar valor à Diretoria em 60 dias?"]',
  '["Perfil sênior com forte conexão entre negócio, dados e tecnologia","Domina Power Platform e IA generativa aplicada a RH","Roadmap de 90 dias bem priorizado e mensurável","Governança e LGPD tratados de forma madura","Principal lacuna: gestão de mudança e custos"]',
  'Forte recomendação', 9.05),
 ('11111111-1111-4111-8111-000000000002',
  '[{"key":"negocio","score":6,"justification":"Foco predominantemente técnico, com pouca conexão ao resultado de RH.","strengths":"Rigor técnico","attention":"Pouca leitura de negócio"},{"key":"analytics","score":8,"justification":"Arquitetura de dados sólida com testes e versionamento.","strengths":"dbt e testes automatizados","attention":"KPIs genéricos e sem visão executiva"},{"key":"automacao","score":7.5,"justification":"Boa viabilidade técnica, priorização orientada à infraestrutura.","strengths":"Domínio de API e RPA","attention":"Ganhos pouco quantificados"},{"key":"ia","score":7,"justification":"Solução pertinente, mas riscos tratados de forma superficial.","strengths":"Uso adequado de embeddings","attention":"LGPD e viés pouco endereçados"},{"key":"comunicacao","score":6,"justification":"Linguagem técnica, pouco adaptada a executivos.","strengths":"Clareza técnica","attention":"Falta storytelling executivo"}]',
  '["Excelente base de engenharia de dados","Escolhas tecnológicas viáveis e testáveis","Pensamento estruturado em pipeline e qualidade"]',
  '["Baixa conexão com resultado de negócio","Riscos de IA e LGPD pouco tratados","Comunicação pouco executiva"]',
  '["Como você traduziria seu pipeline em valor para a Diretoria?","Que riscos de viés você vê na triagem automatizada de currículos?","Como priorizaria se o dado ideal não existisse?"]',
  '["Perfil técnico forte em dados e automação","Visão de negócio ainda em desenvolvimento","Riscos de IA tratados superficialmente","Boa fundação para escalar a plataforma de dados","Requer par de negócio para equilibrar a frente"]',
  'Recomendação', 7.05),
 ('11111111-1111-4111-8111-000000000003',
  '[{"key":"negocio","score":9,"justification":"Excelente leitura de contexto executivo e patrocínio.","strengths":"Visão estratégica","attention":"Pouca profundidade operacional"},{"key":"analytics","score":5.5,"justification":"KPIs sem fórmula ou fonte definidas.","strengths":"Escolha de indicadores relevantes","attention":"Falta detalhamento técnico"},{"key":"automacao","score":5,"justification":"Processos corretos, tecnologia e fluxo pouco detalhados.","strengths":"Foco em experiência","attention":"Sem ganhos quantificados"},{"key":"ia","score":6,"justification":"Caso de uso relevante, arquitetura mínima.","strengths":"Problema bem escolhido","attention":"Sem RAG ou fontes de conhecimento"},{"key":"comunicacao","score":9,"justification":"Comunicação clara e orientada a executivos.","strengths":"Alta capacidade de influência","attention":"—"}]',
  '["Forte visão de negócio e de stakeholders","Comunicação executiva acima da média","Boa priorização estratégica"]',
  '["Baixa profundidade técnica em analytics","Automação sem detalhamento de fluxo","Solução de IA genérica"]',
  '["Como você definiria a fórmula e a fonte do turnover?","Quem executaria a parte técnica do seu plano?","Como garantiria qualidade de dados sem time dedicado?"]',
  '["Perfil estratégico e comunicativo","Ótimo para interface com Diretoria","Profundidade técnica limitada","Precisaria de suporte técnico próximo","Bom fit para liderança com squad técnico"]',
  'Avaliar com ressalvas', 6.60),
 ('11111111-1111-4111-8111-000000000005',
  '[{"key":"negocio","score":5,"justification":"Diagnóstico raso do contexto.","strengths":"Direção correta","attention":"Pouca profundidade"},{"key":"analytics","score":5,"justification":"Apenas um indicador proposto.","strengths":"Fórmula definida","attention":"Cobertura insuficiente"},{"key":"automacao","score":5,"justification":"Apenas uma automação proposta.","strengths":"Processo relevante","attention":"Faltam duas automações"},{"key":"ia","score":5,"justification":"Solução genérica sem arquitetura.","strengths":"Problema válido","attention":"Sem riscos nem KPIs"},{"key":"comunicacao","score":6,"justification":"Respostas curtas, porém claras.","strengths":"Objetividade","attention":"Falta estrutura executiva"}]',
  '["Direção geral correta","Objetividade nas respostas"]',
  '["Respostas incompletas em todas as etapas","Sem quantificação de ganhos","Roadmap pouco desenvolvido"]',
  '["O que faltou para detalhar melhor sua proposta?","Como você estruturaria o dashboard executivo?","Que riscos vê no uso de IA em RH?"]',
  '["Case preenchido parcialmente","Direção correta, execução rasa","Baixa evidência de profundidade técnica","Difícil avaliar potencial completo","Recomenda-se nova conversa exploratória"]',
  'Avaliar com ressalvas', 5.15);

-- SEED: hr review
INSERT INTO public.hr_reviews (candidate_id, reviewer_name, criteria_scores, comments, strengths, attention_points, final_score, final_recommendation) VALUES
 ('11111111-1111-4111-8111-000000000001','Time de RH','{"negocio":9,"analytics":9,"automacao":9,"ia":9,"comunicacao":8}','Alinhada com o perfil buscado para liderar a frente de Inteligência de RH.','Visão sistêmica e execução','Validar experiência prática com Azure',8.90,'Forte recomendação');