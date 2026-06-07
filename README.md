# Santos Automotive

Sistema interno para gestao de oficina automotiva.

O projeto nao tem foco em loja, vitrine, e-commerce, fornecedores, compras ou promocoes. Pecas podem aparecer apenas como itens internos de ordens de servico e notas.

## Stack

- Frontend: React, Vite, TypeScript.
- Backend: Express/Node, servido pelo mesmo processo.
- Banco/API: Supabase.
- Deploy: Railway.
- Push: Web Push com VAPID, sem Firebase.

## Rodar Localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie `.env` a partir de `.env.example`.

3. Rode:

```bash
npm run dev
```

O servidor local sobe em `http://localhost:3000`.

## Scripts

- `npm run dev`: inicia Express com TSX.
- `npm run build`: gera o frontend em `dist`.
- `npm start`: inicia o servidor Express.
- `npm run lint`: executa `tsc --noEmit`.
- `npm run typecheck`: executa `tsc --noEmit`.

## Deploy

Veja [DEPLOYMENT.md](./DEPLOYMENT.md).

## Documentacao Interna

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MODULES.md](./MODULES.md)
- [API_ROUTES.md](./API_ROUTES.md)
- [RBAC_MATRIX.md](./RBAC_MATRIX.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
