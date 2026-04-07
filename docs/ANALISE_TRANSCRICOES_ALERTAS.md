# Análise de Transcrições de Alertas

O backend Python agora expõe análise estruturada para blocos de mensagens copiadas do Telegram ou WhatsApp.
Além disso, o runtime passou a manter incidentes correlacionados em memória para reduzir spam operacional durante a janela ativa.

## Endpoint

- `POST /api/ops/analyze-alert-transcript`
- Autenticação: `Authorization: Bearer INTERNAL_API_SECRET`

## Payload

```json
{
  "transcript": "[06/04/2026 07:51] Zai Sentinel: ..."
}
```

## O que a análise retorna

- contagem total de mensagens
- quantidade de duplicadas
- categorias principais de incidente
- severidades agregadas
- causas prováveis mais recorrentes
- agrupamento por assinatura de incidente
- recomendações operacionais iniciais

## Correlação ao vivo no backend

- o fluxo de dispatch agora consolida alertas parecidos em um incidente ativo
- duplicadas idênticas continuam sendo suprimidas pela janela de dedupe
- reincidências correlacionadas passam a acumular ocorrências, duplicadas suprimidas e último horário visto
- quando um incidente recorrente cruza o limiar configurado, o backend envia atualização resumida em vez de repetir o mesmo alerta bruto
- incidentes ativos passam a ser persistidos em `ops_incidents` no Supabase e reidratados no startup do backend
- incidentes críticos ou reincidentes relevantes agora podem abrir uma task operacional no ZAEA para acompanhamento do ciclo
- se um incidente já resolvido reaparecer com a mesma assinatura, ele passa a ser tratado como regressão e reabre acompanhamento operacional no ZAEA
- novos endpoints operacionais:
  - `GET /api/ops/overview` agora inclui `snapshot.incidents`
  - `GET /api/ops/incidents` retorna a lista de incidentes ativos correlacionados
  - `POST /api/ops/incidents/resolve` resolve um incidente explicitamente com `resolution_reason` padronizado
- novos comandos do bot:
  - `/incidents`
  - `/resolve CHAVE [motivo] [nota]`

## Uso prático

- colar um bloco de conversa do Telegram
- identificar spam e incidentes repetidos
- separar ruído de falhas reais
- acelerar triagem antes de corrigir código ou banco
- fechar explicitamente um incidente após mitigação, sem depender apenas da expiração da janela
- registrar no encerramento se foi falso positivo, mitigação, ajuste de configuração, recovery de provedor ou correção em deploy
- alimentar a base do ZAEA quando o incidente abrir e quando for encerrado
- quando o mesmo incidente voltar após encerrado, o sistema preserva o contexto anterior de resolução e incrementa o contador de reabertura

## Limite atual

- o analisador é determinístico e baseado em padrões já conhecidos
- ele não substitui investigação do código ou do Supabase
- a persistência depende da migration `055_ops_incidents.sql` estar aplicada no ambiente real do Supabase
- ele ajuda a priorizar e deduplicar antes da correção
