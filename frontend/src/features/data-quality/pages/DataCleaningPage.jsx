import { useEffect, useState } from "react";

import { getDatasets } from "../../../api/datasetApi";

import MissingValuePanel from "../components/MissingValuePanel";
import DuplicatePanel from "../components/DuplicatePanel";


// ======================================================
// DATA CLEANING DASHBOARD
// ======================================================

export default function DataCleaningPage() {

  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [datasets, setDatasets] = useState([]);

  const [selectedDatasetId, setSelectedDatasetId] = useState("");

  const [activeTab, setActiveTab] = useState("missing");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // --------------------------------------------------
  // LOAD DATASETS
  // --------------------------------------------------

  useEffect(() => {

    let active = true;

    const loadDatasets = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await getDatasets();

        if (!active) return;

        const datasetList = Array.isArray(response)
          ? response
          : response?.datasets ??
            response?.data?.datasets ??
            response?.data ??
            [];

        if (!Array.isArray(datasetList)) {
          throw new Error("Invalid dataset response from server.");
        }

        setDatasets(datasetList);

        if (datasetList.length > 0) {

          setSelectedDatasetId(
            String(datasetList[0].id)
          );

        }

      } catch (err) {

        if (active) {

          setError(
            err.response?.data?.detail ||
            err.message ||
            "Unable to load datasets."
          );

        }

      } finally {

        if (active) {
          setLoading(false);
        }

      }

    };

    loadDatasets();

    return () => {
      active = false;
    };

  }, []);


  // --------------------------------------------------
  // SELECTED DATASET
  // --------------------------------------------------

  const selectedDataset = datasets.find(
    (dataset) =>
      String(dataset.id) === String(selectedDatasetId)
  );


  // --------------------------------------------------
  // TAB CONFIGURATION
  // --------------------------------------------------

  const tabs = [
    {
      id: "missing",
      label: "Missing Values",
      icon: "🧹",
      description: "Handle missing and null values.",
    },
    {
      id: "duplicates",
      label: "Duplicate Removal",
      icon: "📋",
      description: "Detect and remove duplicate records.",
    },
  ];


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (

    <div className="space-y-6 p-4 md:p-6">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <span className="rounded-lg bg-blue-500/10 p-2 text-xl">
              🧹
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Data Copilot / Data Preparation
            </span>

          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-3xl">
            Data Cleaning Workspace
          </h1>

          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Clean, transform and prepare your datasets
            before performing business analysis.
          </p>

        </div>


        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">

          <p className="text-xs text-blue-400">
            Cleaning Engine
          </p>

          <p className="mt-1 font-semibold text-[var(--color-text)]">
            Phase 6.1 – 6.2
          </p>

          <span className="text-xs text-green-400">
            ● Preview Enabled
          </span>

        </div>

      </div>


      {/* ==========================================
          DATASET SELECTION
      ========================================== */}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Select Dataset
            </h2>

            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Choose an uploaded dataset to start cleaning.
            </p>

          </div>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            {datasets.length} Datasets Available
          </span>

        </div>


        {loading ? (

          <div className="py-6 text-center text-sm text-[var(--color-muted)]">
            Loading datasets...
          </div>

        ) : error ? (

          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {typeof error === "string"
              ? error
              : JSON.stringify(error)}
          </div>

        ) : datasets.length === 0 ? (

          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">

            <div className="mb-3 text-3xl">
              📂
            </div>

            <h3 className="font-semibold text-[var(--color-text)]">
              No Datasets Found
            </h3>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Upload a dataset from the Dataset Management
              page before starting data cleaning.
            </p>

          </div>

        ) : (

          <div className="grid gap-4 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                Available Datasets
              </label>

              <select
                value={selectedDatasetId}
                onChange={(event) =>
                  setSelectedDatasetId(event.target.value)
                }
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-blue-500"
              >

                {datasets.map((dataset) => (

                  <option
                    key={dataset.id}
                    value={dataset.id}
                  >
                    {dataset.name || dataset.original_filename}
                    {" "} (ID: {dataset.id})
                  </option>

                ))}

              </select>

            </div>


            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">

              <p className="text-xs text-[var(--color-muted)]">
                Selected Dataset
              </p>

              <p className="mt-2 font-semibold text-[var(--color-text)]">
                {selectedDataset?.name ||
                  selectedDataset?.original_filename ||
                  "No dataset selected"}
              </p>

              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Dataset ID: {selectedDatasetId || "-"}
              </p>

            </div>

          </div>

        )}

      </div>


      {/* ==========================================
          CLEANING NAVIGATION TABS
      ========================================== */}

      {selectedDatasetId && (

        <div className="grid gap-4 md:grid-cols-2">

          {tabs.map((tab) => (

            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl border p-5 text-left transition ${
                activeTab === tab.id
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-400/50"
              }`}
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <span className="text-2xl">
                    {tab.icon}
                  </span>

                  <div>

                    <h3 className="font-semibold text-[var(--color-text)]">
                      {tab.label}
                    </h3>

                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {tab.description}
                    </p>

                  </div>

                </div>

                {activeTab === tab.id && (

                  <span className="text-sm font-semibold text-blue-400">
                    ACTIVE
                  </span>

                )}

              </div>

            </button>

          ))}

        </div>

      )}


      {/* ==========================================
          ACTIVE CLEANING COMPONENT
      ========================================== */}

      {!loading && !error && selectedDatasetId && (

        <div>

          {activeTab === "missing" && (

            <MissingValuePanel
              key={`missing-${selectedDatasetId}`}
              datasetId={Number(selectedDatasetId)}
            />

          )}

          {activeTab === "duplicates" && (

            <DuplicatePanel
              key={`duplicates-${selectedDatasetId}`}
              datasetId={Number(selectedDatasetId)}
            />

          )}

        </div>

      )}


      {/* ==========================================
          WORKSPACE FOOTER
      ========================================== */}

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

        <div className="flex items-start gap-3">

          <span className="text-xl">
            💡
          </span>

          <div>

            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Data Protection
            </h3>

            <p className="mt-1 text-xs leading-6 text-[var(--color-muted)]">
              Cleaning operations currently generate
              before-and-after previews only. Your original
              uploaded dataset is not modified.
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}