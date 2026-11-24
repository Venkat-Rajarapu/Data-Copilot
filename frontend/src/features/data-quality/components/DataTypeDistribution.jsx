import React from "react";

/*
  Uses the shared "dq-*" classes defined in DataQualityDashboard.jsx.
*/

const typeConfig = [
  { label: "Identifier", key: "identifier", color: "#b39bff" },
  { label: "String", key: "string", color: "#19d3ff" },
  { label: "Integer", key: "integer", color: "#19e6c1" },
  { label: "Float", key: "float", color: "#facc15" },
  { label: "Datetime", key: "datetime", color: "#f472b6" },
];

const getCount = (value) => {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
};

const DataTypeDistribution = ({ distribution = {} }) => {
  const totalColumns = typeConfig.reduce(
    (sum, item) => sum + getCount(distribution[item.key]),
    0
  );

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="dq-glass dq-glass-line h-full p-6">
      <h2 className="text-lg font-semibold text-white">
        Data Type Distribution
      </h2>

      <p className="mb-6 mt-1 text-sm text-[var(--dq-muted)]">
        Distribution of column data types
      </p>

      <div className="mb-6 flex items-center justify-center">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="rgba(25, 211, 255, 0.14)"
              strokeWidth="12"
            />

            {totalColumns > 0 &&
              typeConfig.map((item) => {
                const count = getCount(distribution[item.key]);
                if (count === 0) return null;

                const length = (count / totalColumns) * circumference;

                const segment = (
                  <circle
                    key={item.key}
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
                    strokeDashoffset={-offset}
                    style={{ filter: `drop-shadow(0 0 5px ${item.color})` }}
                  />
                );

                offset += length;
                return segment;
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {totalColumns}
            </span>

            <span className="text-xs text-[var(--dq-muted)]">Columns</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {typeConfig.map((item) => {
          const count = getCount(distribution[item.key]);

          const percentage =
            totalColumns > 0 ? (count / totalColumns) * 100 : 0;

          return (
            <div key={item.key}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-[var(--dq-muted)]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}`,
                    }}
                  />
                  {item.label}
                </span>

                <span className="font-semibold text-white">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataTypeDistribution;