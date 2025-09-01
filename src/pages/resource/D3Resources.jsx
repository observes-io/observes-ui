import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import PropTypes, { func } from 'prop-types';
import { Typography, Stack, TableContainer, FormControlLabel, Switch, Table, Paper, TableHead, TableRow, TableCell, TableBody, Tabs, Tab, Box, Dialog, DialogActions, DialogContent, Link, DialogTitle, Slide, Button, List, ListItem, ListItemText, ownerDocument } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
            backgroundColor: "#e25762",
            border: "2px solid #fff",
        },
    },
    {
        label: "Pipeline Definition",
        circleStyle: {
            backgroundColor: "#5669b3",
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

const D3JSResource = ({ selectedType, filteredProtectedResources, builds, pipelines, logic_containers, projects }) => {
    const svgRef = useRef();
    const [selectedNode, setSelectedNode] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [highlightedNode, setHighlightedNode] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedTab, setSelectedTab] = React.useState("General Information");
    const [showAllQueues, setShowAllQueues] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state

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

        // Clear previous SVG if it exists
        d3.select(svgRef.current).selectAll("*").remove();

        const data = {
            nodes: [],
            links: []
        };

        // Create Logic Container Nodes = Quite static, no issues
        Object.keys(logic_containers).forEach((key, index) => {
            const container = logic_containers[key];
            // console.log("Creating logic container node:", container);
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
                return logicContainers
                    .filter(container => Array.isArray(container.resources) && container.resources.includes(resourceId))
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
            } else {
                // console.log("No logic container found for resource", resourceNode);
            }


            // Connect to PROJECTS - maybe not - too confusing
            // protected_resource.k_projects.forEach(project => {
            // data.links.push({
            //     source: resourceNode.id,
            //     target: `project_${project.id}`,
            //     value: 2
            //     });
            // });

            // Connect to Pipeline Definitions direct - will be created next - trying to connect the reverse way
            // protected_resource.pipelinepermissions.forEach(pipelinedefinition_permissioned => {
            // data.links.push({
            //     source: resourceNode.id,
            //     target: `pipeline_${pipelinedefinition_permissioned}`,
            //     value: 2
            //     });
            // });

        });

        // CREATE project nodes

        // OPTIONS @TODO:
        //   [ ] Show ALL project nodes or 
        //   [ ] ONLY the SELECTED PROJECT
        //   [ ] Projects that are within a FILTERED resource
        //   [ ] Show projects by colouring
        //   [X] Not show at all!

        // projects.forEach(project => {
        //     let projectNode = {
        //         id: `project_${project.id}`,
        //         name: project.name,
        //         description: `Project ${project.description}`,
        //         group: "project",
        //         type: "Project",
        //         radius: 5,
        //         label: project.name,
        //         projects: [project.name],
        //     }
        //     data.nodes.push(projectNode);
        // })

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

                    if (data.nodes.some(node => node.id === resource_type + "_" + resourceid_permission)) {
                        data.links.push({
                            source: pipelineNode.id,
                            target: `${resource_type + "_" + resourceid_permission}`,
                            value: 1
                        });
                    }
                }

            }


            // CREATE BUILDS NODES
            // Preview/Future BUILDS
            const future_build_ids = pipeline_value.builds.preview;


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

        const width = 1500;
        const height = 1500;

        // Create SVG container
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .style("max-width", "100%")
            .style("height", "auto");

        svg.call(d3.zoom().on("zoom", zoomed));
        const g = svg.append("g");

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
                    case "logic_container":
                        return -100;
                    case "project":
                        return 50;
                    case "protected_resource":
                        return 0;
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

        const truncateLabel = (text, maxLength = 7) =>
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
        resourceId = resourceId.split('_')[1];
        const filtered = logicContainers
            .filter(container => Array.isArray(container.resources) && container.resources.includes(resourceId))

        return filtered;
    }

    const tabContentMapping = selectedNode ? {
        "General Information": (
            <Box>
                <List dense>
                    <ListItem>
                        <ListItem>
                            <ListItemText primary="Name" secondary={selectedNode?.name} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Description" secondary={selectedNode?.description} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Type" secondary={selectedNode?.type} />
                        </ListItem>
                    </ListItem>

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
                {selectedNode?.group === "protected_resource" && (
                    <ListItem sx={{ display: 'flex', justifyContent: "right" }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '8px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >

                            {getLogicContainersForResource(selectedNode.id, logic_containers).length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7, width: '100%', textAlign: 'center', fontSize: '0.9em' }}>
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
                                            textAlign: 'center',
                                        }}
                                    >
                                        {logic_container.name}
                                    </Box>
                                ))
                            )}
                        </Box>
                    </ListItem>
                )}

            </Box>
        ),
        "Checks and Approvals": (
            <Box>

                {selectedNode?.checks && (
                    <Box>
                        <Paper elevation={0} sx={{ padding: 2 }}>
                            {(() => {
                                const complianceMap = {
                                    "Protected": {
                                        icon: <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />,
                                        text: "Protected",
                                        color: 'success.main'
                                    },
                                    "Partially Protected": {
                                        icon: <WarningAmberIcon sx={{ color: 'warning.main', mr: 1 }} />,
                                        text: "Partially Protected",
                                        color: 'warning.main'
                                    },
                                    "Not Protected": {
                                        icon: <CancelIcon sx={{ color: 'error.main', mr: 1 }} />,
                                        text: "Not Protected",
                                        color: 'error.main'
                                    }
                                };
                                const complianceResult = evaluate_logic_container_policy(getLogicContainersForResource(selectedNode.id, logic_containers), selectedNode.checks)?.result;
                                const status = complianceMap[complianceResult] || {
                                    icon: null,
                                    text: "Unknown",
                                    color: 'text.primary'
                                };

                                // Align icon and text vertically
                                return (
                                    <Box display="flex" alignItems="center" sx={{ flexWrap: 'wrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {status.icon}
                                            <Typography variant="body1" color={status.color} sx={{ wordWrap: 'break-word', overflowWrap: 'break-word', ml: 1 }}>
                                                {status.text}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            }
                            )()}
                        </Paper>
                    </Box>
                )}

                {selectedNode?.checks && Object.keys(selectedNode.checks).length > 0 ? (
                    Object.entries(selectedNode.checks).map(([checkType, checks]) => (
                        <Box key={checkType} mb={2}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" sx={{ color: 'text.secondary', letterSpacing: 1, fontWeight: 500, wordWrap: 'break-word', overflowWrap: 'break-word' }} gutterBottom>
                                {formatCheckTypeName(checkType)}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {checks.slice(0, 3).map((check, index) => (
                                    <Paper
                                        key={index}
                                        elevation={1}
                                        sx={{
                                            padding: 2,
                                            width: '100%',
                                            maxWidth: '45%',
                                            minWidth: '200px',
                                            flex: '1 1 auto',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }} gutterBottom>
                                            <Link href={isValidUrl(check.url) ? check.url : '#'} target="_blank" rel="noopener">
                                                {check.settings?.displayName || check.type?.name || "Unnamed Check"}
                                            </Link>
                                        </Typography>

                                        <Typography variant="body2">
                                            <strong>Created By:</strong> {check.createdBy?.displayName} on {new Date(check.createdOn).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Modified By:</strong> {check.modifiedBy?.displayName} on {new Date(check.modifiedOn).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Timeout:</strong> {check.timeout} minutes
                                        </Typography>
                                        {check.settings?.inputs && (
                                            <Typography variant="body2">
                                                <strong>Inputs:</strong>
                                                <ul>
                                                    {Object.entries(check.settings.inputs).map(([key, value]) => (
                                                        <li key={key}><strong>{formatCheckTypeName(key)}:</strong> {value}</li>
                                                    ))}
                                                </ul>
                                            </Typography>
                                        )}
                                        {check.settings?.approvers && (
                                            <Typography variant="body2">
                                                <strong>Approvers:</strong>
                                                <ul>
                                                    {check.settings.approvers.map((approver, i) => (
                                                        <li key={i}>{approver.displayName}</li>
                                                    ))}
                                                </ul>
                                            </Typography>
                                        )}
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Typography variant="body1" color={status.color} sx={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        Add an approval and check condition that applies everytime this resource is accessed by a pipeline.
                    </Typography>
                )}
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
                tabs.push("General Information", "Checks and Approvals");
                break;
            case "protected_resource_project":
                tabs.push("General Information", "Checks and Approvals");
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
                            {Array.isArray(selectedNode?.projects)
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
                                : selectedNode?.projects
                            }
                        </Typography>
                        <Typography variant="h5" component="div">
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

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {loading ? (
                <CircularProgress size={80} style={{ color: 'purple' }} />
            ) :
                <Box sx={{ display: 'flex', height: '100%', border: '1px solid #ccc', borderRadius: '8px', padding: '16px', flexDirection: 'column' }}>
                    <svg ref={svgRef}></svg>
                    {renderDialogContent()}
                    <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                    </Box>
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
                    <Button
                        size="small"
                        onClick={() => setShowLegend((prev) => !prev)}
                        sx={{ mb: 1, width: 'fit-content', alignSelf: 'flex-end' }}
                    >
                        {showLegend ? <InfoIcon fontSize="small" /> : <InfoOutlineIcon fontSize="small" />}
                    </Button>
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
