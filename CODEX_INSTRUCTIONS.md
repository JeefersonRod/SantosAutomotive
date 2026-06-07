# Instrucoes Para Evolucao Do Projeto

## Base Atual

- Commit base de seguranca: `6671c01 Harden backend security for production`.
- Nao afrouxar CORS, sessoes, validacao de ambiente, Supabase service role ou RBAC para resolver erro visual.
- O backend e o banco nao devem ser alterados sem plano claro, migration e teste.

## Visao Do Produto

RJ Santos Automotive e uma plataforma interna de gestao de oficina automotiva.

Nao faz parte da visao atual:

- loja;
- e-commerce;
- vitrine;
- hall de produtos;
- promocoes;
- fornecedores;
- compras;
- catalogo comercial.

Itens relacionados a pecas devem existir apenas como suporte interno a O.S. e notas.

## Regras Para Futuras Alteracoes

- Frontend nao pode ser a unica barreira de permissao.
- Rotas sensiveis precisam respeitar o RBAC do backend.
- Cliente nao deve acessar dados globais da oficina.
- Produtos/estoque comercial nao devem voltar para a navegacao principal.
- Mudancas grandes devem ser feitas em etapas pequenas e testaveis.
- Rodar `npm run typecheck`, `npm run lint` e `npm run build` antes de publicar.
