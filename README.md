# Northwind Supply — Product Catalogue

A full-stack product catalogue built as an npm-workspaces monorepo: a React 19 + Vite + Tailwind CSS v4 storefront, an Express 5 API, and a shared TypeScript contract package. Product data is sourced from [FakeStore](https://fakestoreapi.com/products) and **normalised by the backend** — the browser never calls FakeStore directly.

```
docker compose up --build
```

- Storefront: <http://localhost:3000>
- API: <http://localhost:4000>
- Health check: <http://localhost:4000/api/health>

No API keys, database or external accounts are required.

---

## What it does

- **Home** — hero search, category shortcuts, featured products.
- **Category** — `/categories/:slug` with a category switcher.
- **Search** — `/search?q=…`, instant (debounced) search plus submit, shareable URLs; an empty query browses the full catalogue.
- **Product detail** — `/products/:id` with normalized price, rating, stock signal, description and breadcrumbs.
- **Enquiry modal** — Name / Email / Message / Product ID, validated on the client with the same Zod schema the API uses, then emailed through the `IEmailService` port (console adapter by default).
- Unknown routes render a styled 404; upstream failures render retryable error states.

The interface uses a warm paper palette, serif display headings and terracotta accents defined as semantic CSS variables in `apps/frontend/src/styles/globals.css` (`@theme`). UI primitives are Tailwind/shadcn-style components with `cn()` (clsx + tailwind-merge); the dialog and select are built on Base UI primitives.

## Repository layout

```
product-catalogue/
├── docker-compose.yml
├── package.json                 # workspaces + build/test/typecheck scripts
├── tsconfig.base.json
├── packages/contracts/          # Zod schemas, DTOs, API envelopes (single source of truth)
├── apps/backend/
│   └── src/
│       ├── business/            # domain layer — no vendor imports
│       │   ├── ports/           # IProductRepository, IEmailService, ILogger
│       │   ├── services/        # CatalogService, EnquiryService
│       │   ├── errors.ts        # coded domain errors
│       │   ├── search.ts        # token matching
│       │   └── validation.ts
│       ├── data-access/         # adapters
│       │   ├── fakestore/       # FakeStoreAdapter (HTTP + normalization)
│       │   ├── email/           # ConsoleEmailAdapter
│       │   └── logging/
│       ├── presentation/        # Express controllers, routes, middleware, app factory
│       ├── config.ts
│       └── server.ts            # composition root — the only adapter-aware file
└── apps/frontend/
    └── src/
        ├── api/                 # typed fetch client + endpoint functions
        ├── hooks/               # useProducts, useProductDetail, useCategories, useSubmitEnquiry
        ├── features/            # ProductCard, SearchBar, CategoryFilter, EnquiryModal
        ├── components/ui/       # Button, Input, Textarea, Card, Dialog, Select, Badge, Skeleton
        ├── pages/               # Home, Category, Search, Product, NotFound
        ├── styles/
        └── lib/
```

## Architecture

### Backend: ports and adapters (hexagonal)

```
HTTP ──▶ presentation (controllers / routes / error middleware)
              │
              ▼
        business services ──▶ ports (interfaces)
              │                     ▲
              ▼                     │
        domain errors         adapters implement ports
                                    │
                    FakeStoreAdapter · ConsoleEmailAdapter · ConsoleLogger
```

- `CatalogService` and `EnquiryService` depend only on `IProductRepository`, `IEmailService` and shared contracts. There are no axios/Express/Prisma imports in `business/`.
- `FakeStoreAdapter` owns transport, payload validation, normalisation, timeouts and translation of failures into `UpstreamUnavailableError`.
- Domain errors carry a stable `code` and optional field `details`; mapping them to HTTP status codes lives **only** in `presentation/middleware/errorHandler.ts`.
- `server.ts` is the composition root. Swapping an adapter requires touching one adapter file plus one line in `server.ts`.

Request flow for `GET /api/products?category=jewelery&limit=4`:

1. Controller parses the query with the shared `productQuerySchema`.
2. `CatalogService` resolves the category label to its slug via the repository, fetches, filters, de-duplicates and applies the limit.
3. The controller returns `{ data, meta }`; any thrown domain error is converted by the error middleware into the standard `{ error: { code, message, details? } }` envelope.

### Shared contracts

`@catalogue/contracts` exports `productSchema`, `categorySchema`, `productQuerySchema`, `enquirySchema`, receipt/envelope schemas and their inferred types. Both the Express validation and the React form and fetch client import these, so a field limit only changes in one place. Requests and responses are validated at the boundary, and the client turns contract drift into an `INVALID_RESPONSE` error instead of rendering `undefined`.

### Frontend

- Data fetching is isolated in hooks; components receive data and state, not `fetch` calls. Each hook aborts in-flight requests on unmount/parameter change and exposes `isLoading` / `isError` / `refetch` (or a mutation state machine for enquiries).
- The API base URL comes from `VITE_API_BASE_URL` (`src/config/env.ts`); there is no FakeStore URL anywhere in the client.
- All routes are client-side (`BrowserRouter`), with Nginx serving `index.html` as the fallback for deep links.

## Data normalisation

| FakeStore field | Domain field | Notes |
| --- | --- | --- |
| `id` (number) | `id` (string) | Kept as a string so a UUID/DB key can replace it without a contract change. |
| `title` | `title` | Trimmed. |
| `price` | `price` + `currency: "USD"` | Currency is explicit in the domain model. |
| `category` | `category` (slug) + `categoryLabel` | `"Men's Clothing"` → `mens-clothing` / `Men's Clothing`. |
| `image` | `imageUrl` | Validated as a URL. |
| `rating` | `rating` | Defaults to `{ rate: 0, count: 0 }` if absent. |
| — | `stock.status` | Derived from review count: `0` → `out_of_stock`, `< 150` → `low_stock`, otherwise `in_stock`. FakeStore has no inventory; this is a deterministic stand-in and is isolated in `deriveStockStatus` for replacement by a real inventory source. |

Malformed payloads, non-2xx responses, invalid JSON and network failures all surface as `UPSTREAM_UNAVAILABLE` (HTTP 502) rather than leaking vendor details.

## API

Base URL `http://localhost:4000`. All responses are JSON.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/products?category=&search=&limit=` | List products. `limit` is an integer 1–100. Metadata reports the total before the limit. |
| `GET` | `/api/products/:id` | Single product. |
| `GET` | `/api/categories` | Categories with slugs, display names and product counts. |
| `POST` | `/api/enquiries` | Submit an enquiry. |
| `GET` | `/api/health` | Liveness probe. |

Success envelope:

```json
{
  "data": [ /* products */ ],
  "meta": { "total": 6, "category": "jewelery", "search": null }
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The enquiry is invalid.",
    "details": { "email": ["Enter a valid email address"] }
  }
}
```

Error codes: `VALIDATION_ERROR` (400), `PRODUCT_NOT_FOUND` / `UNKNOWN_CATEGORY` / `ROUTE_NOT_FOUND` (404), `INVALID_JSON` (400), `UPSTREAM_UNAVAILABLE` (502), `INTERNAL_ERROR` (500).

```bash
curl http://localhost:4000/api/products?category=jewelery&limit=2
curl http://localhost:4000/api/categories
curl -X POST http://localhost:4000/api/enquiries \
  -H 'Content-Type: application/json' \
  -d '{"productId":"1","name":"Ada Lovelace","email":"ada@example.com","message":"Is this available in olive green?"}'
