/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

// Common default logic containers for the app
import { LogicContainer } from './store';

const now = new Date().toISOString();

const defaultLogicContainers: LogicContainer[] = [
  {
    id: "dev__default",
    name: "Development",
    color: "#006400",
    description: "Development environment",
    criticality: "low",
    is_default: false,
    owner: "anonymous",
    created_at: now,
    updated_at: now,
    projects: [],
    resources: []
  },
  {
    id: "prod__default",
    name: "Production",
    color: "#FF0000",
    description: "Production environment logic container",
    criticality: "high",
    is_default: true,
    owner: "anonymous",
    created_at: now,
    updated_at: now,
    projects: [],
    resources: []
  }
];

export default defaultLogicContainers;
