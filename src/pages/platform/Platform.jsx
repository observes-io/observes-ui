/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from 'react';
import { CircularProgress, Box, Divider, Button, Typography, List, ListItem, ListItemText, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Checkbox, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ListItemButton, ListItemIcon, Grid, Card, CardContent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useColorScheme } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RadarIcon from '@mui/icons-material/Radar';

import ResourceTable from '../resource/ResourceTable';
import ResourceButtonGroup from '../components/ResourceButtonGroup';
import useStore from '../../state/stores/store';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { OBSERVES_DB_NAME } from '../../utils/dbConfig';
import { resourceTypes } from '../../utils/resourceTypes';
import { filterContainersByPlatformSource } from '../../utils/logicContainerHelpers';

import { useAuth } from '../../contexts/AuthContext';

// Component for Logic Containers section - MUST be outside Platform to prevent remounting on re-renders
const LogicContainersSettings = ({ 
  logic_containers, 
  selectedPlatformSource, 
  platformSources,
  newContainer, 
  setNewContainer, 
  nameError, 
  setNameError,
  open, 
  setOpen, 
  editMode, 
  setEditMode,
  handleChange,
  handleCreate,
  handleEdit,
  handleDelete,
  handleUpdate,
  handleClose,
  systemMode
}) => {
  // Filter logic containers by current platform source
  const filteredLogicContainers = selectedPlatformSource
    ? filterContainersByPlatformSource(logic_containers, selectedPlatformSource.id)
    : logic_containers;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Logic Container Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Define and manage logical containers for organizing your CI/CD resources.
          {selectedPlatformSource && (
            <> Currently showing containers for: <strong>{selectedPlatformSource.organisation?.name || selectedPlatformSource.id}</strong></>
          )}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: '20%', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Criticality</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Owner</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Color</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Default</TableCell>
                <TableCell align="right" sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(filteredLogicContainers)
                ? filteredLogicContainers.map((container) => (
                  <TableRow key={container.id} sx={{ height: 28 }}>
                    <TableCell sx={{ py: 0.5, px: 1 }}>{container.name}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>{container.description}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>{container.criticality}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>{container.owner}</TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: container.color, borderRadius: '50%', mr: 0.5, border: '1px solid #ccc' }} />
                        <span style={{ fontSize: '0.85em' }}>{container.color}</span>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, px: 1 }}>{container.is_default ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                      <IconButton sx={{ mx: 1 }} color="primary" size="small" onClick={() => handleEdit(container)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton sx={{ mx: 1 }} color="error" size="small" onClick={() => handleDelete(container.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
                : null}
              {filteredLogicContainers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No logic containers available for this platform source. Create one below or select it in an existing container.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              <TableRow sx={{ height: 28 }}>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                    <TextField
                      size="small"
                      name="name"
                      value={newContainer.name}
                      onChange={e => {
                        handleChange(e);
                        if (nameError && e.target.value.trim() !== '') setNameError(false);
                      }}
                      placeholder="Name"
                      error={nameError}
                      slotProps={{ htmlInput: { style: { fontSize: 13, padding: 4 } } }}
                      sx={{
                        '& .MuiInputBase-input::placeholder': {
                          color: systemMode === 'dark' ? '#bbb' : '#888',
                          opacity: 1,
                        },
                      }}
                      helperText={nameError ? (
                        <span style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                          <WarningAmberIcon sx={{ color: 'red', fontSize: 18, mr: 0.5 }} />
                          <span style={{ color: 'red' }}>Name is required.</span>
                        </span>
                      ) : ''}
                      // slotProps={{
                      //   htmlInput: { style: { fontSize: 13, padding: 4 } },
                      //   formHelperText: { style: { color: 'red', marginLeft: 0 } }
                      // }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField size="small" name="description" value={newContainer.description} onChange={handleChange} placeholder="Description"
                    slotProps={{
                      htmlInput: {
                        style: { fontSize: 13, padding: 4 }
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input::placeholder': {
                        color: systemMode === 'dark' ? '#bbb' : '#888',
                        opacity: 1,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField size="small" name="criticality" value={newContainer.criticality} onChange={handleChange} placeholder="Criticality"
                    select
                    slotProps={{
                      htmlInput: {
                        style: { fontSize: 13, padding: 4 }
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input::placeholder': {
                        color: systemMode === 'dark' ? '#bbb' : '#888',
                        opacity: 1,
                      },
                    }}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField size="small" name="owner" value={newContainer.owner || ''} onChange={handleChange} placeholder="Owner"
                    slotProps={{ htmlInput: { style: { fontSize: 13, padding: 4 }, readOnly: true, tabIndex: -1 } }}
                    sx={{
                      '& .MuiInputBase-input::placeholder': {
                        color: systemMode === 'dark' ? '#bbb' : '#888',
                        opacity: 1,
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      name="color"
                      value={newContainer.color || '#98a192'}
                      onChange={e => handleChange({ target: { name: 'color', value: e.target.value } })}
                      style={{ width: 32, height: 32, border: 'none', background: 'none', padding: 0, marginRight: 8, cursor: 'pointer' }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 60, fontSize: 13, color: systemMode === 'dark' ? '#bbb' : '#444' }}>
                      {newContainer.color || '#98a192'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <Checkbox checked={!!newContainer.is_default} name="is_default" onChange={e => setNewContainer(prev => ({ ...prev, is_default: e.target.checked, }))} size="small" sx={{ p: 0.5 }} />
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                  <IconButton color="success" size="small" onClick={() => {
                    if (!newContainer.name || newContainer.name.trim() === '') {
                      setNameError(true);
                      return;
                    }
                    handleCreate();
                  }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Logic Container' : 'New Logic Container'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Name"
              name="name"
              value={newContainer.name}
              onChange={e => {
                handleChange(e);
                if (nameError && e.target.value.trim() !== '') setNameError(false);
              }}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              error={nameError}
              helperText={nameError ? (
                <span style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                  <WarningAmberIcon sx={{ color: 'red', fontSize: 18, mr: 0.5 }} />
                  <span style={{ color: 'red' }}>Name is required.</span>
                </span>
              ) : ''}
              slotProps={{
                formHelperText: { style: { color: 'red', marginLeft: 0 } }
              }}
            />
            <TextField
              margin="dense"
              label="Description"
              name="description"
              value={newContainer.description}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Criticality"
              name="criticality"
              value={newContainer.criticality}
              onChange={handleChange}
              select
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              label="Owner"
              name="owner"
              value={newContainer.owner || ''}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { readOnly: true, tabIndex: -1 } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <label htmlFor="edit-color-picker" style={{ marginRight: 8 }}>Color:</label>
              <input
                id="edit-color-picker"
                type="color"
                name="color"
                value={newContainer.color || '#98a192'}
                onChange={e => handleChange({ target: { name: 'color', value: e.target.value } })}
                style={{ width: 32, height: 32, border: 'none', background: 'none', padding: 0, marginRight: 8, cursor: 'pointer' }}
              />
              <Typography variant="body2" sx={{ minWidth: 60, fontSize: 13, color: systemMode === 'dark' ? '#bbb' : '#444' }}>
                {newContainer.color || '#98a192'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Checkbox
                checked={!!newContainer.is_default}
                name="is_default"
                onChange={e =>
                  setNewContainer(prev => ({
                    ...prev,
                    is_default: e.target.checked,
                  }))
                }
              />
              <Typography variant="body2">Is Default</Typography>
            </Box>
            <TextField
              margin="dense"
              label="Platform Sources (Organizations)"
              name="platform_source_ids"
              value={Array.isArray(newContainer.platform_source_ids) ? newContainer.platform_source_ids : []}
              onChange={e =>
                setNewContainer(prev => ({
                  ...prev,
                  platform_source_ids: e.target.value,
                }))
              }
              select
              slotProps={{
                select: {
                  multiple: true,
                  renderValue: (selected) => {
                    if (!Array.isArray(selected) || selected.length === 0) return 'None selected';
                    return selected.map(id => {
                      const ps = platformSources.find(p => p.id === id);
                      return ps ? ps.id : id;
                    }).join(', ');
                  }
                }
              }}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              helperText={
                editMode 
                  ? "Select which ADO organizations this logic container can be used in"
                  : `Will be created in current platform source: ${selectedPlatformSource?.organisation?.name || 'Unknown'}. You can add more organizations here.`
              }
            >
              {Array.isArray(platformSources) && platformSources.map(ps => (
                <MenuItem key={ps.id} value={ps.id}>
                  <Checkbox 
                    checked={Array.isArray(newContainer.platform_source_ids) && newContainer.platform_source_ids.includes(ps.id)} 
                  />
                  {ps.organisation?.name || ps.id}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (!newContainer.name || newContainer.name.trim() === '') {
                  setNameError(true);
                  return;
                }
                editMode ? handleUpdate() : handleCreate();
              }}
              variant="contained"
              color="primary"
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Component for Resource Lifecycle section - MUST be outside Platform to prevent remounting on re-renders
const ResourceLifecycleSettings = ({
  resource_type_selected,
  resourceTypes,
  handleResourceTypeChange,
  selectedPlatformSource,
  filteredProtectedResources,
  logic_containers,
  fetchLogicContainers
}) => (
  <Card>
    <CardContent>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        CI/CD Resource Lifecycle
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage the lifecycle of your CI/CD platform resources across different environments.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
        <ResourceButtonGroup
          resourceTypes={resourceTypes.filter(rt => !rt.disabled)}
          resourceType={resource_type_selected}
          handleResourceTypeChange={handleResourceTypeChange}
        />
      </Box>
      {!selectedPlatformSource ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress size={80} style={{ color: 'purple' }} />
        </Box>
      ) : (
        <>
          <ResourceTable
            filteredBadge={0}
            selectedType={resource_type_selected}
            filteredProtectedResources={filteredProtectedResources}
            logicContainers={logic_containers}
            projects={selectedPlatformSource.projects}
            filterFocus={false}
            onLogicContainerChange={fetchLogicContainers}
          />
        </>
      )}
    </CardContent>
  </Card>
);

const Platform = ({ }) => {

  const { user } = useAuth();
  const { systemMode } = useColorScheme();
  const { globalSettings, selectedProject, selectedPlatformSource, platformSources, resource_type_selected, logic_containers, fetchGlobalSettings, setGlobalSettings, setCurrentPage, setResourceTypeSelected, fetchLogicContainers, fetchResources, createLogicContainer, updateLogicContainer, deleteLogicContainer } = useStore();

  // Local state for large resources
  const [endpoints, setEndpoints] = useState([]);
  const [variableGroups, setVariableGroups] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [pools, setPools] = useState([]);
  const [secureFiles, setSecureFiles] = useState([]);
  const [environments, setEnvironments] = useState([]);

  const [logic_container_filter, setlogic_container_filter] = useState('all');


  // LOCAL
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [newContainer, setNewContainer] = useState({
    id: '',
    name: '',
    color: '#98a192',
    description: '',
    criticality: 'low',
    is_default: false,
    owner: 'anonymous',
    created_at: '',
    updated_at: '',
    projects: [],
    platform_source_ids: [],
    resources: {},
  });

  const [selectedSection, setSelectedSection] = useState('logicContainers');
  const [selectedContainerId, setSelectedContainerId] = useState(null);

  // Check if user is tenant admin - FOR DEVELOPMENT PURPOSES, DEFAULT TO TRUE
  const isTenantAdmin = user?.roles?.includes('TenantAdmin') || true;

  useEffect(() => {
    setCurrentPage("Platform Manager");
  }, [setCurrentPage]);

  const menuItems = [
    { id: 'logicContainers', label: 'Logic Containers', icon: <AccountTreeIcon />, show: true },
    { id: 'resourceLifecycle', label: 'Resource Lifecycle', icon: <AutoModeIcon />, show: isTenantAdmin },
  ];


  // Help Dialog State
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    fetchGlobalSettings();

    if (selectedPlatformSource) {
      fetchLogicContainers();
      fetchResources(selectedPlatformSource.id, 'endpoint').then(setEndpoints);
      fetchResources(selectedPlatformSource.id, 'variablegroup').then(setVariableGroups);
      fetchResources(selectedPlatformSource.id, 'repository').then(setRepositories);
      fetchResources(selectedPlatformSource.id, 'pool_merged').then(setPools);
      fetchResources(selectedPlatformSource.id, 'securefile').then(setSecureFiles);
      fetchResources(selectedPlatformSource.id, 'environment').then(setEnvironments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatformSource]);

  // useEffect(() => {
  //   if (globalSettings && !globalSettings.hasLogicContainerStrategy) {
  //     setShowStrategyDialog(true);
  //   }
  // }, [globalSettings]);


  function filterResourcesByProject(resources, projectFilter, resourceType) {
    if (!projectFilter) {
      return resources;
    }

    if (resourceType === 'pool_merged') {
      return resources.filter(resource => {
        let pool_resource_projects_ids = [];
        resource.queues.forEach(queue => {
          pool_resource_projects_ids = [...pool_resource_projects_ids, queue.projectId];
        });
        return pool_resource_projects_ids.includes(projectFilter['id']);
      });
    }

    var filteredResources = []
    resources.forEach(resource => {
      if (resource.k_projects_refs) {
        resource.k_projects_refs.forEach(ref => {
          if (ref.id === projectFilter['id']) {
            filteredResources.push(resource);
          }
        });
      } else if (resource.k_project && resource.k_project.id === projectFilter['id']) {
        filteredResources.push(resource);
      }
    });

    return filteredResources;
  }

  function filterResourcesByLogicContainer(resources, logic_container_filter_id) {
    if (logic_container_filter_id === "all") {
      return resources;
    }
    
    // Get the logic container
    const container = logic_containers.find(lc => lc.id === logic_container_filter_id);
    if (!container) {
      return resources;
    }
    
    // Get current platform source ID
    const platformSourceId = selectedPlatformSource?.id;
    if (!platformSourceId) {
      return resources;
    }
    
    // Get resources for this platform source from the container
    const containerResourceIds = container.resources && container.resources[platformSourceId] 
      ? container.resources[platformSourceId] 
      : [];
    
    // Filter resources - check both new format (container.resources) and old format (resource.logic_container_ids)
    return resources.filter(resource => {
      const resourceIdStr = String(resource.id);
      // Check new format (platform source scoped)
      const inContainerResources = containerResourceIds.map(String).includes(resourceIdStr);
      // Check old format (for backwards compatibility)
      const inResourceLogicContainers = resource.logic_container_ids && 
        resource.logic_container_ids.includes(logic_container_filter_id);
      return inContainerResources || inResourceLogicContainers;
    });
  }

  function filterResourcesBySearchTerm(resources, searchTerm) {
    if (!searchTerm) {
      return resources;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return resources.filter(resource => {
      const resourceName = resource.name ? resource.name.toLowerCase() : '';
      const resourceId = resource.id ? resource.id.toString() : ''; // Convert ID to string for comparison
      return resourceName.includes(lowerCaseSearchTerm) || resourceId.includes(lowerCaseSearchTerm);
    });
  }

  let filteredProtectedResources = [];

  switch (resource_type_selected) {
    case 'endpoint':
      filteredProtectedResources = endpoints;
      break;
    case 'variablegroup':
      filteredProtectedResources = variableGroups;
      break;
    case 'repository':
      filteredProtectedResources = repositories;
      break;
    case 'pool_merged':
      filteredProtectedResources = pools;
      break;
    case 'securefile':
      filteredProtectedResources = secureFiles;
      break;
    case 'environment':
      filteredProtectedResources = environments;
      break;
    default:
      break;
  }

  if (selectedProject) {
    filteredProtectedResources = filterResourcesByProject(filteredProtectedResources, selectedProject, resource_type_selected);
  }

  if (logic_container_filter) {
    filteredProtectedResources = filterResourcesByLogicContainer(filteredProtectedResources, logic_container_filter);
  }


  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewContainer(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDefaultChecksChange = (event) => {
    const { value } = event.target;
    setNewContainer(prevState => ({
      ...prevState,
      defaultChecks: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleEdit = (container) => {
    setOpen(true);
    setEditMode(true);
    setNewContainer({
      ...container,
      // fallback for missing fields
      projects: container.projects || [],
      platform_source_ids: container.platform_source_ids || [],
      resources: container.resources || {},
      created_at: container.created_at || '',
      updated_at: container.updated_at || '',
    });
    setSelectedContainerId(container.id);

  };

  function upsertLogicContainer(container) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(OBSERVES_DB_NAME, 2);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(["logiccontainers"], "readwrite");
        const store = tx.objectStore("logiccontainers");
        const putReq = store.put(container);
        putReq.onsuccess = () => resolve();
        putReq.onerror = (e) => reject(e.target.error);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  const handleCreate = async () => {
    const now = new Date().toISOString();
    
    // Automatically add current platform source if not already included
    let platformSourceIds = Array.isArray(newContainer.platform_source_ids) ? newContainer.platform_source_ids : [];
    if (selectedPlatformSource && !platformSourceIds.includes(selectedPlatformSource.id)) {
      platformSourceIds = [...platformSourceIds, selectedPlatformSource.id];
    }
    
    const containerToSend = {
      id: newContainer.name,
      name: newContainer.name,
      color: newContainer.color,
      description: newContainer.description,
      criticality: newContainer.criticality,
      is_default: !!newContainer.is_default,
      owner: newContainer.owner || 'anonymous',
      created_at: now,
      updated_at: now,
      projects: Array.isArray(newContainer.projects) ? newContainer.projects : [],
      platform_source_ids: platformSourceIds,
      resources: newContainer.resources || {},
    };

    await createLogicContainer(containerToSend);
    await fetchLogicContainers();
    handleClose();
  };

  const handleUpdate = async () => {
    const now = new Date().toISOString();
    const { created_at, ...rest } = newContainer;
    const containerToSend = {
      ...rest,
      created_at: created_at || now,
      updated_at: now,
      projects: Array.isArray(newContainer.projects) ? newContainer.projects : [],
      platform_source_ids: Array.isArray(newContainer.platform_source_ids) ? newContainer.platform_source_ids : [],
      resources: newContainer.resources || {},
    };
    await updateLogicContainer(containerToSend.id, containerToSend);
    await fetchLogicContainers();
    handleClose();
  };

  const handleResourceTypeChange = (type) => {
    setResourceTypeSelected(type);
  };


  const handleDelete = async (id) => {
    await deleteLogicContainer(id);
    await fetchLogicContainers();
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setNewContainer({
      id: '',
      name: '',
      color: '#98a192',
      description: '',
      criticality: 'low',
      is_default: false,
      owner: 'anonymous',
      created_at: '',
      updated_at: '',
      projects: [],
      platform_source_ids: [],
      resources: {},
    });
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'logicContainers':
        return <LogicContainersSettings 
          logic_containers={logic_containers}
          selectedPlatformSource={selectedPlatformSource}
          platformSources={platformSources}
          newContainer={newContainer}
          setNewContainer={setNewContainer}
          nameError={nameError}
          setNameError={setNameError}
          open={open}
          setOpen={setOpen}
          editMode={editMode}
          setEditMode={setEditMode}
          handleChange={handleChange}
          handleCreate={handleCreate}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
          handleClose={handleClose}
          systemMode={systemMode}
        />;
      case 'resourceLifecycle':
        return <ResourceLifecycleSettings 
          resource_type_selected={resource_type_selected}
          resourceTypes={resourceTypes}
          handleResourceTypeChange={handleResourceTypeChange}
          selectedPlatformSource={selectedPlatformSource}
          filteredProtectedResources={filteredProtectedResources}
          logic_containers={logic_containers}
          fetchLogicContainers={fetchLogicContainers}
        />;
      default:
        return <LogicContainersSettings 
          logic_containers={logic_containers}
          selectedPlatformSource={selectedPlatformSource}
          platformSources={platformSources}
          newContainer={newContainer}
          setNewContainer={setNewContainer}
          nameError={nameError}
          setNameError={setNameError}
          open={open}
          setOpen={setOpen}
          editMode={editMode}
          setEditMode={setEditMode}
          handleChange={handleChange}
          handleCreate={handleCreate}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
          handleClose={handleClose}
          systemMode={systemMode}
        />;
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={1} sx={{ flexGrow: 1, flexWrap: 'nowrap' }}>
        {/* Sidebar Menu */}
        <Grid size={{ md: 3 }} sx={{ minWidth: 250, maxWidth: 300, mr: 2 }}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <List component="nav">
              {menuItems
                .filter(item => item.show)
                .map((item) => (
                  <ListItemButton
                    key={item.id}
                    selected={selectedSection === item.id}
                    onClick={() => setSelectedSection(item.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'secondary.light',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'secondary.light',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ px: 1 }}>
              <Button
                startIcon={<HelpOutlineIcon />}
                onClick={() => setOpenHelpDialog(true)}
                size="small"
                variant="outlined"
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Help
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid size={{ md: 9 }} sx={{ flexGrow: 1, overflow: 'auto' }}>
            {renderContent()}
        </Grid>
      </Grid>

      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>About Logic Containers</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Define and manage your resources using logical containers that fit your unique needs. This feature allows you to create and control resource groupings with tailored lifecycle management, checks, and access policies.
            </Typography>
            <List sx={{ listStyleType: 'disc', ml: 3 }}>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary="Dynamically define environments based on their operational logic." />
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary="Apply lifecycle management processes that consider resource interconnectivity and importance." />
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <ListItemText primary="Implement layered checks and access controls tailored to both the group and individual resource levels." />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelpDialog(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Platform;