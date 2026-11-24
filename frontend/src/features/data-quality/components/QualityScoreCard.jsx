import React from "react";

/*
  Uses the shared "dq-*" classes (dq-glass, dq-glass-line, ...) that are
  defined in DataQualityDashboard.jsx, so render it inside that page.
*/

const QualityScoreCard = ({ score = 0, grade = "Unknown" }) => {
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0));

  const getColor = () => {
    if (safeScore >= 90) return "#19e6c1";
    if (safeScore >= 80) return "#19d3ff";
    if (safeScore >= 70) return "#facc15";
    if (safeScore >= 50) return "#fb923c";
    return "#ff6b6b";
  };

  const color = getColor();

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (safeScore / 100) * circumference;

  const message =
    safeScore >= 90
      ? "Your dataset has excellent quality."
      : safeScore >= 80
      ? "Your dataset has good quality."
      : safeScore >= 70
      ? "Your dataset needs some improvements."
      : "Your dataset needs quality improvements.";

  return (
    <div className="dq-glass dq-glass-line h-full p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Overall Data Quality
          </h2>

          <p className="mt-1 text-sm text-[var(--dq-muted)]">
            Dataset quality assessment
          </p>
        </div>

        <span
          className="rounded-full border px-3 py-1 text-sm font-semibold"
          style={{
            backgroundColor: `${color}1a`,
            borderColor: `${color}59`,
            color,
            boxShadow: `0 0 14px ${color}33`,
          }}
        >
          {grade}
        </span>
      </div>

      <div className="flex justify-center">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(25, 211, 255, 0.14)"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
                transition: "stroke-dasharray 0.8s ease",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{safeScore}</span>
            <span className="text-sm text-[var(--dq-muted)]">/ 100</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--dq-muted)]">Overall Quality Score</p>

        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default QualityScoreCard;