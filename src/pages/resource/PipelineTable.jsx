/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useState, useEffect, useRef } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
    Badge,
    Box,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Collapse,
    Typography,
    List,
    ListItem,
    ListItemText,
    Grid,
    Accordion, AccordionSummary, AccordionDetails,
    Tab,
    TablePagination,
    Link,
    Button,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { KeyboardArrowDown, KeyboardArrowUp, ErrorOutline } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as d3 from 'd3';
import resourceTypeStyle from '../theme/resourceTypeStyle.js';
import { CheckCircle, Cancel } from '@mui/icons-material';
import MemoryIcon from '@mui/icons-material/Memory';
import FolderIcon from '@mui/icons-material/Folder';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import KeyIcon from '@mui/icons-material/Key';
import MailLockIcon from '@mui/icons-material/MailLock';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import PipelineDetail from './PipelineDetail';


const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options).replace(',', '');
};

const formatResourcePermissions = (permissions) => {
    let formatedPermissions = {};
    permissions.forEach((permission) => {
        let [type, id] = permission.split(/_(?=[^_]*$)/);
        if (type !== 'queue') {
            if (!formatedPermissions[type]) {
                formatedPermissions[type] = [];
            }
            formatedPermissions[type].push(permission);
        }
    })

    return formatedPermissions;
}

const formatKey = (key) => {
    switch (key.toLowerCase()) {
        case 'repository':
            return 'Repositories';
        case 'endpoint':
            return 'Service Connections';
        case 'pool_merged':
            return 'Pools';
        case 'variablegroup':
            return 'Variable Groups';
        case 'securefile':
            return 'Secure File';
        default:
            return key;
    }
};



