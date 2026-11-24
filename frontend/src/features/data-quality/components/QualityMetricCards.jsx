import React from "react";
import { ClipboardList, Search, CheckCircle2, BarChart3 } from "lucide-react";

/*
  Uses the shared "dq-*" classes defined in DataQualityDashboard.jsx.
*/

const metrics = [
  {
    title: "Completeness",
    description: "Measures missing values",
    key: "completeness",
    icon: ClipboardList,
    color: "#19d3ff",
  },
  {
    title: "Uniqueness",
    description: "Measures duplicate records",
    key: "uniqueness",
    icon: Search,
    color: "#b39bff",
  },
  {
    title: "Validity",
    description: "Measures invalid values",
    key: "validity",
    icon: CheckCircle2,
    color: "#19e6c1",
  },
  {
    title: "Consistency",
    description: "Measures unusual values",
    key: "consistency",
    icon: BarChart3,
    color: "#fb923c",
  },
];

const getScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;

  return Math.min(100, Math.max(0, score));
};

const QualityMetricCards = ({ scores = {} }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const score = getScore(scores[metric.key]);
        const Icon = metric.icon;

        return (
          <div
            key={metric.key}
            className="dq-glass dq-glass-hover p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--dq-muted)]">
                  {metric.title}
                </p>

                <h3 className="mt-2 text-3xl font-bold text-white">
                  {score}%
                </h3>
              </div>

              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{
                  color: metric.color,
                  backgroundColor: `${metric.color}1a`,
                  borderColor: `${metric.color}59`,
                  boxShadow: `0 0 16px ${metric.color}33`,
                }}
              >
                <Icon size={20} />
              </div>
            </div>

            <div className="mt-5 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  backgroundColor: metric.color,
                  boxShadow: `0 0 10px ${metric.color}`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-[var(--dq-muted)]">
              {metric.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default QualityMetricCards;