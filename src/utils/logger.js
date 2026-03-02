/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

// src/utils/logger.js
const logger = {
  error: (...args) => {
    // Errors are suppressed from user console
    // Send to monitoring service (Sentry, etc.) in production if needed
    // DO NOT log sensitive data
  },
  warn: (...args) => {
    // Warnings are suppressed from user console
  },
  info: (...args) => {
    console.log(...args);
  }
};

export default logger;