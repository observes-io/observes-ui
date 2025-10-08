/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
 
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import * as SDK from "azure-devops-extension-sdk";

import reportWebVitals from './reportWebVitals';
import './minimal-scrollbar.css';
import App from "./App";

const RootComponent = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

function render() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <RootComponent />
    </React.StrictMode>
  );
}

const isAdoHost =
  document.referrer.includes("dev.azure.com") ||
  document.referrer.includes("visualstudio.com");

if (isAdoHost) {
  SDK.init();
  SDK.ready().then(() => {
    console.log("ADO extension ready ✅");
    render();
   });
} else {
  console.log("Not running in ADO host");
  render();
}

reportWebVitals();