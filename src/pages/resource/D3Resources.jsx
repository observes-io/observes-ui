/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import PropTypes, { func } from 'prop-types';
import { Typography, Stack, TableContainer, FormControlLabel, Switch, Table, Paper, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, Box, Dialog, DialogActions, DialogContent, Link, DialogTitle, Slide, Button, List, ListItem, ListItemText, ownerDocument } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import { CircularProgress } from '@mui/material';
import resourceTypeStyle from '../theme/resourceTypeStyle.js';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import Divider from '@mui/material/Divider';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ResourceSummary from './ResourceSummary';

const excludedHueRange = [30, 360]; // Exclude hues from orange to red
const isColorInExcludedRange = (hexColor) => {
    const rgb = d3.rgb(hexColor); // Convert HEX to RGB
    const hsl = d3.hsl(rgb);     // Convert RGB to HSL
    return hsl.h >= excludedHueRange[0] && hsl.h <= excludedHueRange[1];
};

const colors = d3.schemeCategory10.filter(color => !isColorInExcludedRange(color));
const projectColor = d3.scaleOrdinal(colors);

const nodeStyles = {
    stroke: "#54457f",
    strokeWidth: 1,
    radius: d => resourceTypeStyle[d.group]?.radius || 3,
    fill: d => resourceTypeStyle[d.group]?.fill || "#999",
    strokeColor: d => d.cicd_sast?.failed_checks_summary?.length > 0 ? "#ff0000" : d.group == 'logic_container' ? "#54457f" : projectColor(d.projects[0]?.id),
    strokeWidthAlert: d => d.cicd_sast?.failed_checks_summary?.length > 0 ? 1 : 1,
    opacity: d => d.cicd_sast?.failed_checks_summary?.length > 0 ? 1 : 1,
    hoverRadius: 12,
    hoverOpacity: 1,
    nonHoverOpacity: 0.5,
    strokeDasharray: d => resourceTypeStyle[d.group]?.dashed ? "4,2" : "none", // Adjust dashes: "4,2" = 4px dash, 2px gap
};


function evaluate_logic_container_policy(logicContainerIds, checks) {
    if (Object.keys(checks).length > 0) {
        return { result: "Protected" };
    }
    return { result: "Not Protected" };
}

function groupChecksByType(checks) {
    return checks.reduce((grouped, check) => {
        const checkType = check.settings?.definitionRef?.name || check.type?.name || "Unknown";
        if (!grouped[checkType]) {
            grouped[checkType] = [];
        }
        grouped[checkType].push(check);
        return grouped;
    }, {});
}

const legendItems = [
    {
        label: "Logic Container",
        circleStyle: {
            backgroundColor: "#fff",
            border: "1px dashed #54457F",
            boxSizing: "border-box",
        },
    },
    {
        label: "CI/CD Resource",
        circleStyle: {
            backgroundColor: "#ee4266",
            border: "2px solid #fff",
        },
    },
    {
        label: "Pool Queue (Project-level)",
        circleStyle: {
            backgroundColor: "#534D41",
            border: "1px solid #fff",
        },
    },
    {
        label: "Pipeline Definition",
        circleStyle: {
            backgroundColor: "#3C4EC3",
            border: "1px solid #fff",
        },
    },
    {
        label: "Pipeline Execution",
        circleStyle: {
            backgroundColor: "#ffa64d",
            border: "1px solid #fff",
        },
    },
    {
        label: "Potential Pipeline Execution",
        circleStyle: {
            backgroundColor: "#cccc00",
            border: "1px solid #FFFF00",
        },
    },
];

