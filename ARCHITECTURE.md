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

Ordens de Servico sao o centro operacional do sistema. A fase atual preserva o backend e o schema existentes: status legados `pending`, `in_progress` e `completed`, itens manuais em `order_items`, tecnicos em `order_technicians`, checklist em JSONB e testes em `service_order_tests`. Fluxos profissionais mais granulares devem ser planejados com migration compativel para nao quebrar O.S. antigas, Dashboard, Clientes e Notas.

## Decisao Arquitetural

O sistema nao deve ser organizado ao redor de produtos, loja ou estoque comercial. A organizacao desejada e por operacao de oficina: atendimento, clientes, veiculos, O.S., diagnostico, agenda, financeiro operacional, equipe, relatorios e configuracoes.

## Legado Tecnico Temporario

`products`, `/api/products` e `InventoryTab` permanecem no codigo/banco por compatibilidade. Eles nao fazem parte da experiencia principal e nao devem ser promovidos como modulo novo sem plano de migration.
