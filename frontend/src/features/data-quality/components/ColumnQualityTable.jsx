import React from "react";

/*
  Uses the shared "dq-*" classes defined in DataQualityDashboard.jsx.
*/

const getStatus = (column) => {
  if (column.invalid_values > 0) return "Invalid";
  if (column.missing_values > 0) return "Missing";
  if (column.outlier_count > 0) return "Outliers";
  return "Healthy";
};

const statusStyles = {
  Healthy: "border-[#19e6c1]/40 bg-[#19e6c1]/15 text-[#19e6c1]",
  Invalid: "border-red-400/40 bg-red-400/15 text-red-300",
  Missing: "border-yellow-400/40 bg-yellow-400/15 text-yellow-300",
  Outliers: "border-orange-400/40 bg-orange-400/15 text-orange-300",
};

const ColumnQualityTable = ({ columns = [] }) => {
  if (!columns.length) {
    return (
      <div className="dq-glass dq-glass-line p-6">
        <h2 className="text-lg font-semibold text-white">
          Column Quality Analysis
        </h2>

        <p className="mt-4 text-sm text-[var(--dq-muted)]">
          No column-level analysis data is available.
        </p>
      </div>
    );
  }

  return (
    <div className="dq-glass dq-glass-line overflow-hidden">
      <div className="border-b border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white">
          Column Quality Analysis
        </h2>

        <p className="mt-1 text-sm text-[var(--dq-muted)]">
          Individual column quality and validation results
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#19d3ff]/10 text-[#19d3ff]">
            <tr>
              <th className="px-6 py-4 font-semibold">Column Name</th>
              <th className="px-6 py-4 font-semibold">Data Type</th>
              <th className="px-6 py-4 font-semibold">Total Values</th>
              <th className="px-6 py-4 font-semibold">Missing</th>
              <th className="px-6 py-4 font-semibold">Invalid</th>
              <th className="px-6 py-4 font-semibold">Outliers</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {columns.map((column, index) => {
              const status = getStatus(column);

              return (
                <tr
                  key={column.column_name || index}
                  className="transition-colors hover:bg-[#19d3ff]/[0.07]"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {column.column_name || "Unknown"}
                  </td>

                  <td className="px-6 py-4 text-[var(--dq-muted)]">
                    {column.detected_type || column.data_type || "Unknown"}
                  </td>

                  <td className="px-6 py-4 text-[var(--dq-muted)]">
                    {column.total_values ?? 0}
                  </td>

                  <td className="px-6 py-4 text-[var(--dq-muted)]">
                    {column.missing_values ?? 0}
                  </td>

                  <td className="px-6 py-4 text-[var(--dq-muted)]">
                    {column.invalid_values ?? 0}
                  </td>

                  <td className="px-6 py-4 text-[var(--dq-muted)]">
                    {column.outlier_count ?? 0}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColumnQualityTable;