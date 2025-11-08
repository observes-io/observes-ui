/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/


import React, { useState, useEffect } from 'react';
import ResourceTable from './ResourceTable';
import PipelineTable from './PipelineTable';
import D3JSResource from './D3Resources';
import { SaveSearchDialog, LoadSearchDialog, ConfirmDeleteDialog } from './SearchDialogs';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { ListSubheader, Tooltip, Chip, Typography, CircularProgress, TextField, Checkbox, FormControlLabel, Divider, Fab, Zoom, Switch, ClickAwayListener, Collapse, Paper } from '@mui/material';
import ResourceButtonGroup from '../components/ResourceButtonGroup';
import useStore from '../../state/stores/store';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import { resourceTypes } from '../../utils/resourceTypes';
import { set } from 'react-hook-form';
import DOMPurify from "dompurify";
import { Delete, DeleteForever } from '@mui/icons-material';
import DeleteForeverSharpIcon from '@mui/icons-material/DeleteForeverSharp';

const ResourceTracker = () => {

    const { selectedScan, resource_type_selected, projects, selectedProject, logic_containers, getProtectedResourcesByOrgTypeAndIdsSummary, setResourceTypeSelected, setCurrentPage, fetchResources, fetchLogicContainers, fetchBuilds, fetchPipelines, savedSearches, fetchSavedSearches, createSavedSearch, deleteSavedSearch, updateSavedSearch } = useStore();

    // Local state for large resources
    const [endpoints, setEndpoints] = useState([]);
    const [variableGroups, setVariableGroups] = useState([]);
    const [repositories, setRepositories] = useState([]);
    const [pools, setPools] = useState([]);
    const [secureFiles, setSecureFiles] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [deploymentGroups, setDeploymentGroups] = useState([]);
    const [builds, setBuilds] = useState([]);
    const [pipelines, setPipelines] = useState([]);


    const [logic_container_filter, setlogic_container_filter] = useState('all');
    const [pipelinesUsingFilteredResources, setPipelinesUsingFilteredResources] = useState(false);

    // For resource filters
    const [isFilteredResource, setIsFilteredResource] = useState(0); // counter for badge
    const [searchTerm, setSearchTerm] = useState('');
    const [protectedState, setProtectedState] = useState('all');
    const [crossProject, setCrossProject] = useState(false);

    // Pool Specific
    const [poolType, setPoolType] = useState('all');
    // const [singleUsePools, setSingleUsePools] = useState(false);

    // For pipeline filters
    const [isFilteredPipeline, setIsFilteredPipeline] = useState(0); // counter for badge
    const [searchTermPipelines, setSearchTermPipelines] = useState('');
    const [resourcePermissions, setResourcePermissions] = useState('all');
    const [buildsFilter, setBuildsFilter] = useState('all');

    // Advanced pipeline filter conditions
    const [pipelineAdvancedFilters, setPipelineAdvancedFilters] = useState([
        { field: 'jobPool', operator: 'equals', value: '' }
    ]);
    const [filterForAlertedPipelines, setFilterForAlertedPipelines] = useState(false);
    const [filterForJobAuthorizationScope, setFilterForJobAuthorizationScope] = useState('all');
    const [filterForPipelineType, setFilterForPipelineType] = useState('all');

    // For policy filters
    const [filterForOverprivilegedResources, setFilterForOverprivilegedResources] = useState(false);
    const [filterForOverprivilegedPipelines, setFilterForOverprivilegedPipelines] = useState(false);
    const [filterForUnqueriablePipelines, setFilterForUnqueriablePipelines] = useState(false);
    const [filterForDisabledPipelines, setFilterForDisabledPipelines] = useState(false);
    const [filterForOversharedResources, setFilterForOversharedResources] = useState(false);

    const [d3Flex, setD3Flex] = useState(2);

    // Floating filter FAB state
    const [resourceFilterExpanded, setResourceFilterExpanded] = useState(false);
    const [pipelineFilterExpanded, setPipelineFilterExpanded] = useState(false);

    // Main filtering UI visibility state
    const [filteringUICollapsed, setFilteringUICollapsed] = useState(false);

    // Scroll-based visibility for Fab filters
    const [showFabFilters, setShowFabFilters] = useState(false);

    // Save search dialog state
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load search dialog state
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [selectedSavedSearch, setSelectedSavedSearch] = useState(null);

    // Edit search state
    const [editingSearchId, setEditingSearchId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Confirmation dialog state
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [searchToDelete, setSearchToDelete] = useState(null);

    // Filters for resource - counters
    useEffect(() => {
        const activeFiltersCount = [
            searchTerm !== '',
            protectedState !== 'all',
            crossProject !== false,
            poolType !== 'all',
            logic_container_filter !== 'all',
            filterForOverprivilegedResources !== false,
            filterForOversharedResources !== false
        ].filter(Boolean).length;
        setIsFilteredResource(activeFiltersCount);
    }, [searchTerm, protectedState, crossProject, poolType, logic_container_filter, filterForOverprivilegedResources, filterForOversharedResources]);


    // Filters for pipelines - counters
    useEffect(() => {
        const activeFiltersCount = [
            searchTermPipelines !== '',
            pipelinesUsingFilteredResources !== false,
            resourcePermissions !== 'all',
            JSON.stringify(pipelineAdvancedFilters) !== JSON.stringify([
                { field: 'jobPool', operator: 'equals', value: '' }
            ]),
            filterForAlertedPipelines !== false,
            filterForUnqueriablePipelines !== false,
            filterForDisabledPipelines !== false,
            filterForOverprivilegedPipelines !== false,
            filterForJobAuthorizationScope !== 'all',
            filterForPipelineType !== 'all',
            buildsFilter !== 'all'
        ].filter(Boolean).length;
        // console.log('Active Pipeline Filters Count:', activeFiltersCount);
        setIsFilteredPipeline(activeFiltersCount);
    }, [searchTermPipelines, pipelinesUsingFilteredResources, resourcePermissions, pipelineAdvancedFilters, filterForAlertedPipelines, filterForJobAuthorizationScope, filterForPipelineType, filterForUnqueriablePipelines, filterForDisabledPipelines, filterForOverprivilegedPipelines, buildsFilter]);

    useEffect(() => {
        setCurrentPage("Tracker");
        Promise.resolve(fetchSavedSearches()).catch(error => {
            console.error("Failed to fetch saved searches:", error);
        });
    }, [setCurrentPage, fetchSavedSearches]);



    useEffect(() => {
        if (selectedScan) {
            // Await logic containers before proceeding
            Promise.resolve(fetchLogicContainers()).then(() => {
                switch (resource_type_selected) {
                    case 'endpoint':
                        fetchResources(selectedScan.id, 'endpoint').then(setEndpoints);
                        setVariableGroups([]);
                        setRepositories([]);
                        setPools([]);
                        setSecureFiles([]);
                        break;
                    case 'variablegroup':
                        fetchResources(selectedScan.id, 'variablegroup').then(setVariableGroups);
                        setEndpoints([]);
                        setRepositories([]);
                        setPools([]);
                        setSecureFiles([]);
                        break;
                    case 'repository':
                        fetchResources(selectedScan.id, 'repository').then(setRepositories);
                        setEndpoints([]);
                        setVariableGroups([]);
                        setPools([]);
                        setSecureFiles([]);
                        break;
                    case 'pool_merged':
                        fetchResources(selectedScan.id, 'pool_merged').then(setPools);
                        setEndpoints([]);
                        setVariableGroups([]);
                        setRepositories([]);
                        setSecureFiles([]);
                        break;
                    case 'securefile':
                        fetchResources(selectedScan.id, 'securefile').then(setSecureFiles);
                        setEndpoints([]);
                        setVariableGroups([]);
                        setRepositories([]);
                        setPools([]);
                        break;
                    case 'environment':
                        fetchResources(selectedScan.id, 'environment').then(setEnvironments);
                        fetchResources(selectedScan.id, 'deploymentgroups').then(setDeploymentGroups);
                        setEndpoints([]);
                        setVariableGroups([]);
                        setRepositories([]);
                        setPools([]);
                        setSecureFiles([]);
                        break;
                    default:
                        setEndpoints([]);
                        setVariableGroups([]);
                        setRepositories([]);
                        setPools([]);
                        setSecureFiles([]);
                        break;

                }
                fetchBuilds(selectedScan.id).then(setBuilds);
                fetchPipelines(selectedScan.id).then(setPipelines);
            });
        } else {
            // No scans available, redirect to home page
            window.location.href = "/";
        }

    }, [selectedScan, resource_type_selected, fetchLogicContainers, fetchResources, fetchBuilds, fetchPipelines]);

    // Scroll detection for showing Fab filters when filtering UI is out of sight
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Calculate scroll percentage
            const scrollPercentage = scrollPosition / (documentHeight - windowHeight);

            // Show Fab filters when scrolled past 45% of the page
            setShowFabFilters(scrollPercentage > 0.33);
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleFilterReset = (scope) => {
        if (scope === 'resource' || !scope) {
            setlogic_container_filter('all');
            setSearchTerm('');
            setProtectedState('all');
            setCrossProject(false);
            setResourcePermissions('all');
            setPoolType('all');
            setFilterForOverprivilegedResources(false);
            setFilterForOversharedResources(false);
        }
        if (scope === 'pipeline' || !scope) {
            // console.log('Resetting Pipeline Filters');
            setSearchTermPipelines('');
            setPipelinesUsingFilteredResources(false);
            setIsFilteredPipeline(0);
            setSearchTermPipelines('');
            setPipelinesUsingFilteredResources(false);
            setFilterForOverprivilegedPipelines(false);
            setFilterForUnqueriablePipelines(false);
            setFilterForDisabledPipelines(false);
            setBuildsFilter('all');
            setFilterForAlertedPipelines(false);
            setFilterForJobAuthorizationScope('all');
            setFilterForPipelineType('all');
            // Advanced pipeline filter conditions
            setPipelineAdvancedFilters([
                { field: 'jobPool', operator: 'equals', value: '' }
            ]);

        }
        if (scope === 'policy' || !scope) {
            setFilterForOverprivilegedResources(false);
            setFilterForOverprivilegedPipelines(false);
            setFilterForOversharedResources(false);
        }
        setSelectedSavedSearch(null);
    };

    const handleResourceTypeChange = (type) => {
        setResourceTypeSelected(type);
    };

    const handleLogicContainerSelect = (event) => {
        const selectedLogicContainerId = event.target.value;
        if (selectedLogicContainerId === 'all' || !selectedLogicContainerId) {
            setlogic_container_filter('all');
        } else {
            setlogic_container_filter(selectedLogicContainerId);
        }
    };


    const handleResourcesByProtectedStateChange = (event) => {
        const selectedProtectedState = event.target.value;
        if (selectedProtectedState === 'all' || !selectedProtectedState) {
            setProtectedState('all');
        } else {
            setProtectedState(selectedProtectedState);
        }
    };

    // Handler to update a filter condition
    const handleAdvancedFilterChange = (idx, key, val) => {
        setPipelineAdvancedFilters(filters => {
            const updated = [...filters];
            updated[idx][key] = val;
            return updated;
        });
    };

    const handlePipelineAuthZScopeChange = (event) => {
        const selectedAuthZScope = event.target.value;
        if (selectedAuthZScope === 'all' || !selectedAuthZScope) {
            setFilterForJobAuthorizationScope('all');
        } else {
            setFilterForJobAuthorizationScope(selectedAuthZScope);
        }
    };

    const handlePipelineTypeChange = (event) => {
        const selectedType = event.target.value;
        if (selectedType === 'all' || !selectedType) {
            setFilterForPipelineType('all');
        } else {
            setFilterForPipelineType(selectedType);
        }
    };

    // Handler to add a new filter row
    const handleAddAdvancedFilter = () => {
        setPipelineAdvancedFilters(filters => ([...filters, { field: 'jobPool', operator: 'equals', value: '' }]));
    };

    // Handler to remove a filter row
    const handleRemoveAdvancedFilter = (idx) => {
        if (pipelineAdvancedFilters.length === 1) {
            setPipelineAdvancedFilters([
                { field: 'jobPool', operator: 'equals', value: '' }
            ]);
            return;
        }
        setPipelineAdvancedFilters(filters => filters.filter((_, i) => i !== idx));
    };

    // Handler to save the search
    const handleSaveSearch = async (formData) => {
        if (!formData.name.trim()) {
            alert('Please enter a name for the search');
            return;
        }

        setIsSaving(true);
        try {
            const searchData = {
                name: formData.name,
                description: formData.description,
                resourceType: resource_type_selected,
                resourceFilters: isFilteredResource > 0 ? {
                    searchTerm,
                    protectedState,
                    crossProject,
                    poolType,
                    logic_container_filter,
                    filterForOverprivilegedResources,
                    filterForOversharedResources,
                    resource_type_selected,
                    selectedProject: selectedProject?.id,
                } : null,
                pipelineFilters: isFilteredPipeline > 0 ? {
                    searchTermPipelines,
                    pipelinesUsingFilteredResources,
                    resourcePermissions,
                    buildsFilter,
                    pipelineAdvancedFilters,
                    filterForAlertedPipelines,
                    filterForJobAuthorizationScope,
                    filterForPipelineType,
                    filterForOverprivilegedPipelines,
                    filterForUnqueriablePipelines,
                    filterForDisabledPipelines,
                    selectedProject: selectedProject?.id,
                } : null,
            };

            if (editingSearchId) {
                // Update existing search
                await updateSavedSearch(editingSearchId, searchData);
                console.log('Search updated successfully!');
            } else {
                // Create new search
                await createSavedSearch(searchData);
                console.log('Search saved successfully!');
            }

            // Reset dialog state and close
            setEditingSearchId(null);
            setSaveDialogOpen(false);

            // Refresh the saved searches list
            fetchSavedSearches();
        } catch (error) {
            console.error(`Failed to ${editingSearchId ? 'update' : 'save'} search:`, error);
            alert(`Failed to ${editingSearchId ? 'update' : 'save'} search. Please try again.`);
        } finally {
            setIsSaving(false);
        }
    };

    // Handler to load a saved search
    const handleLoadSearch = (savedSearch) => {

        handleFilterReset('resource');
        handleFilterReset('pipeline');
        setSelectedSavedSearch(savedSearch);

        // Apply resource filters
        if (savedSearch.resourceFilters) {
            setSearchTerm(savedSearch.resourceFilters.searchTerm || '');
            setProtectedState(savedSearch.resourceFilters.protectedState || 'all');
            setCrossProject(savedSearch.resourceFilters.crossProject || false);
            setPoolType(savedSearch.resourceFilters.poolType || 'all');
            setlogic_container_filter(savedSearch.resourceFilters.logic_container_filter || 'all');
            setFilterForOverprivilegedResources(savedSearch.resourceFilters.filterForOverprivilegedResources || false);
            setFilterForOversharedResources(savedSearch.resourceFilters.filterForOversharedResources || false);
        }

        // Apply pipeline filters
        if (savedSearch.pipelineFilters) {
            setSearchTermPipelines(savedSearch.pipelineFilters.searchTermPipelines || '');
            setPipelinesUsingFilteredResources(savedSearch.pipelineFilters.pipelinesUsingFilteredResources || false);
            setPipelineAdvancedFilters(savedSearch.pipelineFilters.pipelineAdvancedFilters || [{ field: 'jobPool', operator: 'equals', value: '' }]);
            setFilterForAlertedPipelines(savedSearch.pipelineFilters.filterForAlertedPipelines || false);
            setFilterForJobAuthorizationScope(savedSearch.pipelineFilters.filterForJobAuthorizationScope || 'all');
            setFilterForPipelineType(savedSearch.pipelineFilters.filterForPipelineType || 'all');
            setFilterForOverprivilegedPipelines(savedSearch.pipelineFilters.filterForOverprivilegedPipelines || false);
            setFilterForUnqueriablePipelines(savedSearch.pipelineFilters.filterForUnqueriablePipelines || false);
            setFilterForDisabledPipelines(savedSearch.pipelineFilters.filterForDisabledPipelines || false);
        }

        setLoadDialogOpen(false);
        console.log('Loaded saved search:', selectedSavedSearch);
        // setSelectedSavedSearch(null);
    };

    // Handler to edit a saved search
    const handleEditSearch = (search) => {
        setEditingSearchId(search.id);
        setSaveDialogOpen(true);
    };

    // Handler to delete a saved search
    const handleDeleteSearch = (searchId) => {
        setSearchToDelete(searchId);
        setConfirmDialogOpen(true);
    };

    // Handler to confirm deletion
    const handleConfirmDelete = async () => {
        if (!searchToDelete) return;

        setIsDeleting(true);
        try {
            // Check if the deleted search is currently selected
            const isCurrentlySelected = selectedSavedSearch && selectedSavedSearch.id === searchToDelete;

            await deleteSavedSearch(searchToDelete);

            // If the deleted search was selected, reset filters and clear selection
            if (isCurrentlySelected) {
                handleFilterReset('resource');
                handleFilterReset('pipeline');
                setSelectedSavedSearch(null);
            }

            // Refresh the saved searches list
            fetchSavedSearches();
            // if no searches are available close search dialog
            if (!savedSearches.length) {
                setLoadDialogOpen(false);
            }
        } catch (error) {
            console.error('Failed to delete search:', error);
            alert('Failed to delete search. Please try again.');
        } finally {
            setIsDeleting(false);
            setConfirmDialogOpen(false);
            setSearchToDelete(null);
        }
    };

    // Handler to cancel deletion
    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
        setSearchToDelete(null);
    };

    // Handler to cancel edit mode
    const handleCancelEdit = () => {
        setEditingSearchId(null);
        setSaveDialogOpen(false);
    };

    // Get initial values for the dialog
    const getInitialDialogValues = () => {
        if (editingSearchId) {
            const editingSearch = savedSearches.find(search => search.id === editingSearchId);
            return {
                name: editingSearch?.name || '',
                description: editingSearch?.description || ''
            };
        }
        return {
            name: '',
            description: ''
        };
    };

    // Handler to clear selected search and reset filters
    const handleClearSelectedSearch = (e) => {
        e.stopPropagation(); // Prevent triggering the FAB's onClick
        handleFilterReset('resource');
        handleFilterReset('pipeline');
        setSelectedSavedSearch(null);
    };

    function filterPipelinesByProject(definitions, projectFilter) {
        if (!projectFilter) {
            return definitions;
        }

        var filtered_definitions = []
        definitions.forEach(function (item, index) {
            if (item.project.id === projectFilter['id']) {
                filtered_definitions.push(item);
            }
        });

        return filtered_definitions;
    }

    function filterBuildsByProject(builds, projectFilter) {
        if (!projectFilter) {
            return builds;
        }

        var filtered_builds = []
        builds.forEach(function (item, index) {
            if (item.project.id === projectFilter['id']) {
                filtered_builds.push(item);
            }
        });

        return filtered_builds;
    }

    function filterResourcesByProject(resources, projectFilter, resourceType) {
        // this function is also in Platform
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

        const lc = logic_containers.find(lc => lc.id === logic_container_filter_id);

        return resources.filter(resource =>
            resource.id && lc.resources.includes(resource.id)
        );
    }

    function filterPipelinesUsingFilteredResources(filteredPipelines, filteredProtectedResources) {

        // need to get the resources the pipeline can access from here, a list and then use that list to filter against the filtered resources
        var filteredProtectedResourcesIds = filteredProtectedResources.map(resource => String(resource.id))

        return Object.values(filteredPipelines).filter(p => {
            if (
                p.resourcepermissions &&
                p.resourcepermissions[resource_type_selected] &&
                p.resourcepermissions[resource_type_selected].some(id => filteredProtectedResourcesIds.includes(id))
            ) {
                return true;
            }
            return false;
        })
    }


    function filterResourcesByProtectedState(resources, protectedState) {
        if (protectedState === "all") {
            return resources;
        }
        return resources.filter(resource => resource.protectedState === protectedState);
    }

    function filterResourcesByCrossProject(resources, crossProject) {
        if (!crossProject) {
            return resources;
        }
        return resources.filter(resource => resource.isCrossProject === crossProject);
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

    function filterPipelinesBySearchTerm(pipelines, searchTermPipelines) {
        if (!searchTermPipelines) {
            return pipelines;
        }
        const lowerCaseSearchTerm = searchTermPipelines.toLowerCase();

        return Object.values(pipelines).filter(pipeline => {
            const pipelineName = pipeline.name ? pipeline.name.toLowerCase() : '';
            const pipelineId = pipeline.id ? pipeline.id.toString() : ''; // Convert ID to string for comparison
            return pipelineName.includes(lowerCaseSearchTerm) || pipelineId.includes(lowerCaseSearchTerm);
        });
    }

    function filterByPoolType(resources, poolType) {
        if (poolType === 'all') {
            return resources;
        }
        let compare = false;
        if (poolType === 'ms-hosted') {
            compare = true;
        } else {
            compare = false;
        }
        return resources.filter(resource => resource.isHosted === compare);
    }

    // @TODO implement
    // function filterBySingleUse(resources, poolType) {
    //     return resources
    // }

    let filteredProtectedResources = [];
    let filteredPipelines = pipelines;
    let filteredBuilds = builds;

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
            // if i want to drill into deployment groups as well
            // filteredProtectedResources = [...environments, ...deploymentGroups];
            break;
        default:
            break;
    }


    // @TODO DECIDE Moving this into the fetch resources may actually have a bad impact if switching across projects
    if (selectedProject) {
        filteredProtectedResources = filterResourcesByProject(filteredProtectedResources, selectedProject, resource_type_selected);
        filteredPipelines = filterPipelinesByProject(pipelines, selectedProject);
        filteredBuilds = filterBuildsByProject(builds, selectedProject);
    }

    if (logic_container_filter) {
        filteredProtectedResources = filterResourcesByLogicContainer(filteredProtectedResources, logic_container_filter);
    }

    if (protectedState) {
        filteredProtectedResources = filterResourcesByProtectedState(filteredProtectedResources, protectedState);
    }

    if (crossProject) {
        filteredProtectedResources = filterResourcesByCrossProject(filteredProtectedResources, crossProject);
    }

    if (searchTerm) {
        filteredProtectedResources = filterResourcesBySearchTerm(filteredProtectedResources, searchTerm);
    }

    if (poolType) {
        filteredProtectedResources = filterByPoolType(filteredProtectedResources, poolType);
    }


    // get all the containers associated with this resource and if they exist in the nodes, connect them
    function getLogicContainersForResource(resourceId) {
        return logic_containers
            .filter(container =>
                Array.isArray(container.resources) &&
                container.resources.map(String).includes(String(resourceId))
            )
    }

    if (filterForOverprivilegedResources) {
        filteredProtectedResources = filteredProtectedResources.filter(resource => {
            return getLogicContainersForResource(resource.id).length > 1;
        });
    }

    if (filterForOversharedResources) {
        filteredProtectedResources = filteredProtectedResources.filter(resource => {
            return (resource.isOpenAllPipelines) || (resource.pipelinepermissions && resource.pipelinepermissions.length > 1);
        });
    }


    if (pipelinesUsingFilteredResources) {
        filteredPipelines = filterPipelinesUsingFilteredResources(filteredPipelines, filteredProtectedResources);
    }

    if (searchTermPipelines) {
        filteredPipelines = filterPipelinesBySearchTerm(filteredPipelines, searchTermPipelines);
    }


    if (filterForOverprivilegedPipelines) {
        filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
            if (!pipeline.resourcepermissions || !pipeline.resourcepermissions[resource_type_selected]) {
                return false;
            }
            const resourcePermissions = pipeline.resourcepermissions[resource_type_selected];
            var seen_containers = [];
            for (const resourceId of resourcePermissions) {
                filteredProtectedResources.forEach(resource => {
                    if (String(resource.id) === String(resourceId)) {
                        getLogicContainersForResource(String(resourceId)).forEach(container => {
                            if (!seen_containers.includes(container.id)) {
                                seen_containers.push(container.id);
                            }
                        });
                    }
                });
            }


            if (seen_containers.length > 1) {
                return true;
            }
        });
    }

    if (filterForUnqueriablePipelines) {
        filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
            // Check potential pipeline executions (preview)
            let hasErrorYamlExec = false;
            if (pipeline.builds && pipeline.builds.preview) {
                Object.entries(pipeline.builds.preview).forEach(([branch, value]) => {
                    if (value.is_yaml_preview_available === false) {
                        hasErrorYamlExec = true;
                    }
                });
            }
            return hasErrorYamlExec;
        });
    }

    if (filterForDisabledPipelines) {
        filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
            if (pipeline.queueStatus == 'disabled') {
                return true;
            }
        });
    }

    if (filterForJobAuthorizationScope) {
        if (filterForJobAuthorizationScope !== "all") {
            filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
                if (!pipeline.jobAuthorizationScope || pipeline.jobAuthorizationScope !== filterForJobAuthorizationScope) {
                    return false;
                }
                return true;
            });
        }
    }

    if (filterForPipelineType) {
        if (filterForPipelineType !== "all") {
            filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
                // console.log(pipeline);
                // console.log(filterForPipelineType);
                if (!pipeline.process?.type || pipeline.process.type != filterForPipelineType) {
                    return false;
                }
                return true;
            });
        }
    }

    function filterPipelinesByAdvancedFilters(pipelines, filters) {
        if (!filters || filters.length === 0) return pipelines;

        // Group filters by their scope
        const triggerFilters = filters.filter(f => f.field === 'trigger');
        const stageFilters = filters.filter(f => f.field === 'stageName' || f.field === 'stagePool');
        const jobFilters = filters.filter(f => f.field === 'jobName' || f.field === 'jobPool');
        const stepFilters = filters.filter(f => f.field === 'stepType' || f.field === 'stepName' || f.field === 'stepDisplayName' || f.field === 'stepInputs' || f.field === 'stepEnabled');

        // Filter pipelines
        var filt_pipelines = Object.values(pipelines).filter(pipeline => {
            let yaml_recipes = [];
            if (pipeline.builds && pipeline.builds.preview) {
                Object.entries(pipeline.builds.preview).forEach(([key, value]) => {
                    if (value.pipeline_recipe) {
                        yaml_recipes.push(value.pipeline_recipe);
                    }
                });
            }

            const someYamlRecipeMatches = yaml_recipes.some(yaml_recipe => {

                // if not yaml_recipe means theres no valid pipeline recipe, so skip this pipeline
                if (!yaml_recipe || !yaml_recipe.trigger || !yaml_recipe.stages) {
                    // if filter unqueriable is true, show this pipeline
                    if (filters.some(f => f.field === 'unqueriable' && f.value === true)) {
                        return true;
                    }
                    return false;
                }

                // Trigger filters - there is only one trigger, so easy logic
                const triggerResult = triggerFilters.every(filter => {
                    let result = yaml_recipe?.trigger && JSON.stringify(yaml_recipe?.trigger).toLowerCase().includes(filter.value.toLowerCase());
                    if (filter.negate) result = !result;
                    return result;
                });
                if (!triggerResult) return false;

                // Stage filters: At least one stage matches all stage filters
                // If negation is in place for a single filter, I want to check if all stages do not match that filter
                const stages = yaml_recipe?.stages || [];

                if (stageFilters.length > 0) {
                    // for every filter is an AND condition
                    const stageFiltersResult = stageFilters.every(filter => {
                        if (filter.negate) {
                            const allStagesDoNotMatch = stages.every(stage => {
                                let result = true;
                                switch (filter.field) {
                                    case 'stageName':
                                        result = stage.stage && stage.stage.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stagePool':
                                        result = stage.pool && JSON.stringify(stage.pool).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    default:
                                        // if filter is unknown, consider it a match, which negated means it will exclude the stage
                                        result = true;
                                }
                                // negate logic - check if stage does not include the filter value
                                result = !result;
                                return result;
                            });
                            return allStagesDoNotMatch;
                        } else {
                            const someStagesMatch = stages.some(stage => {
                                let result = false;
                                switch (filter.field) {
                                    case 'stageName':
                                        result = stage.stage && stage.stage.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stagePool':
                                        result = stage.pool && JSON.stringify(stage.pool).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    default:
                                        result = false;
                                }
                                return result;
                            });
                            return someStagesMatch;
                        }
                    })
                    if (!stageFiltersResult) return false;
                }


                if (jobFilters.length > 0) {
                    // for every filter is an AND condition
                    const jobFiltersResult = jobFilters.every(filter => {
                        if (filter.negate) {
                            const allJobsDoNotMatch = stages.every(stage => (stage.jobs || []).every(job => {
                                let result = true;
                                switch (filter.field) {
                                    case 'jobName':
                                        result = job.job && job.job.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'jobPool':
                                        result = job.pool && JSON.stringify(job.pool).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    default:
                                        result = true;
                                }
                                result = !result;
                                return result;
                            }));
                            return allJobsDoNotMatch;
                        } else {
                            const someJobsMatch = stages.some(stage => (stage.jobs || []).some(job => {
                                let result = false;
                                switch (filter.field) {
                                    case 'jobName':
                                        result = job.job && job.job.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'jobPool':
                                        result = job.pool && JSON.stringify(job.pool).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    default:
                                        result = false;
                                }
                                return result;
                            }));
                            return someJobsMatch;
                        }
                    })
                    if (!jobFiltersResult) return false;
                }


                if (stepFilters.length > 0) {
                    // for every filter is an AND condition
                    const stepFiltersResult = stepFilters.every(filter => {
                        if (filter.negate) {
                            const allStepsDoNotMatch = stages.every(stage => (stage.jobs || []).every(job => (job.steps || []).every(step => {
                                let result = true;
                                switch (filter.field) {
                                    case 'stepType':
                                        result = step.type && step.type.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepName':
                                        result = step.task && step.task.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepDisplayName':
                                        result = step.displayName && step.displayName.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepInputs':
                                        result = step.inputs && JSON.stringify(step.inputs).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepEnabled':
                                        // Boolean, so check for string match or boolean match
                                        if (typeof step.enabled === 'boolean') {
                                            result = String(step.enabled).toLowerCase() === filter.value.toLowerCase();
                                        } else if (typeof step.enabled === 'string') {
                                            result = step.enabled.toLowerCase().includes(filter.value.toLowerCase());
                                        }
                                        break;
                                    default:
                                        result = true;
                                }
                                result = !result;
                                return result;
                            })));
                            return allStepsDoNotMatch;
                        } else {
                            const someStepsMatch = stages.some(stage => (stage.jobs || []).some(job => (job.steps || []).some(step => {
                                let result = false;
                                switch (filter.field) {
                                    case 'stepType':
                                        result = step.type && step.type.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepName':
                                        result = step.task && step.task.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepDisplayName':
                                        result = step.displayName && step.displayName.toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepInputs':
                                        result = step.inputs && JSON.stringify(step.inputs).toLowerCase().includes(filter.value.toLowerCase());
                                        break;
                                    case 'stepEnabled':
                                        // Boolean, so check for string match or boolean match
                                        if (typeof step.enabled === 'boolean') {
                                            result = String(step.enabled).toLowerCase() === filter.value.toLowerCase();
                                        } else if (typeof step.enabled === 'string') {
                                            result = step.enabled.toLowerCase().includes(filter.value.toLowerCase());
                                        }
                                        break;
                                    default:
                                        result = false;
                                }
                                return result;
                            })));
                            return someStepsMatch;
                        }
                    })
                    if (!stepFiltersResult) return false;
                }
                return true;
            });
            return someYamlRecipeMatches;
        });

        return filt_pipelines;
    }

    function filterBuildsByAdvancedFilters(builds, filters) {
        if (!filters || filters.length === 0) return builds;


        // Group filters by their scope
        const triggerFilters = filters.filter(f => f.field === 'trigger');
        const stageFilters = filters.filter(f => f.field === 'stageName' || f.field === 'stagePool');
        const jobFilters = filters.filter(f => f.field === 'jobName' || f.field === 'jobPool');
        const stepFilters = filters.filter(f => f.field === 'stepType' || f.field === 'stepName' || f.field === 'stepDisplayName' || f.field === 'stepInputs' || f.field === 'stepEnabled');

        var filt_builds = Object.values(builds).filter(build => {
            let yaml_recipe = {};
            if (build && build.pipeline_recipe) {
                yaml_recipe = build.pipeline_recipe;
            }

            // Trigger filters
            const triggerResult = triggerFilters.every(filter => {
                let result = yaml_recipe?.trigger && JSON.stringify(yaml_recipe?.trigger).toLowerCase().includes(filter.value.toLowerCase());
                if (filter.negate) result = !result;
                return result;
            });
            if (!triggerResult) return false;

            // Stage filters: at least one stage matches all stage filters
            const stages = yaml_recipe?.stages || [];
            const stageResult = stageFilters.length === 0 || stages.some(stage => {
                return stageFilters.every(filter => {
                    let result = false;
                    switch (filter.field) {
                        case 'stageName':
                            result = stage.stage && stage.stage.toLowerCase().includes(filter.value.toLowerCase());
                            break;
                        case 'stagePool':
                            var pool_check = stage.pool ? stage.pool : yaml_recipe.pool;
                            result = pool_check && JSON.stringify(pool_check).toLowerCase().includes(filter.value.toLowerCase());
                            break;
                        default:
                            result = true;
                    }
                    if (filter.negate) result = !result;
                    return result;
                });
            });
            if (!stageResult) return false;

            // Job filters: at least one job (in any stage) matches all job filters
            const jobResult = jobFilters.length === 0 || stages.some(stage =>
                (stage.jobs || []).some(job => {
                    return jobFilters.every(filter => {
                        let result = false;
                        switch (filter.field) {
                            case 'jobName':
                                result = job.job && job.job.toLowerCase().includes(filter.value.toLowerCase());
                                break;
                            case 'jobPool':
                                result = job.pool && JSON.stringify(job.pool).toLowerCase().includes(filter.value.toLowerCase());
                                break;
                            default:
                                result = true;
                        }
                        if (filter.negate) result = !result;
                        return result;
                    });
                })
            );
            if (!jobResult) return false;

            // Step filters: at least one step (in any job of any stage) matches all step filters
            const stepResult = stepFilters.length === 0 || stages.some(stage =>
                (stage.jobs || []).some(job =>
                    (job.steps || []).some(step => {
                        return stepFilters.every(filter => {
                            let result = false;
                            switch (filter.field) {
                                case 'stepType':
                                    result = step.type && step.type.toLowerCase().includes(filter.value.toLowerCase());
                                    break;
                                case 'stepName':
                                    result = step.task && step.task.toLowerCase().includes(filter.value.toLowerCase());
                                    break;
                                case 'stepDisplayName':
                                    result = step.displayName && step.displayName.toLowerCase().includes(filter.value.toLowerCase());
                                    break;
                                case 'stepInputs':
                                    result = step.inputs && JSON.stringify(step.inputs).toLowerCase().includes(filter.value.toLowerCase());
                                    break;
                                case 'stepEnabled':
                                    // Boolean, so check for string match or boolean match
                                    if (typeof step.enabled === 'boolean') {
                                        result = String(step.enabled).toLowerCase() === filter.value.toLowerCase();
                                    } else if (typeof step.enabled === 'string') {
                                        result = step.enabled.toLowerCase().includes(filter.value.toLowerCase());
                                    }
                                    break;
                                default:
                                    result = true;
                            }
                            if (filter.negate) result = !result;
                            return result;
                        });
                    })
                )
            );
            if (!stepResult) return false;

            return true;
        });

        return filt_builds;
    }


    // Apply advanced pipeline filters
    if (pipelineAdvancedFilters && pipelineAdvancedFilters.length > 0 && pipelineAdvancedFilters.some(f => f.value)) {
        filteredPipelines = filterPipelinesByAdvancedFilters(filteredPipelines, pipelineAdvancedFilters.filter(f => f.value));
        filteredBuilds = filterBuildsByAdvancedFilters(filteredBuilds, pipelineAdvancedFilters.filter(f => f.value));
    }

    // Filter pipelines with executions (nodes) that have alerts
    if (filterForAlertedPipelines) {
        filteredPipelines = Object.values(filteredPipelines).filter(pipeline => {
            // Check pipeline executions (historic_builds)
            let hasAlertedBuild = false;
            if (pipeline.builds && Array.isArray(pipeline.builds.builds)) {
                hasAlertedBuild = pipeline.builds.builds.some(buildId => {
                    // Find the build node in filteredBuilds
                    const buildNode = filteredBuilds.find(b => String(b.id) === String(buildId));
                    return buildNode && Array.isArray(buildNode.cicd_sast) && buildNode.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0);
                });
            }
            // Check potential pipeline executions (preview)
            let hasAlertedPotential = false;
            if (pipeline.builds && pipeline.builds.preview) {
                hasAlertedPotential = Object.values(pipeline.builds.preview).some(previewBuild => {
                    return previewBuild && Array.isArray(previewBuild.cicd_sast) && previewBuild.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0);
                });
            }
            return hasAlertedBuild || hasAlertedPotential;
        });
    }

    return (
        <Box sx={{ p: 3 }}>
            {!selectedScan ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                    {console.log("No scan selected")}
                    <CircularProgress size={80} style={{ color: 'purple' }} />
                </Box>
            ) : (
                <>
                    <Typography variant="h3" gutterBottom sx={{ fontSize: '1.3rem' }}>
                        Resource & Pipeline Tracker
                    </Typography>
                    <Stack sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                            <ResourceButtonGroup
                                resourceTypes={resourceTypes.filter(rt => !rt.disabled)}
                                resourceType={resource_type_selected}
                                handleResourceTypeChange={handleResourceTypeChange}
                            />
                        </Box>
                        {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                            <ButtonGroup>
                                <Button
                                    variant={filterFocus === 'resource' ? 'contained' : 'outlined'}
                                    onClick={() => handleFilterFocusChange('resource')}
                                >
                                    Resource Focused
                                </Button>
                                <Button
                                    variant={filterFocus === 'pipeline' ? 'contained' : 'outlined'}
                                    onClick={() => handleFilterFocusChange('pipeline')}
                                >
                                    Pipeline Focused
                                </Button>
                            </ButtonGroup>
                        </Box> */}
                    </Stack>

                    <Box sx={{
                        alignItems: 'left',
                        justifyContent: 'left',
                        position: 'relative',
                    }}>
                        <IconButton
                            aria-label="Print D3 Graph as PNG"
                            onClick={() => {
                                setFilteringUICollapsed(!filteringUICollapsed);
                                // Close any open FAB panels when toggling main UI
                                if (filteringUICollapsed) {
                                    setResourceFilterExpanded(false);
                                    setPipelineFilterExpanded(false);
                                }
                            }}
                            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
                            size="small"
                        >
                            <FilterListIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', mx: 'auto', height: '70vh', minHeight: '30vh', maxHeight: '80vh', overflow: 'hidden' }}>

                        {/* Filtering UI */}
                        <Box
                            sx={{
                                flexShrink: 0,
                                width: filteringUICollapsed ? 48 : "auto", // ✅ numeric target values
                                // transition: 'width 0.3s ease-in-out',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                gap: 2,
                                overflowY: 'auto',
                                maxHeight: '100%',
                                textAlign: 'center',
                                maxWidth: '60%',
                            }}
                        >

                            <Collapse in={!filteringUICollapsed} timeout={300}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="h5" color="#e25762" gutterBottom sx={{ fontSize: '1rem', mb: 0 }}>
                                        Resource Filters
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: 'rgba(226,87,98,0.07)', padding: 2, borderRadius: 1 }}>

                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            flexDirection: 'row',
                                            gap: 2,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            minWidth: 0,
                                        }}>
                                            <TextField
                                                variant="standard"
                                                sx={{ mx: 2, maxWidth: 200 }}
                                                label="Search by Name/ID"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                <InputLabel id="logic-container-filter-label">Logic Container</InputLabel>
                                                <Select
                                                    labelId="logic-container-filter-label"
                                                    value={logic_container_filter}
                                                    onChange={handleLogicContainerSelect}
                                                    label="Logic Container"
                                                >
                                                    <MenuItem value="all">
                                                        <em>All</em>
                                                    </MenuItem>
                                                    {Object.keys(logic_containers).map((key) => (
                                                        <MenuItem key={logic_containers[key].id} value={logic_containers[key].id}>
                                                            {logic_containers[key].name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                <InputLabel id="compliance-state-label">Resource Protection</InputLabel>
                                                <Select
                                                    labelId="compliance-state-label"
                                                    value={protectedState}
                                                    onChange={handleResourcesByProtectedStateChange}
                                                    label="Resource Protection"
                                                >
                                                    <MenuItem value="all">
                                                        <em>All</em>
                                                    </MenuItem>
                                                    <MenuItem value="protected">Protected</MenuItem>
                                                    <MenuItem value="unprotected">Unprotected</MenuItem>
                                                </Select>
                                            </FormControl>
                                            {resource_type_selected === 'pool_merged' && (
                                                <>
                                                    <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                        <InputLabel id="pool-type-label">Pool Type</InputLabel>
                                                        <Select
                                                            labelId="pool-type-label"
                                                            value={poolType}
                                                            onChange={(e) => setPoolType(e.target.value)}
                                                            label="Pool Type"
                                                        >
                                                            <MenuItem value="all">
                                                                <em>All</em>
                                                            </MenuItem>
                                                            <MenuItem value="ms-hosted">Microsoft Hosted</MenuItem>
                                                            <MenuItem value="self-hosted">Self-Hosted</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {/* <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={singleUsePools} // Replace with appropriate state for exclusive queues
                                                        onChange={(e) => setSingleUsePools(e.target.checked)} // Replace with appropriate handler
                                                    />
                                                }
                                                label="Show pools with exclusive use (single use)"
                                            /> */}
                                                </>
                                            )}
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            flexDirection: 'row',
                                            gap: 2,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            minWidth: 0,
                                        }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForOverprivilegedResources}
                                                        onChange={(e) => setFilterForOverprivilegedResources(e.target.checked)}
                                                    />
                                                }
                                                label="Overprivileged"
                                            />

                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForOversharedResources}
                                                        onChange={(e) => setFilterForOversharedResources(e.target.checked)}
                                                    />
                                                }
                                                label="Overshared"
                                            />
                                            <FormControlLabel
                                                sx={{ justifyContent: 'center', }}
                                                control={
                                                    <Checkbox
                                                        checked={crossProject}
                                                        onChange={(e) => setCrossProject(e.target.checked)}
                                                    />
                                                }
                                                label="Cross Project"
                                            />

                                            {/* Tooltip explaining resource filters */}
                                            <Tooltip
                                                title={
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Overprivileged" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is included in more than one logic container (shared across multiple containers)
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Overshared" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is open to all pipelines or permissioned to more than one pipeline
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <Chip label="Cross Project" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is accessible across multiple projects
                                                        </Typography>
                                                    </Box>
                                                }
                                                placement="right"
                                            >
                                                <HelpOutlineIcon color="action" sx={{ fontSize: 24, cursor: 'pointer', ml: 2 }} />
                                            </Tooltip>
                                        </Box>

                                        <Box
                                            component="span"
                                            onClick={() => handleFilterReset('resource')}
                                            sx={{
                                                alignSelf: 'flex-end',
                                                cursor: 'pointer',
                                                color: '#1a0dab',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                },
                                            }}
                                        >
                                            Reset Resource Filters
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mt: 4, mb: 2 }}></Divider>

                                    <Typography variant="h5" color="#5669b3" gutterBottom sx={{ fontSize: '1rem' }}>
                                        Pipeline Filters
                                    </Typography>


                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: 'rgba(86,105,179,0.07)', padding: 2, borderRadius: 1 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            flexDirection: 'row',
                                            gap: 2,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            minWidth: 0,
                                        }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <TextField
                                                    variant="standard"
                                                    sx={{ mx: 2, maxWidth: 200 }}
                                                    label="Search by Name/ID"
                                                    value={searchTermPipelines}
                                                    onChange={(e) => setSearchTermPipelines(e.target.value)}
                                                />
                                            </Box>
                                            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                                <InputLabel id="authz-label">Authorization Scope</InputLabel>
                                                <Select
                                                    labelId="authz-label"
                                                    value={filterForJobAuthorizationScope}
                                                    onChange={handlePipelineAuthZScopeChange}
                                                    label="Authorization Scope"
                                                >
                                                    <MenuItem value="all">
                                                        <em>All</em>
                                                    </MenuItem>
                                                    <MenuItem value="projectCollection">Organisation</MenuItem>
                                                    <MenuItem value="project">Project</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                                <InputLabel id="type-label">Pipeline Type</InputLabel>
                                                <Select
                                                    labelId="type-label"
                                                    value={filterForPipelineType}
                                                    onChange={handlePipelineTypeChange}
                                                    label="Pipeline Type"
                                                >
                                                    <MenuItem value="all">
                                                        <em>All</em>
                                                    </MenuItem>
                                                    <MenuItem value="1">Classic</MenuItem>
                                                    <MenuItem value="2">YAML</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            flexDirection: 'row',
                                            gap: 2,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            minWidth: 0,
                                        }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={pipelinesUsingFilteredResources}
                                                        onChange={(e) => setPipelinesUsingFilteredResources(e.target.checked)}
                                                    />
                                                }
                                                label="Permissioned"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForOverprivilegedPipelines}
                                                        onChange={(e) => setFilterForOverprivilegedPipelines(e.target.checked)}
                                                    />
                                                }
                                                label="Overprivileged"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForAlertedPipelines}
                                                        onChange={e => setFilterForAlertedPipelines(e.target.checked)}
                                                    />
                                                }
                                                label="Alerts"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForDisabledPipelines}
                                                        onChange={(e) => setFilterForDisabledPipelines(e.target.checked)}
                                                    />
                                                }
                                                label="Disabled"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={filterForUnqueriablePipelines}
                                                        onChange={(e) => setFilterForUnqueriablePipelines(e.target.checked)}
                                                    />
                                                }
                                                label="YAML Error"
                                            />
                                            <Tooltip
                                                title={
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Permissioned" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Shows pipelines that have permissions to the currently filtered resources
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Overprivileged" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with access to resources included in more than one logic container
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Alerts" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with builds or previews containing security alerts
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <Chip label="Disabled" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines that are currently disabled (cannot be queued)
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            <Chip label="YAML Error" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with YAML errors in preview builds (unqueriable)
                                                        </Typography>
                                                    </Box>
                                                }
                                                placement="right"
                                            >
                                                <HelpOutlineIcon color="action" sx={{ fontSize: 24, cursor: 'pointer', ml: 2 }} />
                                            </Tooltip>
                                        </Box>

                                        <Divider sx={{ mt: 2, mb: 2 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                            {pipelineAdvancedFilters.map((filter, idx) => (
                                                <Box key={idx} sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mb: 1, width: '100%', overflowX: 'auto' }}>
                                                    <FormControl variant="outlined" sx={{ minWidth: 150, flex: 1 }}>
                                                        <Select
                                                            value={filter.field}
                                                            onChange={e => handleAdvancedFilterChange(idx, 'field', e.target.value)}
                                                            size="small"
                                                            MenuProps={{
                                                                PaperProps: {
                                                                    style: {
                                                                        maxHeight: 300,
                                                                    },
                                                                },
                                                            }}
                                                        >
                                                            {/* Trigger Group */}
                                                            <ListSubheader style={{ color: '#1976d2' }}>Trigger</ListSubheader>
                                                            <MenuItem value="trigger" sx={{ backgroundColor: '#e3f2fd', borderRadius: 0 }}>Trigger</MenuItem>

                                                            {/* Stage Group */}
                                                            <ListSubheader style={{ color: '#388e3c' }}>Stage</ListSubheader>
                                                            <MenuItem value="stageName" sx={{ backgroundColor: '#e8f5e9', borderRadius: 0 }}>Stage Name</MenuItem>
                                                            <MenuItem value="stagePool" sx={{ backgroundColor: '#e8f5e9', borderRadius: 0 }}>Stage Pool</MenuItem>

                                                            {/* Job Group */}
                                                            <ListSubheader style={{ color: '#f57c00' }}>Job</ListSubheader>
                                                            <MenuItem value="jobName" sx={{ backgroundColor: '#fff3e0', borderRadius: 0 }}>Job Name</MenuItem>
                                                            <MenuItem value="jobPool" sx={{ backgroundColor: '#fff3e0', borderRadius: 0 }}>Job Pool</MenuItem>

                                                            {/* Step Group */}
                                                            <ListSubheader style={{ color: '#6a1b9a' }}>Step</ListSubheader>
                                                            <MenuItem value="stepType" sx={{ backgroundColor: '#f3e5f5', borderRadius: 0 }}>Step Type</MenuItem>
                                                            <MenuItem value="stepName" sx={{ backgroundColor: '#f3e5f5', borderRadius: 0 }}>Step Name</MenuItem>
                                                            <MenuItem value="stepDisplayName" sx={{ backgroundColor: '#f3e5f5', borderRadius: 0 }}>Display Name</MenuItem>
                                                            <MenuItem value="stepEnabled" sx={{ backgroundColor: '#f3e5f5', borderRadius: 0 }}>Step Enabled</MenuItem>
                                                            <MenuItem value="stepInputs" sx={{ backgroundColor: '#f3e5f5', borderRadius: 0 }}>Step Inputs</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl variant="outlined" sx={{ minWidth: 100, flex: 1 }}>
                                                        {/* <Select
                                                    value={filter.operator}
                                                    onChange={e => handleAdvancedFilterChange(idx, 'operator', e.target.value)}
                                                    size="small"
                                                >
                                                    <MenuItem disabled value="equals">Equals</MenuItem>
                                                    <MenuItem value="contains">Contains</MenuItem>
                                                </Select> */}
                                                        <Typography variant="body2" sx={{ color: 'grey.600', alignSelf: 'center', minWidth: 100, textAlign: 'center' }}>
                                                            contains
                                                        </Typography>
                                                    </FormControl>
                                                    <TextField
                                                        size="small"
                                                        variant="outlined"
                                                        value={filter.value}
                                                        onChange={e => handleAdvancedFilterChange(idx, 'value', e.target.value)}
                                                        placeholder="Value"
                                                        sx={{ minWidth: 120, flex: 2 }}
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={!!filter.negate}
                                                                onChange={e => handleAdvancedFilterChange(idx, 'negate', e.target.checked)}
                                                            />
                                                        }
                                                        label="Negate"
                                                        sx={{ flex: 0 }}
                                                    />
                                                    {idx === pipelineAdvancedFilters.length - 1 && (
                                                        <Button onClick={handleAddAdvancedFilter} color="primary" size="small" sx={{ minWidth: 0, px: 1, flex: 0 }}>AND</Button>

                                                    )}
                                                    <Button onClick={() => handleRemoveAdvancedFilter(idx)} color="error" size="small" sx={{ minWidth: 0, px: 1, flex: 0 }} disabled={pipelineAdvancedFilters.length === 1}>x</Button>
                                                </Box>
                                            ))}
                                        </Box>


                                        <Box
                                            component="span"
                                            onClick={() => handleFilterReset('pipeline')}
                                            sx={{
                                                alignSelf: 'flex-end',
                                                cursor: 'pointer',
                                                color: '#1a0dab',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                },
                                            }}
                                        >
                                            Reset Pipeline Filters
                                        </Box>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>

                        {/* D3JSResource Component */}

                        <Box
                            sx={{
                                flex: d3Flex,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                minWidth: 0,
                                overflowY: 'auto',
                                position: 'relative',
                                transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <D3JSResource
                                selectedType={resource_type_selected}
                                filteredProtectedResources={filteredProtectedResources}
                                builds={filteredBuilds}
                                pipelines={filteredPipelines}
                                logic_containers={logic_containers}
                                projects={projects}
                                sx={{ height: '100%', width: '100%' }}
                            />
                        </Box>
                    </Box>


                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', maxWidth: "100%", mx: 'auto' }}>
                        <ResourceTable
                            filteredBadge={isFilteredResource}
                            selectedType={resource_type_selected}
                            filteredProtectedResources={filteredProtectedResources}
                            logicContainers={logic_containers}
                            projects={projects}
                            filterFocus={false}
                            onLogicContainerChange={() => {
                                fetchLogicContainers();
                                fetchResources(selectedScan.id);
                            }}
                        />
                        <PipelineTable
                            builds={filteredBuilds}
                            filteredBadge={isFilteredPipeline}
                            filteredPipelines={filteredPipelines}
                            filterFocus={false}
                            filteredResourcesTypes_Ids={filteredProtectedResources.map(resource => resource_type_selected + "_" + resource.id)}
                            repositories={repositories}
                            endpoints={endpoints}
                            secureFiles={secureFiles}
                            pools={pools}
                            variableGroups={variableGroups}
                            selectedScan={selectedScan}
                            resourceTypeSelected={resource_type_selected}
                            setResourceTypeSelected={setResourceTypeSelected}
                            getProtectedResourcesByOrgTypeAndIdsSummary={getProtectedResourcesByOrgTypeAndIdsSummary}
                        />
                    </Box>
                </>
            )}

            {/* Floating Action Buttons */}
            <Box sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1100,
                display: 'flex',
                gap: 2
            }}>
                <Fab
                    variant="extended"
                    color="primary"
                    aria-label="load search"
                    onClick={() => setLoadDialogOpen(true)}
                    size="medium"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <SearchIcon />
                    {selectedSavedSearch && (
                        <>
                            <Typography sx={{ ml: 1, fontWeight: 500 }}>
                                {selectedSavedSearch.name}
                            </Typography>
                            <Box
                                component="span"
                                onClick={handleClearSelectedSearch}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'inherit',
                                    ml: 1,
                                    p: 0.5,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </Box>
                        </>
                    )}
                </Fab>
                <Fab
                    variant="extended"
                    color="success"
                    aria-label="save search"
                    onClick={() => setSaveDialogOpen(true)}
                    size="medium"
                    disabled={!(isFilteredResource > 0 || isFilteredPipeline > 0)}
                    sx={{
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <SaveAsIcon />
                </Fab>
                <Fab
                    variant="extended"
                    color="error"
                    aria-label="reset filters"
                    onClick={() => handleFilterReset(false)}
                    size="medium"
                    disabled={!(isFilteredResource > 0 || isFilteredPipeline > 0)}
                    sx={{
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <CloseIcon />
                </Fab>
            </Box>

            {/* Resource Filter Fab - Bottom Left - Show when main UI is collapsed or user scrolled past 45% */}
            {(filteringUICollapsed || showFabFilters) && (
                <ClickAwayListener onClickAway={() => setResourceFilterExpanded(false)}>
                    <Box sx={{
                        position: 'fixed',
                        bottom: 24,
                        left: '0%',
                        transform: 'translateX(+5%)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        alignItems: 'flex-start',
                        gap: 2
                    }}>
                        <Collapse in={resourceFilterExpanded} timeout={300}>
                            <Paper
                                elevation={8}
                                sx={{
                                    mb: 2,
                                    p: 3,
                                    backgroundColor: 'rgba(226,87,98,0.95)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: 3,
                                    maxWidth: 715,
                                    minWidth: 500,
                                    maxHeight: '60vh',
                                    overflowY: 'auto'
                                }}
                            >
                                <Typography variant="h6" color="white" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                                    Resource Filters
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}>
                                        <TextField
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 150,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                    borderRadius: 1
                                                }
                                            }}
                                            placeholder="Search by Name/ID"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
                                            {/* <InputLabel sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1 }}>Logic Container</InputLabel> */}
                                            <Select
                                                value={logic_container_filter}
                                                onChange={handleLogicContainerSelect}
                                                label="Logic Container"
                                                sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                            >
                                                <MenuItem value="all"><em>Any Logic Containers</em></MenuItem>
                                                {Object.keys(logic_containers).map((key) => (
                                                    <MenuItem key={logic_containers[key].id} value={logic_containers[key].id}>
                                                        {logic_containers[key].name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
                                            {/* <InputLabel sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1 }}>Resource Protection</InputLabel> */}
                                            <Select
                                                value={protectedState}
                                                onChange={handleResourcesByProtectedStateChange}
                                                label="Resource Protection"
                                                sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                            >
                                                <MenuItem value="all"><em>Any Protection State</em></MenuItem>
                                                <MenuItem value="protected">Protected</MenuItem>
                                                <MenuItem value="unprotected">Unprotected</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {resource_type_selected === 'pool_merged' && (
                                            <FormControl variant="outlined" size="small" sx={{ minWidth: 140 }}>
                                                {/* <InputLabel sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1 }}>Pool Type</InputLabel> */}
                                                <Select
                                                    value={poolType}
                                                    onChange={(e) => setPoolType(e.target.value)}
                                                    label="Pool Type"
                                                    sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                                >
                                                    <MenuItem value="all"><em>Any Pool Type</em></MenuItem>
                                                    <MenuItem value="ms-hosted">Microsoft Hosted</MenuItem>
                                                    <MenuItem value="self-hosted">Self-Hosted</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}>

                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForOverprivilegedResources}
                                                    onChange={(e) => setFilterForOverprivilegedResources(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Overprivileged</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForOversharedResources}
                                                    onChange={(e) => setFilterForOversharedResources(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Overshared</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={crossProject}
                                                    onChange={(e) => setCrossProject(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Cross Project</Typography>}
                                        />
                                        <Tooltip
                                            title={
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Overprivileged" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is included in more than one logic container
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Overshared" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is open to all pipelines or permissioned to more than one pipeline
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <Chip label="Cross Project" sx={{ mr: 1, bgcolor: "#f3a8aeff", color: "#fff" }} size="small" />: Resource is accessible across multiple projects
                                                    </Typography>
                                                </Box>
                                            }
                                            placement="top"
                                        >
                                            <HelpOutlineIcon sx={{ color: 'white', fontSize: 20, cursor: 'pointer' }} />
                                        </Tooltip>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        <Typography
                                            variant="body2"
                                            onClick={() => handleFilterReset('resource')}
                                            sx={{
                                                color: 'white',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 0.8 }
                                            }}
                                        >
                                            Reset Filters
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Collapse>

                        <Fab
                            variant="extended"
                            color="secondary"
                            aria-label="resource filters"
                            onClick={() => setResourceFilterExpanded(!resourceFilterExpanded)}
                            size="medium"
                            sx={{
                                bgcolor: '#e25762',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#d94450',
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 3
                            }}
                        >
                            <FilterListIcon />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Resource Filters
                            </Typography>
                            {isFilteredResource > 0 && (
                                <Chip
                                    label={isFilteredResource}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.98)',
                                        color: 'white',
                                        height: 20,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            )}
                            {resourceFilterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Fab>
                    </Box>
                </ClickAwayListener>
            )}

            {/* Pipeline Filter Fab - Bottom Right - Show when main UI is collapsed or user scrolled past 45% */}
            {(filteringUICollapsed || showFabFilters) && (
                <ClickAwayListener onClickAway={() => setPipelineFilterExpanded(false)}>
                    <Box sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: '0%',
                        transform: 'translateX(-5%)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        alignItems: 'flex-end',
                        gap: 2
                    }}>
                        <Collapse in={pipelineFilterExpanded} timeout={300}>
                            <Paper
                                elevation={8}
                                sx={{
                                    mb: 2,
                                    p: 3,
                                    backgroundColor: 'rgba(86,105,179,0.95)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: 3,
                                    maxWidth: 715,
                                    minWidth: 500,
                                    maxHeight: '60vh',
                                    overflowY: 'auto'
                                }}
                            >
                                <Typography variant="h6" color="white" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                                    Pipeline Filters
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 2,
                                        alignItems: 'center',
                                    }}>
                                        <TextField
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                minWidth: 150,
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                    borderRadius: 1
                                                }
                                            }}
                                            placeholder="Search by Name/ID"
                                            value={searchTermPipelines}
                                            onChange={(e) => setSearchTermPipelines(e.target.value)}
                                        />
                                        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                                            {/* <InputLabel sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1 }}>Authorization Scope</InputLabel> */}
                                            <Select
                                                value={filterForJobAuthorizationScope}
                                                onChange={handlePipelineAuthZScopeChange}
                                                label="Authorization Scope"
                                                sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                            >
                                                <MenuItem value="all"><em>Any Authorization Scope</em></MenuItem>
                                                <MenuItem value="projectCollection">Organisation</MenuItem>
                                                <MenuItem value="project">Project</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                            {/* <InputLabel sx={{ backgroundColor: 'rgba(255,255,255,0.9)', px: 1 }}>Pipeline Type</InputLabel> */}
                                            <Select
                                                value={filterForPipelineType}
                                                onChange={handlePipelineTypeChange}
                                                label="Pipeline Type"
                                                sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                            >
                                                <MenuItem value="all"><em>Any Pipeline Type</em></MenuItem>
                                                <MenuItem value="1">Classic</MenuItem>
                                                <MenuItem value="2">YAML</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={pipelinesUsingFilteredResources}
                                                    onChange={(e) => setPipelinesUsingFilteredResources(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Permissioned</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForOverprivilegedPipelines}
                                                    onChange={(e) => setFilterForOverprivilegedPipelines(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Overprivileged</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForAlertedPipelines}
                                                    onChange={e => setFilterForAlertedPipelines(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Alerts</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForDisabledPipelines}
                                                    onChange={(e) => setFilterForDisabledPipelines(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">Disabled</Typography>}
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={filterForUnqueriablePipelines}
                                                    onChange={(e) => setFilterForUnqueriablePipelines(e.target.checked)}
                                                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" color="white">YAML Error</Typography>}
                                        />
                                        <Tooltip
                                            title={
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Permissioned" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Shows pipelines that have permissions to the currently filtered resources
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Overprivileged" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with access to resources included in more than one logic container
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Alerts" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with builds or previews containing security alerts
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        <Chip label="Disabled" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines that are currently disabled (cannot be queued)
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <Chip label="YAML Error" size="small" sx={{ mr: 1, bgcolor: "#b7c4f7ff", color: "#fff" }} />: Pipelines with YAML errors in preview builds (unqueriable)
                                                    </Typography>
                                                </Box>
                                            }
                                            placement="top"
                                        >
                                            <HelpOutlineIcon sx={{ color: 'white', fontSize: 20, cursor: 'pointer' }} />
                                        </Tooltip>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}>

                                    </Box>

                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', my: 1 }} />

                                    <Typography variant="body2" color="white" sx={{ fontWeight: 500, mb: 1 }}>
                                        Advanced Filters
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {pipelineAdvancedFilters.map((filter, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                                    <Select
                                                        value={filter.field}
                                                        onChange={e => handleAdvancedFilterChange(idx, 'field', e.target.value)}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                                        MenuProps={{
                                                            PaperProps: {
                                                                style: { maxHeight: 300 },
                                                            },
                                                        }}
                                                    >
                                                        <ListSubheader style={{ color: '#1976d2' }}>Trigger</ListSubheader>
                                                        <MenuItem value="trigger">Trigger</MenuItem>
                                                        <ListSubheader style={{ color: '#388e3c' }}>Stage</ListSubheader>
                                                        <MenuItem value="stageName">Stage Name</MenuItem>
                                                        <MenuItem value="stagePool">Stage Pool</MenuItem>
                                                        <ListSubheader style={{ color: '#f57c00' }}>Job</ListSubheader>
                                                        <MenuItem value="jobName">Job Name</MenuItem>
                                                        <MenuItem value="jobPool">Job Pool</MenuItem>
                                                        <ListSubheader style={{ color: '#6a1b9a' }}>Step</ListSubheader>
                                                        <MenuItem value="stepType">Step Type</MenuItem>
                                                        <MenuItem value="stepName">Step Name</MenuItem>
                                                        <MenuItem value="stepDisplayName">Display Name</MenuItem>
                                                        <MenuItem value="stepEnabled">Step Enabled</MenuItem>
                                                        <MenuItem value="stepInputs">Step Inputs</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                <Typography variant="body2" color="white" sx={{ minWidth: 60, textAlign: 'center' }}>
                                                    contains
                                                </Typography>
                                                <TextField
                                                    size="small"
                                                    variant="outlined"
                                                    value={filter.value}
                                                    onChange={e => handleAdvancedFilterChange(idx, 'value', e.target.value)}
                                                    placeholder="Value"
                                                    sx={{
                                                        minWidth: 100,
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                                            borderRadius: 1
                                                        }
                                                    }}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={!!filter.negate}
                                                            onChange={e => handleAdvancedFilterChange(idx, 'negate', e.target.checked)}
                                                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                                                        />
                                                    }
                                                    label={<Typography variant="body2" color="white">Negate</Typography>}
                                                />
                                                {idx === pipelineAdvancedFilters.length - 1 && (
                                                    <Button
                                                        onClick={handleAddAdvancedFilter}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            color: 'white',
                                                            borderColor: 'white',
                                                            '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                                                        }}
                                                    >
                                                        AND
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => handleRemoveAdvancedFilter(idx)}
                                                    variant="filled"
                                                    color="error"
                                                    size="small"
                                                    sx={{ minWidth: 40 }}
                                                >
                                                    <DeleteForeverSharpIcon fontSize="small" />
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Box sx={{
                                        display: 'flex', justifyContent: 'right', mt: 1
                                    }}>
                                        <Typography
                                            variant="body2"
                                            onClick={() => handleFilterReset('pipeline')}
                                            sx={{
                                                color: 'white',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 0.8 },
                                            }}
                                        >
                                            Reset Filters
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Collapse>

                        <Fab
                            variant="extended"
                            color="secondary"
                            aria-label="pipeline filters"
                            onClick={() => setPipelineFilterExpanded(!pipelineFilterExpanded)}
                            size="medium"
                            sx={{
                                bgcolor: '#5669b3',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#4a5a9f',
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 3
                            }}
                        >
                            <TuneIcon />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Pipeline Filters
                            </Typography>
                            {isFilteredPipeline > 0 && (
                                <Chip
                                    label={isFilteredPipeline}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.98)',

                                        color: 'white',
                                        height: 20,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            )}
                            {pipelineFilterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Fab>
                    </Box>
                </ClickAwayListener>
            )}

            {/* Save Search Dialog */}
            <SaveSearchDialog
                open={saveDialogOpen}
                initialName={getInitialDialogValues().name}
                initialDescription={getInitialDialogValues().description}
                isFilteredResource={isFilteredResource}
                isFilteredPipeline={isFilteredPipeline}
                editingSearchId={editingSearchId}
                isSaving={isSaving}
                onClose={handleCancelEdit}
                onSave={handleSaveSearch}
            />

            <LoadSearchDialog
                open={loadDialogOpen}
                savedSearches={savedSearches}
                isDeleting={isDeleting}
                onClose={() => setLoadDialogOpen(false)}
                onLoadSearch={handleLoadSearch}
                onEditSearch={handleEditSearch}
                onDeleteSearch={handleDeleteSearch}
            />

            {/* Confirmation Dialog */}
            <ConfirmDeleteDialog
                open={confirmDialogOpen}
                isDeleting={isDeleting}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
};

export default ResourceTracker;
