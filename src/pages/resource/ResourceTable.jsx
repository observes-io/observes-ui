/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useState, useEffect } from "react";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Box, Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TablePagination, Tooltip, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useStore from '../../state/stores/store';
import { resourceTypes } from '../../utils/resourceTypes';
import { addResourceToLogicContainer, removeResourceFromLogicContainer, resourceBelongsToContainer } from '../../utils/logicContainerHelpers';


const ResourceTable = ({ selectedType, filteredProtectedResources, allProtectedResources, logicContainers, projects, filterFocus, filteredBadge, onLogicContainerChange, pipelines }) => {

  const { updateLogicContainer, selectedPlatformSource } = useStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addMenuResourceId, setAddMenuResourceId] = useState(null);
  const [downloadMode, setDownloadMode] = useState('filtered'); // 'filtered' or 'all'

  if (!filteredProtectedResources) {
    return null; // or some loading indicator
  /* Copyright Notice
  SPDX-FileCopyrightText: 2025 Observes io LTD
  SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

  Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
  Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
  Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
  */
  }

  useEffect(() => {
    setPage(0);
  }, [selectedType]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getResourceTypeLabel = (type) => {
    const resourceTypeObj = resourceTypes.find(rt => rt.value === type);
    return resourceTypeObj ? resourceTypeObj.label : type;
  };


  const handleAddLogicContainer = async (logicContainerId, resourceId) => {
    const container = logicContainers.find(lc => lc.id === logicContainerId);
    if (!container) return;
    
    // Get current platform source ID
    const platformSourceId = selectedPlatformSource?.id;
    if (!platformSourceId) {
      console.error('No platform source selected');
      return;
    }
    
    // Check if resource already belongs to container in this platform source
    if (resourceBelongsToContainer(container, platformSourceId, resourceId)) {
      if (onLogicContainerChange) onLogicContainerChange();
      return;
    }
    
    // Add resource with platform source scoping
    const updated = addResourceToLogicContainer(container, platformSourceId, resourceId);
    await updateLogicContainer(logicContainerId, updated);
    if (onLogicContainerChange) onLogicContainerChange();
  };

  const handleRemoveLogicContainer = async (logicContainerId, resourceId) => {
    const container = logicContainers.find(lc => lc.id === logicContainerId);
    if (!container) return;
    
    // Get current platform source ID
    const platformSourceId = selectedPlatformSource?.id;
    if (!platformSourceId) {
      console.error('No platform source selected');
      return;
    }
    
    // Check if resource belongs to container in this platform source
    if (!resourceBelongsToContainer(container, platformSourceId, resourceId)) {
      return;
    }
    
    // Remove resource with platform source scoping
    const updated = removeResourceFromLogicContainer(container, platformSourceId, resourceId);
    await updateLogicContainer(logicContainerId, updated);
    if (onLogicContainerChange) onLogicContainerChange();
  };

  const renderTableHeaders = (selectedType) => {
    switch (selectedType) {
      case 'endpoint':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created By</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Creation Date</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Projects</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      case 'variablegroup':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Description</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created By</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Creation Date</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Variables</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      case 'securefile':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created By</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Creation Date</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      case 'environment':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Targets</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created By</TableCell>
            {/* <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Creation Date</TableCell> */}
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      case 'repository':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Default Branch</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Size</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      case 'pool_merged':
        return (
          <>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Name</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Logic Containers</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created By</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Creation Date</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Projects</TableCell>
            <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
          </>
        );
      default:
        return null;
    }
  };

  function getLogicContainersForResource(resourceId, logicContainers) {
    const platformSourceId = selectedPlatformSource?.id;
    if (!platformSourceId) return [];
    
    return logicContainers.filter(container => {
      // New format: resources scoped per platform source
      if (container.resources && typeof container.resources === 'object' && !Array.isArray(container.resources)) {
        if (container.resources[platformSourceId]) {
          return container.resources[platformSourceId].map(String).includes(String(resourceId));
        }
        return false;
      }
      // Old format: simple array (backwards compatibility)
      if (Array.isArray(container.resources)) {
        return container.resources.map(String).includes(String(resourceId));
      }
      return false;
    });
  }

  const renderLogicContainerCell = (resource) => {
    const resource_logicContainers = getLogicContainersForResource(resource.id, logicContainers);
    return resource_logicContainers.length ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
        {resource_logicContainers.map((logicContainer) => {
          return logicContainer ? (
            <Box
              key={logicContainer.id}
              sx={{
                backgroundColor: logicContainer.color ? `${logicContainer.color}22` : '#e0e0e0',
                color: 'black',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8em',
                fontWeight: 'bold',
                margin: '2px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleRemoveLogicContainer(logicContainer.id, resource.id);
              }}
            >
              {logicContainer.name}
            </Box>
          ) : null;
        })}
        <Box
          size="small"
          sx={{ color: '#1976d2', ml: 0.5, p: 0.2, cursor: 'pointer', borderRadius: '50%' }}
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
            setAddMenuResourceId(resource.id);
          }}
        >
          <AddCircleOutlineIcon fontSize="small" />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && addMenuResourceId === resource.id}
          onClose={() => { setAnchorEl(null); setAddMenuResourceId(null); }}
        >

          {logicContainers
            .filter(lc => {
              // Only show containers available in current platform source
              const platformSourceId = selectedPlatformSource?.id;
              if (!platformSourceId) return false;
              return lc.platform_source_ids && lc.platform_source_ids.includes(platformSourceId);
            })
            .filter(lc => !resource_logicContainers.map(rlc => rlc.id).includes(lc.id))
            .map(lc => (
              <MenuItem key={lc.id} onClick={() => {
                handleAddLogicContainer(lc.id, resource.id);
                setAnchorEl(null);
                setAddMenuResourceId(null);
              }}>
                {lc.name}
              </MenuItem>
            ))
          }
          {logicContainers
            .filter(lc => {
              const platformSourceId = selectedPlatformSource?.id;
              if (!platformSourceId) return false;
              return lc.platform_source_ids && lc.platform_source_ids.includes(platformSourceId);
            })
            .filter(lc => !resource_logicContainers.map(rlc => rlc.id).includes(lc.id))
            .length === 0 && (
            <MenuItem disabled>No more logic containers available</MenuItem>
          )}
        </Menu>
      </Box>
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', alignContent: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'grey' }}>No association </span>
        <Box
          size="small"
          sx={{ color: '#1976d2', ml: 0.5, p: 0.2, cursor: 'pointer', borderRadius: '50%' }}
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
            setAddMenuResourceId(resource.id);
          }}
        >
          <AddCircleOutlineIcon fontSize="small" />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && addMenuResourceId === resource.id}
          onClose={() => { setAnchorEl(null); setAddMenuResourceId(null); }}
        >
          {logicContainers
            .filter(lc => {
              // Only show containers available in current platform source
              const platformSourceId = selectedPlatformSource?.id;
              if (!platformSourceId) return false;
              return lc.platform_source_ids && lc.platform_source_ids.includes(platformSourceId);
            })
            .map(lc => (
              <MenuItem key={lc.id} onClick={() => {
                handleAddLogicContainer(lc.id, resource.id);
                setAnchorEl(null);
                setAddMenuResourceId(null);
              }}>
                {lc.name}
              </MenuItem>
            ))
          }
          {logicContainers
            .filter(lc => {
              const platformSourceId = selectedPlatformSource?.id;
              if (!platformSourceId) return false;
              return lc.platform_source_ids && lc.platform_source_ids.includes(platformSourceId);
            })
            .length === 0 && (
            <MenuItem disabled>No logic containers available for this platform source</MenuItem>
          )}
        </Menu>
      </Box>
    );
  };

  const renderTableRows = () => {
    return filteredProtectedResources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((resource) => {
      switch (selectedType) {
        case 'endpoint':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdByName || resource?.createdBy?.displayName || 'Unknown'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdOn ? new Date(resource.createdOn).toLocaleDateString() : resource?.creationDate ? new Date(resource.creationDate).toLocaleDateString() : "?"}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell
                  projects={Array.isArray(resource?.k_projects_refs) ? resource?.k_projects_refs : resource?.k_project ? [resource?.k_project] : []}
                />
              </TableCell>
              <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>
                {Array.isArray(resource?.pipelinepermissions)
                  ? [...new Set(resource.pipelinepermissions)].length
                  : ''}
              </TableCell>
            </TableRow>
          );
        case 'variablegroup':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.description || 'No description'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdByName || resource?.createdBy?.displayName || 'Unknown'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdOn ? new Date(resource.createdOn).toLocaleDateString() : resource?.creationDate ? new Date(resource.creationDate).toLocaleDateString() : "?"}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell projects={resource?.k_projects || [resource.k_project]} />
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {resource?.variables
                  ? Object.keys(resource.variables).map((key) => (
                    <Tooltip key={key} title={key} placement="left">
                      <Box
                        key={key.id}
                        sx={{
                          backgroundColor: resource.variables[key].isSecret ? '#c6aaa3' : 'white',
                          color: 'black',
                          padding: '2px 6px',
                          margin: '2px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          position: 'relative',
                        }}
                      >
                        {key}
                      </Box>
                    </Tooltip>
                  ))
                  : 'No variables'}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>
                {Array.isArray(resource?.pipelinepermissions)
                  ? [...new Set(resource.pipelinepermissions)].length
                  : ''}
              </TableCell>
            </TableRow>
          );
        case 'securefile':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdByName || resource?.createdBy?.displayName || 'Unknown'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdOn ? new Date(resource.createdOn).toLocaleDateString() : resource?.creationDate ? new Date(resource.creationDate).toLocaleDateString() : "?"}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell projects={resource?.k_projects || [resource.k_project]} />
              </TableCell>
              <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>
                {Array.isArray(resource?.pipelinepermissions)
                  ? [...new Set(resource.pipelinepermissions)].length
                  : ''}
              </TableCell>
            </TableRow>
          );

        case 'environment':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {Array.isArray(resource.resources) && resource.resources.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
                    {resource.resources.map((res) => (
                      <Tooltip key={res.id} title={res.tags ? res.tags.join(', ') : ''}>
                        <Box
                          sx={{
                            backgroundColor: '#a259e2',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.85em',
                            fontWeight: 500,
                            margin: '2px',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            maxWidth: 120,
                          }}
                        >
                          {res.name}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                )}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdByName || resource?.createdBy?.displayName || 'Unknown'}</TableCell>
              {/* <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdOn ? new Date(resource.createdOn).toLocaleDateString() : resource?.creationDate ? new Date(resource.creationDate).toLocaleDateString() : "?"}</TableCell> */}
              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell projects={resource?.k_projects || [resource.k_project]} />
              </TableCell>
              <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>
                {Array.isArray(resource?.pipelinepermissions)
                  ? [...new Set(resource.pipelinepermissions)].length
                  : ''}
              </TableCell>
            </TableRow>
          );

        case 'repository':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.defaultBranch || 'No default branch'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.size || 'Unknown size'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell projects={resource?.k_projects || [resource.k_project]} />
              </TableCell>
              <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>
                {Array.isArray(resource?.pipelinepermissions)
                  ? [...new Set(resource.pipelinepermissions)].length
                  : ''}
              </TableCell>
            </TableRow>
          );
        case 'pool_merged':
          return (
            <TableRow key={resource.id}>
              <TableCell sx={{ overflow: 'hidden' }}>
                <a href={resource?.k_url || '#'} target="_blank" rel="noopener noreferrer">
                  {resource?.name || 'Missing Name'}
                </a>
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>
                {renderLogicContainerCell(resource)}
              </TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdByName || resource?.createdBy?.displayName || 'Unknown'}</TableCell>
              <TableCell sx={{ overflow: 'hidden' }}>{resource?.createdOn ? new Date(resource.createdOn).toLocaleDateString() : resource?.creationDate ? new Date(resource.creationDate).toLocaleDateString() : "?"}</TableCell>

              <TableCell sx={{ overflow: 'hidden' }}>
                <ProjectListCell projects={
                  resource?.queues
                    ? resource.queues
                      .map(queue => queue.k_project)
                      .filter(Boolean)
                    : [resource.k_project]
                } />

              </TableCell>

              <TableCell sx={{ overflow: 'hidden' }}>
                {(() => {
                  const uniquePipelinePermissions = [];
                  resource?.queues?.forEach((queue) => {
                    queue.pipelinepermissions?.forEach((permission) => {
                      if (!permission.startsWith("queue") && !uniquePipelinePermissions.includes(permission)) {
                        uniquePipelinePermissions.push(permission);
                      }
                    });
                  });
                  return uniquePipelinePermissions.length;
                })()}
              </TableCell>
            </TableRow>
          );
        default:
          return null;
      }
    });
  };

  // Helper function to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // If the value contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Function to get pipeline details from pipelinepermissions
  const getPipelineDetails = (resource) => {
    let pipelinePermissions = [];
    
    // Handle pool_merged resources differently (they have queues)
    if (selectedType === 'pool_merged' && resource?.queues) {
      const uniquePipelinePermissions = [];
      resource.queues.forEach((queue) => {
        queue.pipelinepermissions?.forEach((permission) => {
          if (!permission.startsWith("queue") && !uniquePipelinePermissions.includes(permission)) {
            uniquePipelinePermissions.push(permission);
          }
        });
      });
      pipelinePermissions = uniquePipelinePermissions;
    } else if (Array.isArray(resource?.pipelinepermissions)) {
      pipelinePermissions = [...new Set(resource.pipelinepermissions)];
    }

    if (!pipelines || pipelinePermissions.length === 0) {
      return { count: 0, names: [] };
    }

    const pipelineDetails = [];
    pipelinePermissions.forEach(permissionId => {
      // Extract pipeline ID from permission format (e.g., "repository_123" -> "123")
      const pipelineId = permissionId.split('_').pop();
      
      // Find pipeline in the pipelines object
      const pipeline = pipelines && typeof pipelines === 'object' 
        ? Object.values(pipelines).find(p => String(p.id) === String(pipelineId))
        : null;

      if (pipeline) {
        const pipelineName = pipeline.name || 'Unknown Pipeline';
        const pipelineUrl = pipeline.k_url || pipeline._links?.web?.href || '';
        pipelineDetails.push(`${pipelineName} (${pipelineUrl})`);
      }
    });

    return {
      count: pipelinePermissions.length,
      names: pipelineDetails
    };
  };

  // Function to check if resource is cross-project
  const isCrossProject = (resource) => {
    // For pool_merged, check if queues reference multiple projects
    if (selectedType === 'pool_merged' && resource?.queues) {
      const uniqueProjects = new Set();
      resource.queues.forEach(queue => {
        if (queue.k_project) {
          uniqueProjects.add(queue.k_project.id);
        }
      });
      return uniqueProjects.size > 1;
    }
    
    // For other resources, check k_projects_refs
    const projectRefs = resource?.k_projects_refs;
    if (Array.isArray(projectRefs)) {
      return projectRefs.length > 1;
    }
    return false;
  };

  // Function to get logic container names for a resource
  const getLogicContainerNames = (resource) => {
    const containers = getLogicContainersForResource(resource.id, logicContainers);
    return containers.map(lc => lc.name).join('; ');
  };

  // Function to download CSV
  const downloadCSV = () => {
    const resourcesToExport = downloadMode === 'all' ? allProtectedResources : filteredProtectedResources;
    
    if (!resourcesToExport || resourcesToExport.length === 0) {
      return;
    }

    // CSV Headers
    const headers = [
      'Resource Name',
      'Resource Type',
      'Number of Pipelines',
      'Pipeline Names (with URLs)',
      'Description',
      'Cross Project',
      'Logic Containers',
      'Protected',
      'Last Used Date',
      'Web URL'
    ];

    // Generate CSV rows
    const rows = resourcesToExport.map(resource => {
      const pipelineInfo = getPipelineDetails(resource);
      const resourceTypeLabel = getResourceTypeLabel(selectedType);
      const description = resource?.description || '';
      const crossProject = isCrossProject(resource) ? 'Yes' : 'No';
      const logicContainerNames = getLogicContainerNames(resource);
      const isProtected = (Array.isArray(resource?.pipelinepermissions) && resource.pipelinepermissions.length > 0) ? 'Yes' : 'No';
      const webUrl = resource?.k_url || '';
      
      // Get last used date - different resources may have different fields
      let lastUsedDate = '';
      if (resource?.lastUsed) {
        lastUsedDate = new Date(resource.lastUsed).toLocaleDateString();
      } else if (resource?.recentlyUsedDate) {
        lastUsedDate = new Date(resource.recentlyUsedDate).toLocaleDateString();
      } else if (resource?.createdOn) {
        lastUsedDate = 'Created: ' + new Date(resource.createdOn).toLocaleDateString();
      } else if (resource?.creationDate) {
        lastUsedDate = 'Created: ' + new Date(resource.creationDate).toLocaleDateString();
      }

      return [
        escapeCSV(resource?.name || 'Missing Name'),
        escapeCSV(resourceTypeLabel),
        escapeCSV(pipelineInfo.count),
        escapeCSV(pipelineInfo.names.join('; ')),
        escapeCSV(description),
        escapeCSV(crossProject),
        escapeCSV(logicContainerNames),
        escapeCSV(isProtected),
        escapeCSV(lastUsedDate),
        escapeCSV(webUrl)
      ];
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
      ? `resources_${selectedType}_all_${new Date().toISOString().split('T')[0]}.csv`
      : `resources_${selectedType}_filtered_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TableContainer
      sx={{
        mt: 3,
        mb: 3,
        mx: 2,
        width: '100%',
        overflowX: 'auto',
        ...(filterFocus && {
          border: "1px solid grey",
          boxShadow: "0 0 5px grey",
        })
      }}
      component={Paper}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, gap: 2 }}>
        <Typography variant="h6" sx={{ alignSelf: 'center', alignContent: 'center', textAlign: 'center', color: "#ee4266" }}>
          {selectedType === 'pool_merged' ? 'Agent Pools' : getResourceTypeLabel(selectedType)} Resources
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
            disabled={downloadMode === 'all' ? !allProtectedResources || allProtectedResources.length === 0 : !filteredProtectedResources || filteredProtectedResources.length === 0}
            sx={{ textTransform: 'none', color: '#ee4266', borderColor: '#ee4266', '&:hover': { borderColor: '#d33a5b' } }}
          >
            Download CSV
          </Button>
          <ToggleButtonGroup
            value={downloadMode}
            exclusive
            onChange={(e, newMode) => newMode && setDownloadMode(newMode)}
            size="small"
            sx={{ height: '32px' }}
          >
            <ToggleButton value="filtered" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5 }}>
              Filtered ({(filteredProtectedResources || []).length})
            </ToggleButton>
            <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5 }}>
              All ({(allProtectedResources || []).length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      <Table sx={{ tableLayout: 'fixed', minWidth: 800 }}>
        <TableHead>
          <TableRow>
            {renderTableHeaders(selectedType)}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProtectedResources?.length > 0 ? (
            renderTableRows()
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography variant="body1" align="center">
                  No {getResourceTypeLabel(selectedType)} resources found for the selected project.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredProtectedResources.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

function ProjectListCell({ projects }) {
  const [expanded, setExpanded] = React.useState(false);
  const showCount = 2;
  const hasMore = projects.length > showCount;

  const visibleProjects = expanded ? projects : projects.slice(0, showCount);

  return (
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
      {visibleProjects.map((project) => (
        <Box
          key={project.id}
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
          title={project.name}
        >
          <a href={project?.self_attribute || '#'} target="_blank" rel="noopener noreferrer">
            {project?.name || 'Missing Name'}
          </a>
        </Box>
      ))}
      {hasMore && !expanded && (
        <Box
          sx={{ color: 'primary.main', cursor: 'pointer', fontSize: '0.9em', mt: 0.5 }}
          onClick={() => setExpanded(true)}
        >
          ...more
        </Box>
      )}
      {hasMore && expanded && (
        <Box
          sx={{ color: 'primary.main', cursor: 'pointer', fontSize: '0.9em', mt: 0.5 }}
          onClick={() => setExpanded(false)}
        >
          Show less
        </Box>
      )}
    </Box>
  );
}

export default ResourceTable;

