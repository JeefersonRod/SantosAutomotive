# Changelog

## Atual

- Iniciada Fase 1 da padronizacao tecnica da Frota com catalogo local focado em diesel leve, picapes e utilitarios.
- Frota e Atendimento rapido agora usam selects de marca, modelo, versao, ano, combustivel e motorizacao, mantendo compatibilidade com `vehicles`.
- Placas passam a ser normalizadas no frontend para busca e salvamento, sem migration ou backend novo nesta fase.
- Checklist de entrada passou a alimentar historico tecnico automatico derivado, sem formulario manual, migration ou backend novo.
- O.S. agora separa queixa do cliente de sintomas tecnicos constatados, persistindo os sintomas na estrutura existente de testes.
- Diagnosticos e testes passam a destacar falhas encontradas, itens testados e descartados, inconclusivos e nao realizados.
- Impressao da O.S. exibe sintomas tecnicos, grupos de diagnostico por resultado e historico tecnico automatico.
- Criada Fase 1 de diagnostico guiado da O.S. com templates estaticos no frontend, sem migration e sem backend novo.
- Modal de "Diagnostico e testes" agora permite selecionar modelos tecnicos, preencher campos guiados, salvar resumo e reabrir para editar.
- Impressao da O.S. passa a exibir diagnosticos guiados preenchidos de forma resumida.
- Impressao de O.S. e Nota migrada para componentes React dedicados, com layout profissional A4 e sem `document.write`.
- O.S. impressa agora exibe numero da ordem, prioridade, dados do cliente/veiculo, checklist, diagnostico/testes, servicos, pecas aplicadas, totais e assinaturas.
- Nota impressa agora exibe numero da nota, vinculo com O.S. quando existir, cliente/veiculo, servicos, pecas aplicadas, descontos, totais, status de pagamento e assinaturas.
- O.S. prioritarias receberam destaque visual mais forte no card.
- Cards de O.S. ganharam acoes rapidas para Checklist e Diagnostico/Testes.
- Botao Abrir Nota passa a abrir o editor da nota vinculada.
- Exclusao de O.S. e Nota exige confirmacao escrita: `EU QUERO EXCLUIR`.
- Checklist de entrada da O.S. ajustado para tres estados: presente, ausente e nao verificado.
- O.S. agora pode gerar/abrir Nota de Servico por acao explicita, reutilizando a nota existente quando houver `order_id`.
- Itens da O.S. mantem valores internos legados, mas a interface diferencia "Servico" e "Peca aplicada" sem criar estoque/produto.
- Visualizacao/impressao de Notas separa servicos e pecas aplicadas, com calculos tolerantes a valores vazios para evitar tela branca.
- Criada tela de Atendimento/Recepcao em etapas para buscar/cadastrar cliente, buscar/cadastrar veiculo e abrir O.S. pendente.
- Atendimento conectado a navegacao apenas para `super_admin`, `admin` e `attendant`.
- Fluxo de Atendimento reutiliza `clientService`, `vehicleService` e `orderService`, sem fetch direto.
- Auditado o fluxo atual de Ordens de Servico.
- Aplicada Fase 1 segura da O.S. profissional sem migration: organizacao em secoes, labels mais operacionais, busca ampliada, status visual compativel e validacoes melhores.
- Mantidos backend, banco, RBAC e status legados de O.S. sem alteracao.
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
