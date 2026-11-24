import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  getDatasets,
  uploadDataset,
  getDatasetPreview,
  deleteDataset,
} from "../../../api/datasetApi";

// ==========================================
// CONSTANTS
// ==========================================

const PREVIEW_LIMIT = 10;

const MAX_FILE_SIZE = 1024 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

// ==========================================
// FORMAT FILE SIZE
// ==========================================

const formatBytes = (bytes) => {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value < 0) {
    return "—";
  }

  if (value === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** index).toFixed(1)} ${units[index]}`;
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// NORMALIZE STATUS
// ==========================================

const normalizeStatus = (value) => {
  const status = String(value || "Uploaded").toLowerCase();

  if (["processed", "complete", "completed", "success"].includes(status)) {
    return "Processed";
  }

  if (["processing", "pending", "in progress"].includes(status)) {
    return "Processing";
  }

  if (["failed", "error"].includes(status)) {
    return "Failed";
  }

  return "Uploaded";
};

// ==========================================
// NORMALIZE BACKEND DATA
// ==========================================

const normalizeDataset = (item) => ({
  id: item.id,
  name: item.name,
  filename: item.original_filename,
  type: String(item.file_type || "")
    .replace(/^\./, "")
    .toUpperCase(),

  fileSize: Number(item.file_size) || 0,

  size: formatBytes(item.file_size),

  rows: item.row_count,

  columns: item.column_count,

  status: normalizeStatus(item.status),

  ownerId: item.owner_id,

  createdAt: item.created_at,

  uploaded: formatDate(item.created_at),
});

// ==========================================
// ERROR MESSAGE
// ==========================================

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

// ==========================================
// STATUS COLORS
// ==========================================

const statusStyles = (status) => {
  if (status === "Processed") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "Processing") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-500";
  }

  if (status === "Failed") {
    return "border-red-500/25 bg-red-500/10 text-red-400";
  }

  return "border-slate-500/25 bg-slate-500/10 text-[var(--dc-muted)]";
};

// ==========================================
// MAIN DATASET COMPONENT
// ==========================================

export default function DatasetPanel() {

  const [datasets, setDatasets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [isDragging, setIsDragging] = useState(false);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("All types");

  const [statusFilter, setStatusFilter] = useState("All statuses");

  // Preview states

  const [previewOpen, setPreviewOpen] = useState(false);

  const [previewDataset, setPreviewDataset] = useState(null);

  const [preview, setPreview] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewError, setPreviewError] = useState("");

  const [previewSearch, setPreviewSearch] = useState("");

  const [previewOffset, setPreviewOffset] = useState(0);

  // ==========================================
  // FETCH DATASETS
  // ==========================================

  const fetchDatasets = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getDatasets();

      if (!Array.isArray(response)) {
        throw new Error(
          "Invalid response from backend. Expected a dataset list."
        );
      }

      setDatasets(response.map(normalizeDataset));

    } catch (err) {
      console.error("Dataset fetching error:", err);

      setDatasets([]);

      setError(getErrorMessage(err));

    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // ==========================================
  // FILTER DATASETS
  // ==========================================

  const filteredDatasets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return datasets.filter((item) => {

      const matchesSearch =
        !term ||
        String(item.name || "").toLowerCase().includes(term) ||
        String(item.filename || "").toLowerCase().includes(term) ||
        String(item.ownerId || "").includes(term);

      const matchesType =
        typeFilter === "All types" ||
        item.type === typeFilter;

      const matchesStatus =
        statusFilter === "All statuses" ||
        item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;

    });

  }, [datasets, search, typeFilter, statusFilter]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const processedCount = datasets.filter(
    (item) => item.status === "Processed"
  ).length;

  const csvCount = datasets.filter(
    (item) => item.type === "CSV"
  ).length;

  const excelCount = datasets.filter(
    (item) => ["XLS", "XLSX"].includes(item.type)
  ).length;

  const totalStorage = datasets.reduce(
    (sum, item) => sum + item.fileSize,
    0
  );

  // ==========================================
  // VALIDATE FILES
  // ==========================================

  const addFiles = (fileList) => {

    const validFiles = [];

    const rejectedFiles = [];

    Array.from(fileList || []).forEach((file) => {

      const filename = file.name.toLowerCase();

      const supported = ACCEPTED_EXTENSIONS.some(
        (extension) => filename.endsWith(extension)
      );

      if (!supported) {
        rejectedFiles.push(`${file.name}: Unsupported format.`);
      }

      else if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}: Maximum size is 1 GB.`);
      }

      else if (
        datasets.some(
          (item) => item.filename?.toLowerCase() === filename
        ) ||
        selectedFiles.some(
          (item) => item.name.toLowerCase() === filename
        ) ||
        validFiles.some(
          (item) => item.name.toLowerCase() === filename
        )
      ) {
        rejectedFiles.push(`${file.name}: Already exists.`);
      }

      else {
        validFiles.push(file);
      }

    });

    if (validFiles.length) {
      setSelectedFiles((current) => [
        ...current,
        ...validFiles,
      ]);
    }

    if (rejectedFiles.length) {
      setNotice(rejectedFiles.join(" "));
    }

    else if (validFiles.length) {
      setNotice(`${validFiles.length} file(s) added to upload queue.`);
    }
  };

  // ==========================================
  // UPLOAD DATASETS
  // ==========================================

  const handleUpload = async () => {

    if (!selectedFiles.length) {
      setNotice("Please select a file first.");
      return;
    }

    setUploading(true);

    setError("");

    setNotice("");

    const failures = [];

    let uploadedCount = 0;

    try {

      for (const file of selectedFiles) {

        const datasetName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim();

        try {

          // IMPORTANT:
          // Backend API expects (name, file, ownerId).

          // Owner is automatically assigned using current_user.id.

          await uploadDataset(datasetName, file);

          uploadedCount++;

        } catch (err) {

          failures.push(
            `${file.name}: ${getErrorMessage(err)}`
          );

        }

      }

      setSelectedFiles([]);

      if (failures.length) {

        setError(failures.join(" | "));

        setNotice(
          `${uploadedCount} uploaded successfully. ${failures.length} failed.`
        );

      } else {

        setNotice(
          `${uploadedCount} dataset(s) uploaded successfully.`
        );

      }

      await fetchDatasets(false);

    } finally {

      setUploading(false);

    }

  };

  // ==========================================
  // DELETE DATASET
  // ==========================================

  const handleDelete = async (dataset) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${dataset.name}"?`
    );

    if (!confirmed) return;

    try {

      setDeletingId(dataset.id);

      setError("");

      await deleteDataset(dataset.id);

      setNotice("Dataset deleted successfully.");

      await fetchDatasets(false);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setDeletingId(null);

    }

  };

  // ==========================================
  // PREVIEW DATASET
  // ==========================================

  const loadPreview = async (
    datasetId,
    offset = 0,
    searchTerm = ""
  ) => {

    try {

      setPreviewLoading(true);

      setPreviewError("");

      const response = await getDatasetPreview(datasetId, {
        limit: PREVIEW_LIMIT,
        offset,
        search: searchTerm,
      });

      setPreview(response);

      setPreviewOffset(offset);

    } catch (err) {

      setPreview(null);

      setPreviewError(getErrorMessage(err));

    } finally {

      setPreviewLoading(false);

    }

  };

  const openPreview = async (dataset) => {

    setPreviewDataset(dataset);

    setPreview(null);

    setPreviewError("");

    setPreviewSearch("");

    setPreviewOffset(0);

    setPreviewOpen(true);

    await loadPreview(dataset.id, 0, "");

  };

  // ==========================================
  // EXPORT DATASETS
  // ==========================================

  const exportDatasetList = () => {

    const headers = [
      "id",
      "name",
      "original_filename",
      "file_type",
      "file_size",
      "row_count",
      "column_count",
      "status",
      "owner_id",
      "created_at",
    ];

    const rows = datasets.map((item) => [
      item.id,
      item.name,
      item.filename,
      item.type,
      item.fileSize,
      item.rows,
      item.columns,
      item.status,
      item.ownerId,
      item.createdAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = "data-copilot-datasets.csv";

    anchor.click();

    URL.revokeObjectURL(url);

  };

  // ==========================================
  // INPUT STYLE
  // ==========================================

  const inputClass =
    "w-full rounded-xl border border-[var(--dc-border)] bg-transparent px-3 py-2.5 text-sm text-[var(--dc-text)] outline-none transition focus:border-[var(--dc-cyan)] focus:ring-2 focus:ring-cyan-500/10";

  // ==========================================
  // UI
  // ==========================================

  return (

    <section className="dc-rise space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h2 className="text-xl font-semibold">
            Dataset Management
          </h2>

          <p className="mt-1 text-sm text-[var(--dc-muted)]">
            Manage datasets stored in your database.
          </p>

        </div>

        <div className="flex gap-2">

          <button
            className="dc-btn"
            onClick={() => fetchDatasets()}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? "dc-spin" : ""}
            />
            Refresh
          </button>

          <button
            className="dc-btn"
            onClick={exportDatasetList}
            disabled={!datasets.length}
          >
            <Download size={15} />
            Export
          </button>

        </div>

      </div>

      {/* MESSAGES */}

      {notice && (

        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs">
          {notice}
        </div>

      )}

      {error && (

        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>

      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            label: "Total Datasets",
            value: datasets.length,
            icon: Database,
            chip: "dc-chip-cyan",
          },
          {
            label: "Processed",
            value: processedCount,
            icon: CheckCircle2,
            chip: "dc-chip-teal",
          },
          {
            label: "CSV Files",
            value: csvCount,
            icon: FileText,
            chip: "dc-chip-blue",
          },
          {
            label: "Excel Files",
            value: excelCount,
            icon: FileSpreadsheet,
            chip: "dc-chip-purple",
          },
        ].map((item) => {

          const IconComponent = item.icon;

          return (

            <div
              key={item.label}
              className="dc-glass p-5"
            >

              <div className="flex items-center justify-between">

                <div className={`dc-chip ${item.chip}`}>
                  <IconComponent size={19} />
                </div>

                <span className="text-2xl font-bold">
                  {item.value}
                </span>

              </div>

              <p className="mt-4 text-sm text-[var(--dc-muted)]">
                {item.label}
              </p>

            </div>

          );

        })}

      </div>

      {/* STORAGE */}

      <div className="dc-glass flex items-center gap-4 p-5">

        <div className="dc-chip dc-chip-blue">
          <HardDrive size={22} />
        </div>

        <div>

          <p className="text-sm text-[var(--dc-muted)]">
            Total Stored File Size
          </p>

          <p className="text-xl font-bold">
            {formatBytes(totalStorage)}
          </p>

        </div>

      </div>

      {/* UPLOAD */}

      <div className="dc-glass p-5 sm:p-6">

        <div className="mb-4">

          <h3 className="font-semibold">
            Upload Dataset
          </h3>

          <p className="mt-1 text-xs text-[var(--dc-muted)]">
            Supported formats: CSV, XLSX, XLS
          </p>

        </div>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}

          onDragLeave={() => setIsDragging(false)}

          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}

          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-9 text-center ${
            isDragging
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-[var(--dc-border)] hover:border-cyan-500/60"
          }`}
        >

          <UploadCloud
            size={35}
            className="mb-3 text-[var(--dc-cyan)]"
          />

          <p className="text-sm font-semibold">
            Drag and drop files here
          </p>

          <p className="mt-1 text-xs text-[var(--dc-muted)]">
            Or click to browse
          </p>

          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />

        </label>

        {/* UPLOAD QUEUE */}

        {selectedFiles.length > 0 && (

          <div className="mt-4 space-y-3">

            {selectedFiles.map((file, index) => (

              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-xl border border-[var(--dc-border)] p-3"
              >

                <div className="flex items-center gap-3">

                  <File size={18} />

                  <div>

                    <p className="text-xs font-semibold">
                      {file.name}
                    </p>

                    <p className="text-xs text-[var(--dc-muted)]">
                      {formatBytes(file.size)}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() =>
                    setSelectedFiles((current) =>
                      current.filter((_, i) => i !== index)
                    )
                  }
                >
                  <X size={16} />
                </button>

              </div>

            ))}

            <button
              type="button"
              className="dc-btn"
              onClick={handleUpload}
              disabled={uploading}
            >

              {uploading ? (
                <>
                  <RefreshCw size={15} className="dc-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Upload to Server
                </>
              )}

            </button>

          </div>

        )}

      </div>

      {/* DATASET TABLE */}

      <div className="dc-glass overflow-hidden">

        <div className="flex flex-col gap-3 border-b border-[var(--dc-border)] p-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="font-semibold">
              Datasets from Database
            </h3>

            <p className="mt-1 text-xs text-[var(--dc-muted)]">
              Showing {filteredDatasets.length} of {datasets.length}
            </p>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search datasets..."
                className={`${inputClass} pl-9`}
              />

            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={inputClass}
            >

              <option>All types</option>
              <option>CSV</option>
              <option>XLSX</option>
              <option>XLS</option>

            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >

              <option>All statuses</option>
              <option>Processed</option>
              <option>Processing</option>
              <option>Uploaded</option>
              <option>Failed</option>

            </select>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px] text-left text-sm">

            <thead className="bg-black/[0.04] text-xs uppercase text-[var(--dc-muted)]">

              <tr>

                <th className="px-5 py-4">Dataset</th>

                <th className="px-5 py-4">Format / Size</th>

                <th className="px-5 py-4">Dimensions</th>

                <th className="px-5 py-4">Status</th>

                <th className="px-5 py-4">Uploaded</th>

                <th className="px-5 py-4 text-right">Actions</th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center"
                  >

                    <RefreshCw className="dc-spin mx-auto mb-3" />

                    Loading datasets...

                  </td>

                </tr>

              ) : (

                filteredDatasets.map((dataset) => (

                  <tr
                    key={dataset.id}
                    className="border-t border-[var(--dc-border)] hover:bg-cyan-500/[0.035]"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        {dataset.type === "CSV" ? (
                          <FileText size={20} />
                        ) : (
                          <FileSpreadsheet size={20} />
                        )}

                        <div>

                          <p className="font-semibold">
                            {dataset.name}
                          </p>

                          <p className="text-xs text-[var(--dc-muted)]">
                            {dataset.filename}
                          </p>

                          <p className="text-[10px] text-[var(--dc-muted)]">
                            Owner ID: {dataset.ownerId}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <p>{dataset.type}</p>

                      <p className="text-xs text-[var(--dc-muted)]">
                        {dataset.size}
                      </p>

                    </td>

                    <td className="px-5 py-4 text-xs">

                      {dataset.rows} rows

                      <br />

                      {dataset.columns} columns

                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs ${statusStyles(dataset.status)}`}
                      >

                        {dataset.status === "Processed" ? (
                          <CheckCircle2 size={12} className="inline mr-1" />
                        ) : dataset.status === "Processing" ? (
                          <Clock3 size={12} className="inline mr-1" />
                        ) : (
                          <UploadCloud size={12} className="inline mr-1" />
                        )}

                        {dataset.status}

                      </span>

                    </td>

                    <td className="px-5 py-4 text-xs text-[var(--dc-muted)]">

                      <CalendarDays size={12} className="inline mr-1" />

                      {dataset.uploaded}

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          title="Preview"
                          onClick={() => openPreview(dataset)}
                          className="rounded-lg border border-[var(--dc-border)] p-2"
                        >

                          <Eye size={15} />

                        </button>

                        <button
                          type="button"
                          title="Delete"
                          disabled={deletingId === dataset.id}
                          onClick={() => handleDelete(dataset)}
                          className="rounded-lg border border-red-500/20 p-2 text-red-400"
                        >

                          {deletingId === dataset.id ? (
                            <RefreshCw size={15} className="dc-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

              {!loading && filteredDatasets.length === 0 && (

                <tr>

                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center text-sm text-[var(--dc-muted)]"
                  >

                    {datasets.length === 0
                      ? "No datasets found. Upload your first dataset."
                      : "No datasets match your filters."}

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* DATASET PREVIEW MODAL */}

      {previewOpen && (

        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">

          <div className="dc-glass max-h-[90vh] w-full max-w-6xl overflow-auto">

            <div className="flex items-center justify-between border-b border-[var(--dc-border)] p-5">

              <div>

                <h3 className="text-lg font-semibold">
                  Dataset Preview
                </h3>

                <p className="text-xs text-[var(--dc-muted)]">
                  {previewDataset?.name}
                </p>

              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
              >

                <X size={20} />

              </button>

            </div>

            <div className="space-y-4 p-5">

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();

                  loadPreview(
                    previewDataset.id,
                    0,
                    previewSearch.trim()
                  );
                }}
              >

                <input
                  value={previewSearch}
                  onChange={(event) => setPreviewSearch(event.target.value)}
                  placeholder="Search rows..."
                  className={inputClass}
                />

                <button
                  type="submit"
                  className="dc-btn"
                  disabled={previewLoading}
                >

                  Search

                </button>

              </form>

              {previewError && (

                <p className="text-sm text-red-400">
                  {previewError}
                </p>

              )}

              {previewLoading ? (

                <div className="py-10 text-center">

                  <RefreshCw className="dc-spin mx-auto mb-3" />

                  Loading preview...

                </div>

              ) : preview ? (

                <>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div className="dc-glass p-3">
                      <p className="text-xs text-[var(--dc-muted)]">Total Rows</p>
                      <p className="text-lg font-semibold">{preview.total_rows ?? "—"}</p>
                    </div>

                    <div className="dc-glass p-3">
                      <p className="text-xs text-[var(--dc-muted)]">Total Columns</p>
                      <p className="text-lg font-semibold">{preview.total_columns ?? "—"}</p>
                    </div>

                    <div className="dc-glass p-3">
                      <p className="text-xs text-[var(--dc-muted)]">Rows Shown</p>
                      <p className="text-lg font-semibold">{preview.records?.length ?? 0}</p>
                    </div>

                    <div className="dc-glass p-3">
                      <p className="text-xs text-[var(--dc-muted)]">Offset</p>
                      <p className="text-lg font-semibold">{previewOffset}</p>
                    </div>

                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--dc-border)]">

                    <table className="w-full min-w-[700px] text-left text-xs">

                      <thead>

                        <tr>

                          {(preview.columns || []).map((column) => (

                            <th
                              key={column}
                              className="px-3 py-3"
                            >

                              {column}

                            </th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {(preview.records || []).map((record, index) => (

                          <tr
                            key={index}
                            className="border-t border-[var(--dc-border)]"
                          >

                            {(preview.columns || []).map((column) => (

                              <td
                                key={column}
                                className="max-w-[250px] truncate px-3 py-3"
                              >

                                {String(record?.[column] ?? "—")}

                              </td>

                            ))}

                          </tr>

                        ))}

                        {(!preview.records || preview.records.length === 0) && (

                          <tr>

                            <td
                              colSpan={(preview.columns || []).length || 1}
                              className="px-3 py-8 text-center"
                            >

                              No preview records found.

                            </td>

                          </tr>

                        )}

                      </tbody>

                    </table>

                  </div>

                  <div className="flex justify-between">

                    <button
                      type="button"
                      className="dc-btn"
                      disabled={previewOffset <= 0 || previewLoading}
                      onClick={() =>
                        loadPreview(
                          previewDataset.id,
                          Math.max(0, previewOffset - PREVIEW_LIMIT),
                          previewSearch.trim()
                        )
                      }
                    >

                      Previous

                    </button>

                    <button
                      type="button"
                      className="dc-btn"
                      disabled={
                        previewLoading ||
                        previewOffset + PREVIEW_LIMIT >=
                          (preview.total_rows || 0)
                      }
                      onClick={() =>
                        loadPreview(
                          previewDataset.id,
                          previewOffset + PREVIEW_LIMIT,
                          previewSearch.trim()
                        )
                      }
                    >

                      Next

                    </button>

                  </div>

                </>

              ) : (

                <p className="py-8 text-center text-sm text-[var(--dc-muted)]">
                  Preview data is not available.
                </p>

              )}

            </div>

          </div>

        </div>

      )}

    </section>

  );

}