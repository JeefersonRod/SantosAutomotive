# Arquitetura

## Stack

- Frontend: React, TypeScript, Vite, Tailwind.
- Backend: Express/Node em `server.ts`.
- Banco/API: Supabase.
- Deploy: Railway.
- Push: Web Push com VAPID, sem Firebase.

## Estrutura Atual

- `src/App.tsx`: shell, rotas, sidebar, topbar e guarda visual de acesso.
- `src/components`: telas legadas grandes e componentes compartilhados.
- `src/components/ui`: base inicial do design system.
- `src/services`: cliente HTTP e servicos por dominio.
- `src/hooks`: hooks reutilizaveis.
- `src/types`: tipos por dominio, extraidos de forma gradual.
- `src/modules`: fronteiras futuras por modulo.

## Services

Novas chamadas de API devem usar `src/services` e `apiRequest` em vez de `fetch` direto nos componentes. Dashboard, Ordens, AuthContext, Clientes, Veiculos, Notas/Financeiro e Equipe ja foram migrados. Demais pontos legados devem migrar gradualmente para preservar comportamento.

## Ordens De Servico

Ordens de Servico sao o centro operacional do sistema. A fase atual preserva o schema existente: status legados `pending`, `in_progress` e `completed`, itens manuais em `order_items`, tecnicos em `order_technicians`, checklist em JSONB e testes em `service_order_tests`. O checklist de entrada usa tres estados no frontend (`present`, `absent`, `not_checked`) com compatibilidade para valores booleanos antigos.

Notas de Servico podem ser geradas a partir da O.S. pelo endpoint `POST /api/orders/:id/note`, que reutiliza `notes.order_id`, `note_items` e evita duplicar nota quando uma ja existe para a mesma O.S. Itens de `order_items` continuam com valores internos legados (`labor`, `parts`) e sao mapeados para `service` e `part` em `note_items`. Fluxos profissionais mais granulares devem ser planejados com migration compativel para nao quebrar O.S. antigas, Dashboard, Clientes e Notas.

Diagnostico guiado Fase 1 usa templates estaticos em `src/utils/diagnosticTemplates.ts` e persiste no modelo atual de `service_order_tests`: `component_name`, `result` e `notes`. Os campos guiados sao serializados em texto legivel dentro de `notes`, mantendo compatibilidade com testes antigos e sem migration.

## Impressao

Documentos de O.S. e Nota usam componentes React dedicados em `src/components/print`, acionados por estado local das telas. A impressao usa CSS A4 em `src/index.css`, escondendo a interface operacional apenas durante `body.printing-document`. Essa camada nao altera backend, banco, RBAC, endpoints ou regras de negocio.

## Atendimento

Atendimento/Recepcao e uma camada frontend integrada a Clientes, Veiculos e Ordens. A fase atual reutiliza `clientService`, `vehicleService` e `orderService`, salva a queixa inicial em `service_orders.description`, observacoes em `service_orders.notes` e abre O.S. com status legado `pending`. Nao ha backend, schema ou RBAC novo nesta fase.

## Decisao Arquitetural

O sistema nao deve ser organizado ao redor de produtos, loja ou estoque comercial. A organizacao desejada e por operacao de oficina: atendimento, clientes, veiculos, O.S., diagnostico, agenda, financeiro operacional, equipe, relatorios e configuracoes.

## Legado Tecnico Temporario

`products`, `/api/products` e `InventoryTab` permanecem no codigo/banco por compatibilidade. Eles nao fazem parte da experiencia principal e nao devem ser promovidos como modulo novo sem plano de migration.
