# Dashboard (Streamlit)

This folder contains a lightweight Streamlit dashboard for visualizing the forecasting outputs under `Dashboard/Output/`.

## Run

```powershell
py -m venv .venv-dashboard
.\.venv-dashboard\Scripts\pip install -r Dashboard\requirements.txt
.\.venv-dashboard\Scripts\streamlit run Dashboard\streamlit_app.py
```

## Expected inputs

The Streamlit app looks for these files (if present):

- `Dashboard/Output/forecast_metrics.csv`
- `Dashboard/Output/future_forecasts_all_models.csv`
- `Dashboard/Output/monte_carlo_band.csv`
- `Dashboard/Output/scenario_forecasts.csv`

Optional:
- `Dashboard/Output/dashboardData.json` (from `Dashboard/Calculations/generate-dashboard-data.mjs`)

Generate it:

```powershell
node .\Dashboard\Calculations\generate-dashboard-data.mjs
```
