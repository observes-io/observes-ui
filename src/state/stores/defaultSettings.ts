/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

// Common default global settings for the app

// Move GlobalSettings interface here for shared use
export interface GlobalSettings {
    MenuLayout: "Header" | "Sidebar";
    hasLogicContainerStrategy: boolean;
    Language: string;
    Fontsize: "small" | "medium" | "large";
    Primarycolor: string;
    ShowNotifications: boolean;
    AnimationsEnabled: boolean;
    DateFormat: string;
    TimeZone: string;
    CompactMode: boolean;
    scanSettings: {
        default_branch_limit: string;
        default_build_settings_expectations: {
            enforceReferencedRepoScopedTokens: boolean;
            disableClassicPipelineCreation: boolean;
        };
    };
}

function getUserLocaleDateFormat(): string {
    try {
        // Try to infer a format string from the user's locale
        const parts = new Intl.DateTimeFormat().formatToParts(new Date(2000, 0, 31));
        // Example: [{type: 'month', value: '1'}, {type: 'literal', value: '/'}, ...]
        let format = '';
        parts.forEach(part => {
            if (part.type === 'day') format += 'DD';
            else if (part.type === 'month') format += 'MM';
            else if (part.type === 'year') format += 'YYYY';
            else format += part.value;
        });
        return format;
    } catch {
        return 'MM/DD/YYYY';
    }
}

const defaultSettings: GlobalSettings = {
    MenuLayout: "Header",
    Language: "en",
    Fontsize: "medium",
    Primarycolor: "#4F46E5",
    ShowNotifications: false,
    AnimationsEnabled: true,
    DateFormat: getUserLocaleDateFormat(), // User's locale by default, can be overridden
    TimeZone: "UTC",
    CompactMode: false,
    hasLogicContainerStrategy: false,
    scanSettings: {
        default_branch_limit: "full",
        default_build_settings_expectations: {
            enforceReferencedRepoScopedTokens: true,
            disableClassicPipelineCreation: true,
        },
    }
};

export default defaultSettings;
