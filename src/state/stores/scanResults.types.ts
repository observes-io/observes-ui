export interface ScanResults {
  id: string;
  scan_start: string;
  scan_end: string;
  organisation: Organisation;
  stats: Record<string, ProjectStats>;
  projects: Record<string, ProjectRecord>;
  protected_resources: ProtectedResources;
  build_definitions: BuildDefinitionsMap;
  builds: BuildsMap;
}

export interface Organisation {
  id: string;
  name: string;
  url: string;
  type: string;
  owner: string;
  shadow_color: string;
  partial_scan: boolean;
  projects_filter: string[];
  resource_counts: OrganisationResourceCounts;
}

export interface OrganisationResourceCounts {
  projects: number;
  pools: number;
  queue: number;
  endpoint: number;
  variablegroup: number;
  securefile: number;
  repository: number;
  pipelines: number;
  builds: number;
  environment: number;
}

export interface ProjectStats {
  language_stats: LanguageStats;
  resource_counts: ResourceCounts;
  // repositories removed from here
}

export interface LanguageStats {
  url: string;
  resultPhase: string;
  languageBreakdown: LanguageBreakdownEntry[];
  repositoryLanguageAnalytics: RepositoryLanguageAnalyticsEntry[];
  id: string;
}

export interface LanguageBreakdownEntry {
  name?: string;
  files?: number;
  filesPercentage?: number;
  bytes?: number;
  languagePercentage?: number;
}

export interface RepositoryLanguageAnalyticsEntry {
  name?: string;
  resultPhase?: string;
  updatedTime?: string;
  languageBreakdown?: LanguageBreakdownEntry[];
  id: string;
}

export interface ProjectInfo {
  id?: string;
  name?: string;
  url?: string;
  state?: string;
  revision?: number;
  visibility?: string;
  lastUpdateTime?: string;
}

export interface ResourceCounts {
  pipelines: number;
  builds: number;
  endpoint: number;
  variablegroup: number;
  securefile: number;
  queue: number;
  environment: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
  lastUpdateTime: string;
  general_settings: GeneralSettings;
  organisation?: string;
}

export interface GeneralSettings {
  build_settings: BuildSettings;
  build_metrics: BuildMetric[];
}

export interface BuildSettings {
  enforceReferencedRepoScopedToken: ExpectedFound;
  disableClassicPipelineCreation: ExpectedFound;
  disableClassicBuildPipelineCreation: ExpectedFound;
  disableClassicReleasePipelineCreation: ExpectedFound;
  forkProtectionEnabled: ExpectedFound;
  buildsEnabledForForks: ExpectedFound;
  enforceJobAuthScopeForForks: ExpectedFound;
  enforceNoAccessToSecretsFromForks: ExpectedFound;
  isCommentRequiredForPullRequest: ExpectedFound;
  requireCommentsForNonTeamMembersOnly: ExpectedFound;
  requireCommentsForNonTeamMemberAndNonContributors: ExpectedFound;
  enableShellTasksArgsSanitizing: ExpectedFound;
  enableShellTasksArgsSanitizingAudit: ExpectedFound;
  disableImpliedYAMLCiTrigger: ExpectedFound;
  statusBadgesArePrivate: ExpectedFound;
  enforceSettableVar: ExpectedFound;
  enforceJobAuthScope: ExpectedFound;
  enforceJobAuthScopeForReleases: ExpectedFound;
  publishPipelineMetadata: ExpectedFound;
}

export interface ExpectedFound {
  expected: boolean;
  found: boolean;
}

export interface BuildMetric {
  name: string;
  intValue: number;
}

export interface ProtectedResources {
  endpoint: ProtectedResourceGroup<EndpointResource>;
  pools: ProtectedResourceGroup<PoolResource>;
  queue: ProtectedResourceGroup<QueueResource>;
  variablegroup: ProtectedResourceGroup<VariableGroupResource>;
  securefile: ProtectedResourceGroup<SecureFileResource>;
  repository: ProtectedResourceGroup<RepositoryResource>;
  // Add other resource types here as needed
}

export interface ProtectedResourceGroup<T> {
  api_endpoint: string;
  api_version: string;
  project_path: string;
  protected_resources: ProtectedResourceEntry<T>[];
  level: string;
}

