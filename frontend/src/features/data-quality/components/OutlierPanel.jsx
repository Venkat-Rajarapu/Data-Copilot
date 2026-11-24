import React from "react";

/*
  This panel is shown inside the glass "Outlier Detection" section of
  DataQualityDashboard.jsx, so it uses a lighter inset style instead of
  another heavy glass card.
*/

const OutlierPanel = ({ outlierAnalysis = {} }) => {
  const summary = outlierAnalysis.summary || {};

  const columns = Array.isArray(outlierAnalysis.columns)
    ? outlierAnalysis.columns
    : [];

  const totalOutliers = Number(summary.total_outliers) || 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Outlier Analysis
          </h2>

          <p className="mt-1 text-sm text-[var(--dq-muted)]">
            Statistical anomalies detected in numerical columns
          </p>
        </div>

        <span className="rounded-full border border-orange-400/40 bg-orange-400/15 px-3 py-1 text-xs font-semibold text-orange-300">
          {summary.method?.toUpperCase() || "IQR"}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 p-4">
          <p className="text-sm text-[var(--dq-muted)]">Total Outliers</p>

          <h3 className="mt-2 text-3xl font-bold text-orange-300">
            {totalOutliers.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-xl border border-[#19d3ff]/30 bg-[#19d3ff]/10 p-4">
          <p className="text-sm text-[var(--dq-muted)]">Affected Columns</p>

          <h3 className="mt-2 text-3xl font-bold text-[#19d3ff]">
            {Number(summary.affected_columns) || 0}
          </h3>
        </div>
      </div>

      {columns.length > 0 ? (
        <div className="space-y-4">
          {columns.map((column, index) => (
            <div
              key={column.column_name || index}
              className="rounded-xl border border-white/10 p-4 transition-colors hover:border-[#19d3ff]/60"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">
                  {column.column_name}
                </h3>

                <span className="text-sm font-semibold text-orange-300">
                  {column.outlier_count} outliers
                </span>
              </div>

              <p className="mt-2 text-xs text-[var(--dq-muted)]">
                Outlier percentage: {column.outlier_percentage ?? 0}%
              </p>

              <p className="mt-1 text-xs text-[var(--dq-muted)]">
                Lower bound: {column.lower_bound ?? "N/A"} |
                Upper bound: {column.upper_bound ?? "N/A"}
              </p>

              {column.outlier_samples?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {column.outlier_samples.map((value, sampleIndex) => (
                    <span
                      key={sampleIndex}
                      className="rounded-md border border-orange-400/30 bg-orange-400/10 px-2 py-1 text-xs text-orange-300"
                    >
                      {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--dq-muted)]">
          Detailed outlier analysis is not available.
        </p>
      )}

      <p className="mt-5 text-xs text-[var(--dq-muted)]">
        Outliers are statistical anomalies and should be investigated
        before deciding whether to modify the data.
      </p>
    </div>
  );
};

export default OutlierPanel;