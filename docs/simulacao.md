## Simulacao de Decisoes

### Visao geral

A funcionalidade de simulacao permite avaliar o impacto de diferentes decisoes de RH (ex.: contratacoes, treinamentos) sobre KPIs de custo, produtividade e ROI.

### Como rodar localmente

1. Certifique-se de estar na branch `feature/simulacao`.
2. Instale dependencias:
   ```bash
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse: `http://localhost:3000/simulacao`.

### Endpoint

- **URL:** `POST /api/simulacao`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "decisaoId": "contratacao",
    "params": {
      "qtd_vagas": 2,
      "salario_medio": 5000,
      "meses_projecao": 12
    }
  }
  ```
- **Resposta de sucesso:**
  ```json
  {
    "status": "success",
    "data": {
      "decisaoId": "contratacao",
      "params": { ... },
      "kpis": [
        {
          "key": "custo_total",
          "label": "Custo total (periodo)",
          "value": 120000,
          "unit": "BRL"
        }
      ],
      "mensagem": "..."
    }
  }
  ```
- **Resposta de erro:**
  ```json
  {
    "status": "error",
    "errors": [
      {
        "code": "DECISAO_NAO_ENCONTRADA",
        "message": "Decisao \"xyz\" nao encontrada."
      }
    ]
  }
  ```

### Configuracao de decisoes

Edite `config/decisoes.ts` para:

- Adicionar novas decisoes.
- Alterar parametros e regras.
- Ajustar valores padrao e ranges.

A logica de calculo esta em `lib/simulacao.ts`; separe claramente as regras de negocio ali.

### Proximos passos sugeridos

- Integrar com Supabase para salvar historico de simulacoes.
- Adicionar mais decisoes (ex.: desligamentos, mudancas de beneficios, etc.).
- Incluir graficos na pagina de resultados (ex.: recharts, chart.js).
- Implementar testes de integracao para a rota `/api/simulacao`.
