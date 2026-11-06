# Northwind Supply — Product Catalogue

A full-stack product catalogue built as an npm-workspaces monorepo: a React 19 + TanStack Query + Vite + Tailwind CSS v4 storefront, an Express 5 API, and a shared TypeScript contract package. Product data is sourced from [FakeStore](https://fakestoreapi.com/products) and **normalised by the backend** — the browser never calls FakeStore directly.

```
docker compose up --build
```

- Storefront: <http://localhost:3000>
- API: <http://localhost:4000>
- Health check: <http://localhost:4000/api/health>

No API keys, database or external accounts are required.

### Reviewer setup

| You need | Notes |
| --- | --- |
| Docker with Compose v2 | The only requirement for `docker compose up --build`. A cold build takes a few minutes. |
| Free ports `3000` and `4000` | Change them with `FRONTEND_PORT` / `BACKEND_PORT` (see [Configuration](#configuration)). If you change `BACKEND_PORT`, set `VITE_API_BASE_URL` to match. |
| Outbound internet access | The API fetches products from `https://fakestoreapi.com`. Without it, catalogue pages show a retryable error. |
| Nothing else | No API keys, database or accounts. Enquiries are printed to the backend container logs (`docker compose logs -f backend`). |

Without Docker: Node.js ≥ 20.19, then `npm install && npm run dev` (API on 4000, Vite on 3000).

### Project documents

- [`DECISIONS.md`](DECISIONS.md) — assumptions, what was dropped or simplified, how the design grows, and next steps.
- [`AI_USAGE.md`](AI_USAGE.md) — tools and models used, key prompts, and where the AI was wrong.
- [`CLAUDE.md`](CLAUDE.md) — agent instructions for working in this repo.
- [`docs/SPEC.md`](docs/SPEC.md) — the original brief the implementation was built from.

---

## What it does

- **Home** — hero search, category shortcuts, featured products.
- **Category** — `/categories/:slug` with a category switcher.
- **Search** — `/search?q=…`, run on submit, with shareable URLs. Results are grouped into **Title matches** and **Related items**; an empty query browses the full catalogue. See [Search](#search).
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
        ├── hooks/               # TanStack Query hooks: useProducts, useProductDetail, useCategories, useSubmitEnquiry
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

- Data fetching is isolated in TanStack Query v5 hooks; components receive data and state, not `fetch` calls. The shared client (`src/lib/queryClient.ts`) centralises caching, deduplication and retry policy, while `src/lib/queryKeys.ts` keeps cache keys consistent. Hooks expose `isLoading` / `isError` / `refetch` (or mutation state for enquiries); TanStack aborts in-flight requests on unmount or parameter change.
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
| `GET` | `/api/search?search=` | Whole-word title search. Created but not used by the UI yet; see [Search](#search). |
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
- `ProductCard`, `SearchBar` (submit, clear), `SearchPage`, `EnquiryModal` (client validation, success, API failure).
- Hooks: `useProducts`, `useProductDetail`, `useCategories` (TanStack Query) and `useSubmitEnquiry` (TanStack Mutation), plus a test that cached categories are reused across mounts.

## Search

Search works end to end in the UI. On the Search page, `SearchPage` calls `GET /api/products?search=`, which matches on title, description and category. It then splits the results on the client: a product is a **Title match** when its title contains the query text (case-insensitive), and everything else is a **Related item**.

`GET /api/search` and `IProductRepository.searchProductsByTitle` (whole-word, title-only matching) exist but are **not used by the frontend yet**, and no backend test covers them. Either wire the frontend to them or remove them; every new data source has to implement each port method, so the port should not grow without a caller.

## Extending it

**Replace the data source.** Create a new class in `apps/backend/src/data-access/` that implements `IProductRepository` (four methods, returning the shared `Product` and `Category` types), then replace `new FakeStoreAdapter(...)` in `server.ts` with your adapter. No service, controller, contract or frontend change is required.

**Replace the email provider.** Implement `IEmailService.sendEnquiryNotification` in a new adapter under `data-access/email/` (e.g. Resend or SendGrid) and construct it instead of `ConsoleEmailAdapter` in `server.ts`. The enquiry flow, validation and receipt stay untouched.

Other likely next steps: a real inventory adapter to replace the review-count stock heuristic, persistence for enquiries, pagination in `productQuerySchema` plus the client list, and image optimisation. The ports and shared contracts are the intended seams.

## Assumptions and trade-offs

- FakeStore has no inventory or currency data; `stock.status` is derived and `USD` is fixed. Both are explicit in the domain schema so a real source can supply them later.
- The backend catalogue is read-only and caches nothing: each uncached list request fetches FakeStore once, so a cache decorator can wrap `IProductRepository` without touching the services. The React client keeps query results for 30 seconds (TanStack Query).
- The console email adapter logs notifications instead of sending them, so no credentials are needed to run the project.
- The enquiry form is an enquiry only — there is no cart, checkout or payment flow, and no authentication.
- Search is token-based (`"men clothing"` matches `"Men's Clothing"`) and runs server-side when the query is submitted. Nothing debounces typing.

## Known limitations

- **`SearchPage` fetching.** The search request uses `useState` + `useEffect` rather than a TanStack Query hook, and runs alongside `useProducts({ search })`, so each query makes two requests. Folding it into one query hook (with `select` doing the title/related split) would remove the duplicate request.
- **Node 20 images.** The Dockerfiles use `node:20-alpine`, which reached end of life in April 2026. Move to a current LTS when convenient.
- **CORS.** `CORS_ORIGIN` defaults to `*` in code when unset (Compose sets `http://localhost:3000`).
- **No rate limiting** on `POST /api/enquiries`, and enquiries are not persisted. A failed notification returns an error to the customer and the enquiry is lost.
- **No backend caching.** Each search fetches the full FakeStore product list.
- **Stock status** is a heuristic derived from review count, not real inventory.
- **Backend config** is parsed by hand in `config.ts` rather than validated with a schema.

## Verifying a build

```bash
npm ci && npm run typecheck && npm run test && npm run build
docker compose up --build
```

Then check: browse → category → product → enquiry (the enquiry appears in the backend container logs); submit a search and confirm both result groups; point `FAKESTORE_API_URL` somewhere invalid and confirm catalogue pages show a retryable error rather than a blank screen.