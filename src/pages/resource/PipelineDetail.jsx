/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useState } from 'react';
import {
    Box, Typography, Accordion, AccordionSummary, AccordionDetails,
    Grid, Card, CardContent, List, ListItem, ListItemText, Badge, Divider, Chip, Tabs, Tab, Table, TableBody, TableRow, TableCell, Button, Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MemoryIcon from '@mui/icons-material/Memory';
import FolderIcon from '@mui/icons-material/Folder';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import KeyIcon from '@mui/icons-material/Key';
import MailLockIcon from '@mui/icons-material/MailLock';
import { Warning as WarningIcon } from '@mui/icons-material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import MetadataSection from './MetadataSection';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ResourceSummary from './ResourceSummary';



const codeBlockStyle = {
    backgroundColor: '#f5f5f5',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    padding: '12px',
    borderRadius: '6px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowX: 'auto',
};

const BranchSection = ({ branch, data }) => {
    const [tab, setTab] = useState(0);

    return (
        <Card sx={{ mb: 2, backgroundColor: '#fff', boxShadow: 0, border: 'none' }}>
            {/* <Typography variant="h6" sx={{ mb: 1 }}>{branch}</Typography> */}

            <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 2 }}>
                <Tab label="YAML" />
                <Tab
                    label="CICD SAST"
                    disabled={!data?.cicd_sast || Object.keys(data.cicd_sast).length === 0}
                    sx={{
                        color: data?.cicd_sast?.some(scan => scan.results?.length > 0) ? 'red' : 'inherit',
                        ...(data?.cicd_sast && Object.keys(data.cicd_sast).length === 0 && { color: 'grey' })
                    }}
                />
            </Tabs>

            {tab === 0 && (
                <>
                    <pre style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxHeight: '300px',
                        overflow: 'auto',
                        maxWidth: '100%'
                    }}>
                        {data?.yaml || 'No YAML available'}
                    </pre>
                </>
            )}

            {tab === 1 && (
                <Box>
                    {data?.cicd_sast?.length > 0 ? (
                        data.cicd_sast.map((alert, idx) => {
                            // Group results by category
                            const groupedByCategory = (alert.results || []).reduce((acc, result) => {
                                const category = result.category || 'Uncategorized';
                                if (!acc[category]) {
                                    acc[category] = {
                                        description: result.description || '',
                                        severity: result.severity || '',
                                        results: []
                                    };
                                }
                                acc[category].results.push(result);
                                return acc;
                            }, {});

                            return (
                                <Accordion key={idx} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }} defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                            <Typography sx={{ userSelect: "text", mr: 2 }} variant="h6">{alert.engine}</Typography>
                                            <Typography sx={{ userSelect: "text", mr: 2 }} variant="body2" color="text.secondary">
                                                {(() => {
                                                    switch (alert.scope) {
                                                        case 'pipeline_yaml':
                                                            return 'Scan of pipeline definition file';
                                                        case 'pipeline_execution_logs':
                                                            return 'Scan of execution logs';
                                                        case 'build_logs':
                                                            return 'Build logs';
                                                        default:
                                                            return 'Build Execution Logs';
                                                    }
                                                })()}
                                            </Typography>
                                            <Chip
                                                label={`${alert.results?.length || 0} result${alert.results?.length !== 1 ? "s" : ""}`}
                                                color={alert.results?.length > 0 ? "error" : "success"}
                                                size="small"
                                                sx={{ mt: 1, alignSelf: "center" }}
                                            />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {Object.keys(groupedByCategory).length > 0 ? (
                                            Object.entries(groupedByCategory).map(([category, categoryData], catIdx) => (
                                                <Box key={catIdx} sx={{ mb: 3 }}>
                                                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                                                        <Typography variant="h6" sx={{ mb: 1 }}>
                                                            {category}
                                                            {categoryData.severity && (
                                                                <Chip
                                                                    label={categoryData.severity}
                                                                    size="small"
                                                                    color={categoryData.severity === 'high' ? 'error' : categoryData.severity === 'medium' ? 'warning' : 'default'}
                                                                    sx={{ ml: 2 }}
                                                                />
                                                            )}
                                                        </Typography>
                                                        {categoryData.description && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {categoryData.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {categoryData.results.map((result, rIdx) => (
                                                        <Box
                                                            key={rIdx}
                                                            sx={{
                                                                mb: 2,
                                                                p: 2,
                                                                border: "1px solid #eee",
                                                                borderRadius: 2,
                                                                backgroundColor: "#fafafa",
                                                            }}
                                                        >
                                                            <Typography variant="body2">
                                                                <strong>Source:</strong> {result.source ? (
                                                                    <a href={result.source} target="_blank" rel="noopener noreferrer">{result.source}</a>
                                                                ) : 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Match:</strong>{" "}
                                                                <span style={{ color: "red", fontWeight: 600 }}>{result.match || 'N/A'}</span>
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Pattern:</strong> {result.pattern || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Start:</strong> {result.start ?? 'N/A'}, <strong>End:</strong> {result.end ?? 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ))
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No alerts triggered.
                                                </Typography>
                                            </Box>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No scan results available.
                        </Typography>
                    )}
                </Box>
            )}
        </Card>
    );
};

const ExecutionSection = ({ build }) => {
    const [tab, setTab] = useState(0);


    return (
        <Card sx={{ mb: 2, backgroundColor: '#fff', boxShadow: 0, border: 'none' }}>
            {/* <Typography variant="h6" sx={{ mb: 1 }}>{build.sourceBranch}</Typography> */}

            <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 2 }}>
                <Tab label="YAML" />
                <Tab
                    label="CICD SAST"
                    disabled={!build?.cicd_sast || Object.keys(build.cicd_sast).length === 0}
                    sx={{
                        color: build?.cicd_sast?.some(scan => scan.results?.length > 0) ? 'red' : 'inherit',
                        ...(build?.cicd_sast && Object.keys(build.cicd_sast).length === 0 && { color: 'grey' })
                    }}
                />
            </Tabs>

            {tab === 0 && (
                <Box sx={{ width: '100%' }}>
                    <pre style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxHeight: '300px',
                        overflow: 'auto',
                        width: '100%',
                        boxSizing: 'border-box',
                        margin: 0
                    }}>
                        {build?.yaml || 'No YAML available'}
                    </pre>
                </Box>
            )}

            {tab === 1 && (
                <Box>
                    {build?.cicd_sast?.length > 0 ? (
                        build.cicd_sast.map((alert, idx) => {
                            // Group results by category
                            const groupedByCategory = (alert.results || []).reduce((acc, result) => {
                                const category = result.category || 'Uncategorized';
                                if (!acc[category]) {
                                    acc[category] = {
                                        description: result.description || '',
                                        severity: result.severity || '',
                                        results: []
                                    };
                                }
                                acc[category].results.push(result);
                                return acc;
                            }, {});

                            return (
                                <Accordion key={idx} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }} defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                            <Typography sx={{ userSelect: "text", mr: 2 }} variant="h6">{alert.engine}</Typography>
                                            <Typography sx={{ userSelect: "text", mr: 2 }} variant="body2" color="text.secondary">
                                                {(() => {
                                                    switch (alert.scope) {
                                                        case 'pipeline_yaml':
                                                            return 'Scan of pipeline definition file';
                                                        case 'pipeline_execution_logs':
                                                            return 'Scan of execution logs';
                                                        case 'build_logs':
                                                            return 'Build logs';
                                                        default:
                                                            return 'Build Execution Logs';
                                                    }
                                                })()}
                                            </Typography>
                                            <Chip
                                                label={`${alert.results?.length || 0} result${alert.results?.length !== 1 ? "s" : ""}`}
                                                color={alert.results?.length > 0 ? "error" : "success"}
                                                size="small"
                                                sx={{ mt: 1, alignSelf: "center" }}
                                            />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {Object.keys(groupedByCategory).length > 0 ? (
                                            Object.entries(groupedByCategory).map(([category, categoryData], catIdx) => (
                                                <Box key={catIdx} sx={{ mb: 3 }}>
                                                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                                                        <Typography variant="h6" sx={{ mb: 1 }}>
                                                            {category}
                                                            {categoryData.severity && (
                                                                <Chip
                                                                    label={categoryData.severity}
                                                                    size="small"
                                                                    color={categoryData.severity === 'high' ? 'error' : categoryData.severity === 'medium' ? 'warning' : 'default'}
                                                                    sx={{ ml: 2 }}
                                                                />
                                                            )}
                                                        </Typography>
                                                        {categoryData.description && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {categoryData.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {categoryData.results.map((result, rIdx) => (
                                                        <Box
                                                            key={rIdx}
                                                            sx={{
                                                                mb: 2,
                                                                p: 2,
                                                                border: "1px solid #eee",
                                                                borderRadius: 2,
                                                                backgroundColor: "#fafafa",
                                                            }}
                                                        >
                                                            <Typography variant="body2">
                                                                <strong>Source:</strong> {result.source ? (
                                                                    <a href={result.source} target="_blank" rel="noopener noreferrer">{result.source}</a>
                                                                ) : 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Match:</strong>{" "}
                                                                <span style={{ color: "red", fontWeight: 600 }}>{result.match || 'N/A'}</span>
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Pattern:</strong> {result.pattern || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Start:</strong> {result.start ?? 'N/A'}, <strong>End:</strong> {result.end ?? 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ))
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No alerts triggered.
                                                </Typography>
                                            </Box>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No scan results available.
                        </Typography>
                    )}
                </Box>
            )}
        </Card>
    );
};

const PipelineDetail = ({ pipeline, builds, filteredResourcesTypes_Ids, formatKey, repositories, variableGroups, secureFiles, pools, endpoints, resourceTypeSelected, selectedPlatformSource, setResourceTypeSelected, getProtectedResourcesByOrgTypeAndIdsSummary }) => {
    const branchOptions = Object.keys(pipeline.builds.preview || {});
    const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
    const [showResourcePermissions, setShowResourcePermissions] = useState(true);
    const [showPreviewExecutions, setShowPreviewExecutions] = useState(true);
    const [showExecutions, setShowExecutions] = useState(true);
    const [selectedExecutionIndex, setSelectedExecutionIndex] = useState(0);

    const handleNextBranch = () => {
        setSelectedBranchIndex((prevIndex) => (prevIndex + 1) % branchOptions.length);
    };

    const handlePreviousBranch = () => {
        setSelectedBranchIndex((prevIndex) => (prevIndex - 1 + branchOptions.length) % branchOptions.length);
    };

    const handleNextExecution = () => {
        setSelectedExecutionIndex((prevIndex) => (prevIndex + 1) % pipeline.builds.builds.length);
    };

    const handlePreviousExecution = () => {
        setSelectedExecutionIndex((prevIndex) => (prevIndex - 1 + pipeline.builds.builds.length) % pipeline.builds.builds.length);
    };

    const selectedBranch = branchOptions[selectedBranchIndex];

    return (
        <Box p={2}>
            {/* Pipeline Name Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    <Link 
                        href={pipeline._links?.web?.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        underline="hover"
                        sx={{ 
                            color: 'primary.main',
                            fontWeight: 500,
                            '&:hover': {
                                color: 'primary.dark'
                            }
                        }}
                    >
                        {pipeline.name}
                    </Link>
                </Typography>
            </Box>

            <Card sx={{ mb: 2, backgroundColor: 'white', alignItems: 'flex-start', flexDirection: 'column', width: '100%' }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography><strong>AuthZ Scope: </strong>
                                <span
                                    style={{
                                        color: pipeline.jobAuthorizationScope === 'projectCollection' ? 'orange' : 'inherit',
                                    }}
                                > {pipeline.jobAuthorizationScope}
                                </span>
                            </Typography>
                        </Grid>

                        <Grid><strong>Pool:</strong> {pipeline.queue.name}</Grid>

                        <Grid>
                            {pipeline.process.type == 1 && (
                                <strong>Designer Pipeline</strong>
                            )}
                            {pipeline.process.type == 2 && (
                                <Typography>
                                    <strong>YAML</strong> on {pipeline.process.yamlFilename}
                                </Typography>
                            )}
                        </Grid>

                    </Grid>
                    {pipeline.triggers ? pipeline.triggers.map((trigger, index) => (
                        <Grid container spacing={1} sx={{ mt: 2 }} key={index}>
                            {trigger.triggerType &&
                                <Grid><strong>Trigger Type:</strong> {trigger.triggerType}</Grid>
                            }
                            {trigger.branchFilters.length > 0 &&
                                <Grid><strong>Branch Filters:</strong> {trigger.branchFilters.join(', ')}</Grid>
                            }
                            {trigger.branchFilters.length > 0 &&
                                <Grid><strong>Path Filters:</strong> {trigger.pathFilters.join(', ') || 'None'}</Grid>
                            }
                        </Grid>
                    )) : <Grid container spacing={1} sx={{ mt: 2 }}>
                        <Typography>No triggers configured.</Typography>
                    </Grid>}

                    <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
                        <Chip
                            label="Pipeline Permissions on Resources"
                            size="small"
                            onClick={() => setShowResourcePermissions(!showResourcePermissions)}
                            sx={{ cursor: 'pointer' }}
                        />
                    </Divider>

                    {showResourcePermissions && (
                        <>
                            {pipeline.resourcepermissions ? (
                                Object.entries(pipeline.resourcepermissions).map(([key, value]) => (
                                    key.toLowerCase() === 'queue' ? null : (
                                        <Box
                                            key={key}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                marginBottom: 1,
                                                borderRadius: '4px',
                                                padding: '4px',
                                                ...(value.some((id) => filteredResourcesTypes_Ids.includes(id)) && {
                                                    border: '1px solid purple',
                                                    boxShadow: "0 0 5px grey",
                                                })
                                            }}
                                        >
                                            <Grid sx={{ ml: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {(() => {
                                                        switch (key.toLowerCase()) {
                                                            case 'pool_merged':
                                                                return <MemoryIcon fontSize="small" />;
                                                            case 'repository':
                                                                return <FolderIcon fontSize="small" />;
                                                            case 'endpoint':
                                                                return <FingerprintIcon fontSize="small" />;
                                                            case 'variablegroup':
                                                                return <KeyIcon fontSize="small" />;
                                                            case 'securefile':
                                                                return <MailLockIcon fontSize="small" />;
                                                            default:
                                                                return <ErrorOutlineIcon fontSize="small" />;
                                                        }
                                                    })()}
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                            <strong>{formatKey(key)}:</strong>
                                                        </Typography>
                                                        <Typography>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                                                                <Typography>
                                                                    <ResourceSummary
                                                                        selectedPlatformSourceId={selectedPlatformSource.id}
                                                                        resourceType={key}
                                                                        resourceIds={value}
                                                                        getProtectedResourcesByOrgTypeAndIdsSummary={getProtectedResourcesByOrgTypeAndIdsSummary}
                                                                        setResourceTypeSelected={setResourceTypeSelected}
                                                                        resourceTypeSelected={resourceTypeSelected}
                                                                        formatKey={formatKey}
                                                                    />
                                                                </Typography>
                                                            </Box>
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Box>
                                    )
                                ))
                            ) : (
                                <>This pipeline has no permissions on resources</>
                            )}
                        </>
                    )}

                    <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
                        <Chip
                            label="Preview Executions"
                            size="small"
                            onClick={() => setShowPreviewExecutions(!showPreviewExecutions)}
                            sx={{ cursor: 'pointer' }}
                        />
                    </Divider>

                    {showPreviewExecutions && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Button onClick={handlePreviousBranch} disabled={branchOptions.length <= 1} sx={{ minWidth: 36, width: 36 }}>
                                    <ArrowBackIosIcon />
                                </Button>
                                <Box sx={{ textAlign: 'center', display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {branchOptions.map((branch, index) => {
                                        const hasScanResults = pipeline.builds.preview[branch]?.cicd_sast?.some(scan => scan.results?.length > 0);
                                        return (
                                            <Button
                                                key={branch}
                                                onClick={() => setSelectedBranchIndex(index)}
                                                variant={index === selectedBranchIndex ? 'contained' : 'outlined'}
                                                color={hasScanResults ? 'error' : (index === selectedBranchIndex ? 'primary' : 'inherit')}
                                                sx={{
                                                    width: 110,
                                                    height: 46,
                                                    marginRight: 1,
                                                    fontWeight: index === selectedBranchIndex ? 'bold' : 'normal',
                                                    fontSize: index === selectedBranchIndex ? '0.9rem' : '0.85rem',
                                                    border: '1px solid lightgrey',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    color: index === selectedBranchIndex ? (hasScanResults ? 'white' : 'black') : (hasScanResults ? '#b32400' : 'grey'),
                                                    backgroundColor: index === selectedBranchIndex ? (hasScanResults ? '#d32f2f' : '#e3e3e3') : 'white',
                                                    boxShadow: index === selectedBranchIndex ? 2 : 0,
                                                    transition: 'background 0.2s, color 0.2s',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                                title={branch}
                                            >
                                                <span style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', textAlign: 'center' }}>{branch}</span>
                                            </Button>
                                        );
                                    })}
                                </Box>
                                <Button onClick={handleNextBranch} disabled={branchOptions.length <= 1} sx={{ minWidth: 36, width: 36 }}>
                                    <ArrowForwardIosIcon />
                                </Button>
                            </Box>
                            <MetadataSection pipeline={pipeline} branch={selectedBranch} />

                            {selectedBranch && (
                                <BranchSection
                                    key={selectedBranch}
                                    branch={selectedBranch}
                                    data={pipeline.builds.preview[selectedBranch]}
                                />
                            )}
                        </Box>
                    )}

                    <Divider sx={{ mt: 2, mb: 2, width: '100%' }}>
                        <Chip
                            label="Executions"
                            size="small"
                            onClick={() => setShowExecutions(!showExecutions)}
                            sx={{ cursor: 'pointer' }}
                        />
                    </Divider>
                    {showExecutions && (
                        Array.isArray(pipeline.builds?.builds) && pipeline.builds.builds.length > 0 ? (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Button onClick={handlePreviousExecution} disabled={pipeline.builds.builds.length <= 1}>
                                        <ArrowBackIosIcon />
                                    </Button>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1, flexWrap: 'wrap' }}>
                                            {pipeline.builds.builds.map((buildId, index) => {
                                                const build = Array.isArray(builds) ? builds.find(b => b?.id == buildId) : Object.values(builds).find(b => b?.id === buildId);
                                                const hasScanResults = build?.cicd_sast?.some(scan => scan.results?.length > 0);
                                                return (
                                                    <Button
                                                        key={buildId}
                                                        onClick={() => setSelectedExecutionIndex(index)}
                                                        variant={index === selectedExecutionIndex ? 'contained' : 'outlined'}
                                                        color={hasScanResults ? 'error' : (index === selectedExecutionIndex ? 'primary' : 'inherit')}
                                                        sx={{
                                                            width: 110,
                                                            height: 46,
                                                            marginRight: 1,
                                                            fontWeight: index === selectedExecutionIndex ? 'bold' : 'normal',
                                                            fontSize: index === selectedExecutionIndex ? '0.9rem' : '0.85rem',
                                                            border: '1px solid lightgrey',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                            color: index === selectedExecutionIndex ? (hasScanResults ? 'white' : 'black') : (hasScanResults ? '#b32400' : 'grey'),
                                                            backgroundColor: index === selectedExecutionIndex ? (hasScanResults ? '#d32f2f' : '#e3e3e3') : 'white',
                                                            boxShadow: index === selectedExecutionIndex ? 2 : 0,
                                                            transition: 'background 0.2s, color 0.2s',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                        title={build && build['buildNumber'] || 'Execution (Does not match filter)'}
                                                    >
                                                        <span style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', textAlign: 'center' }}>{build && build['buildNumber'] || 'Execution (Does not match filter)'}</span>
                                                    </Button>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                    <Button onClick={handleNextExecution} disabled={pipeline.builds.builds.length <= 1}>
                                        <ArrowForwardIosIcon />
                                    </Button>
                                </Box>

                                <Card sx={{ mb: 2, backgroundColor: '#fff', boxShadow: 0, border: 'none' }}>
                                    {(() => {
                                        const buildId = pipeline.builds.builds[selectedExecutionIndex];
                                        const build = Array.isArray(builds)
                                            ? builds.find(b => b?.id == buildId)
                                            : Object.values(builds).find(b => b?.id === buildId);
                                        return (
                                            <>
                                                <MetadataSection build={build} />
                                                <ExecutionSection build={build} />

                                            </>
                                        );
                                    })()}
                                </Card>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No pipeline executions yet.
                            </Typography>
                        )
                    )}

                </CardContent>
            </Card>

            {/* OPTIONS */}
            {/* {pipeline.options?.length > 0 && (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Pipeline Options</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {pipeline.options?.length ? pipeline.options.map((option, index) => (
                            <Card key={index} sx={{ mb: 2, backgroundColor: '#fff' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Option #{index + 1}
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid><strong>Enabled:</strong> {String(option.enabled)}</Grid>
                                        <Grid><strong>Definition ID:</strong> {option.definition?.id}</Grid>
                                        <Grid><strong>Inputs:</strong></Grid>
                                        <Grid>
                                            <pre style={codeBlockStyle}>{JSON.stringify(option.inputs, null, 2)}</pre>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )) : <Typography>No options defined.</Typography>}
                    </AccordionDetails>
                </Accordion>)
            } */}

            {/* VARIABLES */}
            {pipeline.variables?.length > 0 && (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Pipeline Variables</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {pipeline.variables ? (
                            <Grid container spacing={2}>
                                {Object.entries(pipeline.variables).map(([key, value]) => (
                                    <Grid key={key}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="subtitle2">{key}</Typography>
                                                <Typography>
                                                    <strong>Value:</strong> {value.isSecret ? '••••••••' : value.value ?? 'null'}
                                                </Typography>
                                                {value.allowOverride && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Allow Override
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography>No variables defined.</Typography>
                        )}
                    </AccordionDetails>
                </Accordion>
            )
            }
        </Box>
    );
};

export default PipelineDetail;