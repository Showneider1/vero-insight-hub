-- Seed para ambiente de desenvolvimento/teste
-- Cria um usuario admin de teste e associa o papel em user_roles.
-- Apos rodar, faca login em /auth com:
--   email: admin@vero.test
--   senha: Admin123!

-- 1) Cria o usuario no auth.users (Supabase Auth)
-- Observacao: em projetos com RLS habilitado, pode ser necessario executar isso como
-- superuser ou com a role 'service_role'. Ajuste conforme seu ambiente.

DO $$
DECLARE
  v_user_id uuid;
  v_candidate_id uuid;
BEGIN
  -- Tenta criar o usuario; se ja existir, apenas captura o id
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@vero.test',
    crypt('Admin123!', gen_salt('bf')),  -- bcrypt hash da senha
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin Vero"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ON CONFLICT DO NOTHING;

  -- Captura o user_id (recem-criado ou existente)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@vero.test'
  LIMIT 1;

  -- 2) Cria o perfil em public.profiles (se a tabela existir)
  INSERT INTO public.profiles (id, name, email)
  SELECT v_user_id, 'Admin Vero', 'admin@vero.test'
  WHERE v_user_id IS NOT NULL
  ON CONFLICT (id) DO UPDATE
    SET name = 'Admin Vero', email = 'admin@vero.test';

  -- 3) Atribui o papel admin em public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_user_id, 'admin'
  WHERE v_user_id IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4) Opcional: tambem adiciona como recruiter (caso queira testar ambos os papeis)
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_user_id, 'recruiter'
  WHERE v_user_id IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5) Cria um candidato de exemplo para teste do fluxo completo
  INSERT INTO public.candidates (id, name, email, position, access_code, code_active, code_expires_at, status, progress, started_at, submitted_at, created_at)
  SELECT
    gen_random_uuid(),
    'Candidato Exemplo',
    'candidato.exemplo@vero.test',
    'Inteligencia e Inovacao de RH',
    'VERO-2026-TEST',
    true,
    (now() + interval '30 days'),
    'nao_iniciado',
    0,
    NULL,
    NULL,
    now()
  ON CONFLICT (access_code) DO UPDATE
    SET name = 'Candidato Exemplo',
        email = 'candidato.exemplo@vero.test',
        position = 'Inteligencia e Inovacao de RH',
        code_active = true,
        code_expires_at = (now() + interval '30 days'),
        status = 'nao_iniciado',
        progress = 0;

  -- Captura o candidate_id criado (para possiveis extensoes futuras)
  SELECT id INTO v_candidate_id
  FROM public.candidates
  WHERE access_code = 'VERO-2026-TEST'
  LIMIT 1;

  -- 6) Opcional: cria um assessment pendente para este candidato
  INSERT INTO public.assessments (candidate_id, assessment_status, final_score_ai, final_score_hr, recommendation_ai, recommendation_hr)
  SELECT v_candidate_id, 'pendente', NULL, NULL, NULL, NULL
  WHERE v_candidate_id IS NOT NULL
  ON CONFLICT (candidate_id) DO UPDATE
    SET assessment_status = 'pendente';

END $$;

-- Instrucoes de uso:
-- 1) Execute este script no SQL Editor do Supabase (ou via psql/CLI).
-- 2) Login RH: admin@vero.test / Admin123!
-- 3) Login Candidato: acesse / e use o codigo VERO-2026-TEST.
