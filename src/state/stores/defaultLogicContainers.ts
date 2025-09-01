// Common default logic containers for the app
import { LogicContainer } from './store';

const now = new Date().toISOString();

const defaultLogicContainers: LogicContainer[] = [
  {
    id: "dev__default",
    name: "Development",
    color: "#006400",
    description: "Development environment",
    criticality: "low",
    is_default: false,
    owner: "anonymous",
    created_at: now,
    updated_at: now,
    projects: [],
    resources: []
  },
  {
    id: "prod__default",
    name: "Production",
    color: "#FF0000",
    description: "Production environment logic container",
    criticality: "high",
    is_default: true,
    owner: "anonymous",
    created_at: now,
    updated_at: now,
    projects: [],
    resources: []
  }
];

export default defaultLogicContainers;
