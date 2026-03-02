/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { create } from "zustand";
import axios, { all } from "axios";
import { ensureObjectStore, getGlobalSettings, getRecord, addRecord, deleteRecord, updateRecord, getAllRecords, getCount, getPaginatedRecords, deleteAllRecords } from '../../utils/indexeddb';
import defaultSettings, { GlobalSettings } from './defaultSettings';
import defaultLogicContainers from './defaultLogicContainers';
import defaultBotAccounts from "./defaultBotAccounts";
import { OBSERVES_DB_NAME } from '../../utils/dbConfig';
import { ProjectRecord, RepositoryResource, VariableGroupResource, EndpointResource, PoolResource, QueueResource, SecureFileResource, ProjectStats, BuildDefinition, BuildDefinitionBuilds, BuildRecord } from './platformSourceResults.types';

// STATIC

export interface Task {
    Visibility: string[];
    RunsOn: string[];
    id: string;
    name: string;
    Version: string;
    IsTestVersion: boolean;
    MinimumAgentVersion: string;
    Friendlyname: string;
    Description: string;
    Category: string;
    Definitiontype: string;
    ShowEnvironmentVariables: boolean;
    Author: string;
    Demands: any[];
    InstancenameFormat: string;
    Inputs: {
        name: string;
        type: string;
        Label: string;
        DefaultValue: string;
        HelpMarkDown: string;
        Required: boolean;
        VisibleRule: string | null;
        Groupname: string | null;
        Options: Record<string, string>;
        Properties: Record<string, any>;
    }[];
    Groups: {
        name: string;
        Displayname: string;
        IsExpanded: boolean;
    }[];
    PlatformSource: string | null;
    platform_type: number;
}

export interface User {
    Displayname: string;
    url: string;
    // _links: any | null;
    id: string;
    Uniquename: string;
    Imageurl: string;
    Descriptor: string;
}

export interface DeploymentGroup {
    id: string;
    name: string;
    scope: string;
    risk: string;
    created_at: string;
    updated_at: string | null;
}

export interface ConnectedSystem {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    target_system: {
        id: string;
        name: string;
        description: string;
        is_default: boolean;
        logic_containers_ids: string[];
        created_at: string;
        updated_at: string;
    };
    created_at: string;
    updated_at: string;
}

// LOGIC CONTAINERS

export type LogicContainerCriticality = 'none' | 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface LogicContainer {
    id: string;
    name: string;
    color: string;
    description: string;
    criticality: LogicContainerCriticality;
    is_default: boolean;
    is_system?: boolean; // System containers cannot be edited or deleted, only hidden
    owner: string;
    created_at: string;
    updated_at: string | null;
    projects: string[];
    platform_source_ids: string[]; // Which platform sources (ADO orgs) this container is available in
    resources: Record<string, string[]>; // { [platformSourceId]: [resourceIds] } - resources scoped per platform source
}

// SAVED SEARCHES

export interface SavedSearch {
    id: string;
    name: string;
    description?: string;
    resourceFilters?: {
        searchTerm?: string;
        protectedState?: string;
        crossProject?: boolean;
        poolType?: string;
        logic_container_filter?: string;
        filterForOverprivilegedResources?: boolean;
        filterForOversharedResources?: boolean;
        resource_type_selected?: string;
        selectedProject?: string;
    };
    pipelineFilters?: {
        searchTermPipelines?: string;
        pipelinesUsingFilteredResources?: boolean;
        resourcePermissions?: string;
        buildsFilter?: string;
        pipelineAdvancedFilters?: Array<{
            field: string;
            operator: string;
            value: string;
            negate?: boolean;
        }>;
        filterForAlertedPipelines?: boolean;
        filterForJobAuthorizationScope?: string;
        filterForPipelineType?: string;
        filterForOverprivilegedPipelines?: boolean;
        filterForUnqueriablePipelines?: boolean;
        filterForDisabledPipelines?: boolean;
        selectedProject?: string;
        filterForHistoricUnauthorizedServiceConnection?: boolean;
    };
    createdAt: string;
    updatedAt?: string;
}

// CICDSAST

export interface CicdSast {
    failed_checks_summary: any[];
    overall_summary: {
        passed: number;
        failed: number;
        skipped: number;
        parsing_errors: number;
        resource_count: number;
    };
}


export interface PlatformSource {
    id: string;
    platformSourcened: string;
    organisation: {
        id?: string;
        name: string;
        url: string;
        type: string;
        owner?: string;
        shadow_color: string;
        last_platformSource_started: string;
        last_platformSource_finished: string | null;
        last_platformSource_id: string;
        platformSource_progress: string;
        platformSourcened: {
            platformSource: string;
            status: string;
        }[];
    };
}

// POLICY - One policy is made up of multiple rules

export interface Policy {
    id: string;
    name: string;
    Description: string;
    Rules: Rule[];
}

export interface Rule {
    id: string;
    name: string;
    Description: string;
    component: string;
    field: string;
    negate: boolean;
    value: string;
}

export interface PolicyGroup {
    id: string;
    name: string;
    Description: string;
    Owner: string;
    Policyids: string[];
}

export interface ApprovalAuthority {
    id: string;
    name: string;
    Description: string;
    Owner: string;
    Policyids: string[];
    PolicyGroupids: string[];
}

interface selectedPlatformSourceRef {
    id: string; // org name or platformSource id
    type: string; // e.g., 'organisation' or other type if needed
}

interface SelectedPlatformSourceRef {
    id: string; // platform source id
    type: string; // e.g., 'platform_source' or other type if needed
}

interface StoreState {
    globalSettings: GlobalSettings | null,
    current_page: string;
    system_type: string;
    platformSources: PlatformSource[];
    platformSources: PlatformSource[];
    selectedPlatformSource: selectedPlatformSourceRef | null;
    selectedPlatformSource: SelectedPlatformSourceRef | null;
    selectedProject: ProjectRecord | null;
    pipelines: Pipeline[];
    builds: BuildRecord[];
    protected_resources_group: protected_resources_group;
    resource_type_selected: string;


