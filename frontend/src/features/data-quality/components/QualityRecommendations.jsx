import React from "react";
import {
  ClipboardList,
  Search,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Sparkles,
} from "lucide-react";

/*
  Uses the shared "dq-*" classes defined in DataQualityDashboard.jsx.
*/

const priorityStyles = {
  High: "border-red-400/40 bg-red-400/15 text-red-300",
  Medium: "border-orange-400/40 bg-orange-400/15 text-orange-300",
  Low: "border-[#19e6c1]/40 bg-[#19e6c1]/15 text-[#19e6c1]",
};

const iconColors = {
  red: "#ff6b6b",
  yellow: "#facc15",
  orange: "#fb923c",
  cyan: "#19d3ff",
};

const dimensionRecommendations = [
  {
    key: "completeness",
    title: "Improve Completeness",
    description: "Review missing data and improve data collection.",
  },
  {
    key: "uniqueness",
    title: "Improve Uniqueness",
    description: "Review duplicate records and enforce unique identifiers.",
  },
  {
    key: "validity",
    title: "Improve Validity",
    description: "Apply appropriate data validation rules.",
  },
  {
    key: "consistency",
    title: "Improve Consistency",
    description: "Investigate unusual values and standardize data formats.",
  },
];

const QualityRecommendations = ({ issues = {}, scores = {} }) => {
  const recommendations = [];

  const missing = Number(issues.missing_values) || 0;
  const duplicates = Number(issues.duplicate_rows) || 0;
  const invalid = Number(issues.invalid_values) || 0;
  const outliers = Number(issues.outliers) || 0;

  if (missing > 0) {
    recommendations.push({
      title: "Handle Missing Values",
      description: `${missing} missing values detected. Consider suitable imputation or removal strategies.`,
      priority: "High",
      color: "red",
      icon: ClipboardList,
    });
  }

  if (duplicates > 0) {
    recommendations.push({
      title: "Remove Duplicate Records",
      description: `${duplicates} duplicate records detected. Review them before removing duplicates.`,
      priority: "Medium",
      color: "yellow",
      icon: Search,
    });
  }

  if (invalid > 0) {
    recommendations.push({
      title: "Fix Invalid Values",
      description: `${invalid} invalid values detected. Review data types and validation rules.`,
      priority: "High",
      color: "red",
      icon: AlertTriangle,
    });
  }

  if (outliers > 0) {
    recommendations.push({
      title: "Investigate Outliers",
      description: `${outliers} statistical outliers detected. Verify whether these values are genuine or erroneous.`,
      priority: "Medium",
      color: "orange",
      icon: BarChart3,
    });
  }

  dimensionRecommendations.forEach((item) => {
    const score = Number(scores[item.key]);

    if (Number.isFinite(score) && score < 90) {
      recommendations.push({
        title: item.title,
        description: item.description,
        priority: score < 70 ? "High" : "Medium",
        color: score < 70 ? "red" : "orange",
        icon: Lightbulb,
      });
    }
  });

  return (
    <div className="dq-glass dq-glass-line p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Quality Recommendations
        </h2>

        <p className="mt-1 text-sm text-[var(--dq-muted)]">
          Suggestions based on the latest dataset analysis
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-[#19e6c1]/30 bg-[#19e6c1]/10 p-6 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#19e6c1]/40 bg-[#19e6c1]/15 text-[#19e6c1]"
            style={{ boxShadow: "0 0 18px rgba(25, 230, 193, 0.3)" }}
          >
            <Sparkles size={24} />
          </div>

          <h3 className="mt-3 font-semibold text-[#19e6c1]">
            Excellent Data Quality!
          </h3>

          <p className="mt-1 text-sm text-[var(--dq-muted)]">
            No major quality issues were identified.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((item, index) => {
            const Icon = item.icon;
            const color = iconColors[item.color] || iconColors.cyan;

            return (
              <div
                key={`${item.title}-${index}`}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#19d3ff]/60"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    color,
                    backgroundColor: `${color}1a`,
                    borderColor: `${color}59`,
                    boxShadow: `0 0 14px ${color}33`,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{item.title}</h3>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        priorityStyles[item.priority]
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[var(--dq-muted)]">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QualityRecommendations;