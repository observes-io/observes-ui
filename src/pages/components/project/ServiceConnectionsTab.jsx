/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {

    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    MenuItem,
    Select,
    Chip
} from '@mui/material';
import useStore from '../../../state/stores/store';


const ServiceConnectionsTab = ({ projectId }) => {
    const [serviceConnections, setServiceConnections] = useState([]);
    const [serviceConnectionsTotal, setServiceConnectionsTotal] = useState(0);
    const [serviceConnectionsPage, setServiceConnectionsPage] = useState(1);
    const [serviceConnectionsSearch, setServiceConnectionsSearch] = useState('');
    const [serviceConnectionsMatchType, setServiceConnectionsMatchType] = useState('contains');
    const [serviceConnectionsSearchField, setServiceConnectionsSearchField] = useState('name'); // 'name', 'id', 'type'
    const [serviceConnectionsPerPage, setServiceConnectionsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { selectedScan, fetchEndpointsByOrgAndProject } = useStore();

    useEffect(() => {
        async function fetchConnections() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchEndpointsByOrgAndProject(selectedScan.id, projectId);
                    let allConnections = [];
                    if (result && Array.isArray(result.resources)) {
                        allConnections = result.resources;
                    } else {
                        allConnections = [];
                    }
                    setServiceConnections(allConnections);
                    setServiceConnectionsTotal(allConnections.length);
                } else {
                    setServiceConnections([]);
                    setServiceConnectionsTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch service connections');
                setServiceConnections([]);
                setServiceConnectionsTotal(0);
            }
            setLoading(false);
        }
        fetchConnections();
    }, [selectedScan, projectId, fetchEndpointsByOrgAndProject]);

    // Filtered connections and local pagination
    const filteredConnections = serviceConnectionsSearch
        ? serviceConnections.filter(sc => {
            let fieldValue = '';
            if (serviceConnectionsSearchField === 'name') {
                fieldValue = sc.name?.toLowerCase() || '';
            } else if (serviceConnectionsSearchField === 'type') {
                fieldValue = sc.type?.toLowerCase() || '';
            }
            const search = serviceConnectionsSearch.toLowerCase();
            switch (serviceConnectionsMatchType) {
                case 'exact':
                    return fieldValue === search;
                case 'starts':
                    return fieldValue.startsWith(search);
                case 'ends':
                    return fieldValue.endsWith(search);
                default:
                    return fieldValue.includes(search);
            }
        })
        : serviceConnections;

    // Chip counters for status (from filteredConnections)
    const readyCount = filteredConnections.filter(sc => sc.isReady).length;
    const notReadyCount = filteredConnections.filter(sc => sc.isReady === false).length;
    const otherCount = filteredConnections.length - readyCount - notReadyCount;
    // Count of all shared connections (from filteredConnections)
    const sharedCount = filteredConnections.filter(sc => sc.isShared).length;

    // Local pagination
    const pagedConnections = filteredConnections.slice((serviceConnectionsPage - 1) * serviceConnectionsPerPage, serviceConnectionsPage * serviceConnectionsPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setServiceConnectionsPage(1); }, [serviceConnectionsSearch, serviceConnectionsMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredConnections.length;
                            const start = filteredTotal === 0 ? 0 : (serviceConnectionsPage - 1) * serviceConnectionsPerPage + 1;
                            const end = Math.min(serviceConnectionsPage * serviceConnectionsPerPage, filteredTotal);
                            return `Service Connections (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for service connections */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={serviceConnectionsSearchField}
                        onChange={e => setServiceConnectionsSearchField(e.target.value)}
                        sx={{
                            width: 120,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 'none',
                            '& .MuiOutlinedInput-root': {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            },
                        }}
                    >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="type">Type</MenuItem>
                    </Select>
                    <Select
                        size="small"
                        value={serviceConnectionsMatchType}
                        onChange={e => setServiceConnectionsMatchType(e.target.value)}
                        sx={{
                            width: 120,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 'none',
                            ml: '-1px',
                            '& .MuiOutlinedInput-root': {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            },
                        }}
                    >
                        <MenuItem value="contains">Contains</MenuItem>
                        <MenuItem value="exact">Exact</MenuItem>
                        <MenuItem value="starts">Starts with</MenuItem>
                        <MenuItem value="ends">Ends with</MenuItem>
                    </Select>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search by ${serviceConnectionsSearchField}`}
                        value={serviceConnectionsSearch}
                        onChange={e => setServiceConnectionsSearch(e.target.value)}
                        sx={{
                            width: 200,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none',
                            ml: '-1px',
                            '& .MuiOutlinedInput-root': {
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                            },
                        }}
                    />
                </Box>
                {/* Chip counters for status and shared */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
                    <Chip label={`Ready: ${readyCount}`} color="success" size="small" />
                    <Chip label={`Not Ready: ${notReadyCount}`} color="error" size="small" />
                    <Chip label={`Other: ${otherCount}`} color="default" size="small" />
                    <Chip label={`Shared: ${sharedCount}`} color="info" size="small" />
                </Box>
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading service connections...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : serviceConnections.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No service connections found.
                </Typography>
            ) : pagedConnections.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No service connections found.
                </Typography>
            ) : (
                pagedConnections.map((sc) => {
                    let statusLabel = sc.isReady === true ? 'Ready' : (sc.isReady === false ? 'Not Ready' : 'Unknown');
                    let statusColor = sc.isReady === true ? 'success' : (sc.isReady === false ? 'error' : 'default');
                    const displayName = `${sc.name || 'N/A'}`;

                    // Shared chip logic (k_project_shared_from is an array)
                    let sharedChip = null;
                    if (sc.isShared && Array.isArray(sc.k_project_shared_from)) {
                        // If any shared_from.id matches projectId, it's Shared Out, else Shared In
                        const isSharedOut = sc.k_project_shared_from.some(f => f.Id === projectId);
                        if (isSharedOut) {
                            sharedChip = <Chip label="Shared Out" color="info" size="small" sx={{ ml: 1 }} />;
                        } else {
                            sharedChip = <Chip label="Shared In" color="secondary" size="small" sx={{ ml: 1 }} />;
                        }
                    }

                    return (
                        <Accordion
                            key={sc.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{displayName}</Typography>
                                    <Chip label={statusLabel} color={statusColor} size="small" />
                                    {sharedChip}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {sc.id}<br />
                                    <strong>Name:</strong> {sc.name || 'N/A'}<br />
                                    <strong>Type:</strong> {sc.type || 'N/A'}<br />
                                    <strong>Status:</strong> {statusLabel}<br />
                                    <strong>Is Ready:</strong> {String(sc.isReady)}<br />
                                    {sc.isShared && Array.isArray(sc.k_project_shared_from) &&
                                        // Only show 'Shared from' if not shared out (i.e., none of the ids match projectId)
                                        !sc.k_project_shared_from.some(f => f.id === projectId) && (
                                            <>
                                                <strong>Shared from:</strong> {sc.k_project_shared_from.map(f => f.name).join(', ') || 'N/A'}<br />
                                            </>
                                        )
                                    }
                                    {sc.isShared && Array.isArray(sc.k_projects_refs) && sc.k_projects_refs.length > 0 && (
                                        <>
                                            <strong>Shared to:</strong> {sc.k_projects_refs.map(f => f.name).join(', ') || 'N/A'}<br />
                                        </>
                                    )}
                                    <strong>URL:</strong> {sc.url ? (
                                        <a href={sc.url} target="_blank" rel="noopener noreferrer">View Connection</a>
                                    ) : 'N/A'}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                <Button
                    onClick={() => setServiceConnectionsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={serviceConnectionsPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {serviceConnectionsPage} of {Math.max(1, Math.ceil(serviceConnectionsTotal / serviceConnectionsPerPage))}
                </Typography>
                <Button
                    onClick={() => setServiceConnectionsPage((prev) => prev + 1)}
                    disabled={serviceConnectionsPage * serviceConnectionsPerPage >= serviceConnectionsTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

ServiceConnectionsTab.propTypes = {
    projectId: PropTypes.string.isRequired
};

export default ServiceConnectionsTab;