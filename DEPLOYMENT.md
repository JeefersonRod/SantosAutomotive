# Deploy Railway - Santos Automotive

## Variaveis obrigatorias em producao

Configure no servico do Railway:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SESSION_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_NAME=
ALLOWED_ORIGINS=https://santosautomotive-production.up.railway.app
PUBLIC_APP_URL=https://santosautomotive-production.up.railway.app
```

`SESSION_SECRET` deve ser longo e aleatorio. Nao use valores padrao.

`ADMIN_USERNAME` e `ADMIN_PASSWORD` sao usados apenas para criar/validar o administrador inicial. Em producao, o servidor recusa `admin` / `admin123`.

## Variaveis opcionais

```env
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_SUBJECT=mailto:admin@santosautomotive.local
```

Para gerar chaves Web Push:

```bash
npx.cmd web-push generate-vapid-keys
```

Use `MASTER_ADMIN_PASSWORD` somente em desenvolvimento local. Em producao, o bypass de master admin e ignorado.

## Railway

`railway.json` usa:

- build: `npm run build`
- start: `NODE_ENV=production npm run start`
- healthcheck: `/api/health`

O servidor escuta `process.env.PORT` em `0.0.0.0`.

## Healthcheck

- Publico: `/api/health`
  - retorna apenas status basico.
- Administrativo: `/api/health/details`
  - requer login admin/super_admin.
  - mostra diagnostico de Supabase sem expor chaves.

## Checklist antes de publicar

- `SUPABASE_URL` sem `/rest/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` configurada somente no Railway, nunca no frontend.
- `SESSION_SECRET` forte e diferente do exemplo.
- `ALLOWED_ORIGINS` contem somente dominios confiaveis.
- Firebase nao esta em uso.
- `.env` real nao esta versionado.
- `node_modules`, `dist` e cache nao estao versionados.
- `npm run typecheck` passa.
- `npm run lint` passa.
- `npm run build` passa.
