# Decisions and assumptions

How the brief ([`docs/SPEC.md`](docs/SPEC.md)) was interpreted, what was cut, how the design is meant to grow, and what comes next. Everything here describes the code as it is today; things that are unfinished are said to be unfinished.

## 1. Assumptions where the brief was unclear

| Area | Brief said | What was assumed |
| --- | --- | --- |
| Product ids | FakeStore ids are numbers | The domain `id` is a **string**, so a UUID or database key can replace it without a contract change. The FakeStore adapter only accepts all-digit ids before putting one in an upstream URL path. |
| "Featured items" | Home page shows featured items | There is no featured flag in the data, so "featured" is the first 8 products the API returns. |
| Categories | Filter by category | FakeStore categories are lowercase labels such as `men's clothing`. The domain exposes a **slug** (`mens-clothing`) for URLs and a **display label** (`Men's Clothing`). The API accepts either on `?category=` and returns `UNKNOWN_CATEGORY` (404) otherwise. |
| Stock badge | `ProductCard` shows a stock badge | FakeStore has no inventory. `stock.status` is derived from review count (none → out of stock, under 150 → low stock, otherwise in stock). This is a **placeholder**, isolated in `deriveStockStatus`, and is not real availability. |
| Currency | Price is shown | FakeStore prices are treated as USD, and the currency is an explicit field in the domain model. |
| Search | "client/server-assisted", "instant or form-driven" | **Server-side, form-driven.** The query is split into words and every word must appear in the title, description or category (so `men clothing` matches `Men's Clothing`). On the Search page a product is a "Title match" when its title contains the whole query text (case-insensitive), and everything else is a "Related item". Nothing debounces typing. |
| Enquiry handling | "Submit an enquiry" | Enquiries are **validated, checked against a real product, and passed to the email port. They are not stored.** If the email provider fails, the customer gets an error rather than a false success, because the enquiry would otherwise be lost. |
| Enquiry limits | Name, Email, Message, Product ID | Name 2–80 characters, message 10–1000, valid email, non-empty product id. The same Zod schema is used by the form and the API. |
| Error format | "Standard JSON envelopes" | Success is `{ data, meta? }` and failure is `{ error: { code, message, details? } }`, with stable codes. Upstream failures become 502 and never expose vendor details. |
| Docker base image | `node:20-alpine` | Used as written. Node 20 is past end of life (April 2026), so this is a known item to revisit. |

## 2. Requirements dropped or simplified

| Item | Decision | Why |
| --- | --- | --- |
| Persistence | No database; enquiries are not stored | The brief requires zero provisioning. The `IProductRepository` and `IEmailService` ports are where a database or queue would attach. |
| Real email provider | Console adapter only | No API keys may be required. A provider is one new adapter plus one line in `server.ts`. |
| Pagination | Only `?limit=` (1–100) | FakeStore has about 20 products, so cursors would be overhead. `meta.total` reports the count before the limit, so a paginated contract can be added without breaking clients. |
| Backend caching | None | Keeps behaviour obvious. A caching decorator can wrap `IProductRepository` without touching services. The cost today is that each search fetches the whole product list from FakeStore. |
| Auth, cart, checkout | Not built | Out of scope. This is an enquiry flow, not a store. |
| Rate limiting | Not built | Needed before real email is connected, because the enquiry endpoint is public and would otherwise be an email-sending endpoint anyone can hit. |
| Debounced search | Not built | The brief mentions it for `SearchBar`. Search runs on submit and when the field is cleared. The README previously claimed debouncing, which was inaccurate and has been corrected. |
| Dedicated search endpoints | Created, not used | `GET /api/search` and `IProductRepository.searchProductsByTitle` exist but the UI uses `GET /api/products?search=`. This is unfinished work, tracked in the README under "Search". |
| Contracts barrel file | `packages/contracts/src/index.ts` kept | The brief's layout shows it, so it was followed. |

## 3. How the design supports growth beyond the PoC

- **Swap the data source.** `business/` imports only the `IProductRepository` port and shared contracts. A Postgres/Prisma adapter implements the same five methods, and `server.ts` is the only file that names a concrete class. No service, controller, contract or frontend file changes.
- **Swap the email provider.** The same applies to `IEmailService`. The service builds the notification; the adapter decides how to deliver it. A real provider adapter should own its timeouts, retries and error mapping, and throw the domain `UpstreamError` so the error middleware keeps working unchanged.
- **Change the look and feel.** Components use semantic tokens (`bg-background`, `text-foreground`, `border-border`, and so on). `globals.css` maps them in `@theme` to raw variables (`--background`, `--primary`, `--radius`). A re-skin means changing those values; components do not reference colours directly.
- **One source of truth for the API.** `packages/contracts` holds the Zod schemas. The API validates requests with them, the client validates responses with them, and the enquiry form uses the same schema. A changed field limit changes in one place, and contract drift becomes an `INVALID_RESPONSE` error instead of `undefined` in the UI.
- **Presentation stays dumb.** Components take props. Fetching lives in `hooks/` on TanStack Query (central query client, query keys and retry policy that skips 4xx errors), so the transport can change without touching components.
- **HTTP concerns have one home.** Mapping domain error codes to status codes happens only in `presentation/middleware/errorHandler.ts`. Services throw coded domain errors and never see HTTP.
- **Testable by construction.** Services take ports through the constructor, and the clock and id generator are injectable, so tests need no network, no real time and no randomness.

## 4. What I would do next with another day

In priority order:

1. **Finish the search wiring.** Move the search request in `SearchPage` onto a single TanStack Query hook (with `select` doing the title/related split), which also removes the duplicate request. Then either use `/api/search` or delete it and the extra port method, and add tests for whichever remains.
2. **Run it end to end.** `docker compose up --build` and the live FakeStore path were not verified in automated tests. Add a small Playwright smoke test (browse → search → enquire) run in CI.
3. **Contract tests for the ports.** One shared test suite that runs against every `IProductRepository` implementation, so a Prisma adapter has to behave like the FakeStore one.
4. **Before connecting a real email provider:** rate limiting and abuse protection on `POST /api/enquiries`, persistence (or an outbox) so a provider outage does not lose enquiries, and escaping of user text in HTML emails.
5. **Hardening and hygiene:** move the Docker images to a current Node LTS, validate backend config with a schema instead of hand-parsed values, default CORS to a closed list, add a caching decorator for the repository, add pagination to the contract, and do an accessibility pass on the modal and filters.