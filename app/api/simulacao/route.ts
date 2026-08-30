// app/api/simulacao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calcularResultado, SimulacaoInput, SimulacaoError } from '@/lib/simulacao';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  errors?: SimulacaoError[];
}

function logSimulacao(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
) {
  // Em producao, envie para seu sistema de logs (ex.: Supabase logs, Datadog, etc.)
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      logSimulacao('warn', 'Payload invalido', { rawBody: body });
      return NextResponse.json<ApiResponse<never>>(
        {
          status: 'error',
          errors: [
            {
              code: 'PAYLOAD_INVALIDO',
              message: 'O corpo da requisicao deve ser um JSON valido.',
            },
          ],
        },
        { status: 400 }
      );
    }

    const input = body as Partial<SimulacaoInput>;

    if (!input.decisaoId || typeof input.decisaoId !== 'string') {
      logSimulacao('warn', 'decisaoId ausente ou invalido', { body });
      return NextResponse.json<ApiResponse<never>>(
        {
          status: 'error',
          errors: [
            {
              code: 'DECISAO_ID_INVALIDO',
              message: 'O campo "decisaoId" e obrigatorio e deve ser uma string.',
            },
          ],
        },
        { status: 400 }
      );
    }

    if (!input.params || typeof input.params !== 'object') {
      logSimulacao('warn', 'params ausente ou invalido', { body });
      return NextResponse.json<ApiResponse<never>>(
        {
          status: 'error',
          errors: [
            {
              code: 'PARAMS_INVALIDOS',
              message: 'O campo "params" e obrigatorio e deve ser um objeto.',
            },
          ],
        },
        { status: 400 }
      );
    }

    const simulacaoInput: SimulacaoInput = {
      decisaoId: input.decisaoId,
      params: input.params as Record<string, number | string | boolean>,
    };

    logSimulacao('info', 'Iniciando simulacao', { decisaoId: simulacaoInput.decisaoId });

    const resultado = calcularResultado(simulacaoInput);

    if ('code' in resultado) {
      const erro = resultado as SimulacaoError;
      logSimulacao('warn', 'Erro na simulacao', { erro });
      return NextResponse.json<ApiResponse<never>>(
        {
          status: 'error',
          errors: [erro],
        },
        { status: 400 }
      );
    }

    logSimulacao('info', 'Simulacao concluida com sucesso', {
      decisaoId: simulacaoInput.decisaoId,
      kpisCount: (resultado as any).kpis?.length ?? 0,
    });

    return NextResponse.json<ApiResponse<typeof resultado>>({
      status: 'success',
      data: resultado,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    logSimulacao('error', 'Erro interno na simulacao', { error: message });

    return NextResponse.json<ApiResponse<never>>(
      {
        status: 'error',
        errors: [
          {
            code: 'ERRO_INTERNO',
            message: 'Ocorreu um erro interno ao processar a simulacao.',
          },
        ],
      },
      { status: 500 }
    );
  }
}
