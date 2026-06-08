# Changelog

## Atual

- Migradas chamadas de API de Clientes, Veiculos, Notas/Financeiro e Equipe para services por dominio.
- Expandidos `clientService`, `vehicleService`, `financeService` e `staffService`.
- Migradas chamadas de API de Dashboard, Ordens e AuthContext para services por dominio.
- Centralizado o uso de `ApiError` para mensagens de erro em fluxos migrados.
- Aplicado `LoadingState` em Ordens como primeiro uso seguro da base UI.
- Tipos de O.S. atualizados com campos ja usados pela tela (`description` e `tests`).
- Removida a aba Produtos da experiencia principal.
- Removida a rota visual ativa de inventario/produtos.
- Mantidos backend, banco e rotas de products como legado tecnico temporario.
- Criada base inicial de design system em `src/components/ui`.
- Criadas fronteiras iniciais de modulos em `src/modules`.
- Criados hooks e servicos por dominio para extracao gradual.
- Criada guarda visual de rotas por permissao no frontend.
- Documentada a decisao de produto: sistema de gestao de oficina, nao e-commerce.

## Base De Seguranca

- `6671c01 Harden backend security for production`
