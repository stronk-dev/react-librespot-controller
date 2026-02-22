import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./shared.css";
import "./standalone.css";

const renderApp = () => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(<App />);
};

(async () => renderApp())();
