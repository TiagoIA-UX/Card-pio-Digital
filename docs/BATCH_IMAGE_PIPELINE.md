# Pipeline isolado do gerador em lote

O gerador de imagens em lote agora pode ser operado como um pipeline isolado, com gates por fase e estrutura em camadas.

## Camadas

- Camada de Rede: arquivos locais, processos e chamadas HTTPS.
- Camada de Catálogo: CSV de prompts e configuração oficial de templates.
- Camada de Provedores: Pexels, DALL-E, Gemini ou Pollinations.
- Camada de Qualidade: sincronização do mapa e auditoria de imagens.
- Camada de Alertas: relatório local em JSON e Markdown com gancho opcional para ZAEA.

## Fases

1. Preflight: valida arquivos, segredos e scripts antes de executar qualquer geração.
2. Geração: executa o provedor selecionado.
3. Sync-map: obrigatório apenas para provedores que geram arquivos locais.
4. Auditoria: valida o resultado antes de liberar a próxima rodada.

Cada fase só avança se a anterior passar. Falha em qualquer gate interrompe a execução.

## Execução

Exemplo com Pexels em dry-run:

```bash
npm run image:pipeline -- --provider=pexels --template=minimercado --dry-run
```

Exemplo com Gemini, com registro opcional no domínio ZAEA:

```bash
npm run image:pipeline -- --provider=gemini --template=minimercado --integrate-zaea=true
```

## Saída

- Relatórios em private/image-pipeline-reports
- Um arquivo JSON por execução
- Um arquivo Markdown por execução
- Gatilho opcional de task no domínio ZAEA

## Objetivo

Separar o gerador em lote do resto do produto, reduzir drift entre scripts e runtime e impedir que uma geração avance sem validação objetiva.
