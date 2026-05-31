# Google ERP — Event Decor Business Manager

A self-contained ERP system for event decoration businesses, built entirely on Google Apps Script. Manage clients, catalog items, quotes, and invoices — with automatic PDF generation — all backed by Google Sheets and Google Drive. No server required.

## Features

- **Clients** — create and search client records
- **Catalog** — manage products/services across 7 event decor categories
- **Quotes** — build itemized quotes with tax and discount support; lifecycle: Draft → Sent → Approved → Converted to Invoice
- **Invoices** — track payment status (Draft, Sent, Paid, Overdue)
- **PDF Generation** — export professional quote and invoice PDFs directly to Google Drive
- **Dashboard** — monthly revenue, outstanding amounts, recent activity
- **Settings** — configure business name, address, tax rate, payment terms, currency

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Google Apps Script (V8 runtime) |
| Frontend | Vanilla JS / HTML / CSS (served via `doGet()`) |
| Data | Google Sheets (5 sheets: Clients, Catalog, Quotes, Invoices, Settings) |
| Storage | Google Drive (folder structure + PDF exports) |
| Deployment | [clasp](https://github.com/google/clasp) CLI |

## Setup

### Prerequisites

- Node.js (for the clasp CLI)
- A Google account

### First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Authenticate with Google
npx clasp login

# 3. Create a new Google Apps Script project at script.google.com
#    Copy the script ID from Project Settings → IDs

# 4. Set your script ID
# Edit erp/.clasp.json and replace REPLACE_WITH_YOUR_SCRIPT_ID

# 5. Push the code
npm run push

# 6. Deploy as a web app
#    In the GAS editor: Deploy → New deployment → Web app
#    Execute as: User accessing the web app
#    Who has access: Anyone with a Google account

# 7. Open the web app URL and click Setup
#    This creates the Drive folder structure, Master Spreadsheet, and sample catalog data

# 8. Go to Settings and enter your business details
```

## Development

```bash
# Push code changes to Google Apps Script
npm run push

# Create a versioned deployment (production release)
npm run deploy

# Lint the GAS source files
npm run lint
```

> **Note:** There is no local dev server. All changes must be pushed with `npm run push` and tested in the live web app.

## Project Structure

```
erp/
├── Code.gs            # Entry point — doGet(), server* function wrappers for client calls
├── Setup.gs           # One-time init: creates Drive folders, Sheets, templates, sample data
├── SheetManager.gs    # Data access layer — getAllRows, appendRow, updateRow, deleteRow
├── ClientManager.gs   # Client CRUD + search
├── CatalogManager.gs  # Product catalog management
├── QuoteManager.gs    # Quote lifecycle and quote-to-invoice conversion
├── InvoiceManager.gs  # Invoice CRUD and status tracking
├── PDFManager.gs      # PDF generation via Google Sheets template export
├── Utils.gs           # Shared helpers — settings, currency, date, error handling
├── index.html         # SPA shell and router
├── JavaScript.html    # All client-side app logic (state, google.script.run bridge, routing)
├── Stylesheet.html    # App styles
├── Dashboard.html     # Dashboard view
├── Clients.html       # Clients view
├── Catalog.html       # Catalog view
├── QuoteNew.html      # New quote form
├── QuotesList.html    # Quotes list view
├── InvoiceNew.html    # New invoice form
├── InvoicesList.html  # Invoices list view
├── Settings.html      # Business settings view
├── appsscript.json    # GAS manifest (OAuth scopes, runtime, timezone)
└── .clasp.json        # clasp project config (script ID)
```

## Git Workflow

```
feature/* → develop → master → prod
```

- Feature branches are merged into `develop` via PR
- `develop` is promoted to `master` after review
- `prod` is the production branch — run `npm run push` from `prod` to deploy live

## Required OAuth Scopes

Declared in `erp/appsscript.json`. Adding new Google APIs requires updating this file before pushing.

| Scope | Purpose |
|---|---|
| `spreadsheets` | Read/write Google Sheets data |
| `drive` | Create folders, copy templates, export PDFs |
| `script.external_request` | External HTTP requests |
| `userinfo.email` | Identify the current user |

## Key Notes

- **Quote approval required** — a quote must be set to `Approved` before it can be converted to an invoice.
- **Re-running Setup** creates duplicate Drive folders and Sheets — only run it once per deployment.
- **Timezone** is hardcoded to `America/New_York` in `appsscript.json`.
- **PDF exports** depend on the Drive folder/template structure created by Setup. If PDFs fail, re-run Setup in a clean environment.