export interface ProtectedResourceEntry<T> {
  resourceType: string;
  resource: T;
}

export interface EndpointResource {
  data: EndpointResourceData;
  id: string;
  name: string;
  type: string;
  url: string;
  k_url: string;
  createdBy: EndpointIdentity;
  description: string;
  authorization: EndpointAuthorization;
  isShared: boolean;
  isOutdated: boolean;
  isReady: boolean;
  modifiedBy: EndpointIdentity;
  creationDate: string;
  modificationDate: string;
  operationStatus: EndpointOperationStatus;
  owner: string;
  serviceEndpointProjectReferences: ServiceEndpointProjectReference[];
  serviceManagementReference: unknown;
  k_project: KProjectRef;
  k_projects_refs: KProjectRef[];
  k_project_shared_from: { id: string; name: string }[];
  checks: Check[];
  pipelinepermissions: string[];
}

export interface EndpointResourceData {
  creationMode: string;
  environment: string;
  scopeLevel: string;
  subscriptionId: string;
  subscriptionName: string;
  identityType: string;
  appObjectId: string;
  spnObjectId: string;
  azureSpnPermissions: string;
  azureSpnRoleAssignmentId: string;
}

export interface EndpointIdentity {
  displayName: string | null;
  url?: string;
  _links?: {
    avatar: {
      href: string;
    };
  };
  id: string;
  uniqueName?: string;
  imageUrl?: string;
  descriptor?: string;
}

export interface EndpointAuthorization {
  parameters: {
    authenticationType: string;
    tenantId: string;
    serviceprincipalid: string;
  };
  scheme: string;
}

export interface EndpointOperationStatus {
  state: string;
  statusMessage: string;
  severity: string | null;
  errorCode: string | null;
}

export interface ServiceEndpointProjectReference {
  projectReference: {
    id: string;
    name: string;
    pipelinepermissions: string[];
  };
  name: string;
  description: string;
}

export interface PoolResource {
  createdOn: string;
  autoProvision: boolean;
  autoUpdate: boolean;
  autoSize: boolean;
  targetSize: number | null;
  agentCloudId: string | null;
  createdBy: EndpointIdentity;
  owner: EndpointIdentity;
  id: number;
  scope: string;
  name: string;
  k_url: string;
  isHosted: boolean;
  poolType: string;
  size: number;
  isLegacy: boolean;
  options: string;
  k_project?: KProjectRef | Record<string, KProjectRef>;
  queues: PoolQueue[];
  pipelinepermissions: string[];
  checks: Check[];
}

export interface PoolKProject {
  type: string;
  id: string;
  name: string;
  self_attribute?: string;
}

// Shallow reference to a project
export interface KProjectRef {
  type: string;
  id: string;
  name: string;
  self_attribute?: string;
}

export interface PoolQueue {
  id: number;
  projectId: string;
  name: string;
  pool: PoolQueuePool;
  k_project: KProjectRef;
  checks: Check[];
  pipelinepermissions: string[];
}

export interface PoolQueuePool {
  id: number;
  scope: string;
  name: string;
  isHosted: boolean;
  poolType: string;
  size: number;
  isLegacy: boolean;
  options: string;
}

export interface Check {
  settings: CheckSettings;
  createdBy: CheckIdentity;
  createdOn: string;
  modifiedBy: CheckIdentity;
  modifiedOn: string;
  timeout: number;
  _links: {
    self: {
      href: string;
    };
  };
  id: number;
  version: number;
  type: {
    id: string;
    name: string;
  };
  url: string;
  resource: {
    type: string;
    id: string;
    name: string;
  };
}

export type CheckSettings =
  | ApprovalCheckSettings
  | ExtendsCheckSettings
  | BusinessHoursCheckSettings;

export interface ApprovalCheckSettings {
  approvers: Array<{ displayName: string; id: string }>;

  executionOrder: string;
  minRequiredApprovers: number;
  instructions: string;
  blockedApprovers: Array<any>;
}

export interface ExtendsCheckSettings {
  extendsChecks: Array<{
    repositoryType: string;
    repositoryName: string;
    repositoryRef: string;
    templatePath: string;
  }>;
}

