import { useMemo, useState } from "react";
import {
  Server,
  Database,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  ShieldCheck,
  Wifi,
  Terminal,
  CircleDot,
  Gauge,
  ArrowDownToLine,
  ArrowUpFromLine,
  CircuitBoard,
  Layers3,
  Search,
  Download,
  Filter,
  X,
} from "lucide-react";

const SERVICES = [
  { name: "FastAPI Backend", description: "Application server", icon: Server, color: "dc-chip-cyan" },
  { name: "PostgreSQL", description: "Database service", icon: Database, color: "dc-chip-blue" },
  { name: "Authentication", description: "JWT authentication service", icon: ShieldCheck, color: "dc-chip-purple" },
  { name: "API Gateway", description: "REST API service", icon: Globe, color: "dc-chip-teal" },
];

const RESOURCE_METRICS = [
  {
    key: "cpu",
    title: "CPU Utilization",
    icon: Cpu,
    color: "dc-chip-cyan",
    value: "—",
    unit: "%",
    description: "Processor usage across available cores",
    detail: "Core usage: awaiting telemetry",
    capacity: "Processor capacity unavailable",
  },
  {
    key: "memory",
    title: "Memory Usage",
    icon: MemoryStick,
    color: "dc-chip-blue",
    value: "—",
    unit: "%",
    description: "Physical memory currently allocated",
    detail: "Used / available: awaiting telemetry",
    capacity: "Memory capacity unavailable",
  },
  {
    key: "storage",
    title: "Disk Storage",
    icon: HardDrive,
    color: "dc-chip-teal",
    value: "—",
    unit: "%",
    description: "Disk space consumed by application data",
    detail: "Used / free: awaiting telemetry",
    capacity: "Storage capacity unavailable",
  },
  {
    key: "network",
    title: "Network I/O",
    icon: Wifi,
    color: "dc-chip-purple",
    value: "—",
    unit: "",
    description: "Inbound and outbound network traffic",
    detail: "Traffic rate: awaiting telemetry",
    capacity: "Network throughput unavailable",
  },
];

const API_ENDPOINTS = [
  { endpoint: "/api/v1/health/", method: "GET" },
  { endpoint: "/api/v1/health/database", method: "GET" },
  { endpoint: "/api/v1/auth/login", method: "POST" },
  { endpoint: "/api/v1/auth/refresh", method: "POST" },
  { endpoint: "/api/v1/users/", method: "GET" },
  { endpoint: "/api/v1/datasets/", method: "GET" },
];

const EVENTS = [
  { id: 1, title: "Monitoring dashboard initialized", description: "System monitoring interface loaded successfully.", category: "Application", severity: "Info", timestamp: "2026-11-06T13:40:00", source: "Admin UI" },
  { id: 2, title: "Infrastructure health checks pending", description: "FastAPI and PostgreSQL health probes are awaiting backend integration.", category: "Infrastructure", severity: "Warning", timestamp: "2026-11-06T13:35:00", source: "Monitoring UI" },
  { id: 3, title: "Resource telemetry unavailable", description: "CPU, memory, disk and network measurements have not been received.", category: "Resources", severity: "Warning", timestamp: "2026-11-06T13:30:00", source: "Monitoring UI" },
  { id: 4, title: "API route registry loaded", description: "Configured API endpoint list is available for inspection.", category: "API", severity: "Info", timestamp: "2026-11-06T13:25:00", source: "API Monitor UI" },
  { id: 5, title: "Live request telemetry disconnected", description: "Response times and HTTP status codes are not being collected yet.", category: "API", severity: "Warning", timestamp: "2026-11-06T13:20:00", source: "API Monitor UI" },
  { id: 6, title: "Authentication event stream not connected", description: "Login and token activity logs will appear after audit logging integration.", category: "Security", severity: "Info", timestamp: "2026-11-06T13:15:00", source: "Auth Monitor UI" },
];

