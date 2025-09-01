import React, { useState } from 'react';
import {
    Box, Typography, Accordion, AccordionSummary, AccordionDetails,
    Grid, Card, CardContent, List, ListItem, ListItemText, Badge, Divider, Chip, Tabs, Tab, Table, TableBody, TableRow, TableCell, Button
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
                        data.cicd_sast.map((alert, idx) => (
                            <Accordion key={idx} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }} defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                        <Typography sx={{ userSelect: "text", mr: 2 }} variant="h6">{alert.engine}</Typography>
                                        <Typography sx={{ userSelect: "text", mr: 2 }} variant="body2" color="text.secondary">
                                            {/* Scope: {alert.scope === "potential_pipeline_execution_yaml" ? "Potential Execution" : "Execution"} */}
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
                                    {alert.results?.length > 0 ? (
                                        alert.results.map((result, rIdx) => (
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
                                        ))
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {/* You can use a success icon here if desired */}
                                            <Typography variant="body2" color="text.secondary">
                                                No alerts triggered.
                                            </Typography>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))
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
                        {build?.yaml || 'No YAML available'}
                    </pre>
                </>
            )}

            {tab === 1 && (
                <Box>
                    {build?.cicd_sast?.length > 0 ? (
                        build.cicd_sast.map((alert, idx) => (
                            <Accordion key={idx} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }} defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                        <Typography sx={{ userSelect: "text", mr: 2 }} variant="h6">{alert.engine}</Typography>
                                        <Typography sx={{ userSelect: "text", mr: 2 }} variant="body2" color="text.secondary">
                                            {/* Scope: {alert.scope === "potential_pipeline_execution_yaml" ? "Potential Execution" : "Execution"} */}
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
                                    {alert.results?.length > 0 ? (
                                        alert.results.map((result, rIdx) => (
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
                                        ))
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {/* You can use a success icon here if desired */}
                                            <Typography variant="body2" color="text.secondary">
                                                No alerts triggered.
                                            </Typography>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))
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

// Top-level helper component for async resource summary fetching and rendering
function ResourceSummary({ selectedScanId, resourceType, resourceTypeSelected, resourceIds, getProtectedResourcesByOrgTypeAndIdsSummary, setResourceTypeSelected, formatKey }) {
    const [summary, setSummary] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        setLoading(true);
        async function fetchSummary() {
            try {
                const result = await getProtectedResourcesByOrgTypeAndIdsSummary(selectedScanId, resourceType, resourceIds);
                setSummary(result);

            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, [selectedScanId, resourceType, resourceIds, getProtectedResourcesByOrgTypeAndIdsSummary]);

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
    ) : <>
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
    </>;
}

const PipelineDetail = ({ pipeline, builds, filteredResourcesTypes_Ids, formatKey, repositories, variableGroups, secureFiles, pools, endpoints, resourceTypeSelected, selectedScan, setResourceTypeSelected, getProtectedResourcesByOrgTypeAndIdsSummary }) => {
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
            <Card sx={{ mb: 2, backgroundColor: 'white', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography><strong>AuthZ Scope: </strong>
                                <span
                                    style={{
                                        color: pipeline.jobAuthorizationScope === 'projectCollection' ? 'orange' : 'inherit',
                                    }}
                                > {pipeline.jobAuthorizationScope}
                                </span>
                            </Typography>
                        </Grid>

                        <Grid item ><strong>Pool:</strong> {pipeline.queue.name}</Grid>

                        <Grid item >
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
                                <Grid item ><strong>Trigger Type:</strong> {trigger.triggerType}</Grid>
                            }
                            {trigger.branchFilters.length > 0 &&
                                <Grid item ><strong>Branch Filters:</strong> {trigger.branchFilters.join(', ')}</Grid>
                            }
                            {trigger.branchFilters.length > 0 &&
                                <Grid item ><strong>Path Filters:</strong> {trigger.pathFilters.join(', ') || 'None'}</Grid>
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
                                            <Grid item sx={{ ml: 1 }}>
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
                                                                        selectedScanId={selectedScan.id}
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
                                <Button onClick={handlePreviousBranch} disabled={branchOptions.length <= 1}>
                                    <ArrowBackIosIcon />
                                </Button>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {branchOptions.map((branch, index) => {
                                            const hasScanResults = pipeline.builds.preview[branch]?.cicd_sast?.some(scan => scan.results?.length > 0);
                                            return (
                                                <span
                                                    key={branch}
                                                    style={{
                                                        marginRight: '8px',
                                                        color: index === selectedExecutionIndex ? (hasScanResults ? 'red' : 'black') : (hasScanResults ? '#b32400' : 'grey'),
                                                        fontWeight: index === selectedBranchIndex ? 'bold' : 'normal',
                                                        fontSize: index === selectedBranchIndex ? '0.9rem' : '0.85rem',
                                                        border: '1px solid lightgrey',
                                                        borderRadius: '4px',
                                                        padding: '2px 6px',
                                                    }}
                                                >
                                                    {branch}
                                                </span>
                                            );
                                        })}
                                    </Typography>
                                </Box>
                                <Button onClick={handleNextBranch} disabled={branchOptions.length <= 1}>
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
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {pipeline.builds.builds.map((buildId, index) => {
                                                const build = Array.isArray(builds) ? builds.find(b => b?.id == buildId) : Object.values(builds).find(b => b?.id === buildId);
                                                const hasScanResults = build?.cicd_sast?.some(scan => scan.results?.length > 0);

                                                return (
                                                    <span
                                                        key={buildId}
                                                        style={{
                                                            marginRight: '8px',
                                                            color: index === selectedExecutionIndex ? (hasScanResults ? 'red' : 'black') : (hasScanResults ? '#b32400' : 'grey'),
                                                            fontWeight: index === selectedExecutionIndex ? 'bold' : 'normal',
                                                            fontSize: index === selectedExecutionIndex ? '0.9rem' : '0.85rem',
                                                            border: '1px solid lightgrey',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                        }}
                                                    >
                                                        {build && build['buildNumber'] || 'Execution (Does not match filter)'}
                                                    </span>
                                                );
                                            })}
                                        </Typography>
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
                                        <Grid item ><strong>Enabled:</strong> {String(option.enabled)}</Grid>
                                        <Grid item ><strong>Definition ID:</strong> {option.definition?.id}</Grid>
                                        <Grid item ><strong>Inputs:</strong></Grid>
                                        <Grid item >
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
                                    <Grid item key={key}>
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