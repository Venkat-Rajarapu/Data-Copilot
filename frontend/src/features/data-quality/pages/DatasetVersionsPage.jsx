import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  History,
  GitBranch,
  RotateCcw,
  RefreshCw,
  Clock,
  Database,
  Rows3,
  Columns3,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import {
  getDatasetVersions,
  getDatasetAuditHistory,
  restoreDatasetVersion,
  exportCurrentDataset,
  exportDatasetVersion,
} from "../../../api/datasetHistoryApi";

import { getDatasetById } from "../../../api/datasetApi";

import { useAuth } from "../../../context/AuthContext";

// ============================================================
// HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
};

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes) || 0;

  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatOperation = (operation = "") => {
  return String(operation)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getErrorMessage = (error) => {
  return (
    error.response?.data?.detail ||
    error.message ||
    "Something went wrong. Please try again."
  );
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function DatasetVersionsPage() {
  const { datasetId } = useParams();

  const navigate = useNavigate();

  const { user, role } = useAuth();

  const normalizedRole = String(
    role ||
    user?.role?.name ||
    user?.role_name ||
    ""
  ).toLowerCase();

  const roleId = user?.role_id ?? user?.role?.id;

  const canRestore =
    normalizedRole === "admin" ||
    normalizedRole === "analyst" ||
    roleId === 1 ||
    roleId === 2;

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [dataset, setDataset] = useState(null);

  const [versions, setVersions] = useState([]);

  const [history, setHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isRestoring, setIsRestoring] = useState(false);

  const [restoringVersionId, setRestoringVersionId] = useState(null);

  const [downloadingKey, setDownloadingKey] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("versions");

  const [expandedVersion, setExpandedVersion] = useState(null);

  // ----------------------------------------------------------
  // FETCH VERSION HISTORY
  // ----------------------------------------------------------

  const fetchVersionHistory = useCallback(async () => {
    if (!datasetId) {
      setError("Dataset ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const [
        datasetResponse,
        versionResponse,
        historyResponse,
      ] = await Promise.all([
        getDatasetById(datasetId),
        getDatasetVersions(datasetId),
        getDatasetAuditHistory(datasetId, {
          limit: 50,
          offset: 0,
        }),
      ]);

      setDataset(datasetResponse);

      setVersions(
        Array.isArray(versionResponse?.versions)
          ? versionResponse.versions
          : []
      );

      setHistory(
        Array.isArray(historyResponse?.history)
          ? historyResponse.history
          : []
      );

    } catch (err) {
      console.error("Dataset history error:", err);

      setError(getErrorMessage(err));

    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  useEffect(() => {
    fetchVersionHistory();
  }, [fetchVersionHistory]);

  // ----------------------------------------------------------
  // DOWNLOAD CURRENT DATASET
  // ----------------------------------------------------------

  const handleCurrentExport = async (format) => {
    const key = `current-${format}`;

    try {
      setError("");
      setSuccess("");

      setDownloadingKey(key);

      const blob = await exportCurrentDataset(
        datasetId,
        format
      );

      const extension = format === "xlsx" ? "xlsx" : "csv";

      downloadBlob(
        blob,
        `dataset_${datasetId}_current.${extension}`
      );

      setSuccess(
        `Current dataset downloaded successfully as ${extension.toUpperCase()}.`
      );

    } catch (err) {
      console.error("Current dataset export error:", err);

      setError(getErrorMessage(err));

    } finally {
      setDownloadingKey(null);
    }
  };

  // ----------------------------------------------------------
  // DOWNLOAD HISTORICAL VERSION
  // ----------------------------------------------------------

  const handleVersionExport = async (version, format) => {
    const key = `version-${version.id}-${format}`;

    try {
      setError("");
      setSuccess("");

      setDownloadingKey(key);

      const blob = await exportDatasetVersion(
        datasetId,
        version.id,
        format
      );

      const extension = format === "xlsx" ? "xlsx" : "csv";

      downloadBlob(
        blob,
        `dataset_${datasetId}_v${version.version_number}.${extension}`
      );

      setSuccess(
        `Version ${version.version_number} downloaded successfully as ${extension.toUpperCase()}.`
      );

    } catch (err) {
      console.error("Version export error:", err);

      setError(getErrorMessage(err));

    } finally {
      setDownloadingKey(null);
    }
  };

  // ----------------------------------------------------------
  // RESTORE VERSION
  // ----------------------------------------------------------

  const handleRestore = async (version) => {
    if (!canRestore) {
      setError("You do not have permission to restore versions.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to restore Version ${version.version_number}?\n\n` +
      "This will create a new version using the selected version's data. " +
      "Existing versions will remain unchanged."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      setIsRestoring(true);
      setRestoringVersionId(version.id);

      const response = await restoreDatasetVersion(
        datasetId,
        version.id
      );

      setSuccess(
        response.message ||
        "Dataset version restored successfully."
      );

      await fetchVersionHistory();

    } catch (err) {
      console.error("Version restoration error:", err);

      setError(getErrorMessage(err));

    } finally {
      setIsRestoring(false);
      setRestoringVersionId(null);
    }
  };

  // ----------------------------------------------------------
  // DOWNLOAD BUTTON
  // ----------------------------------------------------------

  const renderDownloadButton = (
    format,
    onClick,
    loadingKey,
    disabled = false
  ) => {
    const isDownloading = downloadingKey === loadingKey;

    const isExcel = format === "xlsx";

    return (
      <button
        key={format}
        onClick={onClick}
        disabled={Boolean(downloadingKey) || disabled}
        className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: "var(--color-border)" }}
      >
        {isDownloading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isExcel ? (
          <FileSpreadsheet size={15} />
        ) : (
          <FileText size={15} />
        )}

        {isDownloading
          ? "Downloading..."
          : isExcel
            ? "Excel"
            : "CSV"}
      </button>
    );
  };

  // ----------------------------------------------------------
  // STYLES
  // ----------------------------------------------------------

  const cardStyle = {
    background: "var(--gradient-card)",
    borderColor: "var(--color-border)",
  };

  const mutedStyle = {
    color: "var(--color-muted)",
  };

  const textStyle = {
    color: "var(--color-text)",
  };

  // ----------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center">
        <Loader2
          size={40}
          className="animate-spin text-cyan-400"
        />

        <p className="mt-4 text-sm" style={mutedStyle}>
          Loading dataset version history...
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // ERROR STATE
  // ----------------------------------------------------------

  if (!dataset && error) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate("/datasets")}
          className="flex items-center gap-2 text-sm text-cyan-400"
        >
          <ArrowLeft size={17} />
          Back to Datasets
        </button>

        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
          <AlertCircle className="mb-2" size={22} />
          {error}
        </div>

        <button
          onClick={fetchVersionHistory}
          className="gradient-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">

      {/* HEADER */}

      <section>
        <button
          onClick={() => navigate("/datasets")}
          className="mb-5 flex items-center gap-2 text-sm text-cyan-400 transition hover:text-cyan-300"
        >
          <ArrowLeft size={17} />
          Back to Datasets
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-cyan-500">
              DATA COPILOT / VERSION MANAGEMENT
            </p>

            <h1
              className="text-3xl font-extrabold"
              style={textStyle}
            >
              Version History
            </h1>

            <p className="mt-2 text-sm" style={mutedStyle}>
              Track dataset changes, review previous versions and restore data.
            </p>

            <p className="mt-3 text-sm font-semibold text-cyan-400">
              <Database size={15} className="mr-2 inline" />
              {dataset?.name || "Dataset"}
            </p>
          </div>

          <button
            onClick={fetchVersionHistory}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition hover:bg-cyan-500/10"
            style={{ borderColor: "var(--color-border)" }}
          >
            <RefreshCw
              size={17}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh History
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 size={19} className="shrink-0" />
          {success}
        </div>
      )}

      {/* CURRENT DATASET EXPORT */}

      <section
        className="rounded-2xl border p-5 sm:p-6"
        style={cardStyle}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold" style={textStyle}>
              <Download size={20} className="text-cyan-400" />
              Export Current Dataset
            </h2>

            <p className="mt-2 text-sm" style={mutedStyle}>
              Download the latest dataset with all currently saved changes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {renderDownloadButton(
              "csv",
              () => handleCurrentExport("csv"),
              "current-csv"
            )}

            {renderDownloadButton(
              "xlsx",
              () => handleCurrentExport("xlsx"),
              "current-xlsx"
            )}
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          {
            title: "Total Versions",
            value: versions.length,
            icon: GitBranch,
          },
          {
            title: "Audit Events",
            value: history.length,
            icon: Activity,
          },
          {
            title: "Current Records",
            value: Number(dataset?.row_count || 0).toLocaleString(),
            icon: Rows3,
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
                  style={textStyle}
                >
                  {item.value}
                </h2>
              </div>

              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                <Icon size={25} />
              </div>
            </div>
          );
        })}
      </section>

      {/* TABS */}

      <section
        className="overflow-hidden rounded-2xl border"
        style={cardStyle}
      >
        <div
          className="flex gap-2 border-b p-3 sm:p-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={() => setActiveTab("versions")}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "versions"
                ? "bg-cyan-500/10 text-cyan-400"
                : "hover:bg-cyan-500/5"
            }`}
          >
            <GitBranch size={17} />
            Version History

            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs">
              {versions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab === "audit"
                ? "bg-cyan-500/10 text-cyan-400"
                : "hover:bg-cyan-500/5"
            }`}
          >
            <History size={17} />
            Audit History

            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs">
              {history.length}
            </span>
          </button>
        </div>

        {/* VERSION HISTORY */}

        {activeTab === "versions" && (
          <div className="space-y-4 p-4 sm:p-6">

            {versions.length === 0 && (
              <div className="py-16 text-center">
                <GitBranch
                  size={42}
                  className="mx-auto mb-4 opacity-30"
                />

                <h3 className="text-lg font-bold" style={textStyle}>
                  No Versions Available
                </h3>

                <p className="mt-2 text-sm" style={mutedStyle}>
                  Apply a data cleaning operation to create your first dataset version.
                </p>
              </div>
            )}

            {versions.map((version) => (
              <div
                key={version.id}
                className={`rounded-2xl border p-5 transition ${
                  version.is_current
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : ""
                }`}
                style={{
                  background: version.is_current
                    ? undefined
                    : "var(--color-card)",
                  borderColor: version.is_current
                    ? undefined
                    : "var(--color-border)",
                }}
              >

                {/* VERSION HEADER */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                      <GitBranch size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold" style={textStyle}>
                          Version {version.version_number}
                        </h3>

                        {version.is_current && (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            CURRENT VERSION
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs" style={mutedStyle}>
                        {formatOperation(version.operation_type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">

                    {/* CSV EXPORT */}

                    {renderDownloadButton(
                      "csv",
                      () => handleVersionExport(version, "csv"),
                      `version-${version.id}-csv`
                    )}

                    {/* EXCEL EXPORT */}

                    {renderDownloadButton(
                      "xlsx",
                      () => handleVersionExport(version, "xlsx"),
                      `version-${version.id}-xlsx`
                    )}

                    {/* DETAILS */}

                    <button
                      onClick={() =>
                        setExpandedVersion(
                          expandedVersion === version.id
                            ? null
                            : version.id
                        )
                      }
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition hover:bg-cyan-500/10"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Details

                      {expandedVersion === version.id ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                    </button>

                    {/* RESTORE */}

                    {canRestore && !version.is_current && (
                      <button
                        onClick={() => handleRestore(version)}
                        disabled={isRestoring || Boolean(downloadingKey)}
                        className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 disabled:opacity-50"
                      >
                        {restoringVersionId === version.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <RotateCcw size={15} />
                        )}

                        Restore
                      </button>
                    )}
                  </div>
                </div>

                {/* VERSION METADATA */}

                <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    {
                      label: "Rows",
                      value: Number(version.row_count || 0).toLocaleString(),
                      icon: Rows3,
                    },
                    {
                      label: "Columns",
                      value: version.column_count ?? 0,
                      icon: Columns3,
                    },
                    {
                      label: "File Size",
                      value: formatFileSize(version.file_size),
                      icon: HardDrive,
                    },
                    {
                      label: "Created",
                      value: formatDate(version.created_at),
                      icon: Clock,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-xl p-3"
                        style={{ background: "var(--color-background)" }}
                      >
                        <div className="mb-2 flex items-center gap-2 text-cyan-400">
                          <Icon size={15} />
                          <span className="text-xs">
                            {item.label}
                          </span>
                        </div>

                        <p className="break-words text-sm font-semibold" style={textStyle}>
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* EXPANDED DETAILS */}

                {expandedVersion === version.id && (
                  <div
                    className="mt-5 space-y-3 border-t pt-4"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <h4 className="text-sm font-bold" style={textStyle}>
                      Version Configuration
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                      <div
                        className="rounded-xl p-3"
                        style={{ background: "var(--color-background)" }}
                      >
                        <p className="mb-1 text-xs" style={mutedStyle}>
                          Version ID
                        </p>

                        <p className="text-sm" style={textStyle}>
                          {version.id}
                        </p>
                      </div>

                      <div
                        className="rounded-xl p-3"
                        style={{ background: "var(--color-background)" }}
                      >
                        <p className="mb-1 text-xs" style={mutedStyle}>
                          Source Version ID
                        </p>

                        <p className="text-sm" style={textStyle}>
                          {version.source_version_id ?? "Original"}
                        </p>
                      </div>

                      <div
                        className="rounded-xl p-3 sm:col-span-2"
                        style={{ background: "var(--color-background)" }}
                      >
                        <p className="mb-2 text-xs" style={mutedStyle}>
                          Operation Configuration
                        </p>

                        <pre
                          className="overflow-x-auto whitespace-pre-wrap break-words text-xs"
                          style={textStyle}
                        >
                          {JSON.stringify(
                            version.operation_config || {},
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AUDIT HISTORY */}

        {activeTab === "audit" && (
          <div className="p-4 sm:p-6">

            {history.length === 0 && (
              <div className="py-16 text-center">
                <History
                  size={42}
                  className="mx-auto mb-4 opacity-30"
                />

                <h3 className="text-lg font-bold" style={textStyle}>
                  No Audit Events
                </h3>

                <p className="mt-2 text-sm" style={mutedStyle}>
                  Dataset activities will appear here.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 rounded-xl border p-4"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Activity size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <h4 className="text-sm font-bold" style={textStyle}>
                        {formatOperation(event.action)}
                      </h4>

                      <span className="text-xs" style={mutedStyle}>
                        {formatDate(event.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs" style={mutedStyle}>
                      <User size={13} />
                      User ID: {event.actor_id ?? "System"}
                    </div>

                    {event.details && Object.keys(event.details).length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-cyan-400">
                          View event details
                        </summary>

                        <pre
                          className="mt-2 overflow-x-auto rounded-lg p-3 text-xs"
                          style={{
                            background: "var(--color-background)",
                            color: "var(--color-text)",
                          }}
                        >
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* PERMISSIONS NOTE */}

      {!canRestore && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
          <AlertCircle size={17} className="mr-2 inline" />
          Viewer access: You can inspect dataset versions and audit history, but cannot restore versions.
        </div>
      )}

    </div>
  );
}

export default DatasetVersionsPage;