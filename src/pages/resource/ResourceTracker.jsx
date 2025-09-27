import React, { useState, useEffect } from 'react';
import ResourceTable from './ResourceTable';
import PipelineTable from './PipelineTable';
import D3JSResource from './D3Resources';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { ListSubheader, Tooltip, Chip, Typography, CircularProgress, TextField, Checkbox, FormControlLabel, Divider } from '@mui/material';
import ResourceButtonGroup from '../components/ResourceButtonGroup';
import useStore from '../../state/stores/store';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { set } from 'react-hook-form';
import { resourceTypes } from '../../utils/resourceTypes';

const ResourceTracker = () => {

    const { selectedScan, resource_type_selected, projects, selectedProject, logic_containers, getProtectedResourcesByOrgTypeAndIdsSummary, setResourceTypeSelected, setCurrentPage, fetchResources, fetchLogicContainers, fetchBuilds, fetchPipelines } = useStore();

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

    const [d3Open, setD3Open] = useState(false);
    const [d3Flex, setD3Flex] = useState(2);

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
    }, [setCurrentPage]);


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

    const handleFilterReset = (scope) => {
        if (scope === 'resource') {
            setlogic_container_filter('all');
            setSearchTerm('');
            setProtectedState('all');
            setCrossProject(false);
            setResourcePermissions('all');
            setPoolType('all');
            setFilterForOverprivilegedResources(false);
            setFilterForOversharedResources(false);
        }
        if (scope === 'pipeline') {
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
        if (scope === 'policy') {
            setFilterForOverprivilegedResources(false);
            setFilterForOverprivilegedPipelines(false);
            setFilterForOversharedResources(false);
        }
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
        setPipelineAdvancedFilters(filters => filters.filter((_, i) => i !== idx));
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

        // need to get the resources the pipeline can access dfrom here, a list and then use that list to filter against the filtered resources
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


        var filt_pipelines = Object.values(pipelines).filter(pipeline => {
            let yaml_recipe = {};
            if (pipeline.builds && pipeline.builds.preview) {
                Object.entries(pipeline.builds.preview).forEach(([key, value]) => {
                    yaml_recipe = value.pipeline_recipe;
                });
            }

            // if not yaml_recipe means theres no valid pipeline recipe, so skip this pipeline
            if (!yaml_recipe || !yaml_recipe.trigger || !yaml_recipe.stages) {
                // if filter unqueriable is true, show this pipeline
                if (filters.some(f => f.field === 'unqueriable' && f.value === true)) {
                    return true;
                }
                return false;
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
                            result = stage.pool && JSON.stringify(stage.pool).toLowerCase().includes(filter.value.toLowerCase());
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

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%', mx: 'auto', height: '70vh', minHeight: '30vh', maxHeight: '80vh', overflow: 'hidden' }}>
                        {/* Filtering UI */}
                        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, minWidth: 0, overflowY: 'auto', maxHeight: '100%', width: '100%', textAlign: "center" }}>
                            <Typography variant="h5" color="#e25762" gutterBottom sx={{ fontSize: '1rem' }}>
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
                            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Button
                                    variant="contained"
                                    color="grey"
                                    size="small"
                                    onClick={() => setD3Flex(d3Flex === 3 ? 1 : 3)}
                                >
                                    {d3Flex === 3 ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>&#8594;</span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>&#8592;</span>
                                    )}
                                </Button>
                            </Box>
                            <IconButton
                                aria-label="Expand D3 View"
                                onClick={() => setD3Open(true)}
                                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                                size="small"
                            >
                                <OpenInFullIcon fontSize="small" />
                            </IconButton>
                            <D3JSResource
                                selectedType={resource_type_selected}
                                filteredProtectedResources={filteredProtectedResources}
                                builds={filteredBuilds}
                                pipelines={filteredPipelines}
                                logic_containers={logic_containers}
                                projects={projects}
                                sx={{ height: '100%', width: '100%' }}
                            />
                            <Dialog
                                open={d3Open}
                                onClose={() => setD3Open(false)}
                                maxWidth="xl"
                                fullWidth
                                disableEnforceFocus
                                disableRestoreFocus
                                PaperProps={{ sx: { height: '90vh', width: '90vw', p: 2 } }}
                            >
                                <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                    <IconButton
                                        aria-label="Close D3 View"
                                        onClick={() => setD3Open(false)}
                                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                                        size="small"
                                    >
                                        <span style={{ fontWeight: 'bold', fontSize: 18 }}>&times;</span>
                                    </IconButton>
                                    <D3JSResource
                                        selectedType={resource_type_selected}
                                        filteredProtectedResources={filteredProtectedResources}
                                        builds={filteredBuilds}
                                        pipelines={filteredPipelines}
                                        logic_containers={logic_containers}
                                        projects={projects}
                                    />
                                </Box>
                            </Dialog>
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
        </Box>
    );
};

export default ResourceTracker;
