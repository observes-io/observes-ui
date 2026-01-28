/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
/**
 * Filter functions for resources, pipelines, and builds
 * These functions are designed to be reusable across different components
 */

export function filterPipelinesByProject(definitions, projectFilter) {
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

export function filterBuildsByProject(builds, projectFilter) {
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

export function filterResourcesByProject(resources, projectFilter, resourceType) {
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

export function filterResourcesByLogicContainer(resources, logic_container_filter_id, logic_containers) {
    if (logic_container_filter_id === "all") {
        return resources;
    }

    const lc = logic_containers.find(lc => lc.id === logic_container_filter_id);

    return resources.filter(resource =>
        resource.id && lc.resources.includes(resource.id)
    );
}

export function filterPipelinesUsingFilteredResources(filteredPipelines, filteredProtectedResources, resource_type_selected) {
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

export function filterResourcesByProtectedState(resources, protectedState) {
    if (protectedState === "all") {
        return resources;
    }
    return resources.filter(resource => resource.protectedState === protectedState);
}

export function filterResourcesByCrossProject(resources, crossProject) {
    if (!crossProject) {
        return resources;
    }
    return resources.filter(resource => resource.isCrossProject === crossProject);
}

export function filterResourcesBySearchTerm(resources, searchTerm) {
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

export function filterPipelinesBySearchTerm(pipelines, searchTermPipelines) {
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

export function filterByPoolType(resources, poolType) {
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