export interface BusinessHoursCheckSettings {
  displayName: string;
  definitionRef: {
    id: string;
    name: string;
    version: string;
  };
  inputs: {
    businessDays: string;
    timeZone: string;
    startTime: string;
    endTime: string;
  };
  retryInterval: number;
}

export interface CheckIdentity {
  displayName: string;
  id: string;
  uniqueName?: string;
  descriptor?: string;
}

export interface QueueResource {
  id: number;
  projectId: string;
  name: string;
  pool: PoolQueuePool;
  k_project: KProjectRef;
  k_url: string;
  checks: Check[];
  pipelinepermissions: string[];
}

export interface VariableGroupResource {
  variables: Record<string, VariableGroupVariable>;
  id: number;
  type: string;
  name: string;
  description: string;
  createdBy: CheckIdentity;
  createdOn: string;
  modifiedBy: CheckIdentity;
  modifiedOn: string;
  isShared: boolean;
  variableGroupProjectReferences: VariableGroupProjectReference[] | null;
  k_project: KProjectRef;
  k_url: string;
  checks: Check[];
  pipelinepermissions: string[];
}

export interface VariableGroupVariable {
  value: string | null;
  isSecret?: boolean;
}

export interface VariableGroupProjectReference {
  projectReference: {
    id: string;
    name: string;
    pipelinepermissions: string[];
  };
  name: string;
  description: string;
}

export interface SecureFileResource {
  id: string;
  name: string;
  createdBy: EndpointIdentity;
  createdOn: string;
  modifiedBy: EndpointIdentity;
  modifiedOn: string;
  k_project: KProjectRef;
  k_url: string;
  checks: Check[];
  pipelinepermissions: string[];
}

export interface RepositoryResource {
  id?: string;
  name?: string;
  url?: string;
  project?: ProjectInfo;
  defaultBranch?: string;
  size?: number;
  remoteUrl?: string;
  sshUrl?: string;
  webUrl?: string;
  isDisabled?: boolean;
  isInMaintenance: boolean;
  k_project: KProjectRef;
  k_url: string;
  branches: RepositoryBranch[];
  checks: Check[];
  pipelinepermissions: string[];
}

export interface RepositoryBranch {
  name: string;
  objectId: string;
  creator: EndpointIdentity;
  url: string;
  statuses: RepositoryBranchStatus[];
}

export interface RepositoryBranchStatus {
  id: number;
  state: string;
  description: string;
  context: {
    name: string;
    genre: string;
  };
  creationDate: string;
  createdBy: EndpointIdentity;
  targetUrl: string;
}

export type BuildDefinitionsMap = Record<string, BuildDefinition>;

export interface BuildDefinition {
  triggers: BuildTrigger[];
  properties: Record<string, unknown>;
  tags: string[];
  _links: BuildDefinitionLinks;
  jobAuthorizationScope: string;
  jobTimeoutInMinutes: number;
  jobCancelTimeoutInMinutes: number;
  process: BuildProcess;
  repository: BuildRepository;
  quality: string;
  authoredBy: EndpointIdentity;
  drafts: any[];
  queue: BuildQueue;
  id: number;
  name: string;
  url: string;
  uri: string;
  path: string;
  type: string;
  queueStatus: string;
  revision: number;
  createdDate: string;
  project: ProjectInfo;
  k_project: KProjectRef;
  k_key: string;
  builds: BuildDefinitionBuilds;
  resources: BuildResource[];
  resourcepermissions: BuildResourcePermissions;
  // Add this for variables object
  variables?: Record<string, {
    value: string | null;
    allowOverride?: boolean;
    isSecret?: boolean;
    [key: string]: unknown;
  }>;
}

export interface BuildTrigger {
  branchFilters: string[];
  pathFilters: string[];
  settingsSourceType: number;
  batchChanges: boolean;
  maxConcurrentBuildsPerBranch: number;
  triggerType: string;
}

export interface BuildDefinitionLinks {
  self: { href: string };
  web: { href: string };
  editor: { href: string };
  badge: { href: string };
}

export interface BuildProcess {
  yamlFilename: string;
  type: number;
}

