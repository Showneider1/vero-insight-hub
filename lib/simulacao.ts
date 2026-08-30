// lib/simulacao.ts
import { getDecisoesConfig, SimulacaoConfig } from '@/config/decisoes';

export interface SimulacaoInput {
  decisaoId: string;
  params: Record<string, number | string | boolean>;
}

export interface KpiResult {
  key: string;
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  deltaUnit?: string;
}

export interface SimulacaoResult {
  decisaoId: string;
  params: Record<string, number | string | boolean>;
  kpis: KpiResult[];
  mensagem?: string;
}

export interface SimulacaoError {
  code: string;
  message: string;
  details?: unknown;
}

export function validarParams(
  config: SimulacaoConfig,
  input: SimulacaoInput
): SimulacaoError | null {
  const decisao = config.decisoes.find(d => d.id === input.decisaoId);
  if (!decisao) {
    return {
      code: 'DECISAO_NAO_ENCONTRADA',
      message: `Decisao "${input.decisaoId}" nao encontrada.`,
    };
  }

  for (const param of decisao.params) {
    const value = input.params[param.name];

    if (param.required && (value === undefined || value === null || value === '')) {
      return {
        code: 'PARAM_OBRIGATORIO',
        message: `Parametro "${param.label}" e obrigatorio.`,
        details: { param: param.name },
      };
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (param.type === 'number' && typeof value !== 'number') {
      return {
        code: 'PARAM_TIPO_INVALIDO',
        message: `Parametro "${param.label}" deve ser numerico.`,
        details: { param: param.name, value },
      };
    }

    if (param.type === 'number' && typeof value === 'number') {
      if (param.min !== undefined && value < param.min) {
        return {
          code: 'PARAM_FORA_RANGE',
          message: `Parametro "${param.label}" deve ser >= ${param.min}.`,
          details: { param: param.name, value },
        };
      }
      if (param.max !== undefined && value > param.max) {
        return {
          code: 'PARAM_FORA_RANGE',
          message: `Parametro "${param.label}" deve ser <= ${param.max}.`,
          details: { param: param.name, value },
        };
      }
    }

    if (param.type === 'select' && param.options) {
      const validos = param.options.map(o => o.value);
      if (!validos.includes(value as any)) {
        return {
          code: 'PARAM_VALOR_INVALIDO',
          message: `Parametro "${param.label}" deve ser um dos valores permitidos.`,
          details: { param: param.name, value, validos },
        };
      }
    }
  }

  return null;
}

export function calcularResultado(input: SimulacaoInput): SimulacaoResult | SimulacaoError {
  const config = getDecisoesConfig();
  const erroValidacao = validarParams(config, input);
  if (erroValidacao) {
    return erroValidacao;
  }

  const decisao = config.decisoes.find(d => d.id === input.decisaoId)!;
  const p = input.params;

  // Logica de exemplo – ajuste conforme regras reais de negocio
  if (decisao.id === 'contratacao') {
    const qtdVagas = Number(p.qtd_vagas ?? 0);
    const salarioMedio = Number(p.salario_medio ?? 0);
    const meses = Number(p.meses_projecao ?? 12);

    const custoTotal = qtdVagas * salarioMedio * meses;
    const ganhoProdutividadeEstimado = qtdVagas * 0.05 * meses; // exemplo: 5% por vaga/mes

    return {
      decisaoId: decisao.id,
      params: input.params,
      kpis: [
        {
          key: 'custo_total',
          label: 'Custo total (periodo)',
          value: custoTotal,
          unit: 'BRL',
        },
        {
          key: 'ganho_produtividade',
          label: 'Ganho de produtividade estimado',
          value: ganhoProdutividadeEstimado,
          unit: 'pontos',
          delta: ganhoProdutividadeEstimado,
          deltaUnit: 'pontos',
        },
      ],
      mensagem: `Simulacao de contratacao de ${qtdVagas} vaga(s) por ${meses} meses.`,
    };
  }

  if (decisao.id === 'treinamento') {
    const investimento = Number(p.valor_investimento ?? 0);
    const ganhoPercentual = Number(p.percentual_ganho_produtividade ?? 0);
    const meses = Number(p.meses_projecao ?? 12);

    // Exemplo: ROI simples
    const beneficioMensalEstimado = (ganhoPercentual / 100) * 50000; // base ficticia
    const beneficioTotal = beneficioMensalEstimado * meses;
    const roi = beneficioTotal - investimento;

    return {
      decisaoId: decisao.id,
      params: input.params,
      kpis: [
        {
          key: 'beneficio_total',
          label: 'Beneficio total estimado',
          value: beneficioTotal,
          unit: 'BRL',
        },
        {
          key: 'roi',
          label: 'ROI estimado',
          value: roi,
          unit: 'BRL',
          delta: roi,
          deltaUnit: 'BRL',
        },
      ],
      mensagem: `Simulacao de treinamento com investimento de R$ ${investimento.toLocaleString('pt-BR')} e ganho de ${ganhoPercentual}%.`,
    };
  }

  // Fallback generico
  return {
    decisaoId: decisao.id,
    params: input.params,
    kpis: [],
    mensagem: 'Simulacao executada (logica generica).',
  };
}
