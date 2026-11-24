import {
  Clock,
  ArrowUpRight,
  Database,
  FileBarChart,
  BrainCircuit,
  ShieldCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

// Components
import KpiSummary from "../components/KpiSummary";
import RevenueTrendChart from "../../../components/charts/RevenueTrendChart";
// =========================================
// SAMPLE ACTIVITY DATA
// =========================================

const activities = [
  {
    id: 1,
    title: "Sales dataset uploaded",
    description: "sales_data_2026.csv",
    time: "5 minutes ago",
    icon: Database,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    status: "Completed",
  },
  {
    id: 2,
    title: "Business analytics report generated",
    description: "Monthly business performance report",
    time: "20 minutes ago",
    icon: FileBarChart,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    status: "Completed",
  },
  {
    id: 3,
    title: "Data quality analysis completed",
    description: "Data validation and quality assessment",
    time: "45 minutes ago",
    icon: ShieldCheck,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    status: "Completed",
  },
  {
    id: 4,
    title: "ML model training completed",
    description: "Sales prediction model",
    time: "1 hour ago",
    icon: BrainCircuit,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
    status: "Completed",
  },
];

// =========================================
// DASHBOARD PAGE
// =========================================

function DashboardPage({ isDarkMode }) {
  const headingColor = "var(--color-text)";
  const mutedColor = "var(--color-muted)";
  const borderColor = "var(--color-border)";

  const cardStyle = {
    background: "var(--gradient-card)",
    borderColor,
    boxShadow: "var(--shadow-card)",
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <section>

        {/* Breadcrumb */}

        <div
          className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide"
          style={{ color: "var(--color-primary-light)" }}
        >
          <span>DATA COPILOT</span>
          <span>/</span>
          <span>OVERVIEW</span>
        </div>

        {/* Heading */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <h1
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: headingColor }}
            >
              Dashboard
            </h1>

            <p
              className="mt-2 text-sm sm:text-base"
              style={{ color: mutedColor }}
            >
              Welcome back! Here's what's happening with your data today.
            </p>

          </div>

          {/* Live Status */}

          <div
            className="flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium"
            style={{
              background: "rgba(16,185,129,0.08)",
              borderColor: "rgba(16,185,129,0.2)",
              color: "#34d399",
            }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Workspace Active
          </div>

        </div>

      </section>

      {/* =====================================
          BUSINESS OVERVIEW
      ===================================== */}

      <section className="space-y-5">

        <div>

          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: headingColor }}
          >
            Business Overview
          </h2>

          <p
            className="mt-1 text-sm"
            style={{ color: mutedColor }}
          >
            Monitor your business intelligence performance.
          </p>

        </div>

        {/* KPI CARDS */}

        <KpiSummary />

      </section>

      {/* =====================================
          ANALYTICS SECTION
      ===================================== */}

      <section className="space-y-5">

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

          <div>

            <h2
              className="text-xl font-bold sm:text-2xl"
              style={{ color: headingColor }}
            >
              Analytics Overview
            </h2>

            <p
              className="mt-1 text-sm"
              style={{ color: mutedColor }}
            >
              Explore your business performance and trends.
            </p>

          </div>

          <button
            className="flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:border-cyan-500/40 hover:text-cyan-400"
            style={{
              borderColor,
              color: headingColor,
              background: "var(--color-card)",
            }}
          >
            <Activity size={16} />
            Analytics Overview
            <ArrowUpRight size={15} />
          </button>

        </div>

        {/* CHART CARD */}

        <div
          className="overflow-hidden rounded-2xl border p-4 sm:p-6"
          style={cardStyle}
        >

          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>

              <h3
                className="text-lg font-bold"
                style={{ color: headingColor }}
              >
                Revenue & Orders Trend
              </h3>

              <p
                className="mt-1 text-xs sm:text-sm"
                style={{ color: mutedColor }}
              >
                Monthly business performance analysis
              </p>

            </div>

            <span
              className="w-fit rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor,
                color: mutedColor,
                background: "var(--color-card)",
              }}
            >
              January – December
            </span>

          </div>

          <RevenueTrendChart isDarkMode={isDarkMode} />

        </div>

      </section>

      {/* =====================================
          RECENT ACTIVITY
      ===================================== */}

      <section
        className="overflow-hidden rounded-2xl border"
        style={cardStyle}
      >

        {/* ACTIVITY HEADER */}

        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">

          <div>

            <h2
              className="text-lg font-bold sm:text-xl"
              style={{ color: headingColor }}
            >
              Recent Activity
            </h2>

            <p
              className="mt-1 text-xs sm:text-sm"
              style={{ color: mutedColor }}
            >
              Latest updates from your workspace.
            </p>

          </div>

          <button
            className="flex shrink-0 items-center gap-2 text-xs font-semibold text-cyan-500 transition hover:text-cyan-400 sm:text-sm"
          >
            View all
            <ArrowRight size={16} />
          </button>

        </div>

        {/* ACTIVITY LIST */}

        <div className="px-5 pb-3 sm:px-6">

          {activities.map((activity) => {

            const Icon = activity.icon;

            return (
              <div
                key={activity.id}
                className="flex flex-col justify-between gap-3 border-t py-5 sm:flex-row sm:items-center"
                style={{ borderColor }}
              >

                {/* ACTIVITY DETAILS */}

                <div className="flex min-w-0 items-center gap-4">

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${activity.iconBg}`}
                  >
                    <Icon
                      size={22}
                      className={activity.iconColor}
                    />
                  </div>

                  <div className="min-w-0">

                    <h3
                      className="truncate text-sm font-semibold"
                      style={{ color: headingColor }}
                    >
                      {activity.title}
                    </h3>

                    <p
                      className="mt-1 truncate text-xs"
                      style={{ color: mutedColor }}
                    >
                      {activity.description}
                    </p>

                  </div>

                </div>

                {/* TIME AND STATUS */}

                <div className="flex items-center justify-between gap-4 sm:justify-end">

                  <span
                    className="flex items-center gap-2 text-xs"
                    style={{ color: mutedColor }}
                  >
                    <Clock size={14} />
                    {activity.time}
                  </span>

                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 size={12} />
                    {activity.status}
                  </span>

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* =====================================
          DASHBOARD FOOTER MESSAGE
      ===================================== */}

      <div
        className="flex flex-col justify-between gap-2 border-t pt-5 sm:flex-row sm:items-center"
        style={{ borderColor }}
      >

        <p
          className="text-xs"
          style={{ color: mutedColor }}
        >
          Data Copilot Intelligence Platform
        </p>

        <p
          className="text-xs"
          style={{ color: mutedColor }}
        >
          AI-powered business intelligence and decision support.
        </p>

      </div>

    </div>
  );
}

export default DashboardPage;