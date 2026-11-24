import React from "react";
import ReactDOM from "react-dom/client";

// Main application
import App from "./App";

// Global styles
import "./styles/index.css";
import "./styles/theme.css";

// Axios JWT interceptors
import "./api/interceptors";

// Render application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);