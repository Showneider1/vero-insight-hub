# Vero Talent Compass

PROMPT PARA LOVABLE — PLATAFORMA DE AVALIAÇÃO DE CANDIDATOS COM IA

Crie uma aplicação web moderna, profissional e responsiva para avaliação de candidatos em processos seletivos.

O sistema será utilizado pela empresa Vero, dentro de uma iniciativa de Inteligência e Inovação de RH.

O objetivo da plataforma é permitir que candidatos recebam um código de acesso previamente criado pelo RH, realizem um case prático estruturado e enviem suas respostas. Após a submissão, o time de RH poderá acessar um painel administrativo para visualizar, comparar e avaliar os cases.

Além disso, o sistema deverá utilizar IA Generativa para sugerir uma avaliação inicial do candidato, com base em critérios e pesos previamente definidos. A IA nunca deve substituir completamente a decisão humana: ela deve atuar como um copiloto de avaliação.

1. OBJETIVO DO PRODUTO

Criar uma plataforma chamada:

Vero Talent Assessment

A plataforma deve avaliar candidatos para vagas relacionadas a:

Inteligência de RH

Analytics

Transformação Digital

Automação

Power Platform

Inteligência Artificial

Gestão e Inovação

O sistema deve permitir avaliar não apenas a resposta técnica do candidato, mas principalmente sua capacidade de:

conectar negócio, dados e tecnologia;

priorizar iniciativas;

estruturar um roadmap;

propor automações;

utilizar IA de forma responsável;

comunicar ideias para stakeholders e executivos.

2. PERFIS DE USUÁRIO

A aplicação terá inicialmente dois perfis:

CANDIDATO

O candidato poderá:

acessar utilizando um código único fornecido pelo RH;

visualizar informações da vaga e instruções;

visualizar o case;

responder cada etapa do desafio;

salvar respostas como rascunho;

acompanhar o progresso;

revisar suas respostas;

submeter a versão final;

visualizar confirmação de envio.

Após o envio final, o candidato não poderá mais editar suas respostas.

RH / ADMINISTRADOR

O administrador poderá:

criar novos candidatos;

gerar ou cadastrar códigos únicos de acesso;

definir a vaga associada ao candidato;

acompanhar o status dos candidatos;

visualizar respostas completas;

comparar candidatos;

visualizar avaliações sugeridas pela IA;

adicionar avaliação manual;

alterar notas;

registrar comentários;

visualizar ranking;

filtrar candidatos;

exportar resultados.

3. TELA DE LOGIN DO CANDIDATO

Criar uma tela simples e profissional.

Elementos:

Logo da Vero no topo;

Título: Vero Talent Assessment;

Subtítulo explicando que o candidato deverá utilizar o código recebido pelo time de RH;

Campo:

Digite seu código de acesso

Botão:

Acessar meu desafio

Exemplo de código:

VERO-2026-001

O código deve ser validado antes do acesso.

Após autenticação, identificar automaticamente:

nome do candidato;

vaga;

processo seletivo;

status da avaliação.

4. EXPERIÊNCIA DO CANDIDATO

Após acessar o sistema, apresentar uma tela inicial com:

Header

Logo;

Nome do candidato;

Nome da vaga;

Indicador de progresso;

Botão de sair.

Exemplo:

Olá, João!

Você está realizando o case para a vaga de Inteligência e Inovação de RH.

CARD DE INSTRUÇÕES

Exibir:

Objetivo

Este desafio foi criado para entender como você estrutura problemas, conecta dados, automação e inteligência artificial e transforma tecnologia em resultados para o negócio.

Instruções

Responda todas as etapas;

Estruture suas ideias de forma clara;

Utilize exemplos quando necessário;

Você pode salvar suas respostas durante o preenchimento;

Revise suas respostas antes de enviar;

Após o envio final, não será possível realizar alterações.

Exibir também:

Tempo estimado;

Número de etapas;

Progresso atual.

5. CASE DO CANDIDATO

O case deverá ser dividido em 5 etapas, apresentadas em uma navegação lateral.

MENU LATERAL

Diagnóstico

Analytics

Automação

IA Generativa

Roadmap Executivo

Revisão e Envio

Cada etapa deve mostrar:

Não iniciada;

Em andamento;

Concluída.

6. CONTEÚDO DO CASE

CENÁRIO

A Vero deseja criar uma frente de Inteligência e Inovação de RH.

