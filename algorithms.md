# Algorithms Index (Analytics / ML / Optimization)

This document lists the code locations that implement the project's analytics, forecasting, ML, and optimization algorithms so they are easy to review.

GitHub links below jump directly to the relevant implementation lines. The notebook entry is kept as a plain file path because `.ipynb` line anchors are not a stable way to reference notebook cells.

## Backend (Node/TS) - Operations Analytics & Forecasting

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| KPI computation | Revenue, margin, AOV, category breakdowns, etc. | [dashboard.ts L63-L116](backend/src/modules/analytics/dashboard.ts#L63-L116)<br>[dashboard.ts L221-L284](backend/src/modules/analytics/dashboard.ts#L221-L284)<br>[dashboard.ts L708-L842](backend/src/modules/analytics/dashboard.ts#L708-L842) |
| Demand forecasting | Lightweight "next week" forecast (trend / smoothing-based) used by the analytics dashboard | [dashboard.ts L149-L212](backend/src/modules/analytics/dashboard.ts#L149-L212)<br>[dashboard.ts L422-L486](backend/src/modules/analytics/dashboard.ts#L422-L486) |
| API surface | Analytics endpoints wiring | [routes.ts L5-L66](backend/src/modules/analytics/routes.ts#L5-L66) |

## Backend (Node/TS) - LLM-Based Analytics Chatbot

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Context building | KPI aggregation + inventory/top-items context fed into the LLM | [routes.ts L45-L184](backend/src/modules/ai/routes.ts#L45-L184) |
| API surface | Staff-only "ask" endpoint (LLM integration) | [routes.ts L27-L273](backend/src/modules/ai/routes.ts#L27-L273) |

## Backend (Node/TS) - Digital Twin (Simulation + ML Surrogate)

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Rule-based simulator | Baseline + lever effects ("rules" engine) | [routes.ts L42-L86](backend/src/modules/digitalTwin/routes.ts#L42-L86)<br>[routes.ts L148-L225](backend/src/modules/digitalTwin/routes.ts#L148-L225) |
| ML surrogate model | Feature standardization + ridge regression training + metrics + prediction | [ml.ts L102-L193](backend/src/modules/digitalTwin/ml.ts#L102-L193)<br>[ml.ts L219-L287](backend/src/modules/digitalTwin/ml.ts#L219-L287) |
| Training data loader | CSV parsing into training samples | [csv.ts L28-L120](backend/src/modules/digitalTwin/csv.ts#L28-L120) |
| API surface | Simulation endpoint orchestration (rules vs ML), sample merging/deduping | [routes.ts L227-L388](backend/src/modules/digitalTwin/routes.ts#L227-L388) |
| Training data generator | Mock training CSV generator (includes rule-based output + noise) | [generate-digital-twin-training-csv.mjs L93-L203](backend/scripts/generate-digital-twin-training-csv.mjs#L93-L203) |
| Example training dataset | Mock training CSV used by the surrogate model | [digital-twin-mock-training.csv](backend/data/digital-twin-mock-training.csv) |

## Backend (Node/TS) - Customer Recommendations (Scoring + Bandits)

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Bandit | Thompson sampling stats store + explore/exploit helpers | [banditStore.ts L38-L198](backend/src/modules/customer/banditStore.ts#L38-L198) |
| Recommendation scoring | Multi-signal ranking (bandit + weather + flavor + history + popularity + pairings) | [recommendations.ts L71-L206](backend/src/modules/customer/recommendations.ts#L71-L206)<br>[recommendations.ts L296-L455](backend/src/modules/customer/recommendations.ts#L296-L455) |
| Weather features | Weather normalization used in scoring | [weather.ts L10-L103](backend/src/modules/customer/weather.ts#L10-L103) |
| API surface | Recommendation endpoints wiring | [routes.ts L140-L212](backend/src/modules/customer/routes.ts#L140-L212) |

## Backend (Node/TS) - Queue Prediction (Baseline)

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Dining duration prediction | Deterministic baseline duration model (by group size) | [store.ts L36-L41](backend/src/modules/queue/store.ts#L36-L41)<br>[store.ts L175-L185](backend/src/modules/queue/store.ts#L175-L185)<br>[store.ts L220-L221](backend/src/modules/queue/store.ts#L220-L221) |

## QueueTableManagementSystem (Frontend TS) - Forecasting / Prediction / Optimization Utilities

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Time-series | ARIMA(2,1,0) fit + forecast (ridge-stabilized normal equations) | [arima.ts L14-L104](QueueTableManagementSystem/src/app/lib/ai/arima.ts#L14-L104) |
| Online regression | Recursive least squares (online updates + uncertainty proxy) | [rls.ts L8-L71](QueueTableManagementSystem/src/app/lib/ai/rls.ts#L8-L71) |
| Queueing theory | M/M/c wait-time via Erlang C | [mmc.ts L16-L52](QueueTableManagementSystem/src/app/lib/ai/mmc.ts#L16-L52) |
| Optimization | Table assignment (greedy + exact max-weight assignment via DP) | [assignment.ts L6-L108](QueueTableManagementSystem/src/app/lib/ai/assignment.ts#L6-L108) |
| Math helpers | Linear algebra utilities used by the above | [math.ts L1-L71](QueueTableManagementSystem/src/app/lib/ai/math.ts#L1-L71) |

## Dashboard (Python) - Offline Analytics Notebook + Streamlit Viewer

| Area | Algorithm / Logic | GitHub code links |
|---|---|---|
| Notebook analytics | Data prep + time-series forecasting (ARIMA / regression / smoothing) | `Dashboard/Calculations/calculate.ipynb` |
| Dashboard UI | Loads and visualizes model outputs | [streamlit_app.py L92-L373](Dashboard/streamlit_app.py#L92-L373) |
