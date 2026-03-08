# CompanyFacingApp

A Vite + React + TypeScript dashboard for real-time operational analytics, demand forecasting, inventory optimization, and Gemini-powered operational Q&A.

## Run locally

1. `cd CompanyFacingApp`
2. `npm install`
3. Copy `.env.example` to `.env` and replace `GEMINI_KEY` with your real Gemini API key if you want live AI responses.
4. `npm run dev`

## What is included

- Real-time revenue, hourly sales, peak hour, best-seller, slow-mover, and gross-margin analytics
- Regression + weighted moving average forecasting for next-week menu-item demand
- Time-slot demand and staff-allocation planning
- Automated reorder suggestions and stockout warnings driven by recipe usage and inventory rules
- Waste alerts based on projected cover days versus shelf life
- Margin-improvement suggestions based on target margin settings
- CSV and PDF export for the current dashboard state
- Inline editing for menu items, inventory, recipes, and recent sales records
- Gemini assistant integration using `VITE_GEMINI_API_KEY`