```

Enquiry limits: name 2–80 characters, message 10–1000, valid email, non-empty product ID. The product must exist.

## Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | frontend build arg | `http://localhost:4000` | Public API URL baked into the bundle. |
| `PORT` | backend | `4000` | API listen port. |
| `FAKESTORE_API_URL` | backend | `https://fakestoreapi.com` | Product source. |
| `FAKESTORE_TIMEOUT_MS` | backend | `8000` | Upstream request timeout (≥100 ms). |
| `CORS_ORIGIN` | backend | `*` in code; `http://localhost:3000` in Compose | Comma-separated allowed origins. |
| `BACKEND_PORT` / `FRONTEND_PORT` | Compose | `4000` / `3000` | Host port mappings. |

Copy `.env.example` to `.env` to override Compose defaults. If you change `BACKEND_PORT`, set `VITE_API_BASE_URL` to match, because the URL is compiled into the frontend.

### Docker

- Backend: multi-stage `node:20-alpine`; TypeScript builds contracts then the API; the runtime image installs production dependencies only and runs `node dist/server.js` as the non-root `node` user with an HTTP healthcheck.
- Frontend: multi-stage `node:20-alpine` build → `nginx:alpine`, serving hashed assets with long-lived caching and SPA fallback for client routes.
- Compose starts the frontend only after the backend reports healthy.

