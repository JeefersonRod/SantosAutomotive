# Banco De Dados

## Fonte

O schema base esta em `supabase_schema.sql`.

## Observacao Sobre Products

A tabela `products` nao foi apagada. Ela permanece como legado tecnico temporario para evitar quebra de producao.

Nao usar `products` como loja, vitrine, catalogo, promocao ou fluxo de venda para cliente. Qualquer uso de pecas deve ser interno a O.S. ou nota.

## Mudancas De Banco

Esta etapa nao altera banco e nao cria migration.

O checklist de entrada continua salvo no JSONB existente de `service_orders.checklist`. A geracao de nota a partir de O.S. reutiliza `notes.order_id` e `note_items`; nenhuma tabela nova foi criada nesta etapa.