const D3JSResource = ({ selectedType, filteredProtectedResources, builds, pipelines, logic_containers, projects, repositories, endpoints, secureFiles, pools, variableGroups, resourceTypeSelected, setResourceTypeSelected, getProtectedResourcesByOrgTypeAndIdsSummary, selectedPlatformSource }) => {
    const svgRef = useRef();
    const containerRef = useRef(); // Reference to measure container dimensions
    const zoomTransformRef = useRef(null); // Store zoom transform state
    const [selectedNode, setSelectedNode] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [highlightedNode, setHighlightedNode] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedTab, setSelectedTab] = React.useState("General Information");
    const [showAllQueues, setShowAllQueues] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state
    const [dimensions, setDimensions] = useState({ width: 1500, height: 1500 });

    const handleToggleQueues = () => {
        setShowAllQueues(!showAllQueues);
    };

    if (!filteredProtectedResources || pipelines === 0 || !projects) {
        return <CircularProgress />; // Show loading spinner while data is being fetched
    }

    const getLogicContainerNames = (containerIds) => {
        const filteredLogicContainers = logic_containers.filter(container => containerIds?.includes(container.id));
        return filteredLogicContainers;
    };

    // const calculatePoolPipelinePermissions = (queues) => {
    //     let dedup_permissions = []
    //     queues.forEach(queue => {
    //         if (queue.pipelinepermissions) {
    //             queue.pipelinepermissions.forEach(permission => {
    //                 if (!dedup_permissions.includes(permission)) {
    //                     dedup_permissions.push(permission);
    //                 }
    //             });
    //         }
    //     })
    //     return dedup_permissions;
    // };

    function create_resource_node(resource, index, resourceType, checks) {

        // if pools, its an org level resource and I need to see if it has queues that are project specific
        // also if pools, I want to understand if it is selfhosted

        let foundProjects = []

        if (resourceType === "pool_merged" || resourceType === "pools") {

            let pool_resource_projects_ids = []
            pool_resource_projects_ids = resource.queues.map(queue => queue.projectId);
            foundProjects = projects?.filter(project => pool_resource_projects_ids.includes(project.id));


        } else if (resourceType === "endpoint") {
            let endpoint_resource_projects_ids = []
            endpoint_resource_projects_ids = resource.serviceEndpointProjectReferences.map(projRef => projRef.projectReference?.id);
            foundProjects = projects?.filter(project => endpoint_resource_projects_ids.includes(project.id));
        } else {
            foundProjects = projects?.filter(project => project.id === resource.projectId || project.id === resource.k_project?.id);
        }

        if (resourceType === "environment") {
            return {
                id: resourceType + "_" + (resource?.id?.toString()) || resourceType + "_" + resourceType + "_unknownid_" + (index.toString()),
                name: resource?.name || "No name available",
                description: resource.description || "Environment in project " + (foundProjects?.map(project => project.name).join(", ") || resource.projectId),
                projects: foundProjects ? foundProjects : [resource.projectId] || "No project info available",
                type: "Environment",
                checks: groupChecksByType(checks || []),
                group: "protected_resource",
                pipelinepermissions: resource.pipelinepermissions,
                radius: 10,
                label: resource?.name || "CI/CD Resource",
                url: resource?.k_url || resource?.url,
                createdBy: resource.createdBy,
                createdOn: resource.createdOn,
                lastModifiedBy: resource.lastModifiedBy,
                lastModifiedOn: resource.lastModifiedOn,
                protectedState: resource.protectedState,
                resources: resource.resources,
            };
        }


        if (resourceType === "pool_merged") {
            return {
                id: resourceType + "_" + (resource?.id.toString()) || resourceType + "_" + resourceType + "_unknownid_" + (index.toString()),
                name: resource?.name || "No name available",
                description: resource.description || "Pool in project " + foundProjects?.map(project => project.name).join(", ") || resource.projectId,
                projects: foundProjects ? foundProjects : [resource.projectId] || "No project info available",
                type: "Pool",
                checks: groupChecksByType(checks || []),
                group: "protected_resource",
                pipelinepermissions: resource.pipelinepermissions,
                radius: 10,
                label: resource?.name || "CI/CD Resource",
                url: resource?.url,
                autoProvision: resource.autoProvision || false,
                autoSize: resource.autoSize || false,
                autoUpdate: resource.autoUpdate || false,
                isHosted: resource.isHosted || false,
                isLegacy: resource.isLegacy || false,
                owner: resource.owner?.displayName || "Unknown Owner",
                queues: resource.queues || [],
                size: resource.size || "Unknown Size",
            };
        }

        return {
            id: resourceType + "_" + (resource?.id.toString()) || resourceType + "_" + resourceType + "_unknownid_" + (index.toString()),
            name: resource?.name || "No name available",
            description: resource.description || (resourceType.charAt(0).toUpperCase() + resourceType.slice(1) === "Pool_merged" ? "Pool" : resourceType.charAt(0).toUpperCase() + resourceType.slice(1)) + " in project " + foundProjects?.name || resource.projectId,
            projects: foundProjects ? foundProjects : [resource.projectId] || "No project info available",
            type: resourceType.charAt(0).toUpperCase() + resourceType.slice(1) === "Pool_merged" ? "Pool" : resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
            checks: groupChecksByType(checks || []),
            group: "protected_resource",
            pipelinepermissions: resource.pipelinepermissions,
            radius: 10,
            label: resource?.name || "CI/CD Resource",
            url: resource?.url,
        };


    }

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    useEffect(() => {

        if (filteredProtectedResources === null) {
            setLoading(true);
            return;
        }

        setLoading(false);

        // Save current zoom transform before clearing
        const currentSvg = d3.select(svgRef.current);
        const currentG = currentSvg.select('g');

        // Only try to save zoom if the g element exists
        if (!currentG.empty() && currentG.node()) {
            const gNode = currentG.node();
            if (gNode.__zoom) {
                zoomTransformRef.current = gNode.__zoom;
            }
        }

        // Clear previous SVG if it exists
        d3.select(svgRef.current).selectAll("*").remove();

        const data = {
            nodes: [],
            links: []
        };

        // Create Logic Container Nodes - Only show containers for current platform source
        const filteredContainers = logic_containers.filter(container => {
            if (!selectedPlatformSource?.id) return false;
            return container.platform_source_ids && container.platform_source_ids.includes(selectedPlatformSource.id);
        });
        
        filteredContainers.forEach((container, index) => {
            data.nodes.push({
                id: `${container.id}`,
                name: container.name.charAt(0).toUpperCase() + container.name.slice(1),
                group: "logic_container",
                type: "Logic Container",
                radius: 10,
                projects: ["Platform"],
                citing_patents_count: 0,
                color: container.color,
                description: container.description,
                criticality: container.criticality,
                is_default: container.is_default,
                connectedSystems: container.connectedSystems,
                resources: container.resources,
                label: container.name || "Logic Container",
            });
        });


        // CREATE Protected Resource Nodes (filtering)
        // sometimes this changes and React rerenders without rerendering the pipeline nodes

        filteredProtectedResources.forEach((protected_resource, index) => {

            const resourceNode = create_resource_node(protected_resource, index, selectedType, protected_resource.checks, logic_containers);
            if (resourceNode === undefined) {
                return;
            }
            data.nodes.push(resourceNode);

            // get all the containers associated with this resource and if they exist in the nodes, connect them
            function getLogicContainersForResource(resourceId, logicContainers) {
                return logicContainers.filter(container => {
                    // New format: resources scoped per platform source
                    if (container.resources && typeof container.resources === 'object' && !Array.isArray(container.resources)) {
                        const platformSourceId = selectedPlatformSource?.id;
                        if (platformSourceId && container.resources[platformSourceId]) {
                            return container.resources[platformSourceId].map(String).includes(String(resourceId));
                        }
                        return false;
                    }
                    // Old format: simple array (backwards compatibility)
                    if (Array.isArray(container.resources)) {
                        return container.resources.map(String).includes(String(resourceId));
                    }
                    return false;
                });
            }

            if (selectedType === "environment") {
                // Create a node for each resource in the environment's resources array
                resourceNode.resources.forEach(target => {
                    data.nodes.push({
                        id: `resource_${target.id}`,
                        name: target.name ? target.name.charAt(0).toUpperCase() + target.name.slice(1) : "No name available",
                        group: "environment_resource",
                        type: target.type || "Resource",
                        radius: 9,
                        projects: resourceNode.projects || ["No project info available"],
                        description: target.description || `Resource in environment ${resourceNode.name}`,
                        tags: target.tags || [],
                        label: target.name || "Resource",
                        parentEnvironmentId: resourceNode.id,
                    });

                    data.links.push({
                        source: resourceNode.id,
                        target: `resource_${target.id}`,
                        value: 1
                    });

                });
            }

            // Create queue nodes for pools (project-level representation)
            if (selectedType === "pool_merged" && resourceNode.queues && Array.isArray(resourceNode.queues)) {
                resourceNode.queues.forEach(queue => {
                    const queueProject = projects?.find(p => p.id === queue.projectId);
                    const queueNode = {
                        id: `queue_${queue.id}`,
                        name: queue.name || resourceNode.name,
                        description: `Project-level pool queue in ${queueProject?.name || queue.projectId}`,
                        projects: queueProject ? [queueProject] : [{ id: queue.projectId, name: queue.projectId }],
                        type: "Pool Queue",
                        group: "queue",
                        checks: queue.checks ? groupChecksByType(queue.checks) : {},
                        pipelinepermissions: queue.pipelinepermissions || [],
                        radius: 6,
                        label: queueProject?.name ? `${queueProject.name} Queue` : "Pool Queue",
                        parentPoolId: resourceNode.id,
                        parentPoolName: resourceNode.name,
                        isHosted: resourceNode.isHosted || false,
                        url: queue.url || resourceNode.url,
                    };

                    data.nodes.push(queueNode);

                    // Link queue to pool
                    data.links.push({
                        source: resourceNode.id,
                        target: `queue_${queue.id}`,
                        value: 1
                    });
                });
            }

            const logicContainersForResource = getLogicContainersForResource(protected_resource.id, logic_containers);

            if (logicContainersForResource.length > 0) {
                logicContainersForResource.forEach(container => {
                    if (data.nodes.some(node => node.id === container.id)) {
                        data.links.push({
                            source: resourceNode.id,
                            target: `${container.id}`,
                            value: 2
                        });
                    }
                });
            } 


        });


        // CREATE PIPELINE NODES

        pipelines.forEach((pipeline_value) => {

            const pipelineNode = {
                id: "pipeline_" + pipeline_value.k_key,
                name: pipeline_value.name,
                description: pipeline_value.project.name ? "Pipeline in project " + pipeline_value.project.name : "Pipeline in unrecognised project",
                group: "pipeline",
                // pipeline_actual_endpoints: build_definition.Resources.filter(resource => resource.Type === "ServiceConnection").map(resource => resource.id),
                // pipeline_actual_queues: build_definition.Resources.filter(resource => resource.Type.contains("Pool")).map(resource => resource.id),
                pipelineresources: pipeline_value.resources,
                resourcepermissions: pipeline_value.resourcepermissions,
                type: "Pipeline",
                projects: pipeline_value.project ? [pipeline_value.project.name] : pipeline_value.projectId ? [pipeline_value.projectId] : [],
                radius: 2,
                citing_patents_count: 2,
                label: pipeline_value.name || "Pipeline",
            };


            if (!data.nodes.some(node => node.id === pipelineNode.id)) {
                data.nodes.push(pipelineNode);
            }

            // Connect to RESOURCE NODES

            let compare_selected = selectedType
            for (let resource_type in pipeline_value.resourcepermissions) {

                if (resource_type === "pool_merged") {
                    compare_selected = "pool";
                }

                for (let resourceid_permission of pipeline_value.resourcepermissions[resource_type]) {

                    // For pools, connect to queue nodes instead of pool nodes directly
                    if (resource_type === "pool_merged") {
                        const queueNodes = data.nodes.filter(node =>
                            node.group === "queue" &&
                            node.parentPoolId === resource_type + "_" + resourceid_permission
                        );
                        queueNodes.forEach(queueNode => {
                            if (!data.links.some(link => link.source === pipelineNode.id && link.target === queueNode.id)) {
                                data.links.push({
                                    source: pipelineNode.id,
                                    target: queueNode.id,
                                    value: 1
                                });
                            }
                        });
                    } else {
                        // For non-pool resources, connect directly
                        if (data.nodes.some(node => node.id === resource_type + "_" + resourceid_permission)) {
                            data.links.push({
                                source: pipelineNode.id,
                                target: `${resource_type + "_" + resourceid_permission}`,
                                value: 1
                            });
                        }
                    }
                }

            }
            const future_build_ids = pipeline_value.builds && pipeline_value.builds.preview ? pipeline_value.builds.preview : {};

            // CREATE BUILDS NODES
            // Preview/Future BUILDS

            Object.entries(future_build_ids).forEach(([branch, build]) => {
                const potentialBuildYamlNode = {
                    id: `potential_build_${pipeline_value.id}_${branch}`,
                    name: `Branch ${branch}`,
                    description: pipeline_value.project.name
                        ? `Potential Pipeline Execution in project ${pipeline_value.project.name}`
                        : "Potential Pipeline Execution in unrecognised project",
                    group: "potential_build",
                    type: "Potential Pipeline Execution",
                    projects: pipeline_value.project
                        ? [pipeline_value.project.name]
                        : pipeline_value.projectId
                            ? [pipeline_value.projectId]
                            : [],
                    project: pipeline_value.project
                        ? pipeline_value.project.name
                        : pipeline_value.projectId
                            ? pipeline_value.projectId
                            : [],
                    repository: pipeline_value.repository.name
                        ? `${pipeline_value.repository.name} (${pipeline_value.repository.id} @ ${pipeline_value.project.name})`
                        : "Unknown Repository",
                    sourceBranch: branch,
                    yaml: build.yaml || "YAML not available",
                    cicd_sast: build.cicd_sast || [],
                    radius: 2,
                    citing_patents_count: 2,
                    label: branch
                };

                if (!data.nodes.some((node) => node.id === potentialBuildYamlNode.id)) {
                    data.nodes.push(potentialBuildYamlNode);
                }

                data.links.push({
                    source: potentialBuildYamlNode.id,
                    target: pipelineNode.id,
                    label: branch,
                    value: 2,
                });
            });


            let historic_build_ids = pipeline_value.builds.builds;
            if (!Array.isArray(historic_build_ids)) {
                historic_build_ids = [];
            }

            // Filter builds array for builds whose id is in historic_build_ids
            const historic_builds = builds.filter(b => historic_build_ids.includes(String(b.id)));

            Object.values(historic_builds).forEach((historic_build) => {
                const historicBuildNode = {
                    id: "build_" + historic_build.id,
                    name: historic_build.buildNumber ? historic_build.buildNumber : "No name available for pipeline run",
                    description: "Pipeline execution in project " + historic_build.project.name,
                    group: "historic_build",
                    type: "Pipeline Execution",
                    projects: historic_build.project ? [historic_build.project.name] : historic_build.projectId ? [historic_build.projectId] : [],
                    project: historic_build.project ? historic_build.project.name : historic_build.projectId ? historic_build.projectId : [],
                    repository: historic_build.repository.name + " (" + historic_build.repository.id + " @ " + historic_build.project.name + ")", // @TODO missing data
                    sourceBranch: historic_build.sourceBranch,
                    sourceVersion: historic_build.sourceVersion,
                    cicd_sast: historic_build.cicd_sast,
                    yaml: historic_build.yaml,
                    radius: 2,
                    label: historic_build.buildNumber || historic_build.sourceBranch,
                    citing_patents_count: 2
                };
                if (!data.nodes.some((node) => node.id === historicBuildNode.id)) {
                    data.nodes.push(historicBuildNode);
                }

                data.links.push({
                    source: historicBuildNode.id,
                    target: pipelineNode.id,
                    label: historic_build.sourceBranch,
                    value: 2,
                });
            });
        });



        // CROSS PROJECT Resources

        // POOLS: Each pool is an ORG-level constructionl. They have a list of queues associated (PROJECT-level construction)
        // ENDPOINTS: Endpoints exist across projects, same ID, different attributes.  
        // REPOSITORIES have added complexity as access to them is controlled in multiple ways
        // 1. Project Settings (project setting sets the System.AccessToken scope)
        // 2. If project settings are not set, the Build Service Account may have access to the repo (RBAC)
        // 3. Pipeline permissions (the pipeline itself needs to be given access to the repository if cross project)
        // 4. User permissions (users can use their own PATs to access the repository) (RBAC)

        // Other RESOURCES, PIPELINE DEFINITIONS and BUILDS are project specific 

        // Get dynamic dimensions from container
        const containerElement = containerRef.current;
        const width = containerElement ? containerElement.clientWidth : 1500;
        const height = containerElement ? containerElement.clientHeight : 1500;

        // Update dimensions state
        setDimensions({ width, height });

        // Create SVG container
        const svg = d3.select(svgRef.current)
            .attr("id", "d3jsGraphSvg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .style("width", "100%")
            .style("height", "100%");



        const zoom = d3.zoom().on("zoom", zoomed);
        svg.call(zoom);
        const g = svg.append("g");

        // Restore previous zoom transform if it exists
        if (zoomTransformRef.current) {
            svg.call(zoom.transform, zoomTransformRef.current);
        }

        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        const projectCenters = {};
        const projectCenterHelper = new Set(nodes.map(node => node.projects ? node.projects[0] : "Project Undefined")); // Assuming each node has at least one project

        let i = 0;
        projectCenterHelper.forEach(project => {
            projectCenters[project] = { x: (i % 3) * (width / 20), y: Math.floor(i / 20) * (height / 3) };
            i++;
        });

        function projectForce(alpha) {
            nodes.forEach(node => {
                // console.log("FORCE node.projects[0].name", node.projects[0].name);
                // console.log("FORCE node.projects[0].name", projectCenters);
                // const center = projectCenters[node.projects[0].name];
                // node.vx += (center.x - node.x) * alpha;
                // node.vy += (center.y - node.y) * alpha;
            });
        }

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("project", projectForce(200)) // Custom force for grouping
            .force("x", d3.forceX())
            .force("y", d3.forceY((d) => {
                switch (d.group) {
                    case "environment_resource":
                        return -170;
                    case "logic_container":
                        return -100;
                    case "project":
                        return 50;
                    case "protected_resource":
                        return 0;
                    case "queue":
                        return 50;
                    case "protected_resource_project":
                        return 75;
                    case "pipeline":
                        return 100;
                    case "potential_build":
                        return 150;
                    default:
                        return 200;
                }
            }).strength(1));

        function createLinks(g, links, nodes) {

            // Create a group for links and labels
            const linkGroup = g.append("g").attr("class", "links");

            // Append the lines for the links
            const linkLines = linkGroup
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", (d) => Math.sqrt(d.value));

            return { linkLines };
        }

        // Usage
        const { linkLines } = createLinks(g, links, nodes);

        const node = g.append("g")
            .attr("stroke", nodeStyles.stroke)
            .attr("stroke-width", nodeStyles.strokeWidth)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", nodeStyles.radius)
            .attr("fill", nodeStyles.fill)
            .attr("stroke", d => {
                // Highlight nodes with alerts (cicd_sast with results)
                if (Array.isArray(d.cicd_sast) && d.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0)) {
                    return "red";
                }
                return nodeStyles.strokeColor;
            })
            .attr("stroke-width", d => {
                if (Array.isArray(d.cicd_sast) && d.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0)) {
                    return 2;
                }
                return nodeStyles.strokeWidthAlert;
            })
            .attr("stroke-dasharray", d => nodeStyles.strokeDasharray(d))
            .attr("opacity", nodeStyles.opacity)
            .on("mouseover", (event, d) => {
                // Highlight hovered node
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr("r", nodeStyles.hoverRadius)
                    .attr("opacity", nodeStyles.hoverOpacity);

                // Dim all other nodes
                node.transition()
                    .duration(200)
                    .attr("opacity", n => (n === d ? nodeStyles.hoverOpacity : nodeStyles.nonHoverOpacity));

                // Show label for hovered node
                if (d.type !== "project") {
                    labels.filter(l => l.id === d.id)
                        .text(d => d.label)
                        .style("opacity", 1);
                }
            })
            .on("mouseout", (event, d) => {
                // Reset opacity for all nodes
                node.transition()
                    .duration(200)
                    .attr("opacity", 1);
                // Hide label for hovered node
                if (d.type !== "project") {
                    labels.filter(l => l.id === d.id)
                        .text(d => d.label ? truncateLabel(d.label) : "")
                        .style("opacity", d => d.type !== "step" ? 1 : 0);
                }
            })
            .on("click", (event, d) => {
                setSelectedNode(d);
                setDialogOpen(true);
                setHighlightedNode(d.id);
                setSelectedTab("General Information"); // Always reset to General Information tab
                // shiftGraphLeft(-width / 3)
            });

        const truncateLabel = (text, maxLength = 10) =>
            text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

        const labels = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("dy", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "17px") // doesnt seem to do anything
            // .attr("font-weight", "bold")
            .attr("fill", "#000")
            .attr("data-full-label", d => d.label)
            .text(d => d.label ? d.type === "project" ? d.label : truncateLabel(d.label) : "")
            .style("opacity", d => d.type === "step" ? 0 : 1);


        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        simulation.on("tick", () => {
            linkLines
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            // linkLabels
            //     .attr("x", (d) => (d.source.x + d.target.x) / 2) // Midpoint X
            //     .attr("y", (d) => (d.source.y + d.target.y) / 2); // Midpoint Y
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            labels
                .attr("font-size", 5)
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("dy", -15);
        });

        function zoomed(event) {
            g.attr("transform", event.transform);  // Apply the zoom transformation to the group
            zoomTransformRef.current = event.transform; // Save the current transform
        }

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // // Create legend
        // const legend = svg.append("g")
        //     .attr("class", "legend")
        //     .attr("transform", `translate(-650,-111)`);

        // const groupLabels = {
        //     "protected_resource": "CI/CD Resource",
        //     "pipeline": "Pipeline Definition",
        //     "historic_build": "Pipeline Execution",
        //     "potential_build": "Potential Pipeline Execution",
        //     "logic_container": "Logic Container"
        // };

        // const groups = ["logic_container", "protected_resource", "pipeline", "historic_build", "potential_build"];
        // groups.forEach((group, index) => {
        //     const legendRow = legend.append("g")
        //         .attr("transform", `translate(0, ${index * 25})`);

        //     legendRow.append("circle")
        //         .attr("r", 10)
        //         .attr("fill", resourceTypeStyle[group].fill)
        //         .attr("stroke", resourceTypeStyle[group].stroke)
        //         .attr("stroke-width", resourceTypeStyle[group].strokeWidth)
        //         .attr("stroke-dasharray", resourceTypeStyle[group]?.dashed ? "4,2" : "none");

        //     legendRow.append("text")
        //         .attr("x", 20)
        //         .attr("y", 5)
        //         .attr("font-size", "18px")
        //         .attr("text-anchor", "start")
        //         .style("text-transform", "capitalize")
        //         .text(groupLabels[group] || group); // Use the mapped label or the original group name if not found
        // });

        // Clean up simulation on unmount
        return () => {
            simulation.stop();
        };
    }, [filteredProtectedResources, pipelines, builds, loading]); // Re-run effect if resourceType changes

    useEffect(() => {
        d3.select(svgRef.current).selectAll("circle")
            .attr("r", function (d) {
                if (!d) return 3; // Default radius if d is undefined
                if (highlightedNode === null) {
                    return resourceTypeStyle[d.group]?.radius || 3;
                }
                return d.id === highlightedNode ? 12 : resourceTypeStyle[d.group]?.radius || 3;
            });
    }, [highlightedNode]);

    // Handle container resize
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleClose = () => {
        setDialogOpen(false);
        setHighlightedNode(null);
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const filteredPermissions = selectedNode?.pipelineresources?.filter(permission => {
        if (!permission) return false; // Ignore null elements
        if (permission.Type !== 'queue') return true;
        return showAllQueues || permission.Authorized;
    });

    const renderHighlightedYaml = (yaml, failedChecks) => {
        const lines = yaml.split('\n');
        const failedLines = new Set(failedChecks.flatMap(check => check.code_block.map(block => block[0])));

        return lines.map((line, index) => {
            const lineNumber = index + 1;
            if (failedLines.has(lineNumber)) {
                return `<span style="color: red;">${line}</span>`;
            }
            return line;
        }).join('\n');
    };

    function formatCheckTypeName(str) {
        if (!str) return '';

        if (str === "evaluatebranchProtection") {
            str = "evaluateBranchProtection";
        }
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2')       // insert space before capital letters
            .replace(/^./, s => s.toUpperCase());      // capitalize first letter
    }

    // function renderHighlightedYaml(yaml, highlights = []) {
    //     const lines = yaml.split('\n');
    //     return lines.map((line, i) => {
    //         const isHighlighted = highlights.some(h => line.includes(h));
    //         return (
    //             <div key={i} style={{ backgroundColor: isHighlighted ? '#ffeeee' : 'transparent' }}>
    //                 {line}
    //             </div>
    //         );
    //     });
    // }

    function getLogicContainersForResource(resourceId, logicContainers) {
        if (resourceTypeSelected === "pool_merged") {
            resourceId = parseInt(resourceId.replace('pool_merged_', ''));
        } else {
            resourceId = resourceId.split('_')[1];
        }
        
        // Get current platform source ID - you may need to pass this as a prop
        const platformSourceId = selectedPlatformSource?.id;
        
        const filtered = logicContainers.filter(container => {
            // New format: resources scoped per platform source
            if (container.resources && typeof container.resources === 'object' && !Array.isArray(container.resources)) {
                if (platformSourceId && container.resources[platformSourceId]) {
                    return container.resources[platformSourceId].map(String).includes(String(resourceId));
                }
                return false;
            }
            // Old format: simple array (backwards compatibility)
            if (Array.isArray(container.resources)) {
                return container.resources.map(String).includes(String(resourceId));
            }
            return false;
        });

        return filtered;
    }

    const tabContentMapping = selectedNode ? {
        "General Information": (
            <Box>
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Basic Information
                    </Typography>
                    {selectedNode?.group === "protected_resource" && (
                        <ListItem sx={{ display: 'flex', justifyContent: "right" }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: '8px',
                                    width: '100%',
                                    mb: 1,
                                }}
                            >
                                {getLogicContainersForResource(selectedNode.id, logic_containers).length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, width: '100%', fontSize: '0.9em' }}>
                                        This resource is not associated with any logic container. <b>Tip:</b> Use the Resource Table to associate it with a logic container.
                                    </Typography>
                                ) : (
                                    getLogicContainersForResource(selectedNode.id, logic_containers).map((logic_container) => (
                                        <Box
                                            key={logic_container.id}
                                            sx={{
                                                backgroundColor: logic_container.color,
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8em',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {logic_container.name}
                                        </Box>
                                    ))
                                )}
                            </Box>

                        </ListItem>

                    )}
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {selectedNode?.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Description:</strong> {selectedNode?.description}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Type:</strong> {selectedNode?.type}
                    </Typography>
                    {(selectedNode?.group === "queue" || (selectedNode?.group === "protected_resource" && selectedNode?.type !== "Pool")) && (
                        <>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Parent Pool:</strong> {selectedNode?.parentPoolName}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Pool Type:</strong> {selectedNode?.isHosted ? "Microsoft-hosted" : "Self-hosted"}
                            </Typography>
                            {selectedNode?.url && (
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    <strong>URL:</strong>{" "}
                                    <Link href={selectedNode.url} target="_blank" rel="noopener">
                                        {selectedNode.url}
                                    </Link>
                                </Typography>
                            )}
                            {selectedNode?.group === "protected_resource" && selectedNode?.type === "Pool" && (
                                <Typography variant="body2" sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, fontStyle: 'italic' }}>
                                    <strong>Note:</strong> Approvals and checks for pools are applied at the project-level instance (queue) rather than at the organization-level pool.
                                </Typography>
                            )}
                            {(selectedNode?.group === "protected_resource" || selectedNode?.group === "queue") && selectedNode?.checks && selectedNode?.type !== "Pool" && (
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    <strong>Protection Status:</strong>
                                    {Object.keys(selectedNode.checks).length > 0 ? (
                                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                            <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                                            <Typography component="span">
                                                {Object.keys(selectedNode.checks).length} check type{Object.keys(selectedNode.checks).length !== 1 ? 's' : ''} configured
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                                            <Typography component="span">
                                                No checks configured
                                            </Typography>
                                        </Box>
                                    )}
                                </Typography>
                            )}
                            {selectedNode?.pipelinepermissions && selectedNode.pipelinepermissions.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 1, color: '#3C4EC3' }}>
                                        Pipeline Permissions ({selectedNode.pipelinepermissions.length})
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Pipelines authorized to use this queue:
                                    </Typography>
                                    <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                                        {selectedNode.pipelinepermissions.map((pipelineId, idx) => {
                                            const pipeline = pipelines?.find(p => p.id === pipelineId || p.k_key === pipelineId);
                                            return (
                                                <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                                    • {pipeline ? pipeline.name : `Pipeline ID: ${pipelineId}`}
                                                </Typography>
                                            );
                                        })}
                                    </Box>
                                </>
                            )}
                        </>
                    )}

                </Box>
                <List dense>
                    {selectedNode?.group === "pipeline" && (
                        <Box>
                            {selectedNode?.group === "pipeline" && selectedNode?.resourcepermissions ? (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="h6" sx={{ mt: 2, mb: 1, ml: 2, color: '#ee4266' }}>
                                        Pipeline Resource Permissions
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, ml: 2 }}>
                                        {Object.entries(selectedNode.resourcepermissions).map(([resourceType, resourceIds]) => {
                                            if (resourceType === 'queue') return null;

                                            const formatKey = (key) => {
                                                switch (key.toLowerCase()) {
                                                    case 'repository':
                                                        return 'Repositories';
                                                    case 'endpoint':
                                                        return 'Service Connections';
                                                    case 'pool_merged':
                                                        return 'Pools';
                                                    case 'variablegroup':
                                                        return 'Variable Groups';
                                                    case 'securefile':
                                                        return 'Secure Files';
                                                    default:
                                                        return key;
                                                }
                                            };

                                            return (
                                                <Box
                                                    key={resourceType}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        minWidth: '100px',
                                                        width: '200px',
                                                        maxHeight: '300px',
                                                        overflow: 'auto',
                                                        flex: '1 1 auto',
                                                        p: 2,
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 1,
                                                        backgroundColor: '#fafafa'
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                        <strong>{formatKey(resourceType)}:</strong>
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                        <ResourceSummary
                                                            selectedPlatformSourceId={selectedPlatformSource?.id}
                                                            resourceType={resourceType}
                                                            resourceIds={resourceIds}
                                                            getProtectedResourcesByOrgTypeAndIdsSummary={getProtectedResourcesByOrgTypeAndIdsSummary}
                                                            setResourceTypeSelected={setResourceTypeSelected}
                                                            resourceTypeSelected={resourceTypeSelected}
                                                            formatKey={formatKey}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                                    No resource permissions available for this pipeline.
                                </Typography>
                            )}
                        </Box>)
                    }

                    {selectedNode?.group === "logic_container" && (
                        <ListItem>
                            <ListItem>
                                <ListItemText primary="Criticality" secondary={selectedNode?.criticality} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Is Default" secondary={selectedNode?.is_default ? "Yes" : "No"} />
                            </ListItem>
                        </ListItem>
                    )}

                    {selectedNode?.yaml && (
                        <ListItem>
                            <ListItemText
                                primary="YAML"
                                secondary={
                                    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {renderHighlightedYaml(selectedNode.yaml, selectedNode.cicd_sast?.failed_checks_summary || [])}
                                    </div>
                                }
                            />
                        </ListItem>
                    )}
                </List>

                <Box>

                    {selectedNode?.checks && Object.keys(selectedNode.checks).length > 0 ? (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h5" sx={{ mb: 2, ml: 2, color: '#0ead69' }}>
                                Protection Checks
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, ml: 2, mr: 2 }}>
                                {Object.entries(selectedNode.checks).map(([checkType, checks]) => (
                                    <Box
                                        key={checkType}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            width: '250px',
                                            height: '200px',
                                            overflow: 'auto',
                                            flex: '0 0 250px',
                                            p: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            backgroundColor: '#fafafa'
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                            {formatCheckTypeName(checkType)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {checks.map((check, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        pb: 2,
                                                        borderBottom: index < checks.length - 1 ? '1px solid #e0e0e0' : 'none'
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        <Link href={isValidUrl(check.url) ? check.url : '#'} target="_blank" rel="noopener">
                                                            {check.settings?.displayName || check.type?.name || "Unnamed Check"}
                                                        </Link>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                                        <strong>Created:</strong> {check.createdBy?.displayName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                                        <strong>Timeout:</strong> {check.timeout} min
                                                    </Typography>
                                                    {check.settings?.approvers && (
                                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                                            <strong>Approvers:</strong> {check.settings.approvers.map(a => a.displayName).join(', ')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : (
                        selectedNode?.group === "protected_resource" && selectedNode?.type !== "Pool" && (
                            <Typography variant="body2" sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, fontStyle: 'italic' }}>
                                Add an approval and check condition that applies everytime this resource is accessed by a pipeline.
                            </Typography>
                        )
                    )}
                </Box>

            </Box>
        ),
        "Pipeline Executions": <div>Pipeline Executions Content</div>,
        "Resources Used": <div>Resources Used Content</div>,
        "Results": <div>Results Content</div>,
        "Logs": (
            <Box>
                {selectedNode?.logs ? (
                    <List>
                        <ListItem>
                            <ListItemText primary="Log ID" secondary={selectedNode.logs.id} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Log Type" secondary={selectedNode.logs.type} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Log URL" secondary={
                                <Link href={isValidUrl(selectedNode.logs.url) ? selectedNode.logs.url : '#'} target="_blank" rel="noopener">
                                    {selectedNode.logs.url}
                                </Link>
                            } />
                        </ListItem>
                    </List>
                ) : (
                    <Typography>No logs available</Typography>
                )}
            </Box>
        ),
        "Alerts": (
            <Box>
                {selectedNode?.cicd_sast?.length > 0 ? (
                    selectedNode.cicd_sast.map((alert, idx) => (
                        <Accordion key={idx} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                                    <Typography sx={{ userSelect: "text", mr: 2 }} variant="h6">{alert.engine}</Typography>
                                    <Typography sx={{ userSelect: "text", mr: 2 }} variant="body2" color="text.secondary">
                                        {/* Scope: {alert.scope === "potential_pipeline_execution_yaml" ? "Potential Execution" : "Execution"} */}
                                    </Typography>
                                    <Chip
                                        label={`${alert.results.length} result${alert.results.length !== 1 ? "s" : ""}`}
                                        color={alert.results.length > 0 ? "error" : "success"}
                                        size="small"
                                        sx={{ mt: 1, alignSelf: "center" }}
                                    />
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails>
                                {alert.results.length > 0 ? (
                                    alert.results.map((result, rIdx) => (
                                        <Box
                                            key={rIdx}
                                            sx={{
                                                mb: 2,
                                                p: 2,
                                                border: "1px solid #eee",
                                                borderRadius: 2,
                                                backgroundColor: "#fafafa",
                                            }}
                                        >
                                            <Typography variant="body2">
                                                <strong>Source:</strong> {" "}
                                                <Link href={result.source} target="_blank" rel="noopener">
                                                    {result.source}
                                                </Link>
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Match:</strong>{" "}
                                                <span style={{ color: "red", fontWeight: 600 }}>{result.match}</span>
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Pattern:</strong> {result.pattern}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Start:</strong> {result.start}, <strong>End:</strong> {result.end}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ThumbUpAltIcon sx={{ color: 'success.main', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            No alerts triggered.
                                        </Typography>
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No scan results available.
                    </Typography>
                )}
            </Box>
        ),
        "YAML": <>{selectedNode?.yaml && (
            <ListItem>
                <ListItemText
                    primary="YAML"
                    secondary={
                        <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {renderHighlightedYaml(selectedNode.yaml, selectedNode.cicd_sast?.failed_checks_summary || [])}
                        </div>
                    }
                />
            </ListItem>
        )}</>
    } : {};

    const renderTabs = (selectedNode) => {
        if (!selectedNode) return null;

        const tabs = [];
        let hasAlerts = Array.isArray(selectedNode?.cicd_sast) && selectedNode.cicd_sast.length > 0;
        let hasAlertResults = hasAlerts && selectedNode.cicd_sast.some(alert => Array.isArray(alert.results) && alert.results.length > 0);

        switch (selectedNode.group) {
            case "protected_resource":
                tabs.push("General Information");
                break;
            case "protected_resource_project":
                tabs.push("General Information");
                break;
            case "queue":
                tabs.push("General Information");
                break;
            case "pipeline":
                tabs.push("General Information");
                break;
            case "historic_build":
                tabs.push("General Information", "Alerts");
                break;
            case "potential_build":
                tabs.push("General Information", "Alerts");
                break;
            default:
                return null;
        }

        return (
            <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="resource tabs"
            >
                {tabs.map((label, index) => {
                    if (label === "Alerts") {
                        return (
                            <Tab
                                key={index}
                                label={label}
                                value={label}
                                sx={hasAlertResults ? { color: 'red' } : {}}
                                disabled={!hasAlerts}
                            />
                        );
                    }
                    return <Tab key={index} label={label} value={label} />;
                })}
            </Tabs>
        );
    };

    const renderTabContent = (selectedNode) => {
        if (!selectedNode) return null;
        return tabContentMapping[selectedTab];
    };

    const renderDialogContent = () => (
        <Dialog
            open={dialogOpen}
            onClose={handleClose}
            PaperProps={{
                style: {
                    margin: 0,
                    bottom: 0,
                    width: '70%',
                    maxWidth: 'none',
                    boxShadow: 'none',
                },
            }}
        >
            <DialogTitle>
                {selectedNode && (
                    <>
                        <Typography variant="caption" component="div">
                            {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1).toLowerCase()} @{" "}
                            {Array.isArray(selectedNode?.projects) && selectedNode.projects.length > 0
                                ? selectedNode.projects.map(project =>
                                    typeof project === 'object' && project.url
                                        ? (
                                            <Link
                                                key={project.id || project.name}
                                                href={project.url.replace('/_apis/projects', '')}
                                                target="_blank"
                                                rel="noopener"
                                                sx={{ textDecoration: 'underline', color: 'inherit', mx: 0.5 }}
                                            >
                                                {project.name}
                                            </Link>
                                        )
                                        : (typeof project === 'object' ? project.name : project)
                                ).reduce((prev, curr) => prev === null ? [curr] : [...prev, ', ', curr], null)
                                : (Array.isArray(selectedNode?.projects) && selectedNode.projects.length === 0)
                                    ? "Resource is not shared with any projects"
                                    : selectedNode?.projects || "Resource is not shared with any projects"
                            }
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ mt: 2 }}>
                            {selectedNode.name}
                        </Typography>
                    </>
                )}
            </DialogTitle>
            <DialogContent>
                {renderTabs(selectedNode)}
                {renderTabContent(selectedNode)}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    const [showLegend, setShowLegend] = useState(true);

    const handleDownloadSVG = () => {
        const svg = d3.select("#d3jsGraphSvg");
        if (svg.empty()) {
            console.error("SVG element not found");
            return;
        }

        // Get the SVG HTML content
        const svgHtml = svg.node().outerHTML;

        // Create a blob with the SVG content
        const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'resource-graph.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up the URL
        URL.revokeObjectURL(url);
    };

    const handleDownloadPNG = () => {
        const svg = d3.select("#d3jsGraphSvg");
        if (svg.empty()) {
            console.error("SVG element not found");
            return;
        }

        try {
            // Clone the SVG to avoid modifying the original
            const svgNode = svg.node().cloneNode(true);

            // Remove any problematic attributes that might cause CSP issues
            svgNode.removeAttribute('xmlns:xlink');

            // Ensure SVG has proper namespace
            svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Get SVG dimensions
            const bbox = svg.node().getBBox();
            const width = 1500;
            const height = 1500;

            // Create a clean SVG string with inline styles
            const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}">
    <style>
        circle { stroke-width: 1; }
        line { stroke: #999; stroke-opacity: 0.6; }
        text { font-family: Arial, sans-serif; font-size: 12px; fill: #000; }
    </style>
    ${svgNode.innerHTML}
</svg>`;

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 2;

            canvas.width = width * scale;
            canvas.height = height * scale;

            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create image
            const img = new Image();

            img.onload = () => {
                try {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const downloadLink = document.createElement('a');
                            downloadLink.href = URL.createObjectURL(blob);
                            downloadLink.download = 'resource-graph.png';
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                            URL.revokeObjectURL(downloadLink.href);
                        } else {
                            console.error("Failed to create blob from canvas");
                        }
                    }, 'image/png', 0.95);
                } catch (drawError) {
                    console.error("Error drawing to canvas:", drawError);
                }
            };

            img.onerror = (error) => {
                console.error("Error loading SVG image:", error);
                // Fallback: try with a data URL
                this.tryDataUrlFallback(svgString, width, height, scale);
            };

            // Use data URL instead of blob URL to avoid CSP issues
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            img.src = dataUrl;

        } catch (error) {
            console.error("Error in PNG conversion:", error);
            alert("PNG conversion failed. Please try downloading as SVG instead.");
        }
    };

    const tryDataUrlFallback = (svgString, width, height, scale) => {
        try {
            // Simplified SVG without complex styling
            const simplifiedSvg = svgString.replace(/<style>[\s\S]*?<\/style>/g, '');
            const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(simplifiedSvg);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width * scale;
            canvas.height = height * scale;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = 'resource-graph.png';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        URL.revokeObjectURL(downloadLink.href);
                    }
                }, 'image/png');
            };
            img.onerror = () => {
                console.error("Fallback method also failed");
                alert("PNG conversion failed. Your browser may have security restrictions. Please try downloading as SVG instead.");
            };
            img.src = dataUrl;
        } catch (fallbackError) {
            console.error("Fallback conversion failed:", fallbackError);
            alert("PNG conversion failed. Please try downloading as SVG instead.");
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            {loading ? (
                <CircularProgress size={80} style={{ color: 'purple' }} />
            ) :
                <Box sx={{ display: 'flex', height: '100%', width: '100%', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
                        <Button
                            size="small"
                            onClick={() => setShowLegend((prev) => !prev)}
                            sx={{ minWidth: 'auto', width: 'auto', padding: '2px 4px' }}
                        >
                            {showLegend ? <InfoIcon fontSize="small" /> : <InfoOutlineIcon fontSize="small" />}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon sx={{ fontSize: '14px' }} />}
                            onClick={handleDownloadSVG}
                            sx={{ minWidth: 'auto', width: 'auto', padding: '2px 6px', fontSize: '0.7rem' }}
                        >
                            SVG
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ImageIcon sx={{ fontSize: '14px' }} />}
                            onClick={handleDownloadPNG}
                            sx={{ minWidth: 'auto', width: 'auto', padding: '2px 6px', fontSize: '0.7rem' }}
                        >
                            PNG
                        </Button>
                    </Box>
                    <Box ref={containerRef} sx={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
                        <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }}></svg>
                    </Box>
                    {renderDialogContent()}
                    {showLegend && (
                        <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                            {legendItems.map(({ label, circleStyle }) => (
                                <Stack
                                    key={label}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ mb: 0 }}
                                >
                                    <Box
                                        sx={{
                                            width: 15,
                                            height: 15,
                                            borderRadius: '50%',
                                            ...circleStyle,
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{ textTransform: 'capitalize', fontSize: 12 }}
                                    >
                                        {label}
                                    </Typography>
                                </Stack>
                            ))}
                        </Box>
                    )}

                </Box>
            }
        </Box>
    );
};

D3JSResource.propTypes = {
    resourceType: PropTypes.string,
    projectFilter: PropTypes.object,
    resourceData: PropTypes.object
};

export default D3JSResource;
