/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Helper functions for managing Logic Containers with platform source scoping
 */

/**
 * Add a resource to a logic container for a specific platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID (ADO organization)
 * @param {string} resourceId - The resource ID to add
 * @returns {Object} Updated logic container
 */
export function addResourceToLogicContainer(logicContainer, platformSourceId, resourceId) {
  const updated = { ...logicContainer };
  
  // Ensure resources object exists
  if (!updated.resources) {
    updated.resources = {};
  }
  
  // Ensure platform source exists in resources
  if (!updated.resources[platformSourceId]) {
    updated.resources[platformSourceId] = [];
  }
  
  // Add resource if not already present
  if (!updated.resources[platformSourceId].includes(resourceId)) {
    updated.resources[platformSourceId] = [...updated.resources[platformSourceId], resourceId];
  }
  
  return updated;
}

/**
 * Remove a resource from a logic container for a specific platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID (ADO organization)
 * @param {string} resourceId - The resource ID to remove
 * @returns {Object} Updated logic container
 */
export function removeResourceFromLogicContainer(logicContainer, platformSourceId, resourceId) {
  const updated = { ...logicContainer };
  
  if (!updated.resources || !updated.resources[platformSourceId]) {
    return updated;
  }
  
  updated.resources[platformSourceId] = updated.resources[platformSourceId].filter(
    id => id !== resourceId
  );
  
  // Clean up empty platform source arrays
  if (updated.resources[platformSourceId].length === 0) {
    delete updated.resources[platformSourceId];
  }
  
  return updated;
}

/**
 * Get all resources for a logic container in a specific platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID (ADO organization)
 * @returns {string[]} Array of resource IDs
 */
export function getResourcesForPlatformSource(logicContainer, platformSourceId) {
  if (!logicContainer.resources || !logicContainer.resources[platformSourceId]) {
    return [];
  }
  return logicContainer.resources[platformSourceId];
}

/**
 * Check if a logic container is available in a specific platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID (ADO organization)
 * @returns {boolean} True if container is available in platform source
 */
export function isContainerInPlatformSource(logicContainer, platformSourceId) {
  if (!logicContainer.platform_source_ids) {
    return false;
  }
  return logicContainer.platform_source_ids.includes(platformSourceId);
}

/**
 * Add a platform source to a logic container
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID to add
 * @returns {Object} Updated logic container
 */
export function addPlatformSourceToContainer(logicContainer, platformSourceId) {
  const updated = { ...logicContainer };
  
  if (!updated.platform_source_ids) {
    updated.platform_source_ids = [];
  }
  
  if (!updated.platform_source_ids.includes(platformSourceId)) {
    updated.platform_source_ids = [...updated.platform_source_ids, platformSourceId];
  }
  
  return updated;
}

/**
 * Remove a platform source from a logic container
 * Also removes all resources associated with that platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID to remove
 * @returns {Object} Updated logic container
 */
export function removePlatformSourceFromContainer(logicContainer, platformSourceId) {
  const updated = { ...logicContainer };
  
  // Remove from platform_source_ids
  if (updated.platform_source_ids) {
    updated.platform_source_ids = updated.platform_source_ids.filter(
      id => id !== platformSourceId
    );
  }
  
  // Remove all resources associated with this platform source
  if (updated.resources && updated.resources[platformSourceId]) {
    delete updated.resources[platformSourceId];
  }
  
  return updated;
}

/**
 * Get all platform sources that have resources in a logic container
 * @param {Object} logicContainer - The logic container object
 * @returns {string[]} Array of platform source IDs that have resources
 */
export function getPlatformSourcesWithResources(logicContainer) {
  if (!logicContainer.resources) {
    return [];
  }
  return Object.keys(logicContainer.resources);
}

/**
 * Get total resource count across all platform sources
 * @param {Object} logicContainer - The logic container object
 * @returns {number} Total number of resources
 */
export function getTotalResourceCount(logicContainer) {
  if (!logicContainer.resources) {
    return 0;
  }
  return Object.values(logicContainer.resources).reduce(
    (total, resources) => total + resources.length,
    0
  );
}

/**
 * Migrate old logic container format to new format
 * Old format: { resources: ['id1', 'id2', ...] }
 * New format: { platform_source_ids: ['org1'], resources: { 'org1': ['id1', 'id2'] } }
 * @param {Object} logicContainer - The old logic container object
 * @param {string} defaultPlatformSourceId - Default platform source to assign resources to
 * @returns {Object} Migrated logic container
 */
export function migrateLogicContainerFormat(logicContainer, defaultPlatformSourceId) {
  const updated = { ...logicContainer };
  
  // If resources is an array (old format), convert to new format
  if (Array.isArray(updated.resources)) {
    const oldResources = updated.resources;
    updated.resources = {};
    
    if (oldResources.length > 0 && defaultPlatformSourceId) {
      updated.resources[defaultPlatformSourceId] = oldResources;
      
      // Add platform source if not already present
      if (!updated.platform_source_ids) {
        updated.platform_source_ids = [defaultPlatformSourceId];
      } else if (!updated.platform_source_ids.includes(defaultPlatformSourceId)) {
        updated.platform_source_ids = [...updated.platform_source_ids, defaultPlatformSourceId];
      }
    }
  }
  
  // Ensure platform_source_ids exists
  if (!updated.platform_source_ids) {
    updated.platform_source_ids = [];
  }
  
  // Ensure resources object exists
  if (!updated.resources) {
    updated.resources = {};
  }
  
  return updated;
}

/**
 * Filter logic containers by platform source
 * @param {Object[]} logicContainers - Array of logic container objects
 * @param {string} platformSourceId - Platform source ID to filter by
 * @returns {Object[]} Filtered logic containers
 */
export function filterContainersByPlatformSource(logicContainers, platformSourceId) {
  if (!platformSourceId) {
    return logicContainers;
  }
  
  return logicContainers.filter(container => 
    isContainerInPlatformSource(container, platformSourceId)
  );
}

/**
 * Check if a resource belongs to a logic container in a specific platform source
 * @param {Object} logicContainer - The logic container object
 * @param {string} platformSourceId - The platform source ID
 * @param {string} resourceId - The resource ID to check
 * @returns {boolean} True if resource belongs to container in this platform source
 */
export function resourceBelongsToContainer(logicContainer, platformSourceId, resourceId) {
  if (!logicContainer.resources || !logicContainer.resources[platformSourceId]) {
    return false;
  }
  return logicContainer.resources[platformSourceId].includes(resourceId);
}
