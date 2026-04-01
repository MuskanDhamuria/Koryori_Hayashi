# Algorithms Index (Analytics / ML / Optimization)

This document lists the code locations that implement the project’s analytics, forecasting, ML, and optimization algorithms (so they’re easy to review).

## Backend (Node/TS) — Operations Analytics & Forecasting

| Area | Algorithm / Logic | File path |
|---|---|---|
| KPI computation | Revenue, margin, AOV, category breakdowns, etc. | `backend/src/modules/analytics/dashboard.ts` |
| Demand forecasting | Lightweight “next week” forecast (trend / smoothing-based) used by the analytics dashboard | `backend/src/modules/analytics/dashboard.ts` |
| API surface | Analytics endpoints wiring | `backend/src/modules/analytics/routes.ts` |

## Backend (Node/TS) — LLM-Based Analytics Chatbot

| Area | Algorithm / Logic | File path |
|---|---|---|
| Context building | KPI aggregation + inventory/top-items context fed into the LLM | `backend/src/modules/ai/routes.ts` |
| API surface | Staff-only “ask” endpoint (LLM integration) | `backend/src/modules/ai/routes.ts` |

## Backend (Node/TS) — Digital Twin (Simulation + ML Surrogate)

| Area | Algorithm / Logic | File path |
|---|---|---|
| Rule-based simulator | Baseline + lever effects (“rules” engine) | `backend/src/modules/digitalTwin/routes.ts` |
| ML surrogate model | Feature standardization + ridge regression training + metrics + prediction | `backend/src/modules/digitalTwin/ml.ts` |
| Training data loader | CSV parsing into training samples | `backend/src/modules/digitalTwin/csv.ts` |
| API surface | Simulation endpoint orchestration (rules vs ML), sample merging/deduping | `backend/src/modules/digitalTwin/routes.ts` |
| Training data generator | Mock training CSV generator (includes rule-based output + noise) | `backend/scripts/generate-digital-twin-training-csv.mjs` |
| Example training dataset | Mock training CSV used by the surrogate model | `backend/data/digital-twin-mock-training.csv` |

## Backend (Node/TS) — Customer Recommendations (Scoring + Bandits)

| Area | Algorithm / Logic | File path |
|---|---|---|
| Bandit | Thompson sampling stats store + explore/exploit helpers | `backend/src/modules/customer/banditStore.ts` |
| Recommendation scoring | Multi-signal ranking (bandit + weather + flavor + history + popularity + pairings) | `backend/src/modules/customer/recommendations.ts` |
| Weather features | Weather normalization used in scoring | `backend/src/modules/customer/weather.ts` |
| API surface | Recommendation endpoints wiring | `backend/src/modules/customer/routes.ts` |

## Backend (Node/TS) — Queue Prediction (Baseline)

| Area | Algorithm / Logic | File path |
|---|---|---|
| Dining duration prediction | Deterministic baseline duration model (by group size) | `backend/src/modules/queue/store.ts` |

## QueueTableManagementSystem (Frontend TS) — Forecasting / Prediction / Optimization Utilities

| Area | Algorithm / Logic | File path |
|---|---|---|
| Time-series | ARIMA(2,1,0) fit + forecast (ridge-stabilized normal equations) | `QueueTableManagementSystem/src/app/lib/ai/arima.ts` |
| Online regression | Recursive least squares (online updates + uncertainty proxy) | `QueueTableManagementSystem/src/app/lib/ai/rls.ts` |
| Queueing theory | M/M/c wait-time via Erlang C | `QueueTableManagementSystem/src/app/lib/ai/mmc.ts` |
| Optimization | Table assignment (greedy + exact max-weight assignment via DP) | `QueueTableManagementSystem/src/app/lib/ai/assignment.ts` |
| Math helpers | Linear algebra utilities used by the above | `QueueTableManagementSystem/src/app/lib/ai/math.ts` |

## CustomerFacingApp (Frontend TS) — Recommendation Algorithms

| Area | Algorithm / Logic | File path |
|---|---|---|
| Bandit | Thompson sampling multi-armed bandit + persistence | `CustomerFacingApp/src/app/services/mabService.ts` |
| Recommendation scoring | Multi-signal ranking (bandit + weather + flavor + history + pairings) | `CustomerFacingApp/src/app/services/recommendationService.ts` |
| Weather scoring | Weather-based boost scoring used by recommendations | `CustomerFacingApp/src/app/services/weatherService.ts` |

## CompanyFacingApp (Frontend TS) — Demo Analytics Algorithms

| Area | Algorithm / Logic | File path |
|---|---|---|
| Mock forecasting | Simple linear regression + moving average + trend projection (mock/demo data) | `CompanyFacingApp/src/app/utils/mockData.ts` |

## Dashboard (Python) — Offline Analytics Notebook + Streamlit Viewer

| Area | Algorithm / Logic | File path |
|---|---|---|
| Notebook analytics | Data prep + time-series forecasting (ARIMA / regression / smoothing) | `Dashboard/Calculations/calculate.ipynb` |
| Dashboard UI | Loads and visualizes model outputs | `Dashboard/streamlit_app.py` |
