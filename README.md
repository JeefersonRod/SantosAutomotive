# Santos Automotive

Sistema web para gestao de oficina automotiva com React, Vite, Express, Supabase e Firebase.

## Rodar Localmente

**Pre-requisito:** Node.js

1. Instale as dependencias:
   `npm install`
2. Crie o arquivo `.env` usando `.env.example` como base.
3. Rode o app:
   `npm run dev`

O servidor local sobe em `http://localhost:3000`.

## Deploy no Railway

O projeto esta preparado para Railway como um unico servico Node:

- `npm run build` gera o frontend em `dist`.
- `npm start` sobe o Express.
- `railway.json` configura build, start command e healthcheck.
- O servidor usa `process.env.PORT`, que e definido automaticamente pelo Railway.

No painel do Railway, configure as variaveis:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT`

Depois conecte o repositorio ao Railway e faca o deploy. O healthcheck configurado e `/api/health`.

## Novo Supabase

Para usar uma organizacao/projeto novo no Supabase:

1. Crie uma nova organizacao no dashboard do Supabase.
2. Dentro dela, crie um novo projeto.
3. Abra o SQL Editor do projeto novo.
4. Execute o conteudo de `supabase_schema.sql`.
5. Em Project Settings > API, copie:
   - Project URL para `SUPABASE_URL`
   - anon public key para `SUPABASE_ANON_KEY`
   - service_role secret key para `SUPABASE_SERVICE_ROLE_KEY`
6. Cole essas variaveis no servico do Railway.

Depois do deploy, acesse `/api/health` no dominio do Railway para confirmar se o backend conectou ao Supabase.
