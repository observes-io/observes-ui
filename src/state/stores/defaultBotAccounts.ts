/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/


const now = new Date().toISOString();

const defaultBotAccounts = [
    {
        id: "00000002-0000-8888-8000-000000000000@2c895908-04e0-4952-89fd-54b0046d6288",
        name: "ADO PR Bot",
        description: "A bot that merges pull requests",
        exactMatch: true,
        createdAt: now,
        updatedAt: now,
        isUpdatable: false
    }
];

export default defaultBotAccounts;