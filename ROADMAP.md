# Roadmap

## Prioridade Atual

- Consolidar gestao de oficina.
- Melhorar O.S., atendimento, diagnosticos e financeiro operacional.
- Modularizar frontend gradualmente.
- Aplicar design system nas telas principais.
- Tratar 401/403 de forma consistente.

## Fora Do Roadmap Atual

- Loja.
- Vitrine.
- Hall de produtos.
- Promocoes.
- Catalogo comercial.
- Fornecedores.
- Compras.
- E-commerce.

## Proximas Etapas Recomendadas

1. Validar Atendimento, O.S. e Nota gerada com admin e attendant em dados reais da oficina.
2. Validar impressao/PDF de O.S. e Nota em desktop e mobile usando dados reais.
3. Planejar migration compativel para status profissional de O.S. sem quebrar status legados.
4. Separar campos de O.S. para queixa do cliente, diagnostico tecnico, observacoes internas e entrega.
5. Avaliar constraint unica futura para `notes.order_id` quando houver janela segura de migration.
6. Criar historico de status/aprovacao de orcamento quando houver regra segura.
7. Extrair layout do `App.tsx`.
8. Dividir modais grandes de O.S., notas, clientes, veiculos e equipe.
9. Aplicar componentes `ui` nas telas prioritarias.
10. Definir modulo seguro para area do cliente, se necessario.
