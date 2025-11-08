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
    Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import useStore from '../../../state/stores/store';


const PipelinesTab = ({ projectId }) => {
    const [pipelines, setPipelines] = useState([]);
    const [pipelinesTotal, setPipelinesTotal] = useState(0);
    const [pipelinePage, setPipelinePage] = useState(1);
    const [pipelineSearch, setPipelineSearch] = useState('');
    const [pipelineMatchType, setPipelineMatchType] = useState('contains');
    const [pipelinesPerPage, setPipelinesPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { selectedScan, fetchPipelinesByOrgAndProject } = useStore();

    // Fetch all pipelines for this project once, handle pagination locally
    useEffect(() => {
        async function fetchPipelines() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchPipelinesByOrgAndProject(selectedScan.id, projectId);
                    let allPipelines = [];
                    if (Array.isArray(result)) {
                        allPipelines = result;
                    } else if (result && Array.isArray(result.pipelines)) {
                        allPipelines = result.pipelines;
                    } else {
                        allPipelines = [];
                    }
                    setPipelines(allPipelines);
                    setPipelinesTotal(allPipelines.length);
                } else {
                    setPipelines([]);
                    setPipelinesTotal(0);
                }
            } catch (err) {
                console.error("Error fetching pipelines:", err);
                setError('Failed to fetch pipelines');
                setPipelines([]);
                setPipelinesTotal(0);
            }
            setLoading(false);
        }
        fetchPipelines();
    }, [selectedScan, projectId, fetchPipelinesByOrgAndProject]);


    // Filtered pipelines and local pagination
    const filteredPipelines = pipelineSearch
        ? pipelines.filter(p => {
            if (!p.name) return false;
            const name = p.name.toLowerCase();
            const search = pipelineSearch.toLowerCase();
            switch (pipelineMatchType) {
                case 'exact':
                    return name === search;
                case 'starts':
                    return name.startsWith(search);
                case 'ends':
                    return name.endsWith(search);
                default:
                    return name.includes(search);
            }
        })
        : pipelines;


    // Chip counters for YAML and Classic pipelines (from filteredPipelines)
    const yamlCount = filteredPipelines.filter(p => p.process && p.process.type === 2).length;
    const classicCount = filteredPipelines.filter(p => p.process && p.process.type === 1).length;

    // Chip counters for enabled/disabled pipelines (from filteredPipelines)
    const enabledCount = filteredPipelines.filter(p => p.queueStatus === 'enabled').length;
    const disabledCount = filteredPipelines.filter(p => p.queueStatus === 'disabled').length;

    // Local pagination
    const pagedPipelines = filteredPipelines.slice((pipelinePage - 1) * pipelinesPerPage, pipelinePage * pipelinesPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setPipelinePage(1); }, [pipelineSearch, pipelineMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredPipelines.length;
                            const start = filteredTotal === 0 ? 0 : (pipelinePage - 1) * pipelinesPerPage + 1;
                            const end = Math.min(pipelinePage * pipelinesPerPage, filteredTotal);
                            return `Pipelines (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>

                {/* InputGroup-like filter controls for pipelines */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={pipelineMatchType}
                        onChange={e => setPipelineMatchType(e.target.value)}
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
                        <MenuItem value="contains">Contains</MenuItem>
                        <MenuItem value="exact">Exact</MenuItem>
                        <MenuItem value="starts">Starts with</MenuItem>
                        <MenuItem value="ends">Ends with</MenuItem>
                    </Select>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search pipelines"
                        value={pipelineSearch}
                        onChange={e => setPipelineSearch(e.target.value)}
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
                {/* Chip counters for YAML/Classic and Enabled/Disabled pipelines */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
                    <Chip label={`YAML: ${yamlCount}`} color="success" size="small" />
                    <Chip label={`Classic: ${classicCount}`} color="warning" size="small" />
                    <Chip label={`Enabled: ${enabledCount}`} color="primary" size="small" />
                    <Chip label={`Disabled: ${disabledCount}`} color="error" size="small" />
                </Box>
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading pipelines...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : pipelines.length === 0 ? (
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
                    No pipelines found.
                </Typography>
            ) : pagedPipelines.length === 0 ? (
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
                    No pipelines found.
                </Typography>
            ) : (
                pagedPipelines.map((pipeline) => {
                    let typeLabel = 'Unknown';
                    let chipColor = 'default';
                    if (pipeline.process && pipeline.process.type === 1) {
                        typeLabel = 'Classic';
                        chipColor = 'warning';
                    } else if (pipeline.process && pipeline.process.type === 2) {
                        typeLabel = 'YAML';
                        chipColor = 'success';
                    }
                    let statusLabel = 'Unknown';
                    let statusColor = 'default';
                    if (pipeline.queueStatus === 'enabled') {
                        statusLabel = 'Enabled';
                        statusColor = 'primary';
                    } else if (pipeline.queueStatus === 'disabled') {
                        statusLabel = 'Disabled';
                        statusColor = 'error';
                    }
                    return (
                        <Accordion
                            key={pipeline.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{pipeline.name}</Typography>
                                    <Chip label={typeLabel} color={chipColor} size="small" />
                                    <Chip label={statusLabel} color={statusColor} size="small" />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {pipeline.id}<br />
                                    <strong>Type:</strong> {typeLabel}<br />
                                    <strong>Status:</strong> {statusLabel}<br />
                                    <strong>Created:</strong> {pipeline.createdDate ? dayjs(pipeline.createdDate).format('YYYY-MM-DD') : 'N/A'}<br />
                                    <strong>Last Updated:</strong> {pipeline.updatedDate ? dayjs(pipeline.updatedDate).format('YYYY-MM-DD') : 'N/A'}<br />
                                    <strong>URL:</strong> {pipeline._links?.web?.href ? (
                                        <a href={pipeline._links.web.href} target="_blank" rel="noopener noreferrer">View Pipeline</a>
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
                    onClick={() => setPipelinePage((prev) => Math.max(prev - 1, 1))}
                    disabled={pipelinePage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {pipelinePage} of {Math.max(1, Math.ceil(pipelinesTotal / pipelinesPerPage))}
                </Typography>
                <Button
                    onClick={() => setPipelinePage((prev) => prev + 1)}
                    disabled={pipelinePage * pipelinesPerPage >= pipelinesTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

PipelinesTab.propTypes = {
    projectId: PropTypes.string.isRequired
};

export default PipelinesTab;