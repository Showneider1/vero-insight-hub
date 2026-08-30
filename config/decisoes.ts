// config/decisoes.ts
export type ParamType = 'number' | 'select' | 'boolean';

export interface ParamDef {
  name: string;
  label: string;
  type: ParamType;
  required?: boolean;
  default?: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number | boolean; label: string }[];
  description?: string;
}

export interface DecisionDef {
  id: string;
  label: string;
  description?: string;
  params: ParamDef[];
}

export interface SimulacaoConfig {
  versao: string;
  decisoes: DecisionDef[];
}

export const decisoesConfig: SimulacaoConfig = {
  versao: '1.0.0',
  decisoes: [
    {
      id: 'contratacao',
      label: 'Contratacao de pessoal',
      description: 'Simula impacto de novas contratacoes no custo e produtividade.',
      params: [
        {
          name: 'qtd_vagas',
          label: 'Quantidade de vagas',
          type: 'number',
          required: true,
          default: 1,
          min: 0,
          max: 50,
          step: 1,
          description: 'Numero de novas contratacoes no periodo.',
        },
        {
          name: 'salario_medio',
          label: 'Salario medio (R$)',
          type: 'number',
          required: true,
          default: 5000,
          min: 0,
          step: 100,
          description: 'Salario medio mensal por colaborador.',
        },
        {
          name: 'meses_projecao',
          label: 'Meses de projecao',
          type: 'number',
          required: true,
          default: 12,
          min: 1,
          max: 60,
          step: 1,
          description: 'Horizonte de tempo da simulacao.',
        },
      ],
    },
    {
      id: 'treinamento',
      label: 'Investimento em treinamento',
      description: 'Simula impacto de programas de treinamento na produtividade e retencao.',
      params: [
        {
          name: 'valor_investimento',
          label: 'Valor investido (R$)',
          type: 'number',
          required: true,
          default: 10000,
          min: 0,
          step: 500,
          description: 'Valor total investido em treinamento.',
        },
        {
          name: 'percentual_ganho_produtividade',
          label: 'Ganho de produtividade (%)',
          type: 'number',
          required: true,
          default: 5,
          min: 0,
          max: 100,
          step: 0.5,
          description: 'Estimativa de ganho de produtividade.',
        },
        {
          name: 'meses_projecao',
          label: 'Meses de projecao',
          type: 'number',
          required: true,
          default: 12,
          min: 1,
          max: 60,
          step: 1,
          description: 'Horizonte de tempo da simulacao.',
        },
      ],
    },
  ],
};

export function getDecisoesConfig(): SimulacaoConfig {
  return decisoesConfig;
}