    logic_containers: LogicContainer[];
    connected_systems: ConnectedSystem[];
    savedSearches: SavedSearch[];

    policies: Policy[];
    policyGroups: PolicyGroup[];
    approvalAuthorities: ApprovalAuthority[];

    endpoints: EndpointResource[];
    variableGroups: VariableGroupResource[];
    repositories: RepositoryResource[];
    secureFiles: SecureFileResource[];
    pools: PoolResource[];
    queues: QueueResource[];

    // New paginated state for migration away from platformSourceresults
    organisation: any | null;
    projects: ProjectRecord[];
    projectsTotal: number;
    // key value pairs of project Ids and Names
    projectsReferences: Record<string, string>;

    fetchGlobalSettings: () => Promise<void>;
    fetchPlatformSources: () => Promise<void>;
    fetchPipelines: (org: string, includePreviews?: boolean) => Promise<BuildDefinition[]>;
    fetchPipelinesByOrgAndProject: (org: string, projectId: string) => Promise<BuildDefinition[]>;
    fetchBuilds: (org: string) => Promise<BuildRecord[]>;
    fetchResources: (org: string, type: string) => Promise<void>;

    fetchLogicContainers: () => Promise<void>;

    // Add fetch actions for new paginated state
    fetchOrganisation: (orgId: string) => Promise<void>;
    fetchProjects: (orgId: string, page: number, pageSize: number) => Promise<void>;

    getResourceCountByProject: (project_id: string, resourcetype: string) => number;
    setSelectedPlatformSource: (organisation: PlatformSource | null) => void;
    setSelectedProject: (project: ProjectRecord | null) => void;
    setCurrentPage: (page: string) => void;
    // current only looks at MenuLayout @TODO
    setGlobalSettings: (globalSettings: GlobalSettings | null) => void;
    setSystemType: (system_type: string) => void;
    setResourceTypeSelected: (restype: string) => void;

    // Add platformSource CRUD actions
    addPlatformSource: (platformSourceData: any) => Promise<void>;
    deletePlatformSource: (platformSourceId: string) => Promise<void>;
    // updatePlatformSource: (platformSourceId: string, updateFn: (platformSource: any) => void) => Promise<void>;

    // New action to fetch project stats
    fetchProjectStats: (orgId: string, projectId: string) => Promise<any | null>;

    // Fetch paginated repositories by org ID and project ID
    fetchProjectRepositories: (orgId: string, projectId: string, page: number, pageSize: number) => Promise<{ repositories: RepositoryResource[], total: number }>;

    fetchCommits: (orgId: string, committerEmail: string, page: number, pageSize: number) => Promise<{ commits: any[], total: number }>;

    fetchCommitterStats: (orgId: string) => Promise<any | null>;

    createLogicContainer: (logicContainer: Partial<LogicContainer>) => Promise<void>;
    updateLogicContainer: (logicContainerId: String, updated: LogicContainer) => Promise<void>;
    deleteLogicContainer: (id: string) => Promise<void>;

    // Saved searches CRUD operations
    fetchSavedSearches: () => Promise<void>;
    createSavedSearch: (savedSearch: Omit<SavedSearch, 'id' | 'createdAt'>) => Promise<void>;
    updateSavedSearch: (id: string, updates: Partial<SavedSearch>) => Promise<void>;
    deleteSavedSearch: (id: string) => Promise<void>;

    getProtectedResourcesByOrgTypeAndIdsSummary: (orgId: string, resourceType: string, resourceIds: string[]) => Promise<any[]>;

    fetchProtectedResourcesByTypeOrgProject: (orgId: string, resourceType: string, projectId: string) => Promise<{ resources: any[], total: number }>;
    
    fetchResourcesForPipelines: (orgId: string, pipelines: any[]) => Promise<{
        endpoints: any[],
        variableGroups: any[],
        repositories: any[],
        pools: any[],
        secureFiles: any[],
        environments: any[]
    }>;
}

const getDefaultDateFormat = () => {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().dateStyle || 'MM/DD/YYYY';
    } catch {
        return 'MM/DD/YYYY';
    }
};