function MetricCard({ metric }) {
  const Icon = metric.icon;
  return (
    <article className="dc-glass dc-glass-hover min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`dc-chip ${metric.color}`}><Icon size={21} /></div>
        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-500">Not connected</span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-[var(--dc-muted)]">{metric.title}</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{metric.value}</span>
          {metric.unit && <span className="text-sm text-[var(--dc-muted)]">{metric.unit}</span>}
        </div>
        <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--dc-muted)]">{metric.description}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full border border-[var(--dc-border)] bg-slate-500/10">
          <div className="h-full w-0 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400" />
        </div>
        <p className="mt-3 text-[11px] text-[var(--dc-muted)]">{metric.detail}</p>
      </div>
    </article>
  );
}

function ResourceTelemetryPanel() {
  const [range, setRange] = useState("1 hour");
  const ranges = ["1 hour", "6 hours", "24 hours"];
  return (
    <div className="dc-glass overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--dc-border)] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="dc-chip dc-chip-cyan"><Activity size={20} /></div>
          <div>
            <h3 className="font-semibold">Resource Utilization History</h3>
            <p className="mt-1 text-xs text-[var(--dc-muted)]">Historical telemetry visualization</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Telemetry time range">
          {ranges.map((item) => (
            <button key={item} type="button" onClick={() => setRange(item)} className={`dc-btn !px-3 !py-2 !text-xs ${range === item ? "!border-cyan-500/50 !bg-cyan-500/10 !text-[var(--dc-cyan)]" : ""}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--dc-border)] px-5 py-8 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, var(--dc-border) 1px, transparent 1px), linear-gradient(to bottom, var(--dc-border) 1px, transparent 1px)", backgroundSize: "44px 36px" }} />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-[var(--dc-cyan)]"><Gauge size={23} /></div>
          <h4 className="relative z-10 mt-4 text-sm font-semibold">Telemetry data not available</h4>
          <p className="relative z-10 mt-2 max-w-lg text-xs leading-5 text-[var(--dc-muted)]">
            The {range.toLowerCase()} utilization chart will appear after the monitoring API starts sending CPU, memory, disk and network measurements. No sample values are being displayed as live data.
          </p>
          <span className="relative z-10 mt-4 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold text-amber-500">Awaiting backend telemetry</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "CPU", icon: Cpu, color: "text-cyan-400" },
            { label: "Memory", icon: MemoryStick, color: "text-blue-400" },
            { label: "Disk", icon: HardDrive, color: "text-teal-400" },
            { label: "Network", icon: Wifi, color: "text-violet-400" },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-[var(--dc-border)] px-3 py-2.5">
              <Icon size={15} className={color} />
              <span className="text-xs text-[var(--dc-muted)]">{label}</span>
              <span className="ml-auto text-[10px] text-amber-500">Pending</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SystemMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState("Not connected");
  const [activeMethod, setActiveMethod] = useState("All");
  const [endpointQuery, setEndpointQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [eventSeverity, setEventSeverity] = useState("All severities");
  const [eventCategory, setEventCategory] = useState("All categories");
  const filteredEndpoints = useMemo(() => {
    const query = endpointQuery.trim().toLowerCase();
    return API_ENDPOINTS.filter((endpoint) => {
      const matchesMethod = activeMethod === "All" || endpoint.method === activeMethod;
      const matchesQuery = !query || endpoint.endpoint.toLowerCase().includes(query) || endpoint.method.toLowerCase().includes(query);
      return matchesMethod && matchesQuery;
    });
  }, [activeMethod, endpointQuery]);
  const endpointCounts = useMemo(() => ({
    total: API_ENDPOINTS.length,
    get: API_ENDPOINTS.filter((endpoint) => endpoint.method === "GET").length,
    post: API_ENDPOINTS.filter((endpoint) => endpoint.method === "POST").length,
  }), []);
  const filteredEvents = useMemo(() => {
    const query = eventQuery.trim().toLowerCase();
    return EVENTS.filter((event) => {
      const matchesQuery = !query || [event.title, event.description, event.source, event.category].some((value) => value.toLowerCase().includes(query));
      const matchesSeverity = eventSeverity === "All severities" || event.severity === eventSeverity;
      const matchesCategory = eventCategory === "All categories" || event.category === eventCategory;
      return matchesQuery && matchesSeverity && matchesCategory;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [eventQuery, eventSeverity, eventCategory]);

  const exportEvents = () => {
    const headers = ["Timestamp", "Severity", "Category", "Event", "Description", "Source"];
    const rows = filteredEvents.map((event) => [event.timestamp, event.severity, event.category, event.title, event.description, event.source]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data-copilot-system-events-preview.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString());
      setRefreshing(false);
    }, 650);
  };

  return (
    <section className="dc-rise space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2"><Activity size={16} className="text-[var(--dc-cyan)]" /><span className="text-xs font-semibold uppercase tracking-widest text-[var(--dc-cyan)]">Infrastructure Monitoring</span></div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="mt-1 text-sm text-[var(--dc-muted)]">Monitor application services and infrastructure health.</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing} className="dc-btn">
          <RefreshCw size={15} className={refreshing ? "dc-spin" : ""} />{refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-[var(--dc-muted)]">
        <strong className="text-amber-500">Frontend preview:</strong> Service states and resource metrics are illustrative placeholders. They will be connected to FastAPI and PostgreSQL during backend integration.
      </div>

      <div className="dc-glass flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4"><div className="dc-chip dc-chip-teal"><Activity size={25} /></div><div><h3 className="font-semibold">Monitoring Interface</h3><p className="mt-1 text-xs text-[var(--dc-muted)]">UI initialized · Live health checks not connected</p></div></div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2"><span className="dc-dot dc-dot-offline" /><span className="text-xs font-semibold text-amber-500">Awaiting Backend Integration</span></div>
      </div>

      <div>
        <div className="mb-4"><h3 className="font-semibold">Infrastructure Services</h3><p className="mt-1 text-xs text-[var(--dc-muted)]">Services configured for monitoring.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return <article key={service.name} className="dc-glass dc-glass-hover p-5">
              <div className="flex items-center justify-between"><div className={`dc-chip ${service.color}`}><Icon size={21} /></div><span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-500">Not checked</span></div>
              <h4 className="mt-5 font-semibold">{service.name}</h4><p className="mt-1 text-xs text-[var(--dc-muted)]">{service.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--dc-muted)]"><CircleDot size={13} />Awaiting live health check</div>
            </article>;
          })}
        </div>
      </div>

      <div>
        <div className="mb-4"><div className="flex items-center gap-2"><CircuitBoard size={18} className="text-[var(--dc-cyan)]" /><h3 className="font-semibold">Resource Monitoring</h3></div><p className="mt-1 text-xs text-[var(--dc-muted)]">Infrastructure resource utilization and capacity indicators.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{RESOURCE_METRICS.map((metric) => <MetricCard key={metric.key} metric={metric} />)}</div>
      </div>

      <ResourceTelemetryPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="dc-glass p-5">
          <div className="mb-4 flex items-center gap-3"><div className="dc-chip dc-chip-blue"><Layers3 size={20} /></div><div><h3 className="font-semibold">Resource Capacity Summary</h3><p className="mt-1 text-xs text-[var(--dc-muted)]">Current infrastructure capacity snapshot</p></div></div>
          <div className="space-y-3">
            {[
              { label: "Processor cores", value: "Not reported", icon: Cpu },
              { label: "Total memory", value: "Not reported", icon: MemoryStick },
              { label: "Disk capacity", value: "Not reported", icon: HardDrive },
            ].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--dc-border)] px-4 py-3"><div className="flex items-center gap-2 text-xs text-[var(--dc-muted)]"><Icon size={15} className="text-[var(--dc-cyan)]" />{label}</div><span className="text-xs font-medium">{value}</span></div>)}
          </div>
        </div>
        <div className="dc-glass p-5">
          <div className="mb-4 flex items-center gap-3"><div className="dc-chip dc-chip-purple"><Wifi size={20} /></div><div><h3 className="font-semibold">Network Traffic</h3><p className="mt-1 text-xs text-[var(--dc-muted)]">Inbound and outbound throughput</p></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--dc-border)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--dc-muted)]"><ArrowDownToLine size={15} className="text-cyan-400" />Inbound</div><p className="mt-3 text-xl font-bold">—</p><p className="mt-1 text-[10px] text-[var(--dc-muted)]">Awaiting telemetry</p></div>
            <div className="rounded-xl border border-[var(--dc-border)] p-4"><div className="flex items-center gap-2 text-xs text-[var(--dc-muted)]"><ArrowUpFromLine size={15} className="text-teal-400" />Outbound</div><p className="mt-3 text-xl font-bold">—</p><p className="mt-1 text-[10px] text-[var(--dc-muted)]">Awaiting telemetry</p></div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2"><Globe size={17} className="text-[var(--dc-cyan)]" /><span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--dc-cyan)]">API observability</span></div>
            <h3 className="text-lg font-semibold">API Endpoint Monitoring</h3>
            <p className="mt-1 text-xs text-[var(--dc-muted)]">Browse registered endpoints and prepare request-health monitoring.</p>
          </div>
          <span className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold text-amber-500">Live request telemetry pending</span>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Registered Endpoints", value: endpointCounts.total, note: "Configured in this UI", icon: Globe, color: "dc-chip-cyan" },
            { label: "GET Routes", value: endpointCounts.get, note: "Read operations", icon: ArrowDownToLine, color: "dc-chip-blue" },
            { label: "POST Routes", value: endpointCounts.post, note: "Create / action routes", icon: ArrowUpFromLine, color: "dc-chip-teal" },
            { label: "Average Response", value: "—", note: "Awaiting live telemetry", icon: Activity, color: "dc-chip-purple" },
          ].map((item) => {
            const Icon = item.icon;
            return <article key={item.label} className="dc-glass p-4">
              <div className="flex items-center justify-between gap-2"><div className={`dc-chip ${item.color}`}><Icon size={18} /></div><span className="text-xl font-bold">{item.value}</span></div>
              <p className="mt-3 text-xs font-semibold">{item.label}</p>
              <p className="mt-1 text-[10px] text-[var(--dc-muted)]">{item.note}</p>
            </article>;
          })}
        </div>

        <div className="dc-glass overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--dc-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="font-semibold">Registered API Routes</h4>
              <p className="mt-1 text-xs text-[var(--dc-muted)]">Showing {filteredEndpoints.length} of {API_ENDPOINTS.length} configured routes. Runtime status is not yet connected.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dc-muted)]" />
                <input value={endpointQuery} onChange={(event) => setEndpointQuery(event.target.value)} placeholder="Search endpoint..." aria-label="Search API endpoints" className="w-full rounded-xl border border-[var(--dc-border)] bg-transparent py-2.5 pl-9 pr-3 text-xs text-[var(--dc-text)] outline-none transition placeholder:text-[var(--dc-muted)] focus:border-[var(--dc-cyan)]" />
              </label>
              <select value={activeMethod} onChange={(event) => setActiveMethod(event.target.value)} aria-label="Filter API endpoints by method" className="rounded-xl border border-[var(--dc-border)] bg-transparent px-4 py-2.5 text-xs text-[var(--dc-text)] outline-none focus:border-[var(--dc-cyan)]">
                <option value="All">All Methods</option><option value="GET">GET</option><option value="POST">POST</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-black/[0.04] text-[10px] uppercase tracking-wider text-[var(--dc-muted)]"><tr><th className="px-5 py-4">Endpoint</th><th className="px-5 py-4">Method</th><th className="px-5 py-4">Response Time</th><th className="px-5 py-4">HTTP Code</th><th className="px-5 py-4">Health</th></tr></thead>
              <tbody>
                {filteredEndpoints.map((endpoint) => <tr key={`${endpoint.method}-${endpoint.endpoint}`} className="border-t border-[var(--dc-border)] transition hover:bg-cyan-500/[0.035]">
                  <td className="px-5 py-4 font-mono text-xs">{endpoint.endpoint}</td>
                  <td className="px-5 py-4"><span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-500">{endpoint.method}</span></td>
                  <td className="px-5 py-4 text-xs text-[var(--dc-muted)]">Not measured</td>
                  <td className="px-5 py-4 text-xs text-[var(--dc-muted)]">—</td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Not checked</span></td>
                </tr>)}
                {filteredEndpoints.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-xs text-[var(--dc-muted)]">No API endpoints match your search or method filter.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-[var(--dc-border)] px-5 py-3 text-[10px] text-[var(--dc-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>Endpoint registry is a frontend configuration list, not an automatically discovered route map.</span>
            <span>Last UI refresh: {lastChecked}</span>
          </div>
        </div>
      </section>

      <section className="dc-glass overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--dc-border)] p-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="dc-chip dc-chip-blue"><Terminal size={21} /></div>
            <div><h3 className="font-semibold">System Events &amp; Logs</h3><p className="mt-1 text-xs text-[var(--dc-muted)]">Review application, infrastructure, API and security events.</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportEvents} className="dc-btn"><Download size={14} />Export CSV</button>
            <button type="button" onClick={() => { setEventQuery(""); setEventSeverity("All severities"); setEventCategory("All categories"); }} className="dc-btn"><X size={14} />Clear filters</button>
          </div>
        </div>

        <div className="border-b border-[var(--dc-border)] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-[var(--dc-muted)]"><Filter size={13} /><span>LOCAL UI PREVIEW RECORDS · NOT LIVE SERVER LOGS</span><span className="ml-auto">Showing {filteredEvents.length} of {EVENTS.length} events</span></div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dc-muted)]" />
              <input value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Search events, source..." aria-label="Search system events" className="w-full rounded-xl border border-[var(--dc-border)] bg-transparent py-2.5 pl-9 pr-3 text-xs text-[var(--dc-text)] outline-none placeholder:text-[var(--dc-muted)] focus:border-[var(--dc-cyan)]" />
            </label>
            <select value={eventSeverity} onChange={(event) => setEventSeverity(event.target.value)} aria-label="Filter events by severity" className="rounded-xl border border-[var(--dc-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--dc-text)] outline-none focus:border-[var(--dc-cyan)]"><option>All severities</option><option>Info</option><option>Warning</option><option>Error</option><option>Critical</option></select>
            <select value={eventCategory} onChange={(event) => setEventCategory(event.target.value)} aria-label="Filter events by category" className="rounded-xl border border-[var(--dc-border)] bg-transparent px-3 py-2.5 text-xs text-[var(--dc-text)] outline-none focus:border-[var(--dc-cyan)]"><option>All categories</option><option>Application</option><option>Infrastructure</option><option>Resources</option><option>API</option><option>Security</option></select>
          </div>
        </div>

        <div className="divide-y divide-[var(--dc-border)]">
          {filteredEvents.map((event) => {
            const severityClass = event.severity === "Critical" || event.severity === "Error" ? "border-red-500/25 bg-red-500/10 text-red-400" : event.severity === "Warning" ? "border-amber-500/25 bg-amber-500/10 text-amber-500" : "border-cyan-500/25 bg-cyan-500/10 text-cyan-500";
            const EventIcon = event.severity === "Critical" || event.severity === "Error" ? AlertTriangle : event.severity === "Warning" ? AlertTriangle : CheckCircle2;
            return <article key={event.id} className="flex flex-col gap-3 p-4 transition hover:bg-cyan-500/[0.025] sm:flex-row sm:items-start">
              <div className={`mt-0.5 rounded-xl border p-2 ${severityClass}`}><EventIcon size={16} /></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold">{event.title}</h4><span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${severityClass}`}>{event.severity}</span><span className="rounded-full border border-[var(--dc-border)] px-2.5 py-1 text-[9px] text-[var(--dc-muted)]">{event.category}</span></div><p className="mt-1 text-xs leading-5 text-[var(--dc-muted)]">{event.description}</p><p className="mt-2 text-[10px] text-[var(--dc-muted)]">Source: {event.source}</p></div>
              <time className="shrink-0 text-[10px] text-[var(--dc-muted)]">{new Date(event.timestamp).toLocaleString()}</time>
            </article>;
          })}
          {filteredEvents.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm font-medium">No events match your filters.</p><p className="mt-1 text-xs text-[var(--dc-muted)]">Try another search term or clear the filters.</p></div>}
        </div>
        <div className="border-t border-[var(--dc-border)] px-5 py-3 text-[10px] leading-5 text-[var(--dc-muted)]">These illustrative records demonstrate the log interface only. Real application and security audit events will be supplied by backend logging integration.</div>
      </section>

      <div className="flex flex-col justify-between gap-2 text-xs text-[var(--dc-muted)] sm:flex-row"><p>Last UI refresh: {lastChecked}</p><p>Data Copilot · System Monitoring</p></div>
    </section>
  );
}
