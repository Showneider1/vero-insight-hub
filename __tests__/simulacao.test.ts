// __tests__/simulacao.test.ts
import { calcularResultado, SimulacaoInput } from '@/lib/simulacao';

describe('calcularResultado', () => {
  it('deve calcular simulacao de contratacao', () => {
    const input: SimulacaoInput = {
      decisaoId: 'contratacao',
      params: {
        qtd_vagas: 2,
        salario_medio: 5000,
        meses_projecao: 12,
      },
    };

    const result = calcularResultado(input);

    if ('code' in result) {
      throw new Error('Esperava sucesso, recebeu erro: ' + result.message);
    }

    expect(result.decisaoId).toBe('contratacao');
    expect(result.kpis.some(k => k.key === 'custo_total')).toBe(true);
    const custo = result.kpis.find(k => k.key === 'custo_total')!;
    expect(custo.value).toBe(2 * 5000 * 12);
  });

  it('deve retornar erro para decisaoId inexistente', () => {
    const input: SimulacaoInput = {
      decisaoId: 'inexistente',
      params: {},
    };

    const result = calcularResultado(input);

    if (!('code' in result)) {
      throw new Error('Esperava erro, recebeu sucesso');
    }

    expect(result.code).toBe('DECISAO_NAO_ENCONTRADA');
  });
});