Atualmente:

Os dados estão distribuídos em múltiplas fontes;

Não existe uma visão consolidada dos principais indicadores;

Grande parte dos processos depende de atividades manuais;

A Diretoria deseja utilizar IA para aumentar produtividade e melhorar a tomada de decisão.

Você foi contratado para liderar os primeiros 90 dias dessa transformação.

Sua missão é apresentar uma proposta estruturada.

ETAPA 1 — DIAGNÓSTICO

Pergunta principal

Como você iniciaria o diagnóstico da situação atual de RH e da maturidade da empresa em dados, automação e inteligência artificial?

Solicitar que o candidato responda:

1. Processos atuais

Como você entenderia e mapearia os processos existentes?

2. Stakeholders

Quais áreas e perfis você entrevistaria?

Permitir que o candidato adicione múltiplos stakeholders em uma tabela:

Área / StakeholderObjetivo da entrevistaPrioridade

3. Dados

Quais dados e fontes você levantaria?

Permitir estruturação em tabela:

FonteTipo de dadoResponsávelQualidadeFrequência

4. Priorização

Como definiria as prioridades?

Permitir que o candidato descreva uma metodologia.

Exemplos possíveis:

Impacto x Esforço;

Matriz de Valor;

ROI;

Risco;

Urgência;

Maturidade.

Adicionar um campo opcional:

Descreva os principais critérios que utilizaria para priorização.

ETAPA 2 — ANALYTICS

O candidato deverá criar uma proposta de dashboard executivo de RH.

Solicitar:

Indicadores prioritários

Permitir adicionar indicadores em uma tabela:

IndicadorObjetivoFórmulaFontePeriodicidade

Fontes de dados

Solicitar que o candidato explique como consolidaria as fontes.

Governança

Solicitar definição de:

responsáveis pelos dados;

processo de atualização;

validação;

qualidade;

segurança;

controle de acesso.

Periodicidade

Permitir definir:

Tempo real;

Diário;

Semanal;

Mensal;

Trimestral.

Adicionar uma área visual chamada:

Prévia do Dashboard Executivo

Permitir que o candidato monte uma proposta conceitual utilizando cards e widgets simples.

Exemplos de componentes:

KPI;

gráfico de barras;

gráfico de linha;

funil;

tabela;

ranking.

O objetivo não é exigir conhecimento de design, mas entender como o candidato estrutura a visão executiva.

ETAPA 3 — AUTOMAÇÃO

Solicitar que o candidato escolha os 3 primeiros processos de RH que automatizaria.

Criar três cards:

Automação 1

Automação 2

Automação 3

Para cada automação solicitar:

Processo

Nome do processo.

Problema atual

Qual problema existe?

Motivo da escolha

Por que esse processo deve ser priorizado?

Tecnologia

Permitir selecionar ou informar:

Power Automate;

Power Apps;

Power BI;

SharePoint;

Microsoft Teams;

RPA;

API;

Outra.

Fluxo proposto

Campo para descrever o processo:

Entrada → Processamento → Aprovação → Saída

Ganho esperado

Permitir informar:

redução de tempo;

redução de esforço manual;

redução de erros;

melhoria de experiência;

ganho financeiro.

Adicionar campos quantitativos opcionais.

ETAPA 4 — IA GENERATIVA

O candidato deverá propor uma solução utilizando Inteligência Artificial Generativa para RH.

A interface deve guiar a resposta através de seções.

Problema

Qual problema será resolvido?

Usuários

Quem utilizará a solução?

Exemplos:

RH;

gestores;

colaboradores;

candidatos.

Solução proposta

Descreva como a IA será utilizada.

Arquitetura simplificada

Permitir que o candidato monte uma arquitetura utilizando blocos.

Blocos disponíveis:

Usuário;

Aplicação;

API;

Base de Dados;

Documentos;

Base de Conhecimento;

IA Generativa;

RAG;

Microsoft Azure;

Power Platform;

Sistema de RH.

Permitir uma estrutura visual simples.

Fontes de conhecimento

Permitir cadastrar múltiplas fontes:

FonteTipoSensibilidadeResponsável

Riscos

Solicitar avaliação de:

privacidade;

LGPD;

vazamento de informações;

respostas incorretas;

vieses;

dependência tecnológica;

segurança;

alucinação da IA.

Mitigações

Solicitar que o candidato apresente estratégias de mitigação.

Indicadores de sucesso

