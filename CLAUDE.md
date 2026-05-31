# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Apps Script ERP for an event decoration business. The entire backend runs in Google Apps Script (V8 runtime), data is stored in Google Sheets/Drive, and the frontend is a single-page HTML app served via `doGet()`. No Node.js runtime — `package.json` only exists to provide the `clasp` CLI.

All source code lives in `erp/`.

## Setup

Before first use:

1. `npm install` — installs clasp CLI
2. `npx clasp login` — authenticate with Google account
3. Create a Google Apps Script project (script.google.com) and copy its script ID
4. Update `erp/.clasp.json`: replace `REPLACE_WITH_YOUR_SCRIPT_ID` with the real script ID
5. `npm run push` — upload code to GAS
6. In the GAS console: Deploy → New deployment → Web app (execute as user, access: anyone with Google account)
7. Open the web app URL and click **Setup** — this creates the Drive folder structure, Master Spreadsheet, templates, and seeds sample catalog data
8. Go to Settings in the web app and enter business name, address, tax rate, etc.

## Deploy Commands

```bash
# Push code changes to Google Apps Script
npm run push

# Create a new versioned deployment (production release)
npm run deploy --description "v1.x release notes"

# Open the GAS editor in browser
npx clasp open
```

**Production branch is `prod`.** Git workflow: feature branches → `develop` → `master` → `prod`. Only push to GAS from `prod`.

## Architecture

Three-tier, all within GAS:
- **Backend** (`*.gs` files): server-side logic
- **Bridge**: `google.script.run` — async calls from HTML client to GAS functions
- **Frontend** (`*.html` files): HTML/CSS/JS inlined via `include()` template helper

Key `.gs` files:
- `Code.gs` — entry point (`doGet()`), exposes all `server*` functions to the client
- `Setup.gs` — one-time initialization of Drive folders and Sheets
- `SheetManager.gs` — generic data access layer (append/find/update/delete by row)
- `PDFManager.gs` — generates PDFs by cloning Sheet templates and exporting

Data is stored across 5 sheets in a single Master Spreadsheet: Clients, Catalog, Quotes, Invoices, Settings. `items_json` columns store line-item arrays as JSON strings.

## Code Conventions

- Private GAS functions use a trailing underscore: `getSheet_()`, `generateId_()`
- Functions exposed to `google.script.run` use a `server` prefix: `serverGetAllClients()`
- All public functions are wrapped in try-catch; errors return `{ success: false, error: message }`; success returns `{ success: true, data: ... }`
- Entity IDs are prefix-based: `CLI-001`, `CAT-001`, `Q-001`, `INV-001`
- Constants are UPPERCASE: `SHEET_NAMES`, `QUOTE_HEADERS`
- Dates are stored as `yyyy-MM-dd` strings; timezone is locked to `America/New_York` in `appsscript.json`

## Key Gotchas

- **No local testing** — GAS code cannot be run locally. All changes must be pushed with `npm run push` and tested in the live web app.
- **Quotes must be `Approved` before conversion to invoice** — the code explicitly rejects any other status.
- **PDF generation** works by cloning a Google Sheet template and exporting it as PDF. It locates templates by searching a Drive folder — if the folder structure is missing, regenerate it via the Setup flow.
- **`items_json` has no schema validation** — malformed JSON silently becomes `[]` via `parseJsonSafely_()`.
- **GAS quotas** — Google Apps Script has daily limits on Drive and Sheets operations. The Setup flow creates many Drive items at once; avoid re-running it unnecessarily.
- **OAuth scopes** are declared in `erp/appsscript.json`. Adding new Google service APIs requires adding the scope there before pushing.
