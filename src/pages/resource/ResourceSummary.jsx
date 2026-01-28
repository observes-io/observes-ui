/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React from 'react';
import { Box, Typography } from '@mui/material';

// Top-level helper component for async resource summary fetching and rendering
function ResourceSummary({ selectedPlatformSourceId, resourceType, resourceTypeSelected, resourceIds, getProtectedResourcesByOrgTypeAndIdsSummary, setResourceTypeSelected, formatKey }) {
    const [summary, setSummary] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        setLoading(true);
        async function fetchSummary() {
            try {
                const result = await getProtectedResourcesByOrgTypeAndIdsSummary(selectedPlatformSourceId, resourceType, resourceIds);
                setSummary(result);
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, [selectedPlatformSourceId, resourceType, resourceIds, getProtectedResourcesByOrgTypeAndIdsSummary]);

    if (loading) {
        return <Typography variant="body2" color="text.secondary">Loading...</Typography>;
    }

    if (summary && summary.length > 0) {
        return (
            <>
                {summary.map(res => (
                    res.webUrl ? (
                        <a
                            key={String(res.id)}
                            href={res.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                cursor: 'pointer',
                                textDecoration: 'underline dotted',
                                color: '#007FFF',
                                pointerEvents: 'auto'
                            }}
                            aria-disabled={resourceTypeSelected === resourceType}
                        >
                            {res.name} ({res.id})
                        </a>
                    ) : (
                        <span
                            key={String(res.id)}
                            style={{
                                display: 'block',
                                textDecoration: 'underline dotted',
                                color: '#888'
                            }}
                        >
                            {res.name} ({res.id})
                        </span>
                    )
                ))}
                <p
                    style={{
                        fontSize: '0.8em',
                        color: resourceTypeSelected === resourceType ? '#888' : '#1e77c0ff',
                        cursor: 'pointer',
                        marginBottom: 8
                    }}
                    onClick={() => {
                        if (resourceTypeSelected !== resourceType) {
                            setResourceTypeSelected(resourceType);
                        }
                    }}
                    aria-disabled={resourceTypeSelected === resourceType}
                >
                    See more {formatKey(resourceType)}
                </p>
            </>
        );
    }
    // fallback to just showing IDs if no resource objects found
    return Array.isArray(resourceIds) ? (
        <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <div>
                    {resourceIds.map(id => (
                        <span key={id} style={{ display: 'block' }}>
                            {id}
                        </span>
                    ))}
                </div>
            </Box>
            <p
                style={{ fontSize: '0.8em', color: '#1e77c0ff', cursor: 'pointer', marginBottom: 8 }}
                onClick={() => {
                    setResourceTypeSelected(resourceType);
                }}
            >
                See more on {formatKey(resourceType)}
            </p>
        </>
    ) : (
        <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <span key={resourceIds} style={{ display: 'block' }}>
                    {resourceIds}
                </span>
            </Box>
            <p
                style={{ fontSize: '0.8em', color: '#1e77c0ff', cursor: 'pointer', marginBottom: 8 }}
                onClick={() => {
                    setResourceTypeSelected(resourceType);
                }}
            >
                See more on {formatKey(resourceType)}
            </p>
        </>
    );
}

export default ResourceSummary;
