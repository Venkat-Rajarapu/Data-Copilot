import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Database,
  Upload,
  Search,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  HardDrive,
  Table2,
  Rows3,
  Columns3,
  CloudUpload,
  RefreshCw,
  Loader2,
  History,
} from "lucide-react";

import {
  uploadDataset,
  getDatasets,
  getDatasetById,
  deleteDataset as deleteDatasetApi,
} from "../../../api/datasetApi";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes) || 0;

  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (date) => {
  if (!date) return "Recently uploaded";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently uploaded";
  }

  return parsedDate.toLocaleString();
};

const normalizeDataset = (dataset) => {
  const fileType = String(dataset.file_type || "")
    .replace(".", "")
    .toUpperCase();

  return {
    id: dataset.id,
    name: dataset.name,
    format: fileType,
    size: formatFileSize(dataset.file_size),
    rawSize: Number(dataset.file_size) || 0,
    rows: Number(dataset.row_count) || 0,
    columns: Number(dataset.column_count) || 0,
    uploadedAt: formatDate(dataset.created_at),
    status: dataset.status || "uploaded",
    ownerId: dataset.owner_id,
    originalFilename: dataset.original_filename,
  };
};

// ==========================================
// DATASET PAGE COMPONENT
// ==========================================

function DatasetPage() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [datasets, setDatasets] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedDataset, setSelectedDataset] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH DATASETS
  // ==========================================

  const fetchDatasets = async () => {
    try {
      setError("");
      setIsLoading(true);

      const response = await getDatasets();

      const datasetList = Array.isArray(response)
        ? response
        : response?.items || response?.datasets || [];

      setDatasets(datasetList.map(normalizeDataset));

    } catch (err) {
      console.error("Dataset fetching error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to fetch datasets. Please check your backend connection."
      );

    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    fetchDatasets();
  }, []);

  // ==========================================
  // UPLOAD DATASET
  // ==========================================

  const processFile = async (file) => {
    if (!file) return;

    setError("");
    setSuccess("");

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setError("Only CSV, XLSX and XLS files are supported.");
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    try {
      setIsUploading(true);

      const datasetName = file.name.replace(/\.[^/.]+$/, "");

      await uploadDataset(datasetName, file);

      setSuccess("Dataset uploaded successfully!");

      await fetchDatasets();

    } catch (err) {
      console.error("Dataset upload error:", err);

      setError(
        err.response?.data?.detail ||
        "Dataset upload failed. Please try again."
      );

    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // FILE INPUT
  // ==========================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }

    event.target.value = "";
  };

  // ==========================================
  // DRAG AND DROP
  // ==========================================

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  // ==========================================
  // DELETE DATASET
  // ==========================================

  const handleDeleteDataset = async (dataset) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${dataset.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setDeletingId(dataset.id);

      await deleteDatasetApi(dataset.id);

      setDatasets((previous) =>
        previous.filter((item) => item.id !== dataset.id)
      );

      if (selectedDataset?.id === dataset.id) {
        setSelectedDataset(null);
      }

      setSuccess("Dataset deleted successfully!");

    } catch (err) {
      console.error("Dataset deletion error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete dataset."
      );

    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // DATASET DETAILS
  // ==========================================

  const handlePreviewDataset = async (dataset) => {
    try {
      setError("");
      setSelectedDataset(null);

      const response = await getDatasetById(dataset.id);

      const normalized = normalizeDataset(response);

      setSelectedDataset({
        ...normalized,
        headers: [],
        records: [],
      });

    } catch (err) {
      console.error("Dataset details error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to retrieve dataset details."
      );
    }
  };

  // ==========================================
  // OPEN DATASET VERSION HISTORY
  // ==========================================

  const handleViewVersionHistory = (dataset) => {
    navigate(`/datasets/${dataset.id}/versions`);
  };

  // ==========================================
  // SEARCH DATASETS
  // ==========================================

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) =>
      dataset.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [datasets, search]);

  // ==========================================
  // SUMMARY STATISTICS
  // ==========================================

  const totalRecords = datasets.reduce(
    (sum, item) => sum + item.rows,
    0
  );

  const totalStorage = datasets.reduce(
    (sum, item) => sum + item.rawSize,
    0
  );

  // ==========================================
  // STYLES
  // ==========================================

  const cardStyle = {
    background: "var(--gradient-card)",
    borderColor: "var(--color-border)",
  };

  const mutedStyle = {
    color: "var(--color-muted)",
  };

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">

      {/* HEADER */}

      <section>

        <p className="mb-3 text-xs font-semibold tracking-wider text-cyan-500">
          DATA COPILOT / DATA MANAGEMENT
        </p>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <h1
              className="text-3xl font-extrabold"
              style={{ color: "var(--color-text)" }}
            >
              Datasets
            </h1>

            <p className="mt-2 text-sm" style={mutedStyle}>
              Upload, organize and explore your business datasets.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={fetchDatasets}
              disabled={isLoading}
              className="rounded-xl border p-3 transition hover:bg-cyan-500/10"
              style={{ borderColor: "var(--color-border)" }}
              title="Refresh datasets"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gradient-button flex items-center justify-center gap-2 disabled:opacity-50"
            >

              {isUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}

              {isUploading ? "Uploading..." : "Upload Dataset"}

            </button>

          </div>

        </div>

      </section>

      {/* NOTIFICATIONS */}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">

        {[
          {
            title: "Total Datasets",
            value: datasets.length,
            icon: Database,
          },
          {
            title: "Total Records",
            value: totalRecords.toLocaleString(),
            icon: Rows3,
          },
          {
            title: "Total Storage",
            value: formatFileSize(totalStorage),
            icon: HardDrive,
          },
        ].map((item) => {

          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="glass-card flex items-center justify-between"
            >

              <div>

                <p className="text-sm" style={mutedStyle}>
                  {item.title}
                </p>

                <h2
                  className="mt-2 text-3xl font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  {isLoading ? "..." : item.value}
                </h2>

              </div>

              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                <Icon size={25} />
              </div>

            </div>
          );
        })}

      </section>

      {/* UPLOAD AREA */}

      <section>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
            isDragging
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/5"
          } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          style={{ background: "var(--color-card)" }}
        >

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">

            {isUploading ? (
              <Loader2 size={32} className="animate-spin" />
            ) : (
              <CloudUpload size={32} />
            )}

          </div>

          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text)" }}
          >
            {isUploading
              ? "Uploading your dataset..."
              : "Drop your datasets here"}
          </h3>

          <p className="mt-2 text-sm" style={mutedStyle}>
            Drag and drop your CSV or Excel files, or browse your computer.
          </p>

          <p className="mt-4 text-xs text-cyan-500">
            Supported formats: CSV, XLSX, XLS
          </p>

        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

      </section>

      {/* DATASET TABLE */}

      <section
        className="overflow-hidden rounded-2xl border"
        style={cardStyle}
      >

        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">

          <div>

            <h2
              className="text-lg font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Uploaded Datasets
            </h2>

            <p className="mt-1 text-xs" style={mutedStyle}>
              Manage and preview your uploaded files.
            </p>

          </div>

          <div
            className="flex items-center gap-2 rounded-xl border px-3"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-border)",
            }}
          >

            <Search size={17} style={mutedStyle} />

            <input
              type="text"
              placeholder="Search datasets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full bg-transparent text-sm outline-none sm:w-52"
              style={{ color: "var(--color-text)" }}
            />

          </div>

        </div>

        {/* DATASET TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr
                className="border-y text-xs uppercase tracking-wider"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-muted)",
                }}
              >

                <th className="px-5 py-4">Dataset</th>
                <th className="px-5 py-4">Format</th>
                <th className="px-5 py-4">Records</th>
                <th className="px-5 py-4">Columns</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>

              </tr>

            </thead>

            <tbody>

              {filteredDatasets.map((dataset) => (

                <tr
                  key={dataset.id}
                  className="border-b transition hover:bg-cyan-500/5"
                  style={{ borderColor: "var(--color-border)" }}
                >

                  <td className="whitespace-nowrap px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">

                        {dataset.format === "CSV" ? (
                          <FileText size={20} />
                        ) : (
                          <FileSpreadsheet size={20} />
                        )}

                      </div>

                      <div>

                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {dataset.name}
                        </p>

                        <p className="mt-1 text-xs" style={mutedStyle}>
                          {dataset.uploadedAt}
                        </p>

                      </div>

                    </div>

                  </td>

                  <td className="px-5 py-4 text-sm" style={mutedStyle}>
                    {dataset.format}
                  </td>

                  <td className="px-5 py-4 text-sm" style={mutedStyle}>
                    {dataset.rows.toLocaleString()}
                  </td>

                  <td className="px-5 py-4 text-sm" style={mutedStyle}>
                    {dataset.columns}
                  </td>

                  <td className="px-5 py-4 text-sm" style={mutedStyle}>
                    {dataset.size}
                  </td>

                  <td className="px-5 py-4">

                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">

                      <CheckCircle2 size={13} />

                      {dataset.status}

                    </span>

                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-2">

                      {/* DATASET DETAILS */}

                      <button
                        onClick={() => handlePreviewDataset(dataset)}
                        title="Dataset details"
                        className="rounded-lg p-2 text-cyan-400 transition hover:bg-cyan-500/10"
                      >
                        <Eye size={17} />
                      </button>

                      {/* VERSION HISTORY */}

                      <button
                        onClick={() => handleViewVersionHistory(dataset)}
                        title="View version history"
                        className="rounded-lg p-2 text-violet-400 transition hover:bg-violet-500/10"
                      >
                        <History size={17} />
                      </button>

                      {/* DELETE DATASET */}

                      <button
                        onClick={() => handleDeleteDataset(dataset)}
                        disabled={deletingId === dataset.id}
                        title="Delete dataset"
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >

                        {deletingId === dataset.id ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}

                      </button>

                    </div>

                  </td>

                </tr>

              ))}

              {isLoading && (
                <tr>

                  <td colSpan="7" className="px-5 py-12 text-center">

                    <Loader2
                      size={30}
                      className="mx-auto mb-3 animate-spin text-cyan-400"
                    />

                    <p className="text-sm" style={mutedStyle}>
                      Loading datasets from PostgreSQL...
                    </p>

                  </td>

                </tr>
              )}

              {!isLoading && filteredDatasets.length === 0 && (
                <tr>

                  <td colSpan="7" className="px-5 py-12 text-center">

                    <Database
                      size={35}
                      className="mx-auto mb-3 opacity-30"
                    />

                    <p className="text-sm" style={mutedStyle}>
                      {datasets.length === 0
                        ? "No datasets uploaded yet."
                        : "No matching datasets found."}
                    </p>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* DATASET DETAILS MODAL */}

      {selectedDataset && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedDataset(null)}
        >

          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div
              className="flex items-center justify-between border-b p-5"
              style={{ borderColor: "var(--color-border)" }}
            >

              <div>

                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  {selectedDataset.name}
                </h2>

                <p className="mt-1 text-xs" style={mutedStyle}>
                  Dataset information
                </p>

              </div>

              <button
                onClick={() => setSelectedDataset(null)}
                className="rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-400"
                style={mutedStyle}
              >
                <X size={20} />
              </button>

            </div>

            {/* DATASET INFORMATION */}

            <div
              className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2"
              style={{ color: "var(--color-muted)" }}
            >

              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--color-border)" }}
              >

                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <Table2 size={18} />
                  File Format
                </div>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.format}
                </p>

              </div>

              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--color-border)" }}
              >

                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <Rows3 size={18} />
                  Total Records
                </div>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.rows.toLocaleString()}
                </p>

              </div>

              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--color-border)" }}
              >

                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <Columns3 size={18} />
                  Total Columns
                </div>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.columns}
                </p>

              </div>

              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--color-border)" }}
              >

                <div className="mb-2 flex items-center gap-2 text-cyan-400">
                  <HardDrive size={18} />
                  File Size
                </div>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.size}
                </p>

              </div>

              <div
                className="rounded-xl border p-4 sm:col-span-2"
                style={{ borderColor: "var(--color-border)" }}
              >

                <p className="mb-2 text-cyan-400">
                  Original Filename
                </p>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.originalFilename}
                </p>

              </div>

              <div
                className="rounded-xl border p-4 sm:col-span-2"
                style={{ borderColor: "var(--color-border)" }}
              >

                <p className="mb-2 text-cyan-400">
                  Uploaded At
                </p>

                <p style={{ color: "var(--color-text)" }}>
                  {selectedDataset.uploadedAt}
                </p>

              </div>

            </div>

            <div
              className="border-t p-5 text-sm"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-muted)",
              }}
            >
              Dataset record preview will be enabled after the backend preview API is implemented.
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default DatasetPage;