```bash
docker compose up --build       # first run / after dependency changes
docker compose up               # subsequent runs
docker compose down             # stop
```

The API needs outbound internet access to reach FakeStore. If FakeStore is unreachable, catalogue pages show a retryable error and `/api/health` still reports liveness; enquiries are unaffected apart from the product-existence check.

## Local development

Requires Node.js ≥ 20.19.

```bash
npm install
npm run dev        # contracts build + API (4000) and Vite (3000) with HMR
```

Individual commands:

```bash
npm run build      # contracts → backend dist → frontend dist
npm run typecheck  # strict TypeScript across all workspaces
npm run test       # backend Jest then frontend Jest
```

## Tests

`npm run test` from the repository root runs both suites. All tests are deterministic: HTTP is mocked in the adapter tests, ports are stubbed, the clock and ID generator are injected into `EnquiryService`, and no live FakeStore call is made.

**Backend (Jest + ts-jest + supertest):**

- `FakeStoreAdapter.test.ts` — normalisation, stock derivation, category aggregation, search/limit, 404 → `null`, HTTP/network/malformed-payload translation.
- `CatalogService.test.ts` — query validation, category resolution, unknown category, token search, de-duplication, limit/total semantics, not-found handling.
- `EnquiryService.test.ts` — shared-schema validation, trimming, product existence, notification payload, provider failure propagation.
- `app.test.ts` — endpoint envelopes, status mapping, field-level 400 details, invalid JSON, 404 route.

**Frontend (Jest + jsdom + React Testing Library):**

- UI primitives: Button, Input, Card, Dialog (including close wiring).
- `ProductCard`, `SearchBar` (debounce + submit), `EnquiryModal` (client validation, success, API failure).
- Hooks: `useProducts`, `useProductDetail`, `useCategories`, `useSubmitEnquiry`.

## Extending it

**Replace the data source.** Create a new class in `apps/backend/src/data-access/` that implements `IProductRepository` (four methods, returning the shared `Product` and `Category` types), then replace `new FakeStoreAdapter(...)` in `server.ts` with your adapter. No service, controller, contract or frontend change is required.

**Replace the email provider.** Implement `IEmailService.sendEnquiryNotification` in a new adapter under `data-access/email/` (e.g. Resend or SendGrid) and construct it instead of `ConsoleEmailAdapter` in `server.ts`. The enquiry flow, validation and receipt stay untouched.

Other likely next steps: a real inventory adapter to replace the review-count stock heuristic, persistence for enquiries, pagination in `productQuerySchema` plus the client list, and image optimisation. The ports and shared contracts are the intended seams.

## Assumptions and trade-offs

- FakeStore has no inventory or currency data; `stock.status` is derived and `USD` is fixed. Both are explicit in the domain schema so a real source can supply them later.
- The catalogue is read-only and cached nowhere: each list request fetches FakeStore once. That keeps the demo honest and simple; a cache decorator can wrap `IProductRepository` without touching the services.
- The console email adapter logs notifications instead of sending them, so no credentials are needed to run the project.
- The enquiry form is an enquiry only — there is no cart, checkout or payment flow, and no authentication.
- Search is token-based (`"men clothing"` matches `"Men's Clothing"`) and runs server-side, with debounced requests from the search page.
