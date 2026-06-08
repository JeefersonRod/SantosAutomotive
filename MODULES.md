# Modulos

## Modulos Principais

- Dashboard: visao geral da operacao.
- Atendimento: entrada e triagem de demandas.
- Clientes: proprietarios e historico.
- Veiculos: frota atendida pela oficina.
- Ordens de Servico: servicos, pecas internas, status e checklists.
- Diagnostico e Checklists: testes e evidencias tecnicas.
- Agenda: organizacao futura de servicos.
- Financeiro operacional: notas, orcamentos e pagamentos.
- Equipe: colaboradores, cargos, setores e acesso.
- Relatorios: indicadores operacionais.
- Configuracoes: parametros internos.
- Area do cliente: somente se houver regras seguras.

## Fora Do Escopo Atual

Produtos, loja, vitrine, promocoes, fornecedores, compras e catalogo comercial.

## Estado Atual Da Remocao Visual

A aba Produtos foi removida da navegacao principal. Itens de pecas continuam permitidos apenas dentro de O.S. e notas como composicao interna de servico.

## Ordens De Servico

A O.S. atual usa estrutura existente sem estoque comercial: cliente e veiculo via `vehicle_id`, responsaveis via `order_technicians`, itens manuais via `order_items`, checklist de entrada em JSONB, testes tecnicos em `service_order_tests` e nota operacional quando a O.S. e finalizada. Status profissionais futuros devem manter compatibilidade com `pending`, `in_progress` e `completed`.
