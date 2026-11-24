import Plot from "react-plotly.js";

function RevenueTrendChart({ isDarkMode }) {
  const months = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ];

  const revenue = [
    12000, 15000, 13500, 18000,
    21000, 19500, 24000, 27000,
    25000, 31000, 34000, 38000,
  ];

  const orders = [
    120, 145, 138, 180,
    210, 195, 240, 275,
    260, 310, 345, 390,
  ];

  const textColor = isDarkMode ? "#cbd5e1" : "#475569";
  const gridColor = isDarkMode ? "#334155" : "#e2e8f0";
  const backgroundColor = isDarkMode ? "#102238" : "#ffffff";

  const data = [
    {
      x: months,
      y: revenue,
      type: "bar",
      name: "Revenue",
      marker: {
        color: "#06b6d4",
        line: { width: 0 },
      },
      hovertemplate:
        "Month: %{x}<br>Revenue: ₹%{y:,.0f}<extra></extra>",
    },
    {
      x: months,
      y: orders,
      type: "scatter",
      mode: "lines+markers",
      name: "Orders",
      yaxis: "y2",
      line: {
        color: "#a78bfa",
        width: 3,
      },
      marker: {
        size: 7,
      },
      hovertemplate:
        "Month: %{x}<br>Orders: %{y}<extra></extra>",
    },
  ];

  const layout = {
    autosize: true,
    height: 360,

    paper_bgcolor: backgroundColor,
    plot_bgcolor: backgroundColor,

    font: {
      color: textColor,
      family: "Inter, sans-serif",
    },

    margin: {
      l: 65,
      r: 65,
      t: 30,
      b: 50,
    },

    xaxis: {
      title: "Months",
      gridcolor: gridColor,
    },

    yaxis: {
      title: "Revenue (₹)",
      gridcolor: gridColor,
      tickformat: ",.0f",
    },

    yaxis2: {
      title: "Orders",
      overlaying: "y",
      side: "right",
      showgrid: false,
    },

    legend: {
      orientation: "h",
      x: 0,
      y: 1.15,
    },

    hovermode: "x unified",
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  return (
    <div className="w-full">
      <Plot
        data={data}
        layout={layout}
        config={config}
        useResizeHandler
        style={{
          width: "100%",
          height: "360px",
        }}
      />
    </div>
  );
}

export default RevenueTrendChart;