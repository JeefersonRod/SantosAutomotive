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

A O.S. atual usa estrutura existente sem estoque comercial: cliente e veiculo via `vehicle_id`, responsaveis via `order_technicians`, itens manuais via `order_items`, checklist de entrada em JSONB com tres estados, testes tecnicos em `service_order_tests` e nota operacional gerada a partir da O.S. quando solicitada. Servicos e pecas aplicadas sao categorias internas da O.S./nota, nao catalogo comercial. Status profissionais futuros devem manter compatibilidade com `pending`, `in_progress` e `completed`.

Impressao de O.S. e Nota e tratada como apresentacao frontend: documentos A4 profissionais com dados ja existentes, sem criar estoque, loja, fornecedores, compras ou regra fiscal nova.

## Atendimento

A tela Atendimento guia a recepcao em quatro etapas: cliente, veiculo, queixa e revisao. Ela nao cria modulo comercial novo; apenas reduz atrito para buscar/cadastrar cliente, buscar/cadastrar veiculo e abrir O.S. pendente com dados minimos.
