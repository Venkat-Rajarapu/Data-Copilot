import { useEffect, useState } from "react";

import {
  previewDuplicateCleaning,
  applyDuplicateCleaning,
} from "../../../api/dataCleaningApi";

import {
  getDatasetPreview,
} from "../../../api/datasetApi";


export default function DuplicatePanel({ datasetId }) {

  // ======================================================
  // STATES
  // ======================================================

  const [columns, setColumns] = useState([]);

  const [selectedColumns, setSelectedColumns] = useState([]);

  const [detectionType, setDetectionType] = useState("full");

  const [keepStrategy, setKeepStrategy] = useState("first");

  const [previewLimit, setPreviewLimit] = useState(20);

  const [loadingColumns, setLoadingColumns] = useState(false);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const [loadingApply, setLoadingApply] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] = useState(null);

  const [appliedResult, setAppliedResult] = useState(null);


  // ======================================================
  // LOAD DATASET COLUMNS
  // ======================================================

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

          availableColumns = response.columns.map((column) =>
            typeof column === "string" ? column : column.name
          ).filter(Boolean);

        } else if (Array.isArray(response?.preview?.columns)) {

          availableColumns = response.preview.columns.map((column) =>
            typeof column === "string" ? column : column.name
          ).filter(Boolean);

        } else if (Array.isArray(records) && records.length > 0) {

          availableColumns = Object.keys(records[0]);

        }

        setColumns(availableColumns);
        setSelectedColumns(availableColumns);

        if (availableColumns.length === 0) {
          setError("No dataset columns were found.");
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


  // ======================================================
  // COLUMN SELECTION
  // ======================================================

  const handleColumnChange = (column) => {

    setSelectedColumns((previous) => {

      if (previous.includes(column)) {
        return previous.filter(
          (item) => item !== column
        );
      }

      return [...previous, column];

    });

    setResult(null);
    setAppliedResult(null);
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


  // ======================================================
  // BUILD REQUEST
  // ======================================================

  const buildCleaningRequest = () => {

    return {

      columns:
        detectionType === "full"
          ? null
          : selectedColumns,

      keep: keepStrategy,

      preview_limit: Number(previewLimit),

    };

  };


  // ======================================================
  // PREVIEW DUPLICATE REMOVAL
  // ======================================================

  const handlePreview = async () => {

    if (!datasetId) {
      setError("Please select a dataset first.");
      return;
    }

    if (
      detectionType === "selected" &&
      selectedColumns.length === 0
    ) {
      setError("Please select at least one column.");
      return;
    }

    try {

      setLoadingPreview(true);

      setError("");

      setResult(null);

      setAppliedResult(null);

      const response = await previewDuplicateCleaning(
        datasetId,
        buildCleaningRequest()
      );

      setResult(response);

    } catch (err) {

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message || "Duplicate removal preview failed."
      );

    } finally {

      setLoadingPreview(false);
    }
  };


  // ======================================================
  // APPLY DUPLICATE REMOVAL
  // ======================================================

  const handleApplyCleaning = async () => {

    if (!datasetId || !result) {
      setError("Please generate a duplicate removal preview first.");
      return;
    }

    if (
      detectionType === "selected" &&
      selectedColumns.length === 0
    ) {
      setError("Please select at least one column.");
      return;
    }

    const duplicateRows =
      result.before?.duplicate_rows ?? 0;

    if (duplicateRows === 0) {
      setError("No duplicate rows were detected. Nothing needs to be applied.");
      return;
    }

    const confirmed = window.confirm(
      `Apply duplicate removal to this dataset?\n\n` +
      `Duplicate rows detected: ${duplicateRows}\n` +
      `Removal strategy: ${keepStrategy}\n\n` +
      `A new dataset version will be created. Previous versions will be preserved.`
    );

    if (!confirmed) return;

    try {

      setLoadingApply(true);

      setError("");

      const response = await applyDuplicateCleaning(
        datasetId,
        buildCleaningRequest()
      );

      setAppliedResult(response);

      // Prevent another Apply using the same preview.
      setResult(null);

    } catch (err) {

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail?.message || "Unable to apply duplicate removal."
      );

    } finally {

      setLoadingApply(false);

    }

  };


  // ======================================================
  // PREVIEW TABLE
  // ======================================================

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
                        record[column] === undefined
                          ? (
                            <span className="text-red-400">
                              NULL
                            </span>
                          )
                          : String(record[column])
                        }
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
          Duplicate Removal
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Identify duplicate records, preview their removal, and save cleaned data as a new version.
        </p>

      </div>


      {/* CONFIGURATION */}

      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

        <h3 className="mb-5 text-lg font-semibold text-white">
          Duplicate Cleaning Configuration
        </h3>


        {/* DATASET */}

        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800 p-4">

          <p className="text-xs text-slate-400">
            Selected Dataset ID
          </p>

          <p className="mt-1 font-semibold text-white">
            {datasetId || "No dataset selected"}
          </p>

        </div>


        {/* DETECTION TYPE */}

        <div className="mb-5">

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Duplicate Detection Method
          </label>

          <select
            value={detectionType}
            onChange={(event) => {
              setDetectionType(event.target.value);
              setResult(null);
              setAppliedResult(null);
              setError("");
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          >

            <option value="full">
              Full Row Duplicate Detection
            </option>

            <option value="selected">
              Selected Column Duplicate Detection
            </option>

          </select>

          <p className="mt-2 text-xs text-slate-400">

            {detectionType === "full"
              ? "Compare all columns to identify identical rows."
              : "Compare only the columns you select."
            }

          </p>

        </div>


        {/* COLUMN SELECTION */}

        {detectionType === "selected" && (

          <div className="mb-5">

            <div className="mb-3 flex items-center justify-between">

              <label className="text-sm font-medium text-slate-300">
                Select Columns
              </label>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={clearAllColumns}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear
                </button>

              </div>

            </div>

            {loadingColumns ? (

              <p className="text-sm text-slate-400">
                Loading columns...
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

        )}


        {/* KEEP STRATEGY */}

        <div className="mb-5">

          <label className="mb-2 block text-sm font-medium text-slate-300">
            Duplicate Removal Strategy
          </label>

          <select
            value={keepStrategy}
            onChange={(event) => {
              setKeepStrategy(event.target.value);
              setResult(null);
              setAppliedResult(null);
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
          >

            <option value="first">
              Keep First Occurrence
            </option>

            <option value="last">
              Keep Last Occurrence
            </option>

            <option value="none">
              Remove All Duplicate Occurrences
            </option>

          </select>

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


        {/* ERROR */}

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
            ? "Detecting Duplicates..."
            : "Preview Duplicate Removal"
          }

        </button>

      </div>


      {/* PREVIEW RESULTS */}

      {result && (

        <div className="space-y-6">

          <div>

            <h3 className="text-xl font-bold text-white">
              Duplicate Detection Results
            </h3>

            <p className="mt-1 text-sm text-green-400">
              Duplicate analysis completed successfully.
            </p>

          </div>


          {/* STATISTICS */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[
              {
                label: "Total Rows",
                value: result.before?.total_rows ?? 0,
              },
              {
                label: "Duplicate Rows",
                value: result.before?.duplicate_rows ?? 0,
              },
              {
                label: "Rows in Duplicate Groups",
                value: result.before?.rows_in_duplicate_groups ?? 0,
              },
              {
                label: "Rows Removed",
                value: result.changes?.removed_rows ?? 0,
              },
            ].map((item) => (

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


          {/* BEFORE / AFTER */}

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


          {/* SUMMARY */}

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">

            <h3 className="mb-4 font-semibold text-white">
              Duplicate Removal Summary
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  Detection Method
                </span>

                <span className="text-white">
                  {detectionType === "full"
                    ? "Full Row"
                    : "Selected Columns"}
                </span>

              </div>

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  Keep Strategy
                </span>

                <span className="text-white">
                  {result.changes?.keep_strategy || keepStrategy}
                </span>

              </div>

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  Duplicate Rows Removed
                </span>

                <span className="text-green-400">
                  {result.changes?.removed_rows ?? 0}
                </span>

              </div>

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  Remaining Rows
                </span>

                <span className="text-white">
                  {result.after?.total_rows ?? 0}
                </span>

              </div>

            </div>

          </div>


          {/* APPLY BUTTON */}

          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">

            <h3 className="font-semibold text-white">
              Apply Duplicate Removal
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Save the cleaned dataset as a new version. Your previous dataset versions will remain available in Version History.
            </p>

            <button
              type="button"
              onClick={handleApplyCleaning}
              disabled={
                loadingApply ||
                loadingPreview ||
                (result.before?.duplicate_rows ?? 0) === 0
              }
              className="mt-4 w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loadingApply
                ? "Applying Duplicate Removal..."
                : "Apply & Save New Version"
              }

            </button>

          </div>


          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
            This is currently a preview. Your dataset will only be modified when you click Apply & Save New Version.
          </div>

        </div>

      )}


      {/* SUCCESS RESULT */}

      {appliedResult && (

        <div className="space-y-5">

          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">

            <h3 className="text-xl font-bold text-green-400">
              Duplicate Removal Applied Successfully!
            </h3>

            <p className="mt-2 text-sm text-green-200">
              {appliedResult.message || "Duplicate removal applied successfully."}
            </p>

          </div>


          {/* VERSION DETAILS */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">

              <p className="text-sm text-slate-400">
                New Version
              </p>

              <p className="mt-2 text-2xl font-bold text-green-400">
                v{appliedResult.version?.version_number ?? "—"}
              </p>

            </div>


            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">

              <p className="text-sm text-slate-400">
                Total Rows
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {appliedResult.version?.row_count ?? appliedResult.after?.total_rows ?? "—"}
              </p>

            </div>


            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">

              <p className="text-sm text-slate-400">
                Total Columns
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {appliedResult.version?.column_count ?? "—"}
              </p>

            </div>

          </div>


          {/* REMOVAL SUMMARY */}

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">

            <h3 className="mb-4 font-semibold text-white">
              Applied Cleaning Summary
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  Duplicate Rows Removed
                </span>

                <span className="font-semibold text-green-400">
                  {appliedResult.changes?.removed_rows ?? "—"}
                </span>

              </div>

              <div className="flex justify-between gap-4">

                <span className="text-slate-400">
                  New Dataset Version
                </span>

                <span className="text-white">
                  v{appliedResult.version?.version_number ?? "—"}
                </span>

              </div>

            </div>

          </div>


          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
            Your new dataset version has been saved. Visit Dataset Version History to view the version and audit event.
          </div>

        </div>

      )}

    </div>

  );

}