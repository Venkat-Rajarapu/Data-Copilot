import {
  Database,
  Layers,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";

// =========================================
// KPI DATA
// =========================================

const kpiData = [
  {
    id: 1,
    title: "Total Datasets",
    value: "24",
    change: "+12.5%",
    description: "Compared to last month",
    icon: Database,
    trend: "up",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
    iconBackground: "bg-blue-500/10",
    trendColor: "text-emerald-400",
  },
  {
    id: 2,
    title: "Total Records",
    value: "1.2M",
    change: "+8.2%",
    description: "Compared to last month",
    icon: Layers,
    trend: "up",
    gradient: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400",
    iconBackground: "bg-purple-500/10",
    trendColor: "text-emerald-400",
  },
  {
    id: 3,
    title: "Data Quality Score",
    value: "96.8%",
    change: "+2.4%",
    description: "Compared to last month",
    icon: ShieldCheck,
    trend: "up",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
    iconBackground: "bg-emerald-500/10",
    trendColor: "text-emerald-400",
  },
  {
    id: 4,
    title: "ML Models Trained",
    value: "12",
    change: "-2.1%",
    description: "Compared to last month",
    icon: BrainCircuit,
    trend: "down",
    gradient: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
    iconBackground: "bg-orange-500/10",
    trendColor: "text-red-400",
  },
];

// =========================================
// KPI CARD COMPONENT
// =========================================

function KpiCard({ item }) {
  const Icon = item.icon;

  const isPositive = item.trend === "up";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        item.id === 1
          ? "hover:shadow-blue-500/5"
          : item.id === 2
            ? "hover:shadow-purple-500/5"
            : item.id === 3
              ? "hover:shadow-emerald-500/5"
              : "hover:shadow-orange-500/5"
      }`}
      style={{
        background: "var(--gradient-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Decorative Gradient */}

      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${item.gradient} opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* CARD CONTENT */}

      <div className="relative z-10">

        {/* TOP ROW */}

        <div className="flex items-center justify-between">

          {/* ICON */}

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBackground} ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon size={27} strokeWidth={1.9} />
          </div>

          {/* TREND */}

          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${item.trendColor}`}
          >
            {isPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}

            <span>{item.change}</span>
          </div>

        </div>

        {/* KPI TITLE */}

        <div className="mt-6">

          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            {item.title}
          </p>

          {/* KPI VALUE */}

          <h2
            className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--color-text)" }}
          >
            {item.value}
          </h2>

        </div>

        {/* FOOTER */}

        <div className="mt-4 flex items-center justify-between">

          <p
            className="text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            {item.description}
          </p>

          <ArrowUpRight
            size={16}
            className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
            style={{ color: "var(--color-primary)" }}
          />

        </div>

      </div>

    </div>
  );
}

// =========================================
// KPI SUMMARY COMPONENT
// =========================================

function KpiSummary() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

      {kpiData.map((item) => (
        <KpiCard
          key={item.id}
          item={item}
        />
      ))}

    </div>
  );
}

export default KpiSummary;