export interface BuildRepository {
  properties: Record<string, string>;
  id: string;
  type: string;
  name: string;
  url: string;
  defaultBranch: string;
  clean: string | null;
  checkoutSubmodules: boolean;
}

export interface BuildQueue {
  _links: { self: { href: string } };
  id: number;
  name: string;
  url: string;
  pool: BuildQueuePool;
}

export interface BuildQueuePool {
  id: number;
  name: string;
  isHosted: boolean;
}

export interface BuildDefinitionBuilds {
  metrics: BuildMetricWithScope[];
  preview: BuildDefinitionPreview;
  builds: string[];
}

export interface BuildDefinitionPreview {
  main?: BuildDefinitionPreviewMain;
  [key: string]: BuildDefinitionPreviewMain | undefined;
}

export interface BuildDefinitionPreviewMain {
  cicd_sast?: BuildDefinitionCicdSast[];
  yaml?: string;
  pipeline_recipe?: BuildDefinitionPipelineRecipe;
  [key: string]: unknown;
}

export interface BuildDefinitionCicdSast {
  engine: string;
  scope: string;
  results: unknown[];
}

export interface BuildDefinitionPipelineRecipe {
  trigger?: {
    branches?: {
      include?: string[];
    };
  };
  variables?: Array<{ group: string } | { name: string; value: string }>;
  stages?: BuildDefinitionStage[];
  [key: string]: unknown;
}

export interface BuildDefinitionStage {
  stage: string;
  jobs: BuildDefinitionJob[];
}

export interface BuildDefinitionJob {
  job: string;
  pool: { vmImage: string };
  steps: BuildDefinitionStep[];
}

export interface BuildDefinitionStep {
  task: string;
  displayName?: string;
  inputs: Record<string, unknown>;
}

export interface BuildMetricWithScope {
  name: string;
  scope: string;
  intValue: number;
}

export interface BuildResource {
  type: string;
  id: string;
  authorized: boolean;
  name?: string;
}

export interface BuildResourcePermissions {
  endpoint?: string[];
  pool_merged?: string[];
  queue?: string[];
  repository?: string[];
}

export type BuildsMap = Record<string, BuildRecord>;

export interface BuildRecord {
  _links: BuildRecordLinks;
  properties: Record<string, unknown>;
  tags: string[];
  validationResults: any[];
  plans: BuildPlan[];
  triggerInfo: Record<string, unknown>;
  id: number;
  buildNumber: string;
  status: string;
  result: string;
  queueTime: string;
  startTime: string;
  finishTime: string;
  url: string;
  definition: BuildRecordDefinition;
  buildNumberRevision: number;
  project: ProjectInfo;
  uri: string;
  sourceBranch: string;
  sourceVersion: string;
  queue: BuildRecordQueue;
  priority: string;
  reason: string;
  requestedFor: EndpointIdentity;
  requestedBy: EndpointIdentity;
  lastChangedDate: string;
  lastChangedBy: EndpointIdentity;
  orchestrationPlan: BuildPlan;
  logs: BuildRecordLogs;
  repository: BuildRecordRepository;
  retainedByRelease: boolean;
  triggeredByBuild: unknown;
  appendCommitMessageToRunName: boolean;
  pipeline_recipe: BuildDefinitionPipelineRecipe;
  k_project: KProjectRef;
  k_key: string;
  yaml: string;
  cicd_sast: any[];
}

export interface BuildRecordLinks {
  self: { href: string };
  web: { href: string };
  sourceVersionDisplayUri?: { href: string };
  timeline?: { href: string };
  badge?: { href: string };
}

export interface BuildPlan {
  planId: string;
}

export interface BuildRecordDefinition {
  drafts: any[];
  id: number;
  name: string;
  url: string;
  uri: string;
  path: string;
  type: string;
  queueStatus: string;
  revision: number;
  project: ProjectInfo;
}

export interface BuildRecordQueue {
  id: number;
  name: string;
  pool: BuildQueuePool;
}

export interface BuildRecordLogs {
  id: number;
  type: string;
  url: string;
}

export interface BuildRecordRepository {
  id: string;
  type: string;
  name: string;
  url: string;
  clean: string | null;
  checkoutSubmodules: boolean;
}