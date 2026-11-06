# AI usage notes

This file says how AI was used on this project and where it was wrong. The sections about the review and documentation work describe what actually happened in the AI sessions. Two items that only the author can state are marked **[Author to confirm]**.

## 1. Tools and models

| Tool | Used for |
| --- | --- |
| Gemini (gemini-2.5-flash) | Generated the initial idea and setup for the application from the system directive in `docs/ai_usage.md`. |
| ChatGPT (gpt-4o) | Suggested the folder structure and folder naming conventions for the monorepo. |
| Claude (`claude-sonnet-5-5`, Claude Sonnet 5.5) in a Claude Code–based session on claude.ai | Reviewing the `dev` branch, running its typecheck, tests and build, drafting the PR description, writing the documents in this repo, and prototyping a change to `SearchPage`. |
| Claude skills: `coding-standards` (a rules library for TypeScript/React) and `deep-research` | Conventions applied during the review, and a research step that ran four research sub-agents in parallel. |
| Web search / fetch inside that session | The research step. Many official documentation pages were blocked in the session, so some findings came from secondary sources and are flagged as such in the notes. |
| Freebuff — Solar Mini 4 (modal) | The agreed code-generation modality. The Solar Mini 4 model inside the Freebuff modal was used to generate the code and produce the initial commit, `deee907`. |


## 2. Agent instruction files

- [`CLAUDE.md`](CLAUDE.md) is committed. It records the architecture rules, the commands, and the lessons below. It was written at the end of the project from what the review found, so it **was not in effect while the original code was written**.
- The `coding-standards` skill is not part of this repository. It lives in the AI tool's plugin set, so it is not committed.

## 3. Plan or spec

The implementation was built from a written brief, saved as [`docs/SPEC.md`](docs/SPEC.md). It prescribes the hexagonal layout, the two ports, the shared contracts package, the Jest requirement and the Docker setup. There was no separate plan file beyond that brief.

## 4. Key prompts and moments

1. **The brief.** The spec asked for a ports-and-adapters backend where swapping the data source or email provider means "one new adapter and one line in `server.ts`". That sentence drove the structure: `business/` has no vendor imports, and `server.ts` is the only file that names concrete classes.
2. **Research before building.** A prompt to research "a small product catalogue that can grow" produced four parallel research tasks: backend data-source patterns, email provider abstraction, frontend theming, and monorepo/contract tooling. The findings were not all verified. One reached this repository: Node 20 (required by the brief) is past end of life, which is recorded as a known item in `DECISIONS.md`. The rest informed a scaffold that is not part of this repository. An independent scaffold built in parallel was set aside once the `dev` branch was found to implement the same brief, so none of it is in this repository.
3. **"Check the `dev` branch."** The review ran `npm run typecheck`, `npm run test` and `npm run build` rather than reading the code alone. The tests were green and the build was red. That surfaced the four TypeScript errors that would also break `docker compose up --build`.
4. **"Make search use React Query and fill Title matches and Related items."** The AI produced a patch with a single `useProductSearch` hook, using `select` to split one server response into the two groups. The patch was not applied to `dev`, which keeps its original search code. The idea is recorded as a next step in `DECISIONS.md`, and the author's statement that search works locally is reflected in the PR description.
5. **"The PR description is too long."** This moved most of the detail into `README.md`, `DECISIONS.md` and `CLAUDE.md`, and left the PR description as a short summary that points to them.

## 5. Where the AI got it wrong, and how it was caught

**In the repository's existing code and docs (found by the review):**

- **The README described debounced search that did not exist.** A search for `debounce` across the frontend found nothing. The README and DECISIONS now say search runs on submit.
- **The latest search commit said hooks were refactored to TanStack Query, but `SearchPage` still hand-rolls its request** with `useState` + `useEffect`. Reading the file showed it.
- **A test passed while mocking the wrong thing.** `SearchPage.test.tsx` mocked `searchProductsByTitle` with a `{ data, meta }` envelope although the function returns `Product[]`, and it only asserted that two headings were present. Jest did not complain. `tsc` did.
- **The README and brief promise that `docker compose up --build` works, but the frontend build did not typecheck.** Caught by running `npm run build`.

**In the AI's own output during this review:**

- **The first PR description repeated "debounced search" from the README without checking.** Caught by searching the code; fixed.
- **It claimed the new search routes were covered by backend tests.** Caught by searching the tests before sending; the claim was removed and the gap is now documented.
- **The search patch had a bug:** with `keepPreviousData`, clearing the query could leave the page stuck on "Searching…". Caught by writing a regression test, then undoing the fix to confirm the test failed.
- **The README "Search" section first described the Title-match rule from the AI's own patch** (every query word in the title) instead of the code on `dev` (the title contains the whole query text). Caught by re-reading `SearchPage.tsx` against the docs.

## 6. What was not verified

- Nothing was exercised against the live FakeStore API, which was not reachable from the AI's environment.
- That search works in the browser is the author's report, not something the AI observed.
- The research notes were not independently fact-checked. Treat them as leads.

**Post-review verification (author, not the AI):** `docker compose up --build` now builds and runs the application successfully. No Docker/CDocker-related errors were reported; the application starts and the frontend and backend services are healthy.