const useStore = create<StoreState>((set) => ({
    current_page: "Dashboard",
    system_type: "Azure DevOps",
    globalSettings: {
        MenuLayout: "Header",
        colorScheme: "Light",
        Language: "en",
        Fontsize: "medium",
        Primarycolor: "#4F46E5",
        ShowNotifications: false,
        AnimationsEnabled: true,
        DateFormat: getDefaultDateFormat(),
        TimeZone: "UTC",
        CompactMode: false,
        hasLogicContainerStrategy: false,
        platformSourceSettings: {
            default_branch_limit: "full",
            default_build_settings_expectations: {
                enforceReferencedRepoScopedTokens: true,
                disableClassicPipelineCreation: true,
            },
        }
    },
    platformSources: [],
    selectedPlatformSource: null,
    selectedProject: null,

    // resources
    protected_resources_group: {},
    endpoints: [],
    variableGroups: [],
    secureFiles: [],
    repositories: [],
    pools: [],
    queues: [],

    // resources x Platform
    resource_type_selected: "endpoint",

    // Platform
    logic_containers: [],
    connected_systems: [],
    savedSearches: [],
    pipelines: [],
    builds: [],

    policies: [],
    policyGroups: [],
    approvalAuthorities: [],

    // New paginated state for migration away from platformSourceresults
    organisation: null,
    projects: [],
    projectsTotal: 0,


    getResourceCountByProject: (project_id: string, resourcetype: string): number => {

        let resources = [] as any[]

        switch (resourcetype) {
            case 'endpoint':
                resources = useStore.getState().endpoints;
                break;

            case 'variableGroups':
                resources = useStore.getState().variableGroups;
                break;
            case 'secureFiles':
                resources = useStore.getState().secureFiles;
                break;
            case 'repositories':
                resources = useStore.getState().repositories;
                break;
            case 'pools':
                resources = useStore.getState().pools;
                break;
            case 'queues':
                resources = useStore.getState().queues;
                break;
            case 'pipelines':
                resources = useStore.getState().pipelines;
                break;
            case 'builds':
                resources = useStore.getState().builds;
                break;
            default:
                resources = [];
                break;
        }
        if (Array.isArray(resources)) {
            return resources.filter(resource => resource.project === project_id).length;
        }
        return 0;
    },


    getProtectedResourcesByOrgTypeAndIdsSummary: async (orgId: string, resourceType: string, resourceIds: string[]): Promise<any[]> => {
        if (resourceType === 'pool_merged') {
            resourceType = 'pools';
        }
        // Query indexedDB protected_resources with helper function
        const protectedResources = await getAllRecords('protected_resources', 'byOrgAndType', [orgId, resourceType]);

        return protectedResources
            .filter((resource: { id: string }) => resourceIds.map(String).includes(String(resource.id)))
            .map((resource: { id: string; name?: string; webUrl?: string; web_url?: string; url?: string }) => ({
                id: resource.id,
                name: resource.name,
                webUrl: resource.k_url || resource.webUrl || resource.web_url || resource.url || null
            }));
    },

    fetchGlobalSettings: async () => {
        const globalSettings = await getGlobalSettings(OBSERVES_DB_NAME);
        if (globalSettings) {
            set({ globalSettings });
        } else {
            // If no settings found, set default settings
            set({ globalSettings: defaultSettings });
        }
    },

    fetchPlatformSources: async () => {
        try {
            // @TODO: Fetch only the data that is needed (for landing) & selected platformSource is selected orgs

            // Open IndexedDB and fetch organisations
            const dbName = OBSERVES_DB_NAME;
            const storeName = "organisations";
            // const storeName = "platformSourceresults";
            await ensureObjectStore(dbName, storeName);
            const openRequest = window.indexedDB.open(dbName);

            openRequest.onerror = function (event) {
                console.error("IndexedDB error:", event);
            };

            openRequest.onsuccess = function (event) {
                const db = openRequest.result;
                const transaction = db.transaction([storeName], "readonly");
                const objectStore = transaction.objectStore(storeName);
                const getAllRequest = objectStore.getAll();

                getAllRequest.onsuccess = function () {
                    const platformSources = getAllRequest.result;
                    set({ platformSources: platformSources });
                    if (platformSources.length > 0 && !useStore.getState().selectedPlatformSource) {
                        set({ selectedPlatformSource: { id: platformSources[0].id, type: platformSources[0].organisation?.type || 'organisation' } });
                    }
                };
                getAllRequest.onerror = function (event) {
                    console.error("Error fetching platformSources from IndexedDB:", event);
                };
            };
        } catch (error) {
            console.error("Error opening IndexedDB:", error);
        }
    },


    /**
     * Fetch pipelines (build_definitions) for a specific platformSourceId
     * @param {string} platformSourceId - The ID of the platformSource to fetch pipelines for
     * @param {boolean} includePreviews - Whether to include preview branches (default: true)
     */
    fetchPipelines: async (platformSourceId, includePreviews = true) => {
        const allPipelines = await getAllRecords('build_definitions', 'byOrganisation', platformSourceId);
        if (allPipelines.length === 0) {
            console.warn(`No pipelines found for platformSourceId: ${platformSourceId}`);
            return;
        }

        if (!includePreviews) {
            return allPipelines as BuildDefinition[];
        }

        // For each pipeline, fetch its preview branches from build_definitions_previews and re-attach as builds.preview
        const result = [];
        for (const pipeline of allPipelines) {
            // Get all preview records for this pipeline
            const previews = await getAllRecords('build_definitions_previews', 'byOrgAndDefinitionId', [platformSourceId, pipeline.id]);
            if (previews && previews.length > 0) {
                // Reconstruct preview dict: { branch: previewObj, ... }
                const previewDict = {};
                for (const preview of previews) {
                    const { branch, ...rest } = preview;
                    previewDict[branch] = rest;
                }
                // Attach to builds.preview
                result.push({
                    ...pipeline,
                    builds: {
                        ...(pipeline.builds || {}),
                        preview: previewDict
                    }
                });
            } else {
                result.push(pipeline);
            }
        }
        return result as BuildDefinition[];
    },

    /**
     * Fetch pipelines (build_definitions) for a specific orgId and projectId
     * @param {string} orgId - The ID of the organisation to fetch pipelines for
     * @param {string} projectId - The ID of the project to fetch pipelines for
     */
    fetchPipelinesByOrgAndProject: async (orgId, projectId) => {

        const allPipelines = await getAllRecords('build_definitions', 'byOrgAndKProject', [orgId, projectId])
        if (allPipelines.length === 0) {
            console.warn(`No pipelines found for orgId: ${orgId} and projectId: ${projectId}`);
            return;
        }
        // If pipelines found, return them as the correct type
        return allPipelines as BuildDefinition[];

    },

    /**
     * Fetch builds for a specific platformSourceId
     * @param platformSourceId - The ID of the platformSource to fetch builds for
     */
    fetchBuilds: async (platformSourceId) => {
        const allBuilds = await getAllRecords('builds', 'byOrganisation', platformSourceId);
        if (allBuilds.length === 0) {
            console.warn(`No builds found for platformSourceId: ${platformSourceId}`);
            return;
        }
        // If builds found, return them as the correct type
        return allBuilds as BuildRecord[];

    },

    /**
     * Fetch builds for a specific orgId and projectId
     * @param orgId - The ID of the organisation to fetch builds for
     * @param projectId - The ID of the project to fetch builds for
     */
    fetchBuildsByOrgAndProject: async (orgId, projectId) => {
        const allBuilds = await getAllRecords('builds', 'byOrgAndKProject', [orgId, projectId]);
        if (allBuilds.length === 0) {
            console.warn(`No builds found for orgId: ${orgId} and projectId: ${projectId}`);
            return;
        }
        return allBuilds as BuildRecord[];
    },


    fetchResources: async (platformSourceId: string, type: string) => {

        if (type == "pool_merged") {
            // Special case for pool_merged, which is a merged view of pools and queues
            type = "pools";
        }
        //check if type is empty
        if (!type || type === "") {
            // If no type is provided, return all resources
            const allResources = await getAllRecords('protected_resources', 'byOrganisation', platformSourceId);
            return allResources;
        }

        // check type against known resource types
        const knownResourceTypes = ['endpoint', 'variablegroup', 'securefile', 'repository', 'pools', 'queue', 'deploymentgroups', 'environment'];
        // If type is known, fetch resources by type check for case insensitivity
        type = type.toLowerCase();
        if (knownResourceTypes.includes(type)) {
            // If type is known, fetch resources by type
        const allResources = await getAllRecords('protected_resources', 'byOrgAndType', [platformSourceId, type]);
            if (allResources.length === 0) {
                // If no resources found, return empty array
                console.log(`No resources found for type: ${type} in platformSourceId: ${platformSourceId}`);
                return [];
            }
            // If resources found, return them as the correct type
            switch (type) {
                case 'endpoint':
                    return allResources as EndpointResource[];
                case 'variablegroup':
                    return allResources as VariableGroupResource[];
                case 'securefile':
                    return allResources as SecureFileResource[];
                case 'repository':
                    return allResources as RepositoryResource[];
                case 'pools':
                    return allResources as PoolResource[];
                case 'queue':
                    return allResources as QueueResource[];
            }
            return allResources;
        }
        // If type is not known, log a warning and return empty array
        console.warn(`Unknown resource type: ${type}. Returning empty array.`);
        // If type is not known, return empty array
        return [];

    },
    fetchLogicContainers: async () => {
        try {
            const dbName = OBSERVES_DB_NAME;
            const storeName = "logiccontainers";
            await ensureObjectStore(dbName, storeName);
            
            // Ensure global system containers always exist in the database
            // This guarantees they're available for all platform sources
            for (const defaultContainer of defaultLogicContainers) {
                try {
                    const existing = await getRecord(storeName, defaultContainer.id);
                    if (!existing) {
                        await addRecord(storeName, defaultContainer);
                        console.log(`Created system logic container: ${defaultContainer.name}`);
                    }
                } catch (containerError) {
                    console.error(`Error ensuring system container ${defaultContainer.id}:`, containerError);
                    // Continue with other containers even if one fails
                }
            }
            
            const logicContainers = await getAllRecords(storeName);
            if (logicContainers && logicContainers.length > 0) {
                set({ logic_containers: logicContainers });
            } else {
                // Fallback: if DB is empty, use defaults in memory
                set({ logic_containers: defaultLogicContainers });
            }
        } catch (error) {
            console.error("Error fetching logic containers from IndexedDB:", error);
            // Fallback: use default containers in memory
            set({ logic_containers: defaultLogicContainers });
        }
    },

    // setSelectedPlatformSource: (platformSource: selectedPlatformSourceRef | null) => set({ selectedPlatformSource: platformSource, selectedProject: null }),
    setSelectedPlatformSource: (platformSource: SelectedPlatformSourceRef | null) => set({ selectedPlatformSource: platformSource, selectedProject: null }),
    setSelectedProject: (project: ProjectRecord | null) => set({ selectedProject: project }),
    setCurrentPage: (page: string) => set({ current_page: page }),
    setGlobalSettings: async (gset: GlobalSettings | null) => {
        // @TODO: Change to helper functions
        set({ globalSettings: gset });
        if (gset) {
            try {
                // Update the globalSettings in IndexedDB
                const dbName = OBSERVES_DB_NAME;
                const storeName = "globalSettings";
                await ensureObjectStore(dbName, storeName);
                const openRequest = window.indexedDB.open(dbName);

                openRequest.onerror = function (event) {
                    console.error("IndexedDB error (setGlobalSettings):", event);
                };

                openRequest.onsuccess = function (event) {
                    const db = openRequest.result;
                    const transaction = db.transaction([storeName], "readwrite");
                    const objectStore = transaction.objectStore(storeName);
                    // Ensure the object has an 'id' property for the keyPath
                    objectStore.put({ ...gset, id: "global" });
                    transaction.oncomplete = function () {
                    };
                    transaction.onerror = function (event) {
                        console.error("Error updating globalSettings in IndexedDB:", event);
                    };
                };
            } catch (error) {
                console.error("Error updating global settings:", error);
            }
        }
    },
    setSystemType: (systype: string) => set({ system_type: systype }),
    setResourceTypeSelected: (restype: string) => set({ resource_type_selected: restype }),
    // Add platformSource CRUD actions
    addPlatformSource: async (platformSourceData) => {
        
        try {
            const dbName = OBSERVES_DB_NAME;
            const stores = [
                // 'platformSourceresults', 
                'organisations', 'projects', 'protected_resources',
                'build_definitions', 'builds', 'stats', 'saved_searches',
                'logiccontainers'
            ];
            for (const store of stores) {
                await ensureObjectStore(dbName, store);
            }
            
            // Check if organization already exists and delete it first
            if (platformSourceData.organisation?.id) {
                const existingOrg = await getRecord('organisations', platformSourceData.organisation.id);
                if (existingOrg) {
                    // Organization exists, delete it and all its data first
                    await useStore.getState().deletePlatformSource(platformSourceData.organisation.id);
                }
            }
            
            // // 1. Write full platformSource to platformSourceresults (legacy)
            // await addRecord('platformSourceresults', platformSourceData);
            // 2. Write organisation
            
            if (platformSourceData.organisation && typeof platformSourceData.organisation === 'object') {
                await addRecord('organisations', {
                    scan_start: platformSourceData.scan.start,
                    scan_end: platformSourceData.scan.end,
                    ...platformSourceData.organisation
                });
            }
            
            // 3. Write projects (compound key: [organisation.id, project.id])
            if (platformSourceData.projects && platformSourceData.organisation?.id) {
                for (const [projectId, project] of Object.entries(platformSourceData.projects)) {
                    if (project && typeof project === 'object') {
                        await addRecord('projects', {
                            organisation: platformSourceData.organisation.id,
                            id: projectId,
                            ...project
                        });
                    }
                }
            }

            // 4. Write protected_resources (compound key: [organisation.id, resource id])
            if (platformSourceData.protected_resources && platformSourceData.organisation?.id && typeof platformSourceData.protected_resources === 'object') {
                for (const [type, group] of Object.entries(platformSourceData.protected_resources)) {
                    if (group && typeof group === 'object' && Array.isArray((group as any).protected_resources)) {
                        for (const entry of (group as any).protected_resources) {
                            let resource = entry.resource;
                            const resourceType = entry.resourceType || type;
                            // If resourceType is repository, move branches to repo_branches store
                            if (resource && typeof resource === 'object' && resource.id) {
                                if (resourceType === 'repository' && Array.isArray(resource.branches)) {
                                    // Save branches to repo_branches store
                                    for (const branch of resource.branches) {
                                        await addRecord('repo_branches', {
                                            organisation: platformSourceData.organisation.id,
                                            repoId: resource.id,
                                            ...branch
                                        });
                                    }
                                    // Remove branches from resource before saving
                                    const { branches, ...restResource } = resource;
                                    resource = restResource;
                                }
                                await addRecord('protected_resources', {
                                    organisation: platformSourceData.organisation.id,
                                    id: resource.id,
                                    resourceType: resourceType,
                                    type,
                                    ...resource
                                });
                            }
                        }
                    }
                }
            }

            // 5. Write build_definitions (compound key: [organisation.id, buildDefId])
            // 5.1 if build_definition has a 'builds.preview' dict, write those to build_definitions_previews store
            if (Array.isArray(platformSourceData.build_definitions) && platformSourceData.organisation?.id) {
                for (const buildDef of platformSourceData.build_definitions) {
                    if (buildDef && typeof buildDef === 'object' && buildDef.id) {
                        let buildDefToSave = { ...buildDef };
                        if (buildDefToSave.builds && buildDefToSave.builds.preview && typeof buildDefToSave.builds.preview === 'object') {
                            const previewDict = buildDefToSave.builds.preview;
                            for (const [branch, previewObj] of Object.entries(previewDict)) {
                                await addRecord('build_definitions_previews', {
                                    organisation: platformSourceData.organisation.id,
                                    definitionId: buildDefToSave.id,
                                    k_project: buildDefToSave.k_project,
                                    branch,
                                    ...previewObj
                                });
                            }
                            // Remove preview from buildDef before saving
                            buildDefToSave = {
                                ...buildDefToSave,
                                builds: {
                                    ...buildDefToSave.builds,
                                    preview: undefined
                                }
                            };
                        }
                        await addRecord('build_definitions', {
                            organisation: platformSourceData.organisation.id,
                            id: buildDefToSave.id,
                            ...buildDefToSave
                        });
                    }
                }
            }

            // 6. Write builds (compound key: [organisation.id, buildId])
            if (Array.isArray(platformSourceData.builds) && platformSourceData.organisation?.id) {
                for (const build of platformSourceData.builds) {
                    if (build && typeof build === 'object' && build.id) {
                        await addRecord('builds', {
                            organisation: platformSourceData.organisation.id,
                            id: build.id,
                            ...build
                        });
                    }
                }
            }

            // 7. Write stats (compound key: [organisation.id, projectId])
            if (platformSourceData.stats && platformSourceData.organisation?.id) {
                for (const [projectId, stats] of Object.entries(platformSourceData.stats)) {
                    if (stats && typeof stats === 'object') {
                        await addRecord('stats', {
                            organisation: platformSourceData.organisation.id,
                            id: projectId,
                            ...stats
                        });
                    }
                }
            }

            // 8.1. Ensure default bot_accounts (compound key: [organisation.id, botAccountId])
            if (Array.isArray(defaultBotAccounts) && platformSourceData.organisation?.id) {
                for (const botAccount of defaultBotAccounts) {
                    if (botAccount && typeof botAccount === 'object' && botAccount.id) {
                        await addRecord('bot_accounts', {
                            organisation: platformSourceData.organisation.id,
                            ...botAccount
                        });
                    }
                }
            }

            const now = new Date().toISOString();

            // 8.2 Write build_service_accounts (compound key: [organisation.id, serviceAccountId])
            if (Array.isArray(platformSourceData.build_service_accounts) && platformSourceData.organisation?.id) {
                for (const serviceAccount of platformSourceData.build_service_accounts) {
                    if (serviceAccount && typeof serviceAccount === 'object' && serviceAccount.id) {
                        await addRecord('bot_accounts', {
                            organisation: platformSourceData.organisation.id,
                            exactMatch: true,
                            isUpdatable: false,
                            createdAt: now,
                            updatedAt: now,
                            ...serviceAccount
                        });
                    }
                }
            }

            // 9. Write commits (compound key: [organisation, repositoryId, commitId])
            if (Array.isArray(platformSourceData.commits) && platformSourceData.organisation?.id) {
                for (const commit of platformSourceData.commits) {
                    if (commit && typeof commit === 'object' && commit.commitId) {
                        await addRecord('commits', {
                            organisation: platformSourceData.organisation.id,
                            ...commit
                        });
                    }
                }
            }

            // 10. Write committer_stats (compound key: [organisation, committerEmail])
            if (platformSourceData.committer_stats && platformSourceData.organisation?.id && typeof platformSourceData.committer_stats === 'object') {
                for (const [committerEmail, stats] of Object.entries(platformSourceData.committer_stats)) {
                    if (stats && typeof stats === 'object') {
                        await addRecord('committer_stats', {
                            organisation: platformSourceData.organisation.id,
                            committerEmail,
                            ...stats
                        });
                    }
                }
            }


            // 11. Write artifactsFeeds (compound key: [organisation, feedId])
            // 11.1 Write each feeds packages to artifactsPackages (compound key: [organisation, feedId, id])
            if (platformSourceData.artifacts && platformSourceData.organisation?.id) {
                const orgId = platformSourceData.organisation.id;
                const feedsToStore = [];
                if (Array.isArray(platformSourceData.artifacts.active)) {
                    for (const feed of platformSourceData.artifacts.active) {
                        if (feed && typeof feed === 'object' && feed.id) {
                            // Save packages for this feed, and count them
                            let packagesCount = 0;
                            if (Array.isArray(feed.packages)) {
                                packagesCount = feed.packages.length;
                                for (const pkg of feed.packages) {
                                    if (pkg && typeof pkg === 'object' && pkg.id) {
                                        await addRecord('artifactsPackages', {
                                            organisation: orgId,
                                            feedId: feed.id,
                                            ...pkg
                                        });
                                    }
                                }
                            }
                            // Remove packages from feed before storing, add packagesCount
                            const { packages, ...feedWithoutPackages } = feed;
                            feedsToStore.push({ organisation: orgId, ...feedWithoutPackages, packagesCount });
                        }
                    }
                }
                if (Array.isArray(platformSourceData.artifacts.recyclebin)) {
                    for (const feed of platformSourceData.artifacts.recyclebin) {
                        if (feed && typeof feed === 'object' && feed.id) {
                            // Remove packages from feed before storing, add packagesCount if present
                            let packagesCount = 0;
                            if (Array.isArray(feed.packages)) {
                                packagesCount = feed.packages.length;
                            }
                            const { packages, ...feedWithoutPackages } = feed;
                            feedsToStore.push({ organisation: orgId, ...feedWithoutPackages, packagesCount });
                        }
                    }
                }
                for (const feed of feedsToStore) {
                    await addRecord('artifactsFeeds', feed);
                }
            }

            // Ensure global system logic containers exist
            // These containers are shared across all platform sources
            for (const defaultContainer of defaultLogicContainers) {
                const existing = await getRecord('logiccontainers', defaultContainer.id);
                if (!existing) {
                    await addRecord('logiccontainers', defaultContainer);
                }
            }

            // Create platform-specific default containers
            if (platformSourceData.organisation?.id) {
                const orgId = platformSourceData.organisation.id;
                const now = new Date().toISOString();
                
                // Create Development container for this platform
                const developmentContainer = {
                    id: `Development-${orgId}`,
                    name: `Development-${orgId}`,
                    color: '#4CAF50',
                    description: `Development environment for ${platformSourceData.organisation.name}`,
                    criticality: 'low' as const,
                    is_default: true,
                    is_system: false,
                    owner: 'system',
                    created_at: now,
                    updated_at: now,
                    projects: [],
                    platform_source_ids: [orgId],
                    resources: {}
                };
                
                // Create Production container for this platform
                const productionContainer = {
                    id: `Production-${orgId}`,
                    name: `Production-${orgId}`,
                    color: '#F44336',
                    description: `Production environment for ${platformSourceData.organisation.name}`,
                    criticality: 'high' as const,
                    is_default: true,
                    is_system: false,
                    owner: 'system',
                    created_at: now,
                    updated_at: now,
                    projects: [],
                    platform_source_ids: [orgId],
                    resources: {}
                };
                
                // Add both platform-specific containers to IndexedDB
                await addRecord('logiccontainers', developmentContainer);
                await addRecord('logiccontainers', productionContainer);
            }

            await useStore.getState().fetchPlatformSources();
            await useStore.getState().fetchLogicContainers();
        } catch (error) {
            alert('An error occurred while adding the platform source. ' + error);
            console.error('Error adding platformSource:', error);
        }
    },
    deletePlatformSource: async (platformSourceId) => {
        // console.log("Deleting platformSource with ID:", platformSourceId);
        try {
            // Delete from platformSourceresults (legacy)
            // await deleteRecord('platformSourceresults', platformSourceId);

            // Delete from organisations
            await deleteRecord('organisations', platformSourceId);
            // Delete all records by org id using index-based deletion
            const indexDeletes = [
                { store: 'projects', index: 'byOrganisation', value: platformSourceId },
                { store: 'protected_resources', index: 'byOrganisation', value: platformSourceId },
                { store: 'build_definitions', index: 'byOrganisation', value: platformSourceId },
                { store: 'build_definitions_previews', index: 'byOrganisation', value: platformSourceId },
                { store: 'builds', index: 'byOrganisation', value: platformSourceId },
                { store: 'stats', index: 'byOrganisation', value: platformSourceId },
                { store: 'bot_accounts', index: 'byOrganisation', value: platformSourceId },
                { store: 'commits', index: 'byOrganisation', value: platformSourceId },
                { store: 'committer_stats', index: 'byOrganisation', value: platformSourceId },
                { store: 'repo_branches', index: 'byOrganisation', value: platformSourceId },
                { store: 'artifactsFeeds', index: 'byOrganisation', value: platformSourceId },
                { store: 'artifactsPackages', index: 'byOrganisation', value: platformSourceId },
            ];
            for (const { store, index, value } of indexDeletes) {
                await deleteAllRecords(store, index, value);
            }
            
            // Clean up user-created logic containers (skip system containers)
            // System containers are global and cannot be deleted
            const allContainers = await getAllRecords('logiccontainers');
            for (const container of allContainers) {
                // Skip system containers
                if (container.is_system) {
                    continue;
                }
                
                if (container.platform_source_ids && container.platform_source_ids.includes(platformSourceId)) {
                    const remainingPlatformSources = container.platform_source_ids.filter((id: string) => id !== platformSourceId);
                    
                    if (remainingPlatformSources.length === 0) {
                        // Container is only used by this platform source, delete it
                        await deleteRecord('logiccontainers', container.id);
                    } else {
                        // Container is used by other platform sources, just remove this one
                        const updatedResources = { ...container.resources };
                        delete updatedResources[platformSourceId];
                        
                        await updateRecord('logiccontainers', container.id, (existing: any) => ({
                            ...existing,
                            platform_source_ids: remainingPlatformSources,
                            resources: updatedResources,
                            updated_at: new Date().toISOString()
                        }));
                    }
                }
            }
            
            await useStore.getState().fetchPlatformSources();
        } catch (error) {
            console.error('Error deleting platformSource:', error);
        }
    },
    // updatePlatformSource: async (platformSourceId, updateFn) => {
    //     try {
    //         const storeName = 'platformSourceresults';
    //         await updateRecord(storeName, platformSourceId, updateFn);
    //         await useStore.getState().fetchPlatformSources();
    //     } catch (error) {
    //         console.error('Error updating platformSource:', error);
    //     }
    // },
    // Fetch a single organisation by ID
    fetchOrganisation: async (orgId) => {
        const allOrgs = await getAllRecords('organisations');
        const org = allOrgs.find(o => o.id === orgId);
        set({ organisation: org || null });
    },
    // Fetch paginated projects by org ID using index
    fetchProjects: async (orgId) => {
        const allProjects = await getAllRecords('projects', 'byOrganisation', orgId);
        const total = allProjects.length;
        set({
            projects: allProjects,
            projectsTotal: total,
            projectsReferences: Object.fromEntries(allProjects.map((p: { id: string; name: string; }) => [p.id, p.name]))
        });
    },
    fetchProjectStats: async (orgId, projectId) => {
        // Stats should always be a single record, use compound key [orgId, projectId]
        return await getRecord('stats', [orgId, projectId]);
    },

    // Fetch paginated repositories by org ID and project ID
    fetchProjectRepositories: async (orgId, projectId, page = 0, pageSize = 0, includeBranches = false) => {
        let repos;
        // If page or pageSize is null/undefined/0, fetch all
        if (!page || !pageSize) {
            repos = await getAllRecords('protected_resources', 'byResourceTypeAndOrgAndKProject', ['repository', orgId, projectId]);
        } else {
            repos = await getPaginatedRecords('protected_resources', {
                indexName: 'byResourceTypeAndOrgAndKProject',
                value: ['repository', orgId, projectId],
                offset: (page - 1) * pageSize,
                limit: pageSize
            });
        }
        const total = await getCount('protected_resources', 'byResourceTypeAndOrgAndKProject', ['repository', orgId, projectId]);

        // If includeBranches, fetch branches for each repo
        if (includeBranches) {
            for (const repo of repos) {
                const repoBranches = await getAllRecords('repo_branches', 'byOrgAndRepoId', [orgId, repo.id]);
                // Flatten branches array (repoBranches may have multiple records, each with branches array)
                let branches = [];
                for (const branchRecord of repoBranches) {
                    if (Array.isArray(branchRecord.branches)) {
                        branches = branches.concat(branchRecord.branches.map(b => {
                            const { organisation, repoId, ...rest } = b;
                            return rest;
                        }));
                    }
                }
                repo.branches = branches;
            }
        }
        return { repositories: repos, total };
    },

    fetchCommits: async (orgId, committerEmail, page, pageSize) => {
        const paginated = await getPaginatedRecords('commits', {
            indexName: 'byOrgAndCommitterEmail',
            value: [orgId, committerEmail],
            offset: (page - 1) * pageSize,
            limit: pageSize
        });
        const total = await getCount('commits', 'byOrgAndCommitterEmail', [orgId, committerEmail]);
        return { commits: paginated, total };
    },

    fetchCommitterStats: async (orgId) => {
        const allStats = await getAllRecords('committer_stats');
        const filtered = allStats.filter(s => s.organisation === orgId);
        return filtered.length > 0 ? filtered : null;
    },

    fetchCommitterStatsByProject: async (orgId, projectId) => {
        const allStats = await getAllRecords('committer_stats');
        const filtered = allStats.filter(s => s.organisation === orgId && s.projectId === projectId);
        return filtered.length > 0 ? filtered : null;
    },

    updateLogicContainer: async (logicContainerId: String, updated: LogicContainer) => {
        try {
            // Prevent updating system containers
            const existing = await getRecord('logiccontainers', logicContainerId);
            if (existing?.is_system) {
                console.warn('Cannot update system logic container:', logicContainerId);
                return;
            }
            
            await updateRecord(
                "logiccontainers",
                logicContainerId,
                (current: LogicContainer) => ({
                    ...current,
                    ...updated
                })
            );
            // Optionally, refresh logic containers in store after update
            await useStore.getState().fetchLogicContainers();
        } catch (error) {
            console.error('Error updating logic container:', error);
        }
    },

    createLogicContainer: async (container) => {
        try {
            await addRecord('logiccontainers', container);
            await useStore.getState().fetchLogicContainers();
        } catch (error) {
            console.error('Error creating logic container:', error);
        }
    },

    deleteLogicContainer: async (id: string) => {
        try {
            // Prevent deleting system containers
            const existing = await getRecord('logiccontainers', id);
            if (existing?.is_system) {
                console.warn('Cannot delete system logic container:', id);
                return;
            }
            
            await deleteRecord('logiccontainers', id);
            await useStore.getState().fetchLogicContainers();
        } catch (error) {
            console.error('Error deleting logic container:', error);
        }
    },

    fetchProtectedResourcesByTypeOrgProject: async (orgId, resourceType, projectId) => {
        const resources = await getAllRecords('protected_resources', 'byResourceTypeAndOrgAndKProject', [resourceType, orgId, projectId]);
        const total = resources.length;
        return { resources, total };
    },

    fetchEndpointsByOrgAndProject: async (orgId, projectId) => {
        const resources = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'endpoint']);
        // Filter for endpoints with k_project_refs containing an object with id === projectId
        const filtered = resources.filter(r =>
            Array.isArray(r.k_projects_refs) &&
            r.k_projects_refs.some((ref: any) => ref && ref.id === projectId)
        );
        const total = filtered.length;
        return { resources: filtered, total };
    },

    /**
     * Fetch resources for a specific list of pipelines
     * This method collects all resource IDs from the pipelines' resourcepermissions
     * and fetches only those specific resources from IndexedDB
     * @param {string} orgId - The ID of the organisation
     * @param {any[]} pipelines - Array of pipeline objects containing resourcepermissions
     * @returns {Promise<object>} Object containing arrays of resources by type
     */
    fetchResourcesForPipelines: async (orgId: string, pipelines: any[]) => {
        // Collect all unique resource IDs by type from pipeline permissions
        const resourceIdsByType: Record<string, Set<string>> = {
            endpoint: new Set(),
            variablegroup: new Set(),
            repository: new Set(),
            pool_merged: new Set(),
            securefile: new Set(),
            environment: new Set()
        };

        // Gather resource IDs from all pipelines
        pipelines.forEach(pipeline => {
            if (pipeline.resourcepermissions) {
                Object.keys(pipeline.resourcepermissions).forEach(resourceType => {
                    const normalizedType = resourceType.toLowerCase();
                    if (resourceIdsByType[normalizedType]) {
                        pipeline.resourcepermissions[resourceType].forEach((resourceId: string) => {
                            resourceIdsByType[normalizedType].add(String(resourceId));
                        });
                    }
                });
            }
        });

        // Fetch resources for each type
        const results: any = {
            endpoints: [],
            variableGroups: [],
            repositories: [],
            pools: [],
            secureFiles: [],
            environments: []
        };

        // Fetch endpoints
        if (resourceIdsByType.endpoint.size > 0) {
            const allEndpoints = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'endpoint']);
            results.endpoints = allEndpoints.filter((r: any) => resourceIdsByType.endpoint.has(String(r.id)));
        }

        // Fetch variable groups
        if (resourceIdsByType.variablegroup.size > 0) {
            const allVarGroups = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'variablegroup']);
            results.variableGroups = allVarGroups.filter((r: any) => resourceIdsByType.variablegroup.has(String(r.id)));
        }

        // Fetch repositories
        if (resourceIdsByType.repository.size > 0) {
            const allRepos = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'repository']);
            results.repositories = allRepos.filter((r: any) => resourceIdsByType.repository.has(String(r.id)));
        }

        // Fetch pools (note: stored as 'pools' in database, not 'pool_merged')
        if (resourceIdsByType.pool_merged.size > 0) {
            const allPools = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'pools']);
            results.pools = allPools.filter((r: any) => resourceIdsByType.pool_merged.has(String(r.id)));
        }

        // Fetch secure files
        if (resourceIdsByType.securefile.size > 0) {
            const allSecureFiles = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'securefile']);
            results.secureFiles = allSecureFiles.filter((r: any) => resourceIdsByType.securefile.has(String(r.id)));
        }

        // Fetch environments
        if (resourceIdsByType.environment.size > 0) {
            const allEnvironments = await getAllRecords('protected_resources', 'byOrgAndResourceType', [orgId, 'environment']);
            results.environments = allEnvironments.filter((r: any) => resourceIdsByType.environment.has(String(r.id)));
        }

        return results;
    },

    /**
     * Fetch artifact feeds for a specific orgId and projectId
     * @param {string} orgId - The ID of the organisation
     * @param {string} projectId - The ID of the project
     * @returns {Promise<any[]>} Array of artifact feeds
     */
    fetchArtifactsFeeds: async (orgId: string, projectId: string) => {
        // Use the 'byOrgAndKProject' index on artifactsFeeds
        const allFeeds = await getAllRecords('artifactsFeeds', 'byOrganisation', orgId);

        // filter feeds that have k_project.id === projectId and where there is no k_project (org-wide feeds)
        const filtered = allFeeds.filter(feed =>
            !feed.k_project || (feed.k_project && feed.k_project.id === projectId)
        );
        return { feeds: filtered, total: filtered.length };
    },

    // Saved searches CRUD operations
    fetchSavedSearches: async () => {
        try {
            const dbName = OBSERVES_DB_NAME;
            const storeName = "saved_searches";
            await ensureObjectStore(dbName, storeName);
            const savedSearches = await getAllRecords(storeName);
            set({ savedSearches: savedSearches || [] });
        } catch (error) {
            console.error("Error fetching saved searches from IndexedDB:", error);
            set({ savedSearches: [] });
        }
    },

    createSavedSearch: async (savedSearchData) => {
        try {
            const id = `search_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            const savedSearch: SavedSearch = {
                id,
                ...savedSearchData,
                createdAt: now,
                updatedAt: now
            };

            await addRecord('saved_searches', savedSearch);
            await useStore.getState().fetchSavedSearches();
        } catch (error) {
            console.error('Error creating saved search:', error);
        }
    },

    updateSavedSearch: async (id, updates) => {
        try {
            const now = new Date().toISOString();
            await updateRecord('saved_searches', id, (current: SavedSearch) => ({
                ...current,
                ...updates,
                updatedAt: now
            }));
            await useStore.getState().fetchSavedSearches();
        } catch (error) {
            console.error('Error updating saved search:', error);
        }
    },

    deleteSavedSearch: async (id) => {
        try {
            await deleteRecord('saved_searches', id);
            await useStore.getState().fetchSavedSearches();
        } catch (error) {
            console.error('Error deleting saved search:', error);
        }
    },

}));

export default useStore;