Permitir cadastrar KPIs.

Exemplos:

redução de tempo;

satisfação do usuário;

taxa de utilização;

taxa de resolução;

precisão percebida;

economia operacional.

ETAPA 5 — ROADMAP EXECUTIVO

O candidato deverá criar um roadmap de 90 dias.

Dividir em:

PRIMEIROS 30 DIAS

Foco sugerido:

diagnóstico;

entrevistas;

levantamento de dados;

entendimento dos processos;

identificação de quick wins.

Permitir adicionar iniciativas.

31 A 60 DIAS

Foco sugerido:

primeiros dashboards;

priorização;

pilotos;

automações;

estrutura de governança.

Permitir adicionar iniciativas.

61 A 90 DIAS

Foco sugerido:

implementação;

escala;

IA;

consolidação;

roadmap futuro.

Permitir adicionar iniciativas.

Cada iniciativa deve possuir:

IniciativaImpactoEsforçoResponsávelStatus esperado

Exibir também uma visualização gráfica de timeline de 90 dias.

7. REVISÃO E ENVIO

Criar uma página final.

Mostrar:

progresso de cada etapa;

indicador de respostas incompletas;

possibilidade de retornar para edição;

resumo das respostas.

Adicionar checkbox obrigatório:

Confirmo que revisei minhas respostas e desejo enviar minha avaliação.

Botão principal:

Enviar Case

Antes do envio, exibir modal:

Após o envio, suas respostas não poderão mais ser alteradas. Deseja continuar?

Opções:

Cancelar;

Enviar definitivamente.

8. CONFIRMAÇÃO DE ENVIO

Após o envio, mostrar uma tela profissional.

Mensagem:

Case enviado com sucesso!

Obrigado por participar do processo seletivo.

Sua avaliação foi registrada e será analisada pelo time responsável.

Exibir:

Data e hora do envio;

Código do candidato;

Status: Enviado.

9. PAINEL ADMINISTRATIVO DO RH

Criar uma área administrativa separada.

DASHBOARD PRINCIPAL

Exibir KPIs:

Total de candidatos;

Convites enviados;

Em andamento;

Cases concluídos;

Taxa de conclusão;

Tempo médio de resposta;

Nota média sugerida pela IA.

Adicionar gráficos:

Status dos candidatos

Gráfico de pizza ou barras.

Distribuição de notas

Gráfico de barras.

Ranking geral

Tabela com os candidatos.

10. GESTÃO DE CANDIDATOS

Criar uma tabela:

CandidatoCódigoVagaStatusProgressoNota IAAvaliação RHData

Status possíveis:

Não iniciado;

Em andamento;

Enviado;

Em avaliação;

Avaliado;

Finalizado.

Adicionar filtros:

Vaga;

Status;

Nota;

Data;

Nome.

Adicionar busca.

11. DETALHE DO CANDIDATO

Ao clicar em um candidato, abrir uma página detalhada.

Criar uma navegação por abas:

Resumo

Diagnóstico

Analytics

Automação

IA Generativa

Roadmap

Avaliação

12. AVALIAÇÃO COM IA

O sistema deverá gerar uma avaliação assistida por IA após o envio do candidato.

A IA deve analisar todas as respostas utilizando a seguinte matriz:

CritérioPesoVisão de Negócio e RH20%Analytics e Indicadores25%Automação e Power Platform20%IA Generativa20%Comunicação e Stakeholders15%

A IA deverá gerar uma nota de 0 a 10 para cada critério.

Depois calcular:

Nota Final = média ponderada baseada nos pesos definidos.

13. PROMPT INTERNO PARA AVALIAÇÃO POR IA

Utilizar uma lógica semelhante ao seguinte prompt:

Você é um avaliador especialista em Transformação Digital, Recursos Humanos, Analytics, Automação, Power Platform e Inteligência Artificial.

Seu objetivo é avaliar a resposta de um candidato para uma posição relacionada à liderança ou construção de uma frente de Inteligência e Inovação de RH.

Analise exclusivamente as informações fornecidas pelo candidato.

Não invente informações.

Não penalize candidatos por estilo de escrita ou pequenas diferenças de formato. Avalie principalmente a qualidade do raciocínio, a aplicabilidade das propostas e a capacidade de conectar negócio, dados e tecnologia.

Avalie os seguintes critérios:

Visão de Negócio e RH — peso 20%
Avalie:

