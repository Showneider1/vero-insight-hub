// app/simulacao/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDecisoesConfig, ParamDef, DecisionDef } from '@/config/decisoes';

type SimulacaoResult = {
  decisaoId: string;
  params: Record<string, number | string | boolean>;
  kpis: { key: string; label: string; value: number; unit?: string; delta?: number; deltaUnit?: string }[];
  mensagem?: string;
};

type SimulacaoError = {
  code: string;
  message: string;
  details?: unknown;
};

type ApiResponse =
  | { status: 'success'; data: SimulacaoResult }
  | { status: 'error'; errors: SimulacaoError[] };

export default function PaginaSimulacao() {
  const config = getDecisoesConfig();
  const [decisaoSelecionada, setDecisaoSelecionada] = useState<DecisionDef | null>(
    config.decisoes[0] ?? null
  );
  const [valores, setValores] = useState<Record<string, number | string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<SimulacaoResult | null>(null);
  const [erros, setErros] = useState<SimulacaoError[] | null>(null);

  useEffect(() => {
    if (!decisaoSelecionada) return;
    const novosValores: Record<string, number | string | boolean> = {};
    for (const p of decisaoSelecionada.params) {
      novosValores[p.name] = p.default ?? (p.type === 'number' ? 0 : p.type === 'boolean' ? false : '');
    }
    setValores(novosValores);
    setResultado(null);
    setErros(null);
  }, [decisaoSelecionada]);

  function handleChangeParam(name: string, value: number | string | boolean) {
    setValores(prev => ({ ...prev, [name]: value }));
  }

  async function rodarSimulacao() {
    setLoading(true);
    setResultado(null);
    setErros(null);

    try {
      const res = await fetch('/api/simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisaoId: decisaoSelecionada!.id,
          params: valores,
        }),
      });

      const data: ApiResponse = await res.json();

      if (data.status === 'success') {
        setResultado(data.data);
      } else {
        setErros(data.errors ?? [{ code: 'ERRO_DESCONHECIDO', message: 'Erro ao rodar simulacao.' }]);
      }
    } catch {
      setErros([{ code: 'ERRO_REDE', message: 'Falha de comunicacao com o servidor.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Simulacao de Decisoes</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Decisao</label>
        <select
          className="w-full border rounded p-2"
          value={decisaoSelecionada?.id ?? ''}
          onChange={e => {
            const d = config.decisoes.find(x => x.id === e.target.value) ?? null;
            setDecisaoSelecionada(d);
          }}
        >
          {config.decisoes.map(d => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        {decisaoSelecionada?.description && (
          <p className="text-sm text-gray-600 mt-2">{decisaoSelecionada.description}</p>
        )}
      </div>

      {decisaoSelecionada && (
        <div className="grid gap-4 mb-6">
          {decisaoSelecionada.params.map(param => (
            <ParamField
              key={param.name}
              param={param}
              value={valores[param.name]}
              onChange={v => handleChangeParam(param.name, v)}
            />
          ))}
        </div>
      )}

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={rodarSimulacao}
        disabled={loading || !decisaoSelecionada}
      >
        {loading ? 'Rodando simulacao...' : 'Rodar simulacao'}
      </button>

      {erros && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800 mb-2">Erros na simulacao</h2>
          <ul className="list-disc pl-5 text-red-700">
            {erros.map((e, i) => (
              <li key={i}>
                <strong>{e.code}:</strong> {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Resultados</h2>
          {resultado.mensagem && (
            <p className="text-gray-700 mb-4">{resultado.mensagem}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resultado.kpis.map(kpi => (
              <div key={kpi.key} className="border rounded p-4">
                <div className="text-sm text-gray-600">{kpi.label}</div>
                <div className="text-2xl font-bold">
                  {formatarValor(kpi.value, kpi.unit)}
                </div>
                {kpi.delta !== undefined && (
                  <div className="text-sm text-gray-600">
                    Variacao: {formatarValor(kpi.delta, kpi.deltaUnit)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParamField({
  param,
  value,
  onChange,
}: {
  param: ParamDef;
  value: number | string | boolean | undefined;
  onChange: (v: number | string | boolean) => void;
}) {
  if (param.type === 'select' && param.options) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {param.label} {param.required && <span className="text-red-500">*</span>}
        </label>
        <select
          className="w-full border rounded p-2"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
        >
          {param.options.map(opt => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
        {param.description && (
          <p className="text-xs text-gray-600 mt-1">{param.description}</p>
        )}
      </div>
    );
  }

  if (param.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(e.target.checked)}
        />
        <label className="text-sm font-medium">
          {param.label} {param.required && <span className="text-red-500">*</span>}
        </label>
        {param.description && (
          <p className="text-xs text-gray-600">{param.description}</p>
        )}
      </div>
    );
  }

  // number
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {param.label} {param.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        className="w-full border rounded p-2"
        value={Number(value ?? 0)}
        min={param.min}
        max={param.max}
        step={param.step ?? 1}
        onChange={e => onChange(Number(e.target.value))}
      />
      {param.description && (
        <p className="text-xs text-gray-600 mt-1">{param.description}</p>
      )}
    </div>
  );
}

function formatarValor(valor: number, unit?: string) {
  if (unit === 'BRL') {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (unit === 'pontos') {
    return `${valor.toLocaleString('pt-BR')} pts`;
  }
  if (unit) {
    return `${valor.toLocaleString('pt-BR')} ${unit}`;
  }
  return valor.toLocaleString('pt-BR');
}
