import { create } from "zustand";
import axios, { all } from "axios";
import { ensureObjectStore, getGlobalSettings, getRecord, addRecord, deleteRecord, updateRecord, getAllRecords, getCount, getPaginatedRecords, deleteAllRecords } from '../../utils/indexeddb';
import defaultSettings, { GlobalSettings } from './defaultSettings';
import defaultLogicContainers from './defaultLogicContainers';
import defaultBotAccounts from "./defaultBotAccounts";
import { OBSERVES_DB_NAME } from '../../utils/dbConfig';
import { ProjectRecord, RepositoryResource, VariableGroupResource, EndpointResource, PoolResource, QueueResource, SecureFileResource, ProjectStats, BuildDefinition, BuildDefinitionBuilds, BuildRecord } from './scanResults.types';

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
    Scan: string | null;
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
    owner: string;
    created_at: string;
    updated_at: string | null;
    projects: string[];
    resources: string[];
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


export interface Scan {
    id: string;
    scanned: string;
    organisation: {
        id?: string;
        name: string;
        url: string;
        type: string;
        owner?: string;
        shadow_color: string;
        last_scan_started: string;
        last_scan_finished: string | null;
        last_scan_id: string;
        scan_progress: string;
        scanned: {
            scan: string;
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

interface SelectedScanRef {
    id: string; // org name or scan id
    type: string; // e.g., 'organisation' or other type if needed
}

interface StoreState {
    globalSettings: GlobalSettings | null,
    current_page: string;
    system_type: string;
    scans: Scan[];
    selectedScan: SelectedScanRef | null;
    selectedProject: ProjectRecord | null;
    pipelines: Pipeline[];
    builds: BuildRecord[];
    protected_resources_group: protected_resources_group;
    resource_type_selected: string;


    logic_containers: LogicContainer[];
    connected_systems: ConnectedSystem[];

    policies: Policy[];
    policyGroups: PolicyGroup[];
    approvalAuthorities: ApprovalAuthority[];

    endpoints: EndpointResource[];
    variableGroups: VariableGroupResource[];
    repositories: RepositoryResource[];
    secureFiles: SecureFileResource[];
    pools: PoolResource[];
    queues: QueueResource[];

    // New paginated state for migration away from scanresults
    organisation: any | null;
    projects: ProjectRecord[];
    projectsTotal: number;
    // key value pairs of project Ids and Names
    projectsReferences: Record<string, string>;

    fetchGlobalSettings: () => Promise<void>;
    fetchScans: () => Promise<void>;
    fetchPipelines: (org: string) => Promise<BuildDefinition[]>;
    fetchBuilds: (org: string) => Promise<BuildRecord[]>;
    fetchResources: (org: string, type: string) => Promise<void>;

    fetchLogicContainers: () => Promise<void>;

    // Add fetch actions for new paginated state
    fetchOrganisation: (orgId: string) => Promise<void>;
    fetchProjects: (orgId: string, page: number, pageSize: number) => Promise<void>;

    getResourceCountByProject: (project_id: string, resourcetype: string) => number;
    setSelectedScan: (organisation: Scan | null) => void;
    setSelectedProject: (project: ProjectRecord | null) => void;
    setCurrentPage: (page: string) => void;
    // current only looks at MenuLayout @TODO
    setGlobalSettings: (globalSettings: GlobalSettings | null) => void;
    setSystemType: (system_type: string) => void;
    setResourceTypeSelected: (restype: string) => void;

    // Add scan CRUD actions
    addScan: (scanData: any) => Promise<void>;
    deleteScan: (scanId: string) => Promise<void>;
    // updateScan: (scanId: string, updateFn: (scan: any) => void) => Promise<void>;

    // New action to fetch project stats
    fetchProjectStats: (orgId: string, projectId: string) => Promise<any | null>;

    // Fetch paginated repositories by org ID and project ID
    fetchProjectRepositories: (orgId: string, projectId: string, page: number, pageSize: number) => Promise<{ repositories: RepositoryResource[], total: number }>;

    fetchCommits: (orgId: string, committerEmail: string, page: number, pageSize: number) => Promise<{ commits: any[], total: number }>;

    fetchCommitterStats: (orgId: string) => Promise<any | null>;

    createLogicContainer: (logicContainer: Partial<LogicContainer>) => Promise<void>;
    updateLogicContainer: (logicContainerId: String, updated: LogicContainer) => Promise<void>;
    deleteLogicContainer: (id: string) => Promise<void>;

    getProtectedResourcesByOrgTypeAndIdsSummary: (orgId: string, resourceType: string, resourceIds: string[]) => Promise<any[]>;
}

const getDefaultDateFormat = () => {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().dateStyle || 'MM/DD/YYYY';
    } catch {
        return 'MM/DD/YYYY';
    }
};

const useStore = create<StoreState>((set) => ({
    current_page: "Overview",
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
        scanSettings: {
            default_branch_limit: "full",
            default_build_settings_expectations: {
                enforceReferencedRepoScopedTokens: true,
                disableClassicPipelineCreation: true,
            },
        }
    },
    scans: [],
    selectedScan: null,
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
    pipelines: [],
    builds: [],

    policies: [],
    policyGroups: [],
    approvalAuthorities: [],

    // New paginated state for migration away from scanresults
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
        
        if (resourceType === 'endpoint') {
            console.log(protectedResources);
        }
        
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

    fetchScans: async () => {
        try {
            // @TODO: Fetch only the data that is needed (for landing) & selected scan is selected orgs

            // Open IndexedDB and fetch organisations
            const dbName = OBSERVES_DB_NAME;
            const storeName = "organisations";
            // const storeName = "scanresults";
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
                    const scans = getAllRequest.result;
                    set({ scans });
                    if (scans.length > 0 && !useStore.getState().selectedScan) {
                        set({ selectedScan: { id: scans[0].id, type: scans[0].organisation?.type || 'organisation' } });
                    }
                };
                getAllRequest.onerror = function (event) {
                    console.error("Error fetching scans from IndexedDB:", event);
                };
            };
        } catch (error) {
            console.error("Error opening IndexedDB:", error);
        }
    },
    /**
     * Fetch pipelines (build_definitions) for a specific scanId
     * @param {string} scanId - The ID of the scan to fetch pipelines for 
     */
    fetchPipelines: async (scanId) => {

        const allPipelines = await getAllRecords('build_definitions', 'byOrganisation', scanId)
        if (allPipelines.length === 0) {
            console.warn(`No pipelines found for scanId: ${scanId}`);
            return;
        }
        // console.log(`Fetched ${allPipelines.length} pipelines for scanId: ${scanId}`);
        // If pipelines found, return them as the correct type
        return allPipelines as BuildDefinition[];

    },
    /**
     * Fetch builds for a specific scanId
     * @param scanId - The ID of the scan to fetch builds for
     */
    fetchBuilds: async (scanId) => {
        // console.log("Fetching builds for scanId:", scanId);
        const allBuilds = await getAllRecords('builds', 'byOrganisation', scanId);
        if (allBuilds.length === 0) {
            console.warn(`No builds found for scanId: ${scanId}`);
            return;
        }
        // console.log(`Fetched ${allBuilds.length} builds for scanId: ${scanId}`);
        // If builds found, return them as the correct type
        return allBuilds as BuildRecord[];

    },
    fetchResources: async (scanId: string, type: string) => {
        // console.log("Fetching resources for scanId:", scanId, "type:", type);    

        if (type == "pool_merged") {
            // Special case for pool_merged, which is a merged view of pools and queues
            type = "pools";
        }
        //check if type is empty
        if (!type || type === "") {
            // If no type is provided, return all resources
            const allResources = await getAllRecords('protected_resources', 'byOrganisation', scanId);
            return allResources;
        }

        // check type against known resource types
        const knownResourceTypes = ['endpoint', 'variablegroup', 'securefile', 'repository', 'pools', 'queue'];
        // If type is known, fetch resources by type check for case insensitivity
        type = type.toLowerCase();
        if (knownResourceTypes.includes(type)) {
            // If type is known, fetch resources by type
            const allResources = await getAllRecords('protected_resources', 'byOrgAndType', [scanId, type]);
            // console.log(`Fetched ${allResources.length} resources of type: ${type} for scanId: ${scanId}`);
            if (allResources.length === 0) {
                // If no resources found, return empty array
                console.warn(`No resources found for type: ${type} in scanId: ${scanId}`);
                return [];
            }
            // If resources found, return them as the correct type
            switch (type) {
                case 'endpoint':
                    // console.log("Returning endpoints: ", allResources);
                    return allResources as EndpointResource[];
                case 'variablegroup':
                    // console.log("Returning variable groups: ", allResources);
                    return allResources as VariableGroupResource[];
                case 'securefile':
                    // console.log("Returning secure files: ", allResources);
                    return allResources as SecureFileResource[];
                case 'repository':
                    // console.log("Returning repositories: ", allResources);
                    return allResources as RepositoryResource[];
                case 'pools':
                    // console.log("Returning pools: ", allResources);
                    return allResources as PoolResource[];
                case 'queue':
                    // console.log("Returning queues: ", allResources);
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
            const logicContainers = await getAllRecords(storeName);
            if (logicContainers && logicContainers.length > 0) {
                set({ logic_containers: logicContainers });
            }
        } catch (error) {
            console.error("Error fetching logic containers from IndexedDB:", error);
            set({ logic_containers: defaultLogicContainers });
        }
    },

    setSelectedScan: (scan: SelectedScanRef | null) => set({ selectedScan: scan, selectedProject: null }),
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
    // Add scan CRUD actions
    addScan: async (scanData) => {
        try {
            const dbName = OBSERVES_DB_NAME;
            const stores = [
                // 'scanresults', 
                'organisations', 'projects', 'protected_resources',
                'build_definitions', 'builds', 'stats'
            ];
            for (const store of stores) {
                await ensureObjectStore(dbName, store);
            }
            // // 1. Write full scan to scanresults (legacy)
            // await addRecord('scanresults', scanData);

            // 2. Write organisation
            if (scanData.organisation && typeof scanData.organisation === 'object') {
                await addRecord('organisations', {
                    scan_start: scanData.scan.start,
                    scan_end: scanData.scan.end,
                    ...scanData.organisation
                });
            }

            // 3. Write projects (compound key: [organisation.id, project.id])
            if (scanData.projects && scanData.organisation?.id) {
                for (const [projectId, project] of Object.entries(scanData.projects)) {
                    if (project && typeof project === 'object') {
                        await addRecord('projects', {
                            organisation: scanData.organisation.id,
                            id: projectId,
                            ...project
                        });
                    }
                }
            }

            // 4. Write protected_resources (compound key: [organisation.id, resource id])
            if (scanData.protected_resources && scanData.organisation?.id && typeof scanData.protected_resources === 'object') {
                for (const [type, group] of Object.entries(scanData.protected_resources)) {
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
                                            organisation: scanData.organisation.id,
                                            repoId: resource.id,
                                            ...branch
                                        });
                                    }
                                    // Remove branches from resource before saving
                                    const { branches, ...restResource } = resource;
                                    resource = restResource;
                                }
                                await addRecord('protected_resources', {
                                    organisation: scanData.organisation.id,
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
            if (Array.isArray(scanData.build_definitions) && scanData.organisation?.id) {
                for (const buildDef of scanData.build_definitions) {
                    if (buildDef && typeof buildDef === 'object' && buildDef.id) {
                        await addRecord('build_definitions', {
                            organisation: scanData.organisation.id,
                            id: buildDef.id,
                            ...buildDef
                        });
                    }
                }
            }

            // 6. Write builds (compound key: [organisation.id, buildId])
            if (Array.isArray(scanData.builds) && scanData.organisation?.id) {
                for (const build of scanData.builds) {
                    if (build && typeof build === 'object' && build.id) {
                        await addRecord('builds', {
                            organisation: scanData.organisation.id,
                            id: build.id,
                            ...build
                        });
                    }
                }
            }

            // 7. Write stats (compound key: [organisation.id, projectId])
            if (scanData.stats && scanData.organisation?.id) {
                for (const [projectId, stats] of Object.entries(scanData.stats)) {
                    if (stats && typeof stats === 'object') {
                        await addRecord('stats', {
                            organisation: scanData.organisation.id,
                            id: projectId,
                            ...stats
                        });
                    }
                }
            }

            // 8.1. Ensure default bot_accounts (compound key: [organisation.id, botAccountId])
            if (Array.isArray(defaultBotAccounts) && scanData.organisation?.id) {
                for (const botAccount of defaultBotAccounts) {
                    if (botAccount && typeof botAccount === 'object' && botAccount.id) {
                        await addRecord('bot_accounts', {
                            organisation: scanData.organisation.id,
                            ...botAccount
                        });
                    }
                }
            }

            const now = new Date().toISOString();

            // 8.2 Write build_service_accounts (compound key: [organisation.id, serviceAccountId])
            if (Array.isArray(scanData.build_service_accounts) && scanData.organisation?.id) {
                for (const serviceAccount of scanData.build_service_accounts) {
                    if (serviceAccount && typeof serviceAccount === 'object' && serviceAccount.id) {
                        await addRecord('bot_accounts', {
                            organisation: scanData.organisation.id,
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
            if (Array.isArray(scanData.commits) && scanData.organisation?.id) {
                for (const commit of scanData.commits) {
                    if (commit && typeof commit === 'object' && commit.commitId) {
                        await addRecord('commits', {
                            organisation: scanData.organisation.id,
                            ...commit
                        });
                    }
                }
            }

            // 10. Write committer_stats (compound key: [organisation, committerEmail])
            if (scanData.committer_stats && scanData.organisation?.id && typeof scanData.committer_stats === 'object') {
                for (const [committerEmail, stats] of Object.entries(scanData.committer_stats)) {
                    if (stats && typeof stats === 'object') {
                        await addRecord('committer_stats', {
                            organisation: scanData.organisation.id,
                            committerEmail,
                            ...stats
                        });
                    }
                }
            }

            await useStore.getState().fetchScans();
        } catch (error) {
            console.error('Error adding scan:', error);
        }
    },
    deleteScan: async (scanId) => {
        // console.log("Deleting scan with ID:", scanId);
        try {
            // Delete from scanresults (legacy)
            // await deleteRecord('scanresults', scanId);

            // Delete from organisations
            await deleteRecord('organisations', scanId);
            // Delete all records by org id using index-based deletion
            const indexDeletes = [
                { store: 'projects', index: 'byOrganisation', value: scanId },
                { store: 'protected_resources', index: 'byOrganisation', value: scanId },
                { store: 'build_definitions', index: 'byOrganisation', value: scanId },
                { store: 'builds', index: 'byOrganisation', value: scanId },
                { store: 'stats', index: 'byOrganisation', value: scanId },
                { store: 'bot_accounts', index: 'byOrganisation', value: scanId },
                { store: 'commits', index: 'byOrganisation', value: scanId },
                { store: 'committer_stats', index: 'byOrganisation', value: scanId },
                { store: 'repo_branches', index: 'byOrganisation', value: scanId }
            ];
            for (const { store, index, value } of indexDeletes) {
                await deleteAllRecords(store, index, value);
            }
            await useStore.getState().fetchScans();
        } catch (error) {
            console.error('Error deleting scan:', error);
        }
    },
    // updateScan: async (scanId, updateFn) => {
    //     try {
    //         const storeName = 'scanresults';
    //         await updateRecord(storeName, scanId, updateFn);
    //         await useStore.getState().fetchScans();
    //     } catch (error) {
    //         console.error('Error updating scan:', error);
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
            repos = await getAllRecords('protected_resources', 'byResourceTypeAndOrgAndProject', ['repository', orgId, projectId]);
        } else {
            repos = await getPaginatedRecords('protected_resources', {
                indexName: 'byResourceTypeAndOrgAndProject',
                value: ['repository', orgId, projectId],
                offset: (page - 1) * pageSize,
                limit: pageSize
            });
        }
            const total = await getCount('protected_resources', 'byResourceTypeAndOrgAndProject', ['repository', orgId, projectId]);

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

    updateLogicContainer: async (logicContainerId: String, updated: LogicContainer) => {
        try {
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
            await deleteRecord('logiccontainers', id);
            await useStore.getState().fetchLogicContainers();
        } catch (error) {
            console.error('Error deleting logic container:', error);
        }
    },

}));

export default useStore;