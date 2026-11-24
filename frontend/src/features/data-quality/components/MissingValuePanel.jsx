import { useEffect, useMemo, useState } from "react";

import {
  previewMissingValueCleaning,
  applyMissingValueCleaning,
} from "../../../api/dataCleaningApi";

import {
  getDatasetPreview,
} from "../../../api/datasetApi";

// ======================================================
// MISSING VALUE TREATMENT PANEL
// ======================================================

export default function MissingValuePanel({ datasetId }) {

  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [operation, setOperation] = useState("fill_mean");
  const [constantValue, setConstantValue] = useState("Unknown");

  const [previewLimit, setPreviewLimit] = useState(20);

  const [loadingColumns, setLoadingColumns] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [appliedResult, setAppliedResult] = useState(null);

  // --------------------------------------------------
  // CLEANING OPERATIONS
  // --------------------------------------------------

  const operations = [
    {
      value: "fill_mean",
      label: "Mean Imputation",
      description: "Replace missing numeric values with the column average.",
    },
    {
      value: "fill_median",
      label: "Median Imputation",
      description: "Replace missing numeric values with the column median.",
    },
    {
      value: "fill_mode",
      label: "Mode Imputation",
      description: "Replace missing values with the most frequent value.",
    },
    {
      value: "fill_constant",
      label: "Constant Value",
      description: "Replace missing values with a custom value.",
    },
    {
      value: "forward_fill",
      label: "Forward Fill",
      description: "Fill missing values using the previous available value.",
    },
    {
      value: "backward_fill",
      label: "Backward Fill",
      description: "Fill missing values using the next available value.",
    },
    {
      value: "drop_rows",
      label: "Drop Missing Rows",
      description: "Remove rows containing missing values in selected columns.",
    },
    {
      value: "drop_columns",
      label: "Drop Missing Columns",
      description: "Remove selected columns containing missing values.",
    },
  ];

  const requiresConstant = operation === "fill_constant";

  // --------------------------------------------------
  // LOAD DATASET COLUMNS
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadColumns = async () => {
      if (!datasetId) {
        setColumns([]);
        setSelectedColumns([]);
        setResult(null);
        setAppliedResult(null);
        return;
      }

      try {
        setLoadingColumns(true);
        setError("");
        setResult(null);
        setAppliedResult(null);

        const response = await getDatasetPreview(
          datasetId,
          {
            limit: 1,
            offset: 0,
          }
        );

        if (!active) return;

        const records =
          response?.preview?.records ??
          response?.preview?.data ??
          response?.records ??
          response?.data?.records ??
          response?.data ??
          [];

        let availableColumns = [];

        if (Array.isArray(response?.columns)) {
          availableColumns = response.columns
            .map((column) =>
              typeof column === "string" ? column : column.name
            )
            .filter(Boolean);

        } else if (Array.isArray(response?.preview?.columns)) {
          availableColumns = response.preview.columns
            .map((column) =>
              typeof column === "string" ? column : column.name
            )
            .filter(Boolean);

        } else if (Array.isArray(records) && records.length > 0) {
          availableColumns = Object.keys(records[0]);
        }

        setColumns(availableColumns);
        setSelectedColumns(availableColumns);

        if (availableColumns.length === 0) {
          setError("No columns were found in this dataset preview.");
        }

      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
            "Unable to load dataset columns."
          );
        }

      } finally {
        if (active) {
          setLoadingColumns(false);
        }
      }
    };

    loadColumns();

    return () => {
      active = false;
    };

  }, [datasetId]);

  // --------------------------------------------------
  // BUILD CLEANING REQUEST
  // --------------------------------------------------

  const buildCleaningRequest = () => {
    const request = {
      operation,
      columns: selectedColumns,
      preview_limit: Number(previewLimit),
    };

    if (requiresConstant) {
      request.value = constantValue;
    }

    return request;
  };

  // --------------------------------------------------
  // SELECT / DESELECT COLUMNS
  // --------------------------------------------------

  const handleColumnChange = (column) => {
    setSelectedColumns((previous) => {
      if (previous.includes(column)) {
        return previous.filter((item) => item !== column);
      }

      return [...previous, column];
    });

    setResult(null);
    setAppliedResult(null);
    setError("");
  };

  const selectAllColumns = () => {
    setSelectedColumns(columns);
    setResult(null);
    setAppliedResult(null);
  };

  const clearAllColumns = () => {
    setSelectedColumns([]);
    setResult(null);
    setAppliedResult(null);
  };

  // --------------------------------------------------
  // VALIDATE CONFIGURATION
  // --------------------------------------------------

  const validateConfiguration = () => {
    if (!datasetId) {
      setError("Please select a dataset first.");
      return false;
    }

    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      return false;
    }

    if (requiresConstant && constantValue.trim() === "") {
      setError("Please enter a constant value.");
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // PREVIEW CLEANING
  // --------------------------------------------------

  const handlePreview = async () => {
    if (!validateConfiguration()) return;

    try {
      setLoadingPreview(true);
      setError("");
      setResult(null);
      setAppliedResult(null);

      const response = await previewMissingValueCleaning(
        datasetId,
        buildCleaningRequest()
      );

      setResult(response);

    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message || "Cleaning preview failed."
      );

    } finally {
      setLoadingPreview(false);
    }
  };

  // --------------------------------------------------
  // APPLY CLEANING AND SAVE VERSION
  // --------------------------------------------------

  const handleApplyCleaning = async () => {
    if (!validateConfiguration()) return;

    if (!result) {
      setError("Please generate a cleaning preview before applying.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to apply this cleaning operation?\n\n" +
      "The cleaned dataset will be saved as a new version. " +
      "Your previous version will remain available in Version History."
    );

    if (!confirmed) return;

    try {
      setLoadingApply(true);
      setError("");

      const response = await applyMissingValueCleaning(
        datasetId,
        buildCleaningRequest()
      );

      setAppliedResult(response);

    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message || "Unable to apply cleaning operation."
      );

    } finally {
      setLoadingApply(false);
    }
  };

  // --------------------------------------------------
  // FORMAT STATISTICS
  // --------------------------------------------------

  const statistics = useMemo(() => {
    if (!result) return [];

    return [
      {
        label: "Missing Before",
        value: result.before?.total_missing_values ?? 0,
      },
      {
        label: "Missing After",
        value: result.after?.total_missing_values ?? 0,
      },
      {
        label: "Values Filled",
        value: result.changes?.filled_values ?? 0,
      },
      {
        label: "Rows Removed",
        value: result.changes?.removed_rows ?? 0,
      },
    ];
  }, [result]);

  // --------------------------------------------------
  // PREVIEW TABLE
  // --------------------------------------------------

  const PreviewTable = ({ title, records }) => {
    const tableColumns = records?.length
      ? Object.keys(records[0])
      : [];

    return (
      <div className="overflow-hidden rounded-xl border border-slate-700">

        <div className="border-b border-slate-700 bg-slate-800 px-4 py-3">
          <h3 className="font-semibold text-white">
            {title}
          </h3>

          <p className="text-xs text-slate-400">
            {records?.length || 0} preview records
          </p>
        </div>

        <div className="max-h-80 overflow-auto">
          {!records?.length ? (
            <p className="p-5 text-center text-sm text-slate-400">
              No records available.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr>
                  {tableColumns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-slate-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    {tableColumns.map((column) => (
                      <td
                        key={column}
                        className="whitespace-nowrap px-4 py-3 text-slate-300"
                      >
                        {record[column] === null ||
                        record[column] === undefined ? (
                          <span className="text-red-400">NULL</span>
                        ) : (
                          String(record[column])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h2 className="text-2xl font-bold text-white">
          Missing Value Treatment
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Detect and handle missing values in your dataset.
          Preview changes before saving.
        </p>
      </div>

      {/* CONFIGURATION CARD */}

      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">
            Cleaning Configuration
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Select an operation and the columns to process.
          </p>
        </div>

        {/* DATASET INFORMATION */}

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400">
            Selected Dataset ID
          </p>

          <p className="mt-1 font-semibold text-white">
            {datasetId || "No dataset selected"}
          </p>
        </div>

        {/* OPERATION */}

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Cleaning Operation
          </label>

          <select
            value={operation}
            onChange={(event) => {
              setOperation(event.target.value);
              setResult(null);
              setAppliedResult(null);
              setError("");
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            {operations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-400">
            {
              operations.find((item) => item.value === operation)
                ?.description
            }
          </p>
        </div>

        {/* CONSTANT VALUE */}

        {requiresConstant && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Constant Value
            </label>

            <input
              type="text"
              value={constantValue}
              onChange={(event) => {
                setConstantValue(event.target.value);
                setResult(null);
                setAppliedResult(null);
              }}
              placeholder="Enter replacement value"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* COLUMN SELECTION */}

        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">
              Select Columns
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={selectAllColumns}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearAllColumns}
                className="text-xs font-medium text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingColumns ? (
            <p className="text-sm text-slate-400">
              Loading dataset columns...
            </p>
          ) : columns.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-4 text-sm text-slate-400">
              No dataset columns available.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {columns.map((column) => (
                <label
                  key={column}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3 hover:border-blue-500"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnChange(column)}
                    className="h-4 w-4 accent-blue-500"
                  />

                  <span className="text-sm text-slate-200">
                    {column}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* PREVIEW LIMIT */}

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Preview Limit
          </label>

          <select
            value={previewLimit}
            onChange={(event) => {
              setPreviewLimit(Number(event.target.value));
              setResult(null);
              setAppliedResult(null);
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            <option value={10}>10 Records</option>
            <option value={20}>20 Records</option>
            <option value={50}>50 Records</option>
            <option value={100}>100 Records</option>
          </select>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {typeof error === "string"
              ? error
              : JSON.stringify(error)}
          </div>
        )}

        {/* PREVIEW BUTTON */}

        <button
          type="button"
          onClick={handlePreview}
          disabled={
            loadingPreview ||
            loadingApply ||
            loadingColumns ||
            !datasetId ||
            columns.length === 0
          }
          className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingPreview
            ? "Generating Preview..."
            : "Preview Cleaning Changes"}
        </button>
      </div>

      {/* RESULT SECTION */}

      {result && (
        <div className="space-y-6">

          <div>
            <h3 className="text-xl font-bold text-white">
              Cleaning Results
            </h3>

            <p className="mt-1 text-sm text-green-400">
              Preview generated successfully.
            </p>
          </div>

          {/* STATISTICS */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-700 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-400">
                  {item.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* BEFORE / AFTER TABLES */}

          <div className="grid gap-5 xl:grid-cols-2">
            <PreviewTable
              title="Original Dataset"
              records={result.preview?.original_records}
            />

            <PreviewTable
              title="Cleaned Dataset Preview"
              records={result.preview?.cleaned_records}
            />
          </div>

          {/* DETAILED SUMMARY */}

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="mb-4 font-semibold text-white">
              Cleaning Summary
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Operation</span>
                <span className="text-white">{result.operation}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Missing Values Before</span>
                <span className="text-white">
                  {result.before?.total_missing_values}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Missing Values After</span>
                <span className="text-white">
                  {result.after?.total_missing_values}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Values Filled</span>
                <span className="text-green-400">
                  {result.changes?.filled_values}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Rows Removed</span>
                <span className="text-white">
                  {result.changes?.removed_rows}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Columns Removed</span>
                <span className="text-white">
                  {result.changes?.removed_column_count}
                </span>
              </div>

            </div>
          </div>

          {/* APPLY STATUS */}

          {appliedResult ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5">

              <h3 className="font-semibold text-green-300">
                Cleaning Applied Successfully!
              </h3>

              <p className="mt-2 text-sm text-green-200">
                {appliedResult.message}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-green-200/70">
                    New Version
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">
                    v{appliedResult.version?.version_number ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-green-200/70">
                    Total Rows
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {appliedResult.version?.row_count ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-green-200/70">
                    Total Columns
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {appliedResult.version?.column_count ?? "—"}
                  </p>
                </div>

              </div>

              <p className="mt-4 text-sm text-green-200">
                Your new dataset version has been saved. Visit Dataset Version
                History to view the version and audit event.
              </p>

            </div>
          ) : (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
              This is a preview only. Your original dataset has not been modified.
              Click Apply Cleaning & Save Version to persist these changes.
            </div>
          )}

          {/* APPLY BUTTON */}

          {!appliedResult && (
            <button
              type="button"
              onClick={handleApplyCleaning}
              disabled={loadingApply || loadingPreview}
              className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingApply
                ? "Applying Cleaning & Saving Version..."
                : "Apply Cleaning & Save Version"}
            </button>
          )}

        </div>
      )}

    </div>
  );
}