const PipelineTable = ({ filteredPipelines, allPipelines, filterFocus, filteredBadge, filteredResourcesTypes_Ids, builds, repositories, variableGroups, secureFiles, pools, endpoints, resourceTypeSelected, setResourceTypeSelected, getProtectedResourcesByOrgTypeAndIdsSummary, selectedPlatformSource, fetchResources }) => {
    const [openRows, setOpenRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [highlightedPipelines, setHighlightedPipelines] = useState(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadMode, setDownloadMode] = useState('filtered'); // 'filtered' or 'all'
    
    // State to hold all resource types for CSV export
    const [allResources, setAllResources] = useState({
        endpoints: endpoints || [],
        variableGroups: variableGroups || [],
        secureFiles: secureFiles || [],
        repositories: repositories || [],
        pools: pools || []
    });



    useEffect(() => {
        if (filteredPipelines === null) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [filteredPipelines]);

    // Update allResources when individual resource props change
    useEffect(() => {
        setAllResources(prev => ({
            ...prev,
            endpoints: endpoints || prev.endpoints,
            variableGroups: variableGroups || prev.variableGroups,
            secureFiles: secureFiles || prev.secureFiles,
            repositories: repositories || prev.repositories,
            pools: pools || prev.pools
        }));
    }, [endpoints, variableGroups, secureFiles, repositories, pools]);

    useEffect(() => {
        if (!filteredPipelines) return;
        
        const highlighted = new Set();
        Object.values(filteredPipelines).map((pipeline) => {
            if (pipeline.resourcepermissions) {
                Object.entries(pipeline.resourcepermissions).forEach(([key, value]) => {
                    if (value.some((id) => filteredResourcesTypes_Ids.includes(key + "_" + id))) {
                        highlighted.add(pipeline.id);
                    }
                });
            }
        });
        setHighlightedPipelines(highlighted);
    }, [filteredPipelines, filteredResourcesTypes_Ids]);

    const handleClick = (id) => {
        setOpenRows((prevOpenRows) => ({
            ...prevOpenRows,
            [id]: !prevOpenRows[id],
        }));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Helper function to escape CSV values
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    // Get builds for a specific pipeline
    const getPipelineBuilds = (pipelineId) => {
        if (!builds || !Array.isArray(builds)) return [];
        return builds.filter(build => String(build.definition?.id) === String(pipelineId));
    };

    // Count builds with alerts for a pipeline
    const countBuildsWithAlerts = (pipelineId) => {
        const pipelineBuilds = getPipelineBuilds(pipelineId);
        return pipelineBuilds.filter(build => {
            return Array.isArray(build.cicd_sast) && 
                   build.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0);
        }).length;
    };

    // Get alert categories for a pipeline
    const getAlertCategories = (pipelineId) => {
        const pipelineBuilds = getPipelineBuilds(pipelineId);
        const categories = new Set();
        
        pipelineBuilds.forEach(build => {
            if (Array.isArray(build.cicd_sast)) {
                build.cicd_sast.forEach(alert => {
                    if (Array.isArray(alert.results) && alert.results.length > 0) {
                        alert.results.forEach(result => {
                            if (result.category) {
                                categories.add(result.category);
                            }
                        });
                    }
                });
            }
        });
        
        return Array.from(categories).sort();
    };

    // Load all resource types for complete CSV data
    const loadAllResourceTypes = async () => {
        if (!selectedPlatformSource || !fetchResources) {
            console.error('Missing selectedPlatformSource or fetchResources function');
            return null;
        }

        try {
            const [endpointsData, variableGroupsData, secureFilesData, repositoriesData, poolsData] = await Promise.all([
                fetchResources(selectedPlatformSource.id, 'endpoint'),
                fetchResources(selectedPlatformSource.id, 'variablegroup'),
                fetchResources(selectedPlatformSource.id, 'securefile'),
                fetchResources(selectedPlatformSource.id, 'repository'),
                fetchResources(selectedPlatformSource.id, 'pool_merged')
            ]);

            const resourceData = {
                endpoints: endpointsData || [],
                variableGroups: variableGroupsData || [],
                secureFiles: secureFilesData || [],
                repositories: repositoriesData || [],
                pools: poolsData || []
            };

            setAllResources(resourceData);
            return resourceData;
        } catch (error) {
            console.error('Error loading resources for CSV:', error);
            return null;
        }
    };

    // Get resource names for a specific type
    const getResourceNames = (resourceType, resourceIds, resourceData) => {
        if (!resourceIds || resourceIds.length === 0) return [];
        
        let resourceList = [];
        switch (resourceType.toLowerCase()) {
            case 'endpoint':
                resourceList = resourceData.endpoints || [];
                break;
            case 'variablegroup':
                resourceList = resourceData.variableGroups || [];
                break;
            case 'securefile':
                resourceList = resourceData.secureFiles || [];
                break;
            case 'repository':
                resourceList = resourceData.repositories || [];
                break;
            case 'pool_merged':
                resourceList = resourceData.pools || [];
                break;
            default:
                return [];
        }

        return resourceIds.map(id => {
            const resource = resourceList.find(r => String(r.id) === String(id));
            return resource ? resource.name : `Unknown (ID: ${id})`;
        });
    };

    // Download CSV function
    const downloadCSV = async () => {
        const pipelinesToExport = downloadMode === 'all' ? allPipelines : filteredPipelines;
        
        if (!pipelinesToExport || Object.keys(pipelinesToExport).length === 0) {
            return;
        }

        setIsDownloading(true);

        // Load all resource types to ensure complete data
        const loadedResources = await loadAllResourceTypes();
        
        if (!loadedResources) {
            console.error('Failed to load resources');
            setIsDownloading(false);
            return;
        }

        const resourceTypes = ['endpoint', 'variablegroup', 'securefile', 'repository', 'pool_merged'];
        
        // CSV Headers
        const headers = [
            'Pipeline Name',
            'Number of Builds',
            'Number of Builds with Alerts',
            'Alert Types/Categories',
            // Resource count columns
            'Service Connections Count',
            'Variable Groups Count',
            'Secure Files Count',
            'Repositories Count',
            'Agent Pools Count',
            // Resource name columns
            'Service Connections',
            'Variable Groups',
            'Secure Files',
            'Repositories',
            'Agent Pools',
            'Web URL'
        ];

        // Generate CSV rows
        const rows = Object.values(pipelinesToExport).map(pipeline => {
            const pipelineName = pipeline.name || 'Unknown';
            const webUrl = pipeline._links?.web?.href || '';
            const pipelineBuilds = getPipelineBuilds(pipeline.id);
            const buildsCount = pipelineBuilds.length;
            const buildsWithAlertsCount = countBuildsWithAlerts(pipeline.id);
            const alertCategories = getAlertCategories(pipeline.id);

            // Get resource permissions
            const resourcePermissions = pipeline.resourcepermissions || {};
            
            const row = [
                escapeCSV(pipelineName),
                escapeCSV(buildsCount),
                escapeCSV(buildsWithAlertsCount),
                escapeCSV(alertCategories.join('; '))
            ];

            // Add resource counts
            resourceTypes.forEach(type => {
                const resourceIds = resourcePermissions[type] || [];
                row.push(escapeCSV(resourceIds.length));
            });

            // Add resource names using loaded resources directly
            resourceTypes.forEach(type => {
                const resourceIds = resourcePermissions[type] || [];
                const names = getResourceNames(type, resourceIds, loadedResources);
                row.push(escapeCSV(names.join('; ')));
            });

            // Add web URL as last column
            row.push(escapeCSV(webUrl));

            return row;
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        const filename = downloadMode === 'all' 
            ? `pipelines_all_${new Date().toISOString().split('T')[0]}.csv`
            : `pipelines_filtered_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDownloading(false);
    };

    return (
        <TableContainer
            sx={{
                mt: 3,
                mb: 3,
                mx: 2,
                ...(filterFocus && {
                    border: "1px solid grey",
                    boxShadow: "0 0 5px grey",
                }),
            }}
            component={Paper}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 3, marginBottom: 2, gap: 2 }}>
                <Typography
                    variant="h6"
                    sx={{
                        alignSelf: "center",
                        alignContent: "center",
                        textAlign: "center",
                        color: '#3C4EC3'
                    }}
                >
                    Pipelines
                    <Badge
                        badgeContent={filteredBadge}
                        color="primary"
                        sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                    >
                        <FilterAltIcon fontSize="small" sx={{ marginLeft: 1 }} />
                    </Badge>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={downloadCSV}
                        disabled={isDownloading || (downloadMode === 'all' ? !allPipelines || Object.keys(allPipelines).length === 0 : !filteredPipelines || Object.keys(filteredPipelines).length === 0)}
                        sx={{ textTransform: 'none', color: '#3C4EC3', borderColor: '#3C4EC3', '&:hover': { borderColor: '#2b3991' } }}
                    >
                        {isDownloading ? 'Loading Data...' : 'Download CSV'}
                    </Button>
                    <ToggleButtonGroup
                        value={downloadMode}
                        exclusive
                        onChange={(e, newMode) => newMode && setDownloadMode(newMode)}
                        size="small"
                        sx={{ height: '32px' }}
                    >
                        <ToggleButton value="filtered" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5 }}>
                            Filtered ({Object.keys(filteredPipelines || {}).length})
                        </ToggleButton>
                        <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5 }}>
                            All ({Object.keys(allPipelines || {}).length})
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Pipeline Name</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Type</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project Name</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Repository</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredPipelines && Object.values(filteredPipelines).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pipeline) => (
                        <React.Fragment key={pipeline.id}>
                            <TableRow
                                sx={{
                                    ...(highlightedPipelines.has(pipeline.id) && {
                                        backgroundColor: 'rgba(232, 202, 240, 0.3)', // Highlight row
                                    }),
                                }}
                            >
                                <TableCell>
                                    <IconButton
                                        aria-label={openRows[pipeline.id] ? "close row" : "expand row"}
                                        size="small"
                                        onClick={() => setOpenRows((prev) => ({ ...prev, [pipeline.id]: !prev[pipeline.id] }))}
                                    >
                                        {openRows[pipeline.id] ? (
                                            <KeyboardArrowUp />
                                        ) : (
                                            <KeyboardArrowDown />
                                        )}
                                    </IconButton>
                                </TableCell>
                                <TableCell>
                                    <Link href={pipeline._links.web.href} target="_blank" rel="noopener noreferrer" underline="hover">
                                        {pipeline.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{pipeline.type}</TableCell>
                                <TableCell><Link href={pipeline.authoredBy.url} target="_blank" rel="noopener noreferrer">
                                    {pipeline.authoredBy.displayName}
                                </Link> on {formatDate(pipeline.createdDate)} </TableCell>
                                <TableCell sx={{ overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            alignContent: 'center',
                                            alignItems: 'center',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                        }}
                                    >
                                        <Box
                                            key={pipeline.project.id}
                                            sx={(theme) => ({
                                                backgroundColor: theme.palette.action.selected,
                                                color: theme.palette.text.primary,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.9em',
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                            })}
                                            title={pipeline.project.name}
                                        >
                                            {pipeline.project.name}
                                        </Box>

                                    </Box>

                                </TableCell>
                                <TableCell>
                                    {pipeline.repository?.url ? (
                                        <a
                                            href={pipeline.repository.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'blue', textDecoration: 'underline' }}
                                        >
                                            {pipeline.repository.name}
                                        </a>
                                    ) : (
                                        pipeline.repository?.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {pipeline.resourcepermissions ? (
                                        Object.entries(pipeline.resourcepermissions).map(([key, value]) => (
                                            key.toLowerCase() === 'queue' ? null : (
                                                <Box
                                                    key={key}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: 1,
                                                        borderRadius: '4px',
                                                        padding: '4px',
                                                        ...(value.some((id) => filteredResourcesTypes_Ids.includes(key + "_" + id)) && {
                                                            border: '1px solid purple',
                                                            boxShadow: "0 0 5px grey",
                                                        })
                                                    }}
                                                >
                                                    <Tooltip title={formatKey(key)} placement="left">
                                                        <Badge
                                                            badgeContent={value.length}
                                                            color="secondary"
                                                            sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                                                        >
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
                                                                    case 'environment':
                                                                        return <TrackChangesIcon fontSize="small" />;
                                                                    default:
                                                                        return <ErrorOutline fontSize="small" />;
                                                                }
                                                            })()}
                                                        </Badge>
                                                    </Tooltip>
                                                </Box>
                                            )
                                        ))
                                    ) : (
                                        <></>
                                    )}
                                </TableCell>
                            </TableRow>
                            {openRows[pipeline.id] && (
                                <TableRow>
                                    <TableCell
                                        style={{ paddingBottom: 0, paddingTop: 0 }}
                                        colSpan={8}
                                    >
                                        <Collapse
                                            in={openRows[pipeline.id]}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <Box margin={1}>
                                                <PipelineDetail builds={builds} pipeline={pipeline} filteredResourcesTypes_Ids={filteredResourcesTypes_Ids} formatKey={formatKey} repositories={repositories}
                                                    endpoints={endpoints}
                                                    secureFiles={secureFiles}
                                                    pools={pools}
                                                    variableGroups={variableGroups}
                                                    resourceTypeSelected={resourceTypeSelected}
                                                    setResourceTypeSelected={setResourceTypeSelected}
                                                    getProtectedResourcesByOrgTypeAndIdsSummary={getProtectedResourcesByOrgTypeAndIdsSummary}
                                                    selectedPlatformSource={selectedPlatformSource}
                                                />
                                                <Box sx={{ textAlign: 'right', mt: 1 }}>
                                                    <IconButton aria-label="close row" size="small" onClick={() => setOpenRows((prev) => ({ ...prev, [pipeline.id]: false }))}>
                                                        <KeyboardArrowUp /> Close
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPipelines ? filteredPipelines.length : 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );
};

export default PipelineTable;