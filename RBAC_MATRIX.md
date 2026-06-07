# Matriz RBAC

## Perfis

- `super_admin`: acesso total.
- `admin`: administracao operacional.
- `attendant`: atendimento, clientes, veiculos, O.S. e financeiro operacional.
- `technician`: leitura e execucao tecnica em O.S./veiculos permitidos.
- `client`: area restrita futura; sem acesso global da oficina.

## Regras Principais

- Admin: equipe, detalhes de healthcheck e gestao administrativa.
- Staff: dashboard, O.S., veiculos, notificacoes e diagnosticos permitidos.
- Workshop operator (`super_admin`, `admin`, `attendant`): clientes, criacao de O.S. e escrita de dados operacionais.
- Finance access (`super_admin`, `admin`, `attendant`): notas e orcamentos.
- Tecnico: nao deve criar/editar clientes, veiculos ou equipe.
- Cliente: nao deve acessar dashboard interno, equipe, notas, clientes globais ou staff.

## Frontend

O frontend agora possui guarda visual de rota em `App.tsx`, mas isso e apenas UX. A seguranca real continua no backend.
