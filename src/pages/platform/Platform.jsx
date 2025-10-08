/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from 'react';
import { CircularProgress, Box, Divider, Button, Typography, List, ListItem, ListItemText, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Checkbox, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useColorScheme } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import ResourceTable from '../resource/ResourceTable';
import ResourceButtonGroup from '../components/ResourceButtonGroup';
import useStore from '../../state/stores/store';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import { OBSERVES_DB_NAME } from '../../utils/dbConfig';
import { resourceTypes } from '../../utils/resourceTypes';


const Platform = ({ }) => {

  const { systemMode } = useColorScheme();
  const { globalSettings, selectedProject, selectedScan, resource_type_selected, logic_containers, fetchGlobalSettings, setGlobalSettings, setCurrentPage, setResourceTypeSelected, fetchLogicContainers, fetchResources, createLogicContainer, updateLogicContainer, deleteLogicContainer } = useStore();

  // Local state for large resources
  const [endpoints, setEndpoints] = useState([]);
  const [variableGroups, setVariableGroups] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [pools, setPools] = useState([]);
  const [secureFiles, setSecureFiles] = useState([]);

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
  });

  const [showLogicContainerManagement, setShowLogicContainerManagement] = useState(true);
  const [showResourceLifecycleManagement, setShowResourceLifecycleManagement] = useState(true);
  const [selectedContainerId, setSelectedContainerId] = useState(null);


  // Help Dialog State
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    fetchGlobalSettings();

    if (selectedScan) {
      fetchLogicContainers();
      fetchResources(selectedScan.id, 'endpoint').then(setEndpoints);
      fetchResources(selectedScan.id, 'variablegroup').then(setVariableGroups);
      fetchResources(selectedScan.id, 'repository').then(setRepositories);
      fetchResources(selectedScan.id, 'pool_merged').then(setPools);
      fetchResources(selectedScan.id, 'securefile').then(setSecureFiles);
    }
  }, [selectedScan, fetchLogicContainers, fetchResources, fetchGlobalSettings]);

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
    return resources.filter(resource =>
      resource.logic_container_ids &&
      resource.logic_container_ids.includes(logic_container_filter_id)
    );
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
    };

    await createLogicContainer(containerToSend);
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
    };
    await updateLogicContainer(containerToSend.id, containerToSend);
    handleClose();
  };

  const handleResourceTypeChange = (type) => {
    setResourceTypeSelected(type);
  };


  const handleDelete = async (id) => {
    await deleteLogicContainer(id);
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
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ fontSize: '1.3rem' }}>
        Platform Manager
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', width: '40%', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" gutterBottom>
            Establish a lifecycle management system for your CICD platform resources by defining logical containers, onboarding resources and applying conditions of access that are enforced in your pipelines.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flex: 1, gap: 3, justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }} onClick={() => setShowLogicContainerManagement(prev => !prev)}>
            <Button
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center',
                height: '100%',
                bgcolor: (theme) => showLogicContainerManagement
                  ? (systemMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100])
                  : 'transparent',
                '&:hover': {
                  bgcolor: (theme) => showLogicContainerManagement
                    ? (systemMode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200])
                    : (systemMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]),
                },
                transition: 'background 0.2s',
              }}
            >
              <AccountTreeIcon sx={{ fontSize: 48 }} />
              <Typography variant="caption" sx={{ mt: 1 }}>Manage Logic Containers</Typography>
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }} onClick={() => setShowResourceLifecycleManagement(prev => !prev)}>
            <Button
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center',
                height: '100%',
                bgcolor: (theme) => showResourceLifecycleManagement
                  ? (systemMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100])
                  : 'transparent',
                '&:hover': {
                  bgcolor: (theme) => showResourceLifecycleManagement
                    ? (systemMode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[200])
                    : (systemMode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]),
                },
                transition: 'background 0.2s',
              }}
            >
              <AutoModeIcon sx={{ fontSize: 48 }} />
              <Typography variant="caption" sx={{ mt: 1 }}>CI/CD Resource Lifecycle</Typography>
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
            <HelpOutlineIcon
              sx={{ fontSize: 18, color: 'grey', mb: 6, cursor: 'pointer' }}
              onClick={() => setOpenHelpDialog(true)}
            />
          </Box>
        </Box>
      </Box>


      {showLogicContainerManagement && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Logic Container Management
          </Typography>
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
                  {/* <TableCell sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Projects</TableCell> */}
                  <TableCell align="right" sx={{ py: 0.5, px: 1, overflow: 'hidden', textAlign: 'center', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(logic_containers)
                  ? logic_containers.map((container) => (
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
                      {/* <TableCell sx={{ py: 0.5, px: 1 }}>{Array.isArray(container.projects) ? container.projects.join(', ') : ''}</TableCell> */}
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
                        inputProps={{ style: { fontSize: 13, padding: 4 }, placeholder: 'Name' }}
                        sx={{
                          '& .MuiInputBase-input::placeholder': {
                            color: systemMode === 'dark' ? '#bbb' : '#888',
                            opacity: 1,
                          },
                        }}
                        helperText={nameError ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <WarningAmberIcon sx={{ color: 'red', fontSize: 18, mr: 0.5 }} />
                            <span style={{ color: 'red' }}>Name is required.</span>
                          </Box>
                        ) : ''}
                        FormHelperTextProps={{ style: { color: 'red', marginLeft: 0 } }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.5, px: 1 }}>
                    <TextField size="small" name="description" value={newContainer.description} onChange={handleChange} placeholder="Description"
                      inputProps={{
                        style: { fontSize: 13, padding: 4 },
                        placeholder: 'Description'
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
                      inputProps={{
                        style: { fontSize: 13, padding: 4 },
                        placeholder: 'Criticality'
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
                      inputProps={{ style: { fontSize: 13, padding: 4 }, placeholder: 'Owner', readOnly: true, tabIndex: -1 }}
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
                  {/* <TableCell sx={{ py: 0.5, px: 1 }}>
                    <TextField size="small" name="projects" value={Array.isArray(newContainer.projects) ? newContainer.projects.join(',') : ''} onChange={e => setNewContainer(prev => ({ ...prev, projects: e.target.value.split(',').map(s => s.trim()), }))} placeholder="Projects" inputProps={{ style: { fontSize: 13, padding: 4 } }} />
                  </TableCell> */}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <WarningAmberIcon sx={{ color: 'red', fontSize: 18, mr: 0.5 }} />
                    <span style={{ color: 'red' }}>Name is required.</span>
                  </Box>
                ) : ''}
                FormHelperTextProps={{ style: { color: 'red', marginLeft: 0 } }}
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
                inputProps={{ readOnly: true, tabIndex: -1 }}
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
                label="Projects (comma separated)"
                name="projects"
                value={Array.isArray(newContainer.projects) ? newContainer.projects.join(',') : ''}
                onChange={e =>
                  setNewContainer(prev => ({
                    ...prev,
                    projects: e.target.value.split(',').map(s => s.trim()),
                  }))
                }
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
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
        </Box>
      )}

      {showResourceLifecycleManagement && (
        <span>
          {/* <Divider sx={{ my: 3 }} /> */}

          <Typography variant="h5" gutterBottom sx={{ mt: 10, mb: 3, mx: 2 }}>
            CI/CD Resource Lifecycle
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
            <ResourceButtonGroup
              resourceTypes={resourceTypes.filter(rt => !rt.disabled)}
              resourceType={resource_type_selected}
              handleResourceTypeChange={handleResourceTypeChange}
            />
          </Box>
          {!selectedScan ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
              {console.log("No scan selected")}
              <CircularProgress size={80} style={{ color: 'purple' }} />
            </Box>
          ) : (
            <>
              <ResourceTable
                filteredBadge={0}
                selectedType={resource_type_selected}
                filteredProtectedResources={filteredProtectedResources}
                logicContainers={logic_containers}
                projects={selectedScan.projects}
                filterFocus={false}
                onLogicContainerChange={fetchLogicContainers}
              />

            </>
          )}

        </span>
      )}

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