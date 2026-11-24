import React from "react";
import { ClipboardList, Copy, AlertTriangle, BarChart3 } from "lucide-react";

/*
  Uses the shared "dq-*" classes defined in DataQualityDashboard.jsx.
*/

const issueTypes = [
  {
    label: "Missing Values",
    key: "missing_values",
    icon: ClipboardList,
    color: "#19d3ff",
  },
  {
    label: "Duplicate Rows",
    key: "duplicate_rows",
    icon: Copy,
    color: "#b39bff",
  },
  {
    label: "Invalid Values",
    key: "invalid_values",
    icon: AlertTriangle,
    color: "#facc15",
  },
  {
    label: "Outliers",
    key: "outliers",
    icon: BarChart3,
    color: "#ff6b6b",
  },
];

const getCount = (value) => {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
};

const IssueDistributionChart = ({ issues = {} }) => {
  const totalIssues = issueTypes.reduce(
    (total, item) => total + getCount(issues[item.key]),
    0
  );

  const maxValue = Math.max(
    1,
    ...issueTypes.map((item) => getCount(issues[item.key]))
  );

  return (
    <div className="dq-glass dq-glass-line h-full p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Issue Distribution
          </h2>

          <p className="mt-1 text-sm text-[var(--dq-muted)]">
            Data quality issues detected in your dataset
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {totalIssues.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--dq-muted)]">Total Issues</p>
        </div>
      </div>

      <div className="space-y-6">
        {issueTypes.map((item) => {
          const count = getCount(issues[item.key]);
          const percentage = (count / maxValue) * 100;
          const Icon = item.icon;

          return (
            <div key={item.key}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}1a`,
                      borderColor: `${item.color}59`,
                    }}
                  >
                    <Icon size={16} />
                  </span>

                  <span className="text-sm font-medium text-white">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-semibold text-white">
                  {count.toLocaleString()}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-xs text-[var(--dq-muted)]">
          Issue counts are based on the latest dataset analysis.
          Outliers are statistical anomalies, not necessarily data errors.
        </p>
      </div>
    </div>
  );
};

export default IssueDistributionChart;