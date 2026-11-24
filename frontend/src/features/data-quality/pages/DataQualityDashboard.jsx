import React, { useCallback, useEffect, useState } from "react";
import {
  BrainCircuit,
  RefreshCw,
  Database,
  Table2,
  Layers,
  Hash,
  Gauge,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Upload,
} from "lucide-react";

// API
import { getDatasets } from "../../../api/datasetApi";

// Services
import {
  fetchQualityDashboard,
  fetchDatasetProfile,
  fetchMissingValues,
  fetchDataTypeValidation,
  fetchOutlierAnalysis,
} from "../services/dataQualityService";

// Components
import QualityScoreCard from "../components/QualityScoreCard";
import QualityMetricCards from "../components/QualityMetricCards";
import IssueDistributionChart from "../components/IssueDistributionChart";
import DataTypeDistribution from "../components/DataTypeDistribution";
import ColumnQualityTable from "../components/ColumnQualityTable";
import OutlierPanel from "../components/OutlierPanel";
import QualityRecommendations from "../components/QualityRecommendations";

/* =========================================
   THEME CSS (embedded, no separate .css file)
   Data Copilot look: dark navy, cyan glow,
   glassmorphism.

   The ".dq-skin" rules at the bottom re-color
   your existing child components (cards, table,
   charts wrappers) that use light Tailwind
   classes like bg-white and text-gray-800.
========================================= */

const STYLES = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.dq-page {
  --dq-cyan: #19d3ff;
  --dq-cyan-strong: #00c8ff;
  --dq-teal: #19e6c1;
  --dq-blue: #0ab4ff;
  --dq-navy: #04152b;
  --dq-muted: #9fb3c8;
  --dq-glass: rgba(8, 25, 45, 0.65);
  --dq-border: rgba(0, 212, 255, 0.28);

  position: relative;
  isolation: isolate;
  min-height: 100vh;
  padding: 28px;
  color: #fff;
  font-family: 'Poppins', 'Inter', system-ui, sans-serif;
  background:
    radial-gradient(ellipse 40% 35% at 0% 0%, rgba(0, 200, 255, 0.2), transparent 70%),
    radial-gradient(ellipse 40% 40% at 100% 20%, rgba(25, 230, 193, 0.14), transparent 70%),
    radial-gradient(ellipse 60% 25% at 50% 100%, rgba(0, 200, 255, 0.18), transparent 70%),
    linear-gradient(180deg, #04152b 0%, #020a1a 100%);
}
.dq-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(25, 211, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(25, 211, 255, 0.045) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at 50% 15%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 15%, #000 20%, transparent 75%);
}

/* Header */
.dq-gradient-text {
  background: linear-gradient(90deg, var(--dq-cyan-strong), var(--dq-teal));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.dq-underline {
  width: 56px;
  height: 3px;
  border-radius: 3px;
  background: var(--dq-cyan);
  box-shadow: 0 0 12px var(--dq-cyan), 0 0 24px rgba(25, 211, 255, 0.6);
}
.dq-glow-icon {
  color: var(--dq-cyan);
  filter: drop-shadow(0 0 8px rgba(25, 211, 255, 0.85));
}

/* Glass surfaces */
.dq-glass {
  position: relative;
  background: var(--dq-glass);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  border: 1px solid var(--dq-border);
  border-radius: 20px;
  box-shadow: 0 0 28px rgba(0, 212, 255, 0.16), inset 0 0 24px rgba(0, 212, 255, 0.06);
}
.dq-glass-hover { transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s; }
.dq-glass-hover:hover {
  transform: translateY(-4px);
  border-color: rgba(25, 211, 255, 0.7);
  box-shadow: 0 0 34px rgba(0, 212, 255, 0.32), inset 0 0 24px rgba(0, 212, 255, 0.08);
}
.dq-glass-line::after {
  content: '';
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--dq-cyan), transparent);
  box-shadow: 0 0 12px var(--dq-cyan);
}
.dq-glass-error {
  border-color: rgba(255, 107, 107, 0.5);
  box-shadow: 0 0 26px rgba(255, 107, 107, 0.15), inset 0 0 20px rgba(255, 107, 107, 0.05);
}