compreensão do contexto;

capacidade de identificar problemas relevantes;

conexão entre tecnologia e resultado;

entendimento de impacto para RH e negócio.

Analytics e Indicadores — peso 25%
Avalie:

qualidade dos KPIs;

definição de métricas;

fontes de dados;

governança;

priorização;

capacidade de construir visão executiva.

Automação e Power Platform — peso 20%
Avalie:

identificação de processos adequados;

lógica de priorização;

escolha de tecnologia;

viabilidade;

clareza dos ganhos esperados.

IA Generativa — peso 20%
Avalie:

relevância do problema;

qualidade da solução;

arquitetura;

uso de RAG ou fontes de conhecimento quando aplicável;

preocupação com segurança, LGPD e riscos;

definição de indicadores de sucesso.

Comunicação e Stakeholders — peso 15%
Avalie:

clareza;

estrutura;

capacidade de priorização;

visão executiva;

capacidade de influenciar stakeholders.

Para cada critério, retorne:

Nota de 0 a 10;

Justificativa objetiva;

Pontos fortes;

Pontos de atenção;

Sugestões de perguntas para entrevista.

Depois calcule a nota final ponderada.

Também gere:

Resumo Executivo

Máximo de 5 bullets.

Principais Pontos Fortes

Liste de 3 a 5 pontos.

Principais Riscos ou Lacunas

Liste de 3 a 5 pontos.

Perguntas Recomendadas para Entrevista

Crie de 3 a 7 perguntas personalizadas com base nas respostas do candidato.

Recomendação

Escolha uma das opções:

Forte recomendação;

Recomendação;

Avaliar com ressalvas;

Não recomendado neste momento.

IMPORTANTE:

A avaliação gerada por IA é apenas uma recomendação e não deve ser utilizada como decisão automática de contratação.

14. INTERFACE DE AVALIAÇÃO

Na tela do RH, apresentar dois blocos lado a lado.

Avaliação sugerida pela IA

Exibir:

Nota final;

Notas por critério;

Gráfico radar;

Pontos fortes;

Pontos de atenção;

Resumo executivo;

Perguntas para entrevista;

Recomendação.

Adicionar um indicador visual:

Avaliação gerada por IA — requer validação humana

Avaliação do RH

Permitir que o avaliador:

atribua notas manualmente;

altere notas sugeridas;

escreva comentários;

registre evidências;

marque pontos fortes;

marque pontos de atenção.

Campos:

CritérioNota IANota RH

Calcular automaticamente a nota final do RH.

15. COMPARAÇÃO DE CANDIDATOS

Criar uma tela de comparação.

Permitir selecionar até 5 candidatos.

Exibir:

gráfico radar comparativo;

notas por critério;

nota final;

ranking;

principais forças;

principais lacunas;

recomendações da IA;

avaliação final do RH.

Objetivo:

Permitir que gestores comparem candidatos de forma estruturada, sem depender apenas de uma nota única.

16. GESTÃO DE CÓDIGOS

Criar uma área chamada:

Códigos de Acesso

Permitir:

criar candidato;

associar candidato a uma vaga;

gerar código único automaticamente;

definir validade do código;

ativar ou desativar código;

reenviar convite.

Formato sugerido:

VERO-[ANO]-[CÓDIGO]

Exemplo:

VERO-2026-A7K9

17. BANCO DE DADOS

Criar estrutura para as seguintes entidades:

Users

id

name

email

role

created_at

Candidates

id

name

email

access_code

position

status

started_at

submitted_at

Assessments

id

candidate_id

assessment_status

final_score_ai

final_score_hr

recommendation_ai

CandidateResponses

id

candidate_id

section

question_id

response

updated_at

EvaluationCriteria

id

name

weight

description

AIEvaluations

id

candidate_id

criteria_scores

strengths

weaknesses

interview_questions

executive_summary

recommendation

generated_at

HRReviews

id

candidate_id

reviewer_id

criteria_scores

comments

final_recommendation

18. REQUISITOS DE UX E DESIGN

O design deve transmitir:

inovação;

tecnologia;

confiança;

sofisticação;

ambiente corporativo.

Estilo:

moderno;

clean;

minimalista;

interface SaaS;

excelente legibilidade.

Utilizar:

bastante espaço em branco;

cards;

gráficos modernos;

ícones discretos;

animações sutis;

feedback visual de progresso.

Paleta sugerida:

