import React, { useState, useEffect } from "react";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Box, Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TablePagination, Tooltip } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useStore from '../../state/stores/store';
import { resourceTypes } from '../../utils/resourceTypes';


const ResourceTable = ({ selectedType, filteredProtectedResources, logicContainers, projects, filterFocus, filteredBadge, onLogicContainerChange }) => {

  const { updateLogicContainer } = useStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addMenuResourceId, setAddMenuResourceId] = useState(null);

  if (!filteredProtectedResources) {
    return null; // or some loading indicator
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
    const resources = Array.isArray(container.resources) ? container.resources : [];
    if (!resources.includes(resourceId)) {
      const updated = { ...container, resources: [...resources, resourceId] };
      await updateLogicContainer(logicContainerId, updated);
      if (onLogicContainerChange) onLogicContainerChange();
    } else {
      if (onLogicContainerChange) onLogicContainerChange();
    }
  };

  const handleRemoveLogicContainer = async (logicContainerId, resourceId) => {
    const container = logicContainers.find(lc => lc.id === logicContainerId);
    if (!container || !Array.isArray(container.resources)) {
      if (onLogicContainerChange) onLogicContainerChange();
      return;
    }
    const updated = { ...container, resources: container.resources.filter(id => id !== resourceId) };
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
    return logicContainers
      .filter(container => Array.isArray(container.resources) && container.resources.includes(resourceId))
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

          {logicContainers.filter(lc => !resource_logicContainers.map(lc => lc.id).includes(lc.id)).map(lc => (
            <MenuItem key={lc.id} onClick={() => {
              handleAddLogicContainer(lc.id, resource.id);
              setAnchorEl(null);
              setAddMenuResourceId(null);
            }}>
              {lc.name}
            </MenuItem>
          ))}
          {logicContainers.filter(lc => !resource_logicContainers.includes(lc.id)).length === 0 && (
            <MenuItem disabled>No more logic containers</MenuItem>
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
          {logicContainers.map(lc => (
            <MenuItem key={lc.id} onClick={() => {
              handleAddLogicContainer(lc.id, resource.id);
              setAnchorEl(null);
              setAddMenuResourceId(null);
            }}>
              {lc.name}
            </MenuItem>
          ))}
          {logicContainers.length === 0 && (
            <MenuItem disabled>No logic containers</MenuItem>
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
      <Typography variant="h6" sx={{ marginTop: 2, alignSelf: 'center', alignContent: 'center', textAlign: 'center', color: "#e25762" }}>
        {selectedType === 'pool_merged' ? 'Agent Pools' : getResourceTypeLabel(selectedType)} Resources
        <Badge
          badgeContent={filteredBadge}
          color="primary"
          sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
        >
          <FilterAltIcon fontSize="small" sx={{ marginLeft: 1 }} />
        </Badge>
      </Typography>
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