/* Icon chips */
.dq-chip {
  display: inline-flex;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid;
}
.dq-chip-cyan { color: #19d3ff; background: rgba(25, 211, 255, 0.1); border-color: rgba(25, 211, 255, 0.35); box-shadow: 0 0 16px rgba(25, 211, 255, 0.2); }
.dq-chip-blue { color: #5aa9ff; background: rgba(90, 169, 255, 0.1); border-color: rgba(90, 169, 255, 0.35); box-shadow: 0 0 16px rgba(90, 169, 255, 0.2); }
.dq-chip-teal { color: #19e6c1; background: rgba(25, 230, 193, 0.1); border-color: rgba(25, 230, 193, 0.35); box-shadow: 0 0 16px rgba(25, 230, 193, 0.2); }
.dq-chip-red { color: #ff6b6b; background: rgba(255, 107, 107, 0.1); border-color: rgba(255, 107, 107, 0.35); box-shadow: 0 0 16px rgba(255, 107, 107, 0.2); }

/* Buttons */
.dq-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, filter 0.2s;
}
.dq-btn:hover:not(:disabled) {
  border-color: var(--dq-cyan);
  box-shadow: 0 0 18px rgba(25, 211, 255, 0.35);
  transform: translateY(-2px);
}
.dq-btn-primary {
  color: var(--dq-navy);
  font-weight: 700;
  background: linear-gradient(90deg, var(--dq-blue), var(--dq-teal));
  border-color: transparent;
  box-shadow: 0 0 22px rgba(0, 212, 255, 0.45);
}
.dq-btn-primary:hover:not(:disabled) { filter: brightness(1.12); }
.dq-btn-danger { border-color: rgba(255, 107, 107, 0.5); color: #ff9a9a; }
.dq-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dq-btn:focus-visible,
.dq-select:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.dq-spin { animation: dq-spin 0.8s linear infinite; }

/* Select */
.dq-select {
  width: 100%;
  padding: 12px 16px;
  font: 400 14px 'Poppins', sans-serif;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  outline: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.dq-select:focus {
  border-color: var(--dq-cyan);
  box-shadow: 0 0 0 3px rgba(25, 211, 255, 0.18), 0 0 16px rgba(25, 211, 255, 0.25);
}
.dq-select option { background: #04152b; color: #fff; }

/* KPI accent line */
.dq-kpi-line {
  height: 3px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--dq-cyan), transparent);
  box-shadow: 0 0 10px rgba(25, 211, 255, 0.5);
  opacity: 0.8;
}

/* Loader */
.dq-loader {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(25, 211, 255, 0.2);
  border-top-color: var(--dq-cyan);
  box-shadow: 0 0 18px rgba(25, 211, 255, 0.4);
  animation: dq-spin 0.9s linear infinite;
}

/* Entry animation */
.dq-rise { animation: dq-rise 0.5s ease both; }
@keyframes dq-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dq-spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .dq-page { padding: 16px; }
}

/* ==========================================================
   SKIN BRIDGE
   Re-colors child components that still use light Tailwind
   classes, so they match the dark theme with no code changes.
========================================================== */
.dq-skin .bg-white,
.dq-skin .bg-gray-50,
.dq-skin .bg-gray-100 {
  background-color: rgba(8, 25, 45, 0.65) !important;
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}
.dq-skin .bg-white.rounded-xl,
.dq-skin .bg-white.rounded-2xl,
.dq-skin .bg-white.rounded-lg {
  border-color: rgba(0, 212, 255, 0.28) !important;
  box-shadow: 0 0 28px rgba(0, 212, 255, 0.16), inset 0 0 24px rgba(0, 212, 255, 0.06);
}
.dq-skin .text-gray-900,
.dq-skin .text-gray-800,
.dq-skin .text-gray-700 { color: #ffffff !important; }
.dq-skin .text-gray-600,
.dq-skin .text-gray-500,
.dq-skin .text-gray-400 { color: #9fb3c8 !important; }
.dq-skin .border-gray-100,
.dq-skin .border-gray-200,
.dq-skin .border-gray-300 { border-color: rgba(0, 212, 255, 0.22) !important; }
.dq-skin .divide-gray-100 > :not([hidden]) ~ :not([hidden]),
.dq-skin .divide-gray-200 > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255, 255, 255, 0.08) !important; }
.dq-skin .hover\:bg-gray-50:hover,
.dq-skin .hover\:bg-gray-100:hover { background-color: rgba(25, 211, 255, 0.08) !important; }
.dq-skin thead,
.dq-skin thead tr,
.dq-skin thead th { background-color: rgba(25, 211, 255, 0.08) !important; color: #19d3ff !important; }
.dq-skin tbody tr { border-color: rgba(255, 255, 255, 0.08) !important; }
.dq-skin select,
.dq-skin input {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.15);
}
.dq-skin select option { background: #04152b; color: #fff; }
.dq-skin .recharts-text,
.dq-skin .recharts-legend-item-text { fill: #9fb3c8 !important; color: #9fb3c8 !important; }
.dq-skin .recharts-cartesian-grid line { stroke: rgba(255, 255, 255, 0.08); }

@media (prefers-reduced-motion: reduce) {
  .dq-page *,
  .dq-page *::before,
  .dq-page *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

// ==========================================
// HELPER: EXTRACT ARRAY FROM API RESPONSE
// ==========================================

const extractList = (response, possibleKeys = []) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  for (const key of possibleKeys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  return [];
};

const formatNumber = (value) =>
  typeof value === "number" ? value.toLocaleString() : value ?? 0;

// ==========================================
// MAIN DASHBOARD
// ==========================================

const DataQualityDashboard = () => {
  // Dataset states
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");

  // Analysis states
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [missingAnalysis, setMissingAnalysis] = useState(null);
  const [validationAnalysis, setValidationAnalysis] = useState(null);
  const [outlierAnalysis, setOutlierAnalysis] = useState(null);

  // Outlier method
  const [outlierMethod, setOutlierMethod] = useState("iqr");

  // Loading and error states
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // 1. FETCH UPLOADED DATASETS
  // ==========================================

  const loadDatasets = useCallback(async () => {
    try {
      setLoadingDatasets(true);
      setError("");

      const response = await getDatasets();

      const datasetList = extractList(response, [
        "datasets",
        "items",
        "data",
      ]);

      setDatasets(datasetList);

      if (datasetList.length > 0) {
        setSelectedDatasetId((currentId) => {
          const exists = datasetList.some(
            (dataset) => String(dataset.id) === String(currentId)
          );

          return exists
            ? currentId
            : String(datasetList[0].id);
        });
      } else {
        setSelectedDatasetId("");
      }
    } catch (err) {
      console.error("Dataset loading error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load uploaded datasets."
      );
    } finally {
      setLoadingDatasets(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // ==========================================
  // 2. FETCH QUALITY ANALYSIS
  // ==========================================

  const loadQualityDashboard = useCallback(async () => {
    if (!selectedDatasetId) {
      return;
    }

    try {
      setLoadingDashboard(true);
      setError("");

      setDashboard(null);
      setProfile(null);
      setMissingAnalysis(null);
      setValidationAnalysis(null);
      setOutlierAnalysis(null);

      const results = await Promise.allSettled([
        fetchQualityDashboard(selectedDatasetId),
        fetchDatasetProfile(selectedDatasetId),
        fetchMissingValues(selectedDatasetId),
        fetchDataTypeValidation(selectedDatasetId),
        fetchOutlierAnalysis(selectedDatasetId, outlierMethod),
      ]);

      const [
        dashboardResult,
        profileResult,
        missingResult,
        validationResult,
        outlierResult,
      ] = results;

      // Dashboard API is mandatory
      if (dashboardResult.status === "rejected") {
        throw dashboardResult.reason;
      }

      setDashboard(dashboardResult.value);

      setProfile(
        profileResult.status === "fulfilled"
          ? profileResult.value
          : null
      );

      setMissingAnalysis(
        missingResult.status === "fulfilled"
          ? missingResult.value
          : null
      );

      setValidationAnalysis(
        validationResult.status === "fulfilled"
          ? validationResult.value
          : null
      );

      setOutlierAnalysis(
        outlierResult.status === "fulfilled"
          ? outlierResult.value
          : null
      );

      const failedDetails = results
        .slice(1)
        .filter((result) => result.status === "rejected");

      if (failedDetails.length > 0) {
        console.warn(
          `${failedDetails.length} detailed analysis request(s) failed.`
        );
      }
    } catch (err) {
      console.error("Quality dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load data quality analysis."
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, [selectedDatasetId, outlierMethod]);

  useEffect(() => {
    loadQualityDashboard();
  }, [loadQualityDashboard]);

  // ==========================================
  // 3. EXTRACT DASHBOARD DATA
  // ==========================================

  const data = dashboard?.dashboard || {};

  const overview = data.overview || {};

  const scores = data.quality_scores || {};

  const issues = {
    missing_values:
      data.missing_values?.total_missing_values ?? 0,

    duplicate_rows:
      data.duplicates?.duplicate_rows ?? 0,

    invalid_values:
      data.validation?.total_invalid_values ?? 0,

    outliers:
      data.outliers?.total_outliers ?? 0,
  };

  const typeDistribution =
    data.data_type_distribution || {};

  const score = Number(overview.quality_score) || 0;

  const grade = overview.quality_grade || "Unknown";

  // ==========================================
  // 4. EXTRACT COLUMN-WISE ANALYSIS
  // ==========================================

  const profileColumns = extractList(
    profile?.profile || profile?.profiling || profile,
    ["columns", "column_profiles"]
  );

  const missingColumns = extractList(
    missingAnalysis?.missing_values ||
      missingAnalysis?.missing_analysis ||
      missingAnalysis,
    ["columns", "column_analysis"]
  );

  const validationColumns = extractList(
    validationAnalysis?.validation ||
      validationAnalysis,
    ["columns"]
  );

  const outlierColumns = extractList(
    outlierAnalysis?.outlier_analysis ||
      outlierAnalysis,
    ["columns"]
  );

  // Create lookup maps
  const profileMap = new Map(
    profileColumns.map((item) => [
      item.column_name,
      item,
    ])
  );

  const missingMap = new Map(
    missingColumns.map((item) => [
      item.column_name,
      item,
    ])
  );

  const validationMap = new Map(
    validationColumns.map((item) => [
      item.column_name,
      item,
    ])
  );

  const outlierMap = new Map(
    outlierColumns.map((item) => [
      item.column_name,
      item,
    ])
  );

  // Collect all column names
  const columnNames = [
    ...new Set([
      ...profileMap.keys(),
      ...missingMap.keys(),
      ...validationMap.keys(),
      ...outlierMap.keys(),
    ]),
  ];

  // Merge column analysis
  const columnAnalysis = columnNames.map((name) => {
    const p = profileMap.get(name) || {};
    const m = missingMap.get(name) || {};
    const v = validationMap.get(name) || {};
    const o = outlierMap.get(name) || {};

    return {
      column_name: name,

      detected_type:
        v.detected_type ||
        p.detected_type ||
        p.data_type ||
        "Unknown",

      total_values:
        v.total_values ??
        p.total_values ??
        p.total_count ??
        0,

      missing_values:
        m.missing_values ??
        m.missing_count ??
        v.missing_values ??
        0,

      invalid_values:
        v.invalid_values ?? 0,

      outlier_count:
        o.outlier_count ?? 0,
    };
  });

  // ==========================================
  // 5. LOADING DATASETS
  // ==========================================

  if (loadingDatasets) {
    return (
      <div className="dq-page flex items-center justify-center">
        <style>{STYLES}</style>

        <div className="flex flex-col items-center gap-5">
          <div className="dq-loader" />
          <p className="text-sm text-[var(--dq-muted)]">
            Loading uploaded datasets...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. DATASET LOADING ERROR
  // ==========================================

  if (error && datasets.length === 0) {
    return (
      <div className="dq-page dq-skin">
        <style>{STYLES}</style>

        <div className="dq-glass dq-glass-error mx-auto mt-10 max-w-xl p-6">
          <div className="flex items-start gap-4">
            <div className="dq-chip dq-chip-red">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h2 className="font-semibold">Something went wrong</h2>
              <p className="mt-1 text-sm text-[#ff9a9a]">{error}</p>

              <button
                type="button"
                onClick={loadDatasets}
                className="dq-btn dq-btn-danger mt-4"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 7. NO DATASETS AVAILABLE
  // ==========================================

  if (datasets.length === 0) {
    return (
      <div className="dq-page dq-skin">
        <style>{STYLES}</style>

        <div className="dq-glass dq-glass-line mx-auto mt-10 flex max-w-xl flex-col items-center px-8 py-14 text-center">
          <div className="dq-chip dq-chip-cyan mb-5">
            <Upload size={26} />
          </div>

          <h2 className="text-xl font-semibold">
            No Datasets Available
          </h2>

          <p className="mt-2 text-sm text-[var(--dq-muted)]">
            Upload a dataset to start data quality analysis.
          </p>
        </div>
      </div>
    );
  }

  const selectedDataset = datasets.find(
    (dataset) =>
      String(dataset.id) === String(selectedDatasetId)
  );

  const overviewCards = [
    {
      label: "Total Rows",
      value: overview.total_rows,
      icon: Table2,
      chip: "dq-chip-cyan",
    },
    {
      label: "Total Columns",
      value: overview.total_columns,
      icon: Layers,
      chip: "dq-chip-blue",
    },
    {
      label: "Total Cells",
      value: overview.total_cells,
      icon: Hash,
      chip: "dq-chip-teal",
    },
  ];

  // ==========================================
  // 8. MAIN DASHBOARD UI
  // ==========================================

  return (
    <div className="dq-page dq-skin">
      <style>{STYLES}</style>

      <div className="mx-auto max-w-[1400px]">

        {/* HEADER */}

        <section className="dq-rise mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">
            <BrainCircuit size={52} strokeWidth={1.5} className="dq-glow-icon shrink-0" />

            <div>
              <div className="mb-1 flex items-center gap-2">
                <Gauge size={15} className="text-[var(--dq-cyan)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--dq-cyan)]">
                  Data Quality
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Quality <span className="dq-gradient-text">Dashboard</span>
              </h1>

              <p className="mt-1 text-sm text-[var(--dq-muted)]">
                Monitor, analyze and improve your dataset quality.
              </p>

              <div className="dq-underline mt-3" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDatasets}
              disabled={loadingDatasets}
              className="dq-btn"
            >
              <Database size={14} />
              Refresh Datasets
            </button>

            <button
              type="button"
              onClick={loadQualityDashboard}
              disabled={loadingDashboard || !selectedDatasetId}
              className="dq-btn dq-btn-primary"
            >
              <RefreshCw size={14} className={loadingDashboard ? "dq-spin" : ""} />
              {loadingDashboard
                ? "Refreshing..."
                : "Refresh Analysis"}
            </button>
          </div>

        </section>

        {/* DATASET SELECTOR */}

        <section className="dq-glass dq-glass-line dq-rise mb-8 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">

            <div className="flex-1">
              <label
                htmlFor="dq-dataset"
                className="mb-2 block text-sm font-semibold"
              >
                Select Dataset
              </label>

              <select
                id="dq-dataset"
                value={selectedDatasetId}
                onChange={(event) =>
                  setSelectedDatasetId(event.target.value)
                }
                className="dq-select"
              >
                {datasets.map((dataset) => (
                  <option
                    key={dataset.id}
                    value={dataset.id}
                  >
                    {dataset.name || dataset.filename}
                  </option>
                ))}
              </select>
            </div>

            {selectedDataset && (
              <div className="text-sm text-[var(--dq-muted)]">
                <p>
                  Dataset ID:{" "}
                  <span className="font-semibold text-white">
                    {selectedDataset.id}
                  </span>
                </p>

                <p className="mt-1">
                  File: {selectedDataset.filename || "N/A"}
                </p>
              </div>
            )}

          </div>
        </section>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="dq-glass dq-glass-error mb-6 flex items-center gap-3 p-4 text-sm text-[#ff9a9a]"
          >
            <ShieldAlert size={20} className="shrink-0 text-[#ff6b6b]" />
            {error}
          </div>
        )}

        {/* DASHBOARD LOADING */}

        {loadingDashboard ? (
          <div className="dq-glass flex flex-col items-center gap-5 px-6 py-16 text-center">
            <div className="dq-loader" />
            <p className="text-sm text-[var(--dq-muted)]">
              Analyzing dataset quality...
            </p>
          </div>
        ) : dashboard ? (
          <>

            {/* OVERVIEW */}

            <section className="dq-rise mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {overviewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div key={card.label} className="dq-glass dq-glass-hover p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--dq-muted)]">
                        {card.label}
                      </p>

                      <div className={`dq-chip ${card.chip}`}>
                        <Icon size={20} />
                      </div>
                    </div>

                    <h2 className="mt-2 text-3xl font-bold">
                      {formatNumber(card.value)}
                    </h2>

                    <div className="dq-kpi-line mt-4" />
                  </div>
                );
              })}
            </section>

            {/* QUALITY SCORE + METRICS */}

            <section className="dq-rise mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

              <QualityScoreCard
                score={score}
                grade={grade}
              />

              <div className="xl:col-span-2">
                <QualityMetricCards
                  scores={scores}
                />
              </div>

            </section>

            {/* ISSUE + DATA TYPE DISTRIBUTION */}

            <section className="dq-rise mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

              <IssueDistributionChart
                issues={issues}
              />

              <DataTypeDistribution
                distribution={typeDistribution}
              />

            </section>

            {/* OUTLIER ANALYSIS */}

            <section className="dq-glass dq-glass-line dq-rise mb-8 p-5">

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">
                  <div className="dq-chip dq-chip-cyan">
                    <Sparkles size={18} />
                  </div>

                  <h2 className="text-lg font-semibold">
                    Outlier Detection
                  </h2>
                </div>

                <select
                  aria-label="Outlier detection method"
                  value={outlierMethod}
                  onChange={(event) =>
                    setOutlierMethod(event.target.value)
                  }
                  className="dq-select sm:!w-auto"
                >
                  <option value="iqr">
                    IQR Method
                  </option>

                  <option value="zscore">
                    Z-Score Method
                  </option>
                </select>

              </div>

              <OutlierPanel
                outlierAnalysis={
                  outlierAnalysis?.outlier_analysis ||
                  outlierAnalysis ||
                  {}
                }
              />

            </section>

            {/* COLUMN QUALITY ANALYSIS */}

            <section className="dq-rise mb-8">
              <ColumnQualityTable
                columns={columnAnalysis}
              />
            </section>

            {/* QUALITY RECOMMENDATIONS */}

            <section className="dq-rise mb-8">
              <QualityRecommendations
                issues={issues}
                scores={scores}
              />
            </section>

            {/* FOOTER */}

            <section className="dq-glass dq-rise p-5">

              <h3 className="font-semibold">
                Dataset Analysis Summary
              </h3>

              <p className="mt-2 text-sm text-[var(--dq-muted)]">
                Analysis is based on the selected uploaded dataset.
                Statistical outliers should be reviewed before
                making data correction decisions.
              </p>

            </section>

          </>
        ) : null}

      </div>
    </div>
  );
};

export default DataQualityDashboard;