Azul escuro;

Azul tecnológico;

Branco;

Cinza claro.

Utilizar cores de status:

Verde: concluído;

Amarelo: em andamento;

Vermelho: pendência ou atenção;

Azul: informação.

A interface deve ser totalmente responsiva para:

desktop;

tablet;

mobile.

Priorizar a experiência desktop para o painel administrativo e uma experiência fluida para candidatos.

19. REQUISITOS TÉCNICOS

Estruturar o projeto de forma escalável.

Utilizar:

autenticação;

controle de acesso baseado em perfil;

banco de dados relacional;

persistência automática das respostas;

autosave;

controle de status;

trilha de auditoria para avaliações;

integração preparada para API de IA;

tratamento de erros;

loading states;

empty states.

Garantir que:

candidatos não possam acessar dados de outros candidatos;

candidatos não possam alterar respostas após submissão;

somente usuários autorizados possam visualizar avaliações;

a avaliação da IA seja claramente identificada como recomendação;

exista possibilidade de revisão humana.

20. FLUXO PRINCIPAL

Fluxo do candidato

RH cria candidato
↓
Sistema gera código
↓
Candidato acessa plataforma
↓
Valida código
↓
Visualiza instruções
↓
Responde etapas
↓
Sistema salva automaticamente
↓
Candidato revisa
↓
Envia case
↓
Sistema bloqueia edição
↓
IA gera avaliação
↓
RH recebe case para análise

Fluxo do RH

Administrador acessa painel
↓
Cria candidato
↓
Gera código
↓
Acompanha progresso
↓
Recebe case enviado
↓
Sistema gera avaliação por IA
↓
RH revisa respostas
↓
RH compara avaliação da IA
↓
RH registra avaliação própria
↓
Candidato recebe status interno do processo

21. PRIORIDADE DE IMPLEMENTAÇÃO

Construir inicialmente um MVP completamente funcional com:

MVP — FASE 1

Login por código;

Cadastro de candidatos;

Apresentação do case;

Cinco etapas de resposta;

Autosave;

Progresso;

Revisão;

Envio definitivo;

Painel do RH;

Visualização das respostas;

Avaliação estruturada por critérios;

Integração preparada para IA;

Comparação básica entre candidatos.

FASE 2

Adicionar:

arquitetura visual de IA;

construtor visual de dashboard;

comparação avançada;

exportação PDF;

exportação Excel;

histórico de avaliações;

múltiplos avaliadores;

workflow de aprovação;

biblioteca de cases;

diferentes modelos de avaliação;

analytics sobre o próprio processo seletivo.

22. DADOS DEMONSTRATIVOS

Criar dados fictícios para demonstrar a aplicação.

Incluir pelo menos:

8 candidatos;

2 vagas;

diferentes status;

diferentes níveis de progresso;

avaliações fictícias;

notas por critério.

Criar pelo menos:

Candidato excelente

Perfil que demonstra forte conexão entre:

Dados + Automação + IA + Negócio.

Candidato técnico

Bom conhecimento técnico, mas pouca visão de negócio.

Candidato estratégico

Boa visão de negócio, mas respostas pouco detalhadas tecnicamente.

Candidato incompleto

Case parcialmente preenchido.

Isso deve permitir testar os dashboards, filtros, ranking e comparação.

RESULTADO ESPERADO

O resultado final deve ser uma aplicação funcional chamada:

Vero Talent Assessment

A aplicação deve funcionar como uma plataforma real de assessment corporativo.

A experiência precisa demonstrar claramente a proposta de valor:

Transformar um processo seletivo tradicional em uma avaliação estruturada, digital, orientada por dados e potencializada por Inteligência Artificial.

O foco não deve ser apenas dar uma nota ao candidato.

A plataforma deve ajudar o RH a identificar:

qualidade do raciocínio;

capacidade de priorização;

visão de negócio;

maturidade em dados;

capacidade de automação;

entendimento de IA;

capacidade de estruturar uma transformação;

capacidade de comunicação com stakeholders.

A IA deve funcionar como um copiloto do avaliador humano, gerando uma primeira análise estruturada, explicável e baseada exclusivamente nas respostas do candidato.

Construa a aplicação com uma arquitetura organizada, componentes reutilizáveis e uma experiência visual de produto SaaS corporativo de alta qualidade.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vero-insight-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48c85fba-f931-4eca-94b3-b9137a2c49dd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
