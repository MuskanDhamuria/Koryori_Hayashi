from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Iterable

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st


@dataclass(frozen=True)
class OutputPaths:
    root: Path

    @property
    def output_dir(self) -> Path:
        return self.root / "Output"

    @property
    def forecast_metrics(self) -> Path:
        return self.output_dir / "forecast_metrics.csv"

    @property
    def future_forecasts_all_models(self) -> Path:
        return self.output_dir / "future_forecasts_all_models.csv"

    @property
    def monte_carlo_band(self) -> Path:
        return self.output_dir / "monte_carlo_band.csv"

    @property
    def scenario_forecasts(self) -> Path:
        return self.output_dir / "scenario_forecasts.csv"

    @property
    def dashboard_data_json(self) -> Path:
        return self.output_dir / "dashboardData.json"

    def expected_csvs(self) -> list[Path]:
        return [
            self.forecast_metrics,
            self.future_forecasts_all_models,
            self.monte_carlo_band,
            self.scenario_forecasts,
        ]

    def expected_optional(self) -> list[Path]:
        return [self.dashboard_data_json]


ROOT = Path(__file__).resolve().parent
PATHS = OutputPaths(root=ROOT)


st.set_page_config(
    page_title="Dashboard",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
<style>
/* Hide Streamlit sidebar and its collapse/expand control ("side pop out"). */
[data-testid="stSidebar"] { display: none; }
[data-testid="stSidebarCollapsedControl"] { display: none; }

/* Hide the top-right toolbar/menu (Deploy, Rerun, Auto rerun, Clear cache, etc.). */
[data-testid="stToolbar"] { display: none; }
[data-testid="stHeaderActionElements"] { display: none; }
[data-testid="stDecoration"] { display: none; }
</style>
""",
    unsafe_allow_html=True,
)


def _human_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def _status_badge(exists: bool) -> str:
    return "OK" if exists else "MISSING"


@st.cache_data(show_spinner=False)
def read_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    if "Month" in df.columns:
        df["Month"] = pd.to_datetime(df["Month"], errors="coerce")
    return df


@st.cache_data(show_spinner=False)
def read_json(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def file_picker(label: str, candidates: Iterable[Path]) -> Path | None:
    options: list[tuple[str, Path]] = []
    for path in candidates:
        options.append((f"{_status_badge(path.exists())} {_human_path(path)}", path))

    if not options:
        return None

    selected = st.selectbox(label, options=options, format_func=lambda x: x[0])
    return selected[1] if selected else None


def download_df(df: pd.DataFrame, label: str, filename: str) -> None:
    st.download_button(
        label=label,
        data=df.to_csv(index=False).encode("utf-8"),
        file_name=filename,
        mime="text/csv",
        use_container_width=True,
    )


st.title("Dashboard")
st.caption("Reads forecasting outputs from `Dashboard/Output/` and renders quick charts + tables.")

load_mode = "Use repo files"
uploaded_file = None
show_raw = False


def load_df_from_repo(path: Path) -> pd.DataFrame | None:
    if not path.exists():
        return None
    return read_csv(str(path))


def load_df_from_upload() -> pd.DataFrame | None:
    if uploaded_file is None:
        return None
    df = pd.read_csv(uploaded_file)
    if "Month" in df.columns:
        df["Month"] = pd.to_datetime(df["Month"], errors="coerce")
    return df


def load_df(path: Path) -> pd.DataFrame | None:
    return load_df_from_upload() if load_mode == "Upload CSV" else load_df_from_repo(path)


tab_overview, tab_xlsx, tab_metrics, tab_future, tab_scenarios, tab_monte = st.tabs(
    ["Overview", "Spreadsheet extracts", "Model metrics", "Future forecasts", "Scenarios", "Monte Carlo band"]
)

with tab_overview:
    if PATHS.dashboard_data_json.exists():
        try:
            payload = read_json(str(PATHS.dashboard_data_json))
        except Exception as exc:  # noqa: BLE001
            st.error(f"Failed to read `dashboardData.json`: {exc}")
        else:
            summary = payload.get("summary") or {}

            st.subheader("Summary")
            cols = st.columns(6)
            cols[0].metric("Item sales total", f"{summary.get('itemSalesTotal', 0):,.2f}")
            cols[1].metric("Hourly revenue", f"{summary.get('hourlyRevenue', 0):,.2f}")
            cols[2].metric("Hourly orders", f"{int(summary.get('hourlyOrders', 0) or 0):,}")
            cols[3].metric("Avg order value", f"{summary.get('avgOrderValue', 0):,.2f}")
            cols[4].metric("Margin %", f"{summary.get('marginPercent', 0):,.2f}%")
            peak_hour = summary.get("peakHour", None)
            cols[5].metric("Peak hour", f"{int(peak_hour):02d}:00" if peak_hour is not None else "—")
    else:
        st.subheader("Summary")
        st.caption("`Dashboard/Output/dashboardData.json` not found.")

with tab_xlsx:
    st.subheader("Spreadsheet extracts")
    if not PATHS.dashboard_data_json.exists():
        st.info("`Dashboard/Output/dashboardData.json` not found. Generate it to see these charts.")
    else:
        try:
            payload = read_json(str(PATHS.dashboard_data_json))
        except Exception as exc:  # noqa: BLE001
            st.error(f"Failed to read `dashboardData.json`: {exc}")
        else:
            tables = payload.get("tables") or {}
            items = pd.DataFrame(tables.get("items") or [])
            hourly = pd.DataFrame(tables.get("hourly") or [])
            monthly = pd.DataFrame(tables.get("monthly") or [])

            if not monthly.empty and "month" in monthly.columns:
                monthly["month"] = pd.to_datetime(monthly["month"], errors="coerce")
                monthly = monthly.dropna(subset=["month"]).sort_values("month")

            top_items_n = st.slider("Top items", min_value=5, max_value=20, value=10, step=1)

            left, right = st.columns(2)
            with left:
                if items.empty or not {"item", "salesSummary"}.issubset(items.columns):
                    st.info("No item table found in JSON (expected `tables.items`).")
                else:
                    plot_items = items.copy()
                    plot_items["salesSummary"] = pd.to_numeric(plot_items["salesSummary"], errors="coerce").fillna(0)
                    plot_items = plot_items.sort_values("salesSummary", ascending=False).head(top_items_n)
                    fig = px.bar(plot_items, x="salesSummary", y="item", orientation="h")
                    fig.update_layout(yaxis_title=None, xaxis_title=None)
                    st.plotly_chart(fig, use_container_width=True)

            with right:
                if hourly.empty or not {"hour", "amount", "orders"}.issubset(hourly.columns):
                    st.info("No hourly table found in JSON (expected `tables.hourly`).")
                else:
                    hourly_plot = hourly.copy()
                    hourly_plot["hour"] = pd.to_numeric(hourly_plot["hour"], errors="coerce")
                    hourly_plot["amount"] = pd.to_numeric(hourly_plot["amount"], errors="coerce").fillna(0)
                    hourly_plot["orders"] = pd.to_numeric(hourly_plot["orders"], errors="coerce").fillna(0)
                    hourly_plot = hourly_plot.dropna(subset=["hour"]).sort_values("hour")
                    fig = px.line(hourly_plot, x="hour", y=["amount", "orders"], markers=True)
                    fig.update_layout(yaxis_title=None, xaxis_title="Hour", legend_title_text=None)
                    st.plotly_chart(fig, use_container_width=True)

            if monthly.empty or "month" not in monthly.columns:
                st.info("No monthly table found in JSON (expected `tables.monthly`).")
            else:
                available_metrics = [c for c in monthly.columns if c != "month"]
                selected_metrics = st.multiselect(
                    "Monthly metrics",
                    options=available_metrics,
                    default=[c for c in ["totalSales", "profitLoss"] if c in available_metrics] or available_metrics[:2],
                )
                if selected_metrics:
                    fig = px.line(monthly, x="month", y=selected_metrics, markers=True)
                    fig.update_layout(yaxis_title=None, xaxis_title=None, legend_title_text=None)
                    st.plotly_chart(fig, use_container_width=True)

            if show_raw:
                st.markdown("#### Raw tables")
                st.write("Items")
                st.dataframe(items, use_container_width=True)
                st.write("Hourly")
                st.dataframe(hourly, use_container_width=True)
                st.write("Monthly")
                st.dataframe(monthly, use_container_width=True)

with tab_metrics:
    st.subheader("Forecast error metrics")
    st.caption(
        "MAE = Mean Absolute Error (lower is better)  \n"
        "RMSE = Root Mean Squared (lower is better)  \n"
        "MAPE_% = Mean Absolute Percentage Error ( Lower is better)"
    )

    df = load_df(PATHS.forecast_metrics)
    if df is None or df.empty:
        st.empty()
    else:
        if not {"Model", "MAE", "RMSE", "MAPE_%"}.issubset(df.columns):
            st.error("Unexpected schema: expected columns `Model, MAE, RMSE, MAPE_%`.")
        else:
            melted = df.melt(id_vars=["Model"], value_vars=["MAE", "RMSE", "MAPE_%"], var_name="Metric")
            fig = px.bar(melted, x="Model", y="value", color="Metric", barmode="group")
            fig.update_layout(yaxis_title=None, xaxis_title=None, legend_title_text=None)
            st.plotly_chart(fig, use_container_width=True)

            if show_raw:
                st.dataframe(df, use_container_width=True)
                download_df(df, "Download metrics CSV", "forecast_metrics.csv")

with tab_future:
    st.subheader("Future forecasts (all models)")

    df = load_df(PATHS.future_forecasts_all_models)
    if df is None or df.empty:
        st.empty()
    else:
        if "Month" not in df.columns:
            st.error("Unexpected schema: expected a `Month` column.")
        else:
            value_cols = [c for c in df.columns if c != "Month"]
            if not value_cols:
                st.error("No model columns found (expected at least 1 column besides `Month`).")
            else:
                long_df = df.melt(id_vars=["Month"], value_vars=value_cols, var_name="Model", value_name="Forecast")
                long_df = long_df.dropna(subset=["Month"])
                fig = px.line(long_df, x="Month", y="Forecast", color="Model", markers=True)
                fig.update_layout(yaxis_title=None, xaxis_title=None, legend_title_text=None)
                st.plotly_chart(fig, use_container_width=True)

                if show_raw:
                    st.dataframe(df, use_container_width=True)
                    download_df(df, "Download future forecasts CSV", "future_forecasts_all_models.csv")

with tab_scenarios:
    st.subheader("Scenario forecasts")

    df = load_df(PATHS.scenario_forecasts)
    if df is None or df.empty:
        st.empty()
    else:
        if "Month" not in df.columns:
            st.error("Unexpected schema: expected a `Month` column.")
        else:
            scenario_cols = [c for c in df.columns if c != "Month"]
            if not scenario_cols:
                st.error("No scenario columns found (expected at least 1 column besides `Month`).")
            else:
                selected = st.multiselect("Scenarios", options=scenario_cols, default=scenario_cols)
                if not selected:
                    st.info("Select at least one scenario to plot.")
                else:
                    long_df = df.melt(id_vars=["Month"], value_vars=selected, var_name="Scenario", value_name="Forecast")
                    long_df = long_df.dropna(subset=["Month"])
                    fig = px.line(long_df, x="Month", y="Forecast", color="Scenario", markers=True)
                    fig.update_layout(yaxis_title=None, xaxis_title=None, legend_title_text=None)
                    st.plotly_chart(fig, use_container_width=True)

                if show_raw:
                    st.dataframe(df, use_container_width=True)
                    download_df(df, "Download scenario forecasts CSV", "scenario_forecasts.csv")

with tab_monte:
    st.subheader("Monte Carlo band")

    df = load_df(PATHS.monte_carlo_band)
    if df is None or df.empty:
        st.empty()
    else:
        required = {"Month", "P05", "P50", "P95"}
        if not required.issubset(df.columns):
            st.error("Unexpected schema: expected columns `Month, P05, P50, P95`.")
        else:
            df = df.dropna(subset=["Month"]).sort_values("Month")
            fig = go.Figure()
            fig.add_trace(
                go.Scatter(
                    x=df["Month"],
                    y=df["P95"],
                    mode="lines",
                    line=dict(width=0),
                    showlegend=False,
                    hoverinfo="skip",
                )
            )
            fig.add_trace(
                go.Scatter(
                    x=df["Month"],
                    y=df["P05"],
                    mode="lines",
                    fill="tonexty",
                    fillcolor="rgba(209,45,45,0.20)",
                    line=dict(width=0),
                    name="5th to 95th percentile",
                )
            )
            fig.add_trace(
                go.Scatter(
                    x=df["Month"],
                    y=df["P50"],
                    mode="lines+markers",
                    line=dict(color="rgba(209,45,45,1)", width=2),
                    name="Median",
                )
            )
            fig.update_layout(yaxis_title=None, xaxis_title=None)
            st.plotly_chart(fig, use_container_width=True)

            if show_raw:
                st.dataframe(df, use_container_width=True)
                download_df(df, "Download Monte Carlo CSV", "monte_carlo_band.csv")
