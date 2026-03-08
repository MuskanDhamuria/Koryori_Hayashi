# CompanyFacingApp

A full-stack Smart Analytics & AI Forecasting Dashboard for restaurant operations.

## What changed

This app now runs with:

- a **React + Vite frontend**
- an **Express backend**
- a **local SQLite database** for dashboard persistence and authentication
- **secure login** backed by hashed passwords and HTTP-only session cookies
- **live spreadsheet sync** for approved local CSV/XLSX files watched by the backend
- the original analytics, forecasting, export, and Gemini assistant features

## Run locally

Use Node **22.13+**.

```bash
npm install
cp .env.example .env
npm run dev
```

This starts:

- the frontend on `http://localhost:5173`
- the backend on `http://localhost:3001`

The first time you open the app, you will create the first admin account in the UI.

## Build

```bash
npm run build
```

## Authentication model

- users are stored in SQLite
- passwords are hashed on the server using Node's `scrypt`
- the server issues an HTTP-only session cookie after login
- dashboard data endpoints require authentication

## Spreadsheet sync

### Important limitation

A normal browser app cannot silently scan arbitrary files on a laptop. Instead, this project uses a **local backend watcher**. You provide one approved file path in the UI, and the backend watches that path for changes.

When the file is saved:

1. the backend reparses it
2. it updates SQLite
3. it pushes a live event back to the frontend
4. the dashboard reloads the changed data automatically

### Supported files

- `.csv`
- `.xls`
- `.xlsx`

### CSV mode

For CSV, choose the target entity in the UI:

- `salesRecords`
- `menuItems`
- `inventoryItems`
- `recipes`
- `settings`

Use headers that match the dashboard field names.

Examples:

#### salesRecords CSV

```csv
menuItemName,timestamp,quantity,note
Teriyaki Salmon Bowl,2026-03-08T10:00:00,7,Spreadsheet update
Chicken Katsu Curry,2026-03-08T11:00:00,4,Spreadsheet update
```

#### menuItems CSV

```csv
id,name,category,price,unitCost,prepMinutes
menu-1,Teriyaki Salmon Bowl,Bowl,18.5,7.8,12
menu-2,Chicken Katsu Curry,Main,17.0,6.4,14
```

### Excel workbook mode

For Excel workbooks, use sheet names like:

- `menuItems`
- `inventoryItems`
- `salesRecords`
- `recipes`
- `settings`

The importer accepts those sheet names directly and also recognizes close variants like `menu`, `inventory`, `sales`, and `config`.

### Field conventions

#### menuItems sheet / CSV

- `id`
- `name`
- `category`
- `price`
- `unitCost`
- `prepMinutes`

#### inventoryItems sheet / CSV

- `id`
- `name`
- `unit`
- `onHand`
- `unitCost`
- `safetyStock`
- `leadTimeDays`
- `packSize`
- `shelfLifeDays`

#### salesRecords sheet / CSV

- `id` (optional)
- `menuItemId` or `menuItemName`
- `timestamp`
- `quantity`
- `note`

#### recipes sheet / CSV

- `id` (optional)
- `menuItemId` or `menuItemName`
- `inventoryItemId` or `inventoryItemName`
- `quantityPerItem`

#### settings sheet / CSV

Either use a single row with direct columns:

- `currencyCode`
- `ordersPerStaffHour`
- `targetMargin`
- `forecastHorizonDays`
- `wasteCoverThresholdDays`
- `regressionBlend`

Or a two-column key/value style with:

- `key`
- `value`

## AI configuration

Set your Gemini key in `.env`:

```env
VITE_GEMINI_API_KEY=GEMINI_KEY
```

Replace `GEMINI_KEY` with a real Gemini API key to enable live AI answers. Until then, the app falls back to a deterministic local assistant summary.
