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
3. Validar diagnosticos guiados em O.S. reais com admin e tecnico atribuido.
4. Planejar migration compativel para diagnostico estruturado somente se a oficina precisar filtrar/laudar campos tecnicos.
5. Planejar migration compativel para status profissional de O.S. sem quebrar status legados.
6. Separar campos de O.S. para queixa do cliente, diagnostico tecnico, observacoes internas e entrega.
7. Avaliar constraint unica futura para `notes.order_id` quando houver janela segura de migration.
8. Criar historico de status/aprovacao de orcamento quando houver regra segura.
9. Extrair layout do `App.tsx`.
10. Dividir modais grandes de O.S., notas, clientes, veiculos e equipe.
11. Aplicar componentes `ui` nas telas prioritarias.
12. Definir modulo seguro para area do cliente, se necessario.
