# Rotas Da API

## Publicas Ou Sem Sessao

- `POST /api/auth/login`
- `POST /api/auth/register-request`
- `GET /api/health`

## Autenticacao

- `GET /api/auth/me`
- `POST /api/auth/logout`

## Admin

- `GET /api/health/details`
- `GET /api/staff`
- `POST /api/staff`
- `PUT /api/staff/:id`
- `DELETE /api/staff/:id`
- `GET /api/staff-requests`
- `DELETE /api/staff-requests/:id`

## Operacao Da Oficina

- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/clients/:id/vehicles`
- `GET /api/clients/:id/orders`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET /api/orders/:id/tests`
- `POST /api/orders/:id/tests`
- `DELETE /api/orders/tests/:testId`
- `GET /api/stats`

## Financeiro Operacional

- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

## Notificacoes

- `GET /api/notifications/public-key`
- `POST /api/notifications/subscription`

## Legado Tecnico

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Essas rotas permanecem por compatibilidade, mas nao devem ser usadas para loja, vitrine, promocoes ou catalogo comercial.
