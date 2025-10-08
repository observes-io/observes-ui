/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import PropTypes from 'prop-types';

import {
    Card,
    CardContent,
    Grid,
    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Chip,
    Tooltip as MuiTooltip,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import resourceTypeStyle from '../theme/resourceTypeStyle';
import { Pie, Bar } from 'react-chartjs-2';

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale, // Import the CategoryScale
    LinearScale,   // Import LinearScale for the y-axis
    BarElement     // Import BarElement for bar charts
} from 'chart.js';
import { useEffect, useRef, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import useStore from '../../state/stores/store';
import PipelinesTab from './project/PipelinesTab';
import ReposTab from './project/ReposTab';
import BuildsTab from './project/BuildsTab';
import ServiceConnectionsTab from './project/ServiceConnectionsTab';
import VariableGroupsTab from './project/VariableGroupsTab';
import SecureFilesTab from './project/SecureFilesTab';
import QueuesTab from './project/QueuesTab';
import ArtifactsTab from './project/ArtifactsTab';
import { TabContext, TabPanel } from '@mui/lab';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GeneralSettingsTable = ({ buildSettings }) => {
    const formatKey = (key) => {
        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first letter
    };

    return (
        <TableContainer style={{ maxHeight: 300, overflowY: 'auto', backgroundColor: 'white' }}>
            <Table size="small" stickyHeader >
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell align="center">Expected</TableCell>
                        <TableCell align="center">Found</TableCell>
                        <TableCell align="center">Compliance</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(buildSettings).map(([key, value]) => (
                        <TableRow key={key}>
                            <TableCell>{formatKey(key)}</TableCell>
                            <TableCell align="center">{value.expected?.toString()}</TableCell>
                            <TableCell align="center">{value.found?.toString()}</TableCell>
                            <TableCell align="center">
                                {typeof value === 'object' ? (
                                    value.expected === value.found ? (
                                        <CheckCircleIcon color="success" />
                                    ) : (
                                        <WarningIcon color="warning" />
                                    )
                                ) : (
                                    <ErrorOutlineIcon color="info" />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};


// Accept repos, repoPage, setRepoPage, reposTotal, repoSearch, setRepoSearch, repoMatchType, setRepoMatchType, showDisabledRepos, setShowDisabledRepos as props
const ProjectCard = ({
    project,
    showBarChart,
    setShowBarChart
}) => {
    const [activeTab, setActiveTab] = useState('repos');
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);
    const [stats, setStats] = useState(null);
    const { fetchProjectStats, selectedScan } = useStore();

    // Fetch stats for this project using selectedScan
    useEffect(() => {
        async function fetchStats() {
            try {
                if (selectedScan && selectedScan.id && project.id) {
                    const result = await fetchProjectStats(selectedScan.id, project.id);
                    setStats(result);
                } else {
                    setStats(null);
                }
            } catch {
                setStats(null);
            }
        }
        fetchStats();
    }, [selectedScan, project.id]);

    // Show more/less for project description
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Helper to format age in days to years, months, days
    const formatAge = (days) => {
        if (!days || isNaN(days)) return 'N/A';
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        const remDays = days % 365 % 30;
        let result = '';
        if (years > 0) result += `${years} year${years > 1 ? 's' : ''}, `;
        if (months > 0) result += `${months} month${months > 1 ? 's' : ''}, `;
        result += `${remDays} day${remDays !== 1 ? 's' : ''}`;
        return result;
    };

    // Helper to format date and show days ago
    const formatDateWithDaysAgo = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = dayjs(dateStr);
        if (!date.isValid()) return 'N/A';
        const today = dayjs();
        const daysAgo = today.diff(date, 'day');
        const formattedDate = date.format('YYYY-MM-DD');
        return <span title={`${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}>{formattedDate}</span>;
    };

    // Memoized chart data (must be before early return)
    const repoCount = stats?.resource_counts?.repository || 0;
    const serviceConnectionCount = stats?.resource_counts?.endpoint || 0;
    const variableGroupCount = stats?.resource_counts?.variablegroup || 0;
    const pipelineCount = stats?.resource_counts?.pipelines || 0;
    const environmentCount = stats?.resource_counts?.environment || 0;
    const buildCount = stats?.resource_counts?.builds || 0;
    const securefileCount = stats?.resource_counts?.securefile || 0;
    const queuesCount = stats?.resource_counts?.queue || 0;
    const commitCount = stats?.resource_counts?.commits || 0;
    const committerCount = stats?.resource_counts?.unique_committers || 0;
    const artifactFeedCount = stats?.resource_counts?.artifacts_feeds || 0;
    const artifactPackageCount = stats?.resource_counts?.artifacts_packages || 0;

    const leftTabs = [
        { label: "Repositories", value: "repos" },
        { label: "Artifacts", value: "artifacts" },
    ];

    const rightTabs = [
        { label: "Pipelines", value: "pipelines" },
        { label: "Builds", value: "builds" },
        { label: "Service Connections", value: "service-connections" },
        { label: "Variable Groups", value: "variable-groups" },
        { label: "Secure Files", value: "secure-files" },
        // { label: "Environments", value: "environments" },
        { label: "Queues", value: "queues" },
    ];

    const barChartData = useMemo(() => ({
        labels: ['Committers', 'ArtFeeds', 'Pipes', 'Builds', 'Repos', 'SvcConns', 'VarGroups', 'SecFile', 'Environments'],
        datasets: [
            {
                data: [committerCount, artifactFeedCount, pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, environmentCount],
                backgroundColor: [
                    resourceTypeStyle.committer.fill,
                    resourceTypeStyle.artifact_feed.fill,
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.build.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                ],
                borderColor: [
                    resourceTypeStyle.committer.fill,
                    resourceTypeStyle.artifact_feed.fill,
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.build.fill,
                    resourceTypeStyle.repo.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                ],
                borderWidth: 1,
            },
        ],
    }), [committerCount, artifactFeedCount, pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, environmentCount]);

    const tableData = useMemo(() => ({
        labels: ['Pipes', 'Builds', 'Repos', 'SvcConns', 'VarGroups', 'SecFile', 'Environments', 'Queue', 'Commits', 'Committers', 'ArtFeeds', 'ArtPackages'],
        datasets: [
            {
                data: [pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, environmentCount, queuesCount, commitCount, committerCount, artifactFeedCount, artifactPackageCount],
                backgroundColor: [
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.repo.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                    resourceTypeStyle.protected_resource.fill,
                ],
                borderColor: [
                    resourceTypeStyle.pipeline.stroke,
                    resourceTypeStyle.pipeline.stroke,
                    resourceTypeStyle.repo.stroke,
                    resourceTypeStyle.protected_resource.stroke,
                    resourceTypeStyle.protected_resource.stroke,
                    resourceTypeStyle.protected_resource.stroke,
                    resourceTypeStyle.protected_resource.stroke,
                    resourceTypeStyle.protected_resource.stroke,
                ],
                borderWidth: 1,
            },
        ],
    }), [pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, environmentCount, queuesCount, commitCount, committerCount, artifactFeedCount, artifactPackageCount]);

    const languageData = useMemo(() => (
        stats?.language_stats?.languageBreakdown && stats?.language_stats?.languageBreakdown.length > 0 ? {
            labels: stats.language_stats.languageBreakdown.map((lang) => lang.name),
            datasets: [{
                data: stats.language_stats.languageBreakdown.map((lang) => lang.languagePercentage),
                backgroundColor: stats.language_stats.languageBreakdown.map((lang) =>
                    resourceTypeStyle.languages[lang.name]?.fill || '#e0e0e0'
                ),
                borderColor: stats.language_stats.languageBreakdown.map((lang) =>
                    resourceTypeStyle.languages[lang.name]?.stroke || '#bdbdbd'
                ),
                borderWidth: 1,
            }]
        } : {
            labels: ['No Data'],
            datasets: [{
                data: [100],
                backgroundColor: ['#e0e0e0'],
                borderColor: ['#bdbdbd'],
                borderWidth: 1,
            }]
        }
    ), [stats]);

    // Chart cleanup (must be before early return)
    useEffect(() => {
        const ref = pieChartRef.current;
        return () => { if (ref) ref.destroy(); };
    }, [languageData]);
    useEffect(() => {
        const ref = barChartRef.current;
        return () => { if (ref) ref.destroy(); };
    }, [barChartData]);


    // Early return for loading
    if (!stats) {
        return (
            <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px', mb: 2 }}>
                <CardContent>
                    <Typography variant="body1" color="textSecondary">
                        Loading project stats...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const firstSeen = dayjs(project.FirstSeen);
    const lastSeen = dayjs(project.LastSeen);
    const formattedFirstSeen = firstSeen.isValid() ? firstSeen.format('YYYY-MM-DD') : 'N/A';
    const formattedLastSeen = lastSeen.isValid() ? lastSeen.format('YYYY-MM-DD') : 'N/A';

    // Table for bar chart data, split into two columns
    const BarChartTable = () => {
        const mid = Math.ceil(tableData.labels.length / 2);
        const leftLabels = tableData.labels.slice(0, mid);
        const rightLabels = tableData.labels.slice(mid);
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 2 }}>
                <TableContainer sx={{ maxWidth: 180, margin: '0 auto', overflowX: 'visible' }}>
                    <Table size="small">
                        <TableBody>
                            {leftLabels.map((label, idx) => (
                                <TableRow key={label}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '50%' }}>{label}</TableCell>
                                    <TableCell>{tableData.datasets[0].data[idx]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TableContainer sx={{ maxWidth: 180, margin: '0 auto', overflowX: 'visible' }}>
                    <Table size="small">
                        <TableBody>
                            {rightLabels.map((label, idx) => (
                                <TableRow key={label}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '50%' }}>{label}</TableCell>
                                    <TableCell>{tableData.datasets[0].data[mid + idx]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    return (
        <Grid sx={{ display: 'flex', width: '100%' }}>
            {/* Project Card wrapper */}
            <Card sx={{ display: 'flex', width: '100%', mb: 2, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.005)' } }}>
                <CardContent sx={{ width: '100%', mb: 2 }}>
                    {/* Row with Name / Description / First/Last seen | Counts of CICD Resources | Language Metrics */}
                    <Grid container spacing={2}>
                        {/* Name / Description / First/Last seen */}
                        <Grid sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex: 1,
                            flexDirection: 'column',
                            height: '100%',
                            maxWidth: '33%'
                        }}>
                            <Typography variant="caption" color="textSecondary" sx={{ alignItems: 'center', justifyContent: 'flex-start', display: 'flex', mb: 4, flexDirection: 'column' }}>
                                Project Info
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#3366cc', fontWeight: 'bold' }}>{project.name}</Typography>
                            {project.description && project.description.length > 50 ? (
                                <>
                                    <Typography variant="body2">
                                        {showFullDescription
                                            ? project.description
                                            : project.description.slice(0, 200) + '...'}
                                    </Typography>
                                    <Button
                                        size="small"
                                        sx={{ mt: 1, textTransform: 'none', minWidth: 0, p: 0 }}
                                        onClick={() => setShowFullDescription((prev) => !prev)}
                                    >
                                        {showFullDescription ? 'Show Less' : 'Show More'}
                                    </Button>
                                </>
                            ) : (
                                <Typography variant="body2">{project.description || 'No description available'}</Typography>
                            )}
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', fontWeight: 'bold' }}>
                                First Seen: {formattedFirstSeen}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                Last Seen: {formattedLastSeen}
                            </Typography>
                        </Grid>

                        <Grid sx={{
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 0,
                            height: '100%',
                            maxWidth: '33%',
                            flex: 1
                        }}>
                            <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'flex-top', mb: 1 }}>
                                CICD Resources
                            </Typography>
                            {/* Toggle for Bar/Table */}
                            <ToggleButtonGroup
                                value={showBarChart ? 'bar' : 'table'}
                                exclusive
                                onChange={(_, value) => { if (value !== null) setShowBarChart(value === 'bar'); }}
                                sx={{ mb: 1, height: 28 }}
                                size="small"
                            >
                                <ToggleButton value="bar" sx={{ px: 1, fontSize: 12, minWidth: 60 }}>Bar</ToggleButton>
                                <ToggleButton value="table" sx={{ px: 1, fontSize: 12, minWidth: 60 }}>Table</ToggleButton>
                            </ToggleButtonGroup>
                            {showBarChart ? (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 2,
                                        width: '100%',
                                        height: '220px',
                                        minHeight: '180px',
                                        maxHeight: '300px',
                                    }}
                                    style={{ maxWidth: '400px', maxHeight: '300px' }}
                                >
                                    <Bar data={barChartData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => `${context.label}: ${context.raw}`,
                                                },
                                            },
                                        },
                                        scales: {
                                            x: {
                                                grid: { display: false },
                                                ticks: { display: true, font: { size: 10 } },
                                            },
                                            y: {
                                                display: false,
                                                grid: { display: false },
                                                title: { display: false, text: 'Count' },
                                                beginAtZero: true,
                                            },
                                        },
                                    }} />
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 2,
                                        width: '100%',
                                        height: '220px',
                                        minHeight: '180px',
                                        maxHeight: '300px',
                                    }}
                                >
                                    <BarChartTable />
                                </Box>
                            )}
                        </Grid>

                        {/* Language Metrics */}
                        <Grid sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex: 1,
                            flexDirection: 'column',
                            maxWidth: '33%'
                        }}>
                            <Typography variant="caption" color="textSecondary" sx={{ mb: 2 }}>
                                Language Breakdown
                            </Typography>
                            {stats && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flex: 1 }}>
                                    <Pie
                                        data={languageData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                tooltip: {
                                                    callbacks: {
                                                        label: (context) => {
                                                            const lang = stats.language_stats.languageBreakdown?.find(l => l.name === context.label) || {};
                                                            return `${context.label}: ${context.raw}%\nFiles: ${lang.Files}, Size: ${lang.Bytes} bytes`;
                                                        }
                                                    }
                                                },
                                                legend: {
                                                    position: 'right'
                                                }
                                            }
                                        }}
                                        style={{ maxWidth: '300px', maxHeight: '200px' }}
                                    />
                                </Box>
                            )}

                        </Grid>
                    </Grid>

                    {/* Settings Section */}
                    {/* General Settings Section */}
                    {/* { console.log('projectStats:', projectStats) }
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                            General Settings
                        </Typography>
                        <GeneralSettingsTable buildSettings={project.general_settings?.build_settings} />
                    </Box> */}

                    {/* Repos */}
                    {/* {console.log('repoStart:', repoStart, 'repoEnd:', repoEnd, 'reposTotal:', reposTotal)} */}
                    {/* Tabs Section */}
                    <Divider sx={{ mt: 5 }} />
                    <TabContext value={activeTab}>
                        <Box sx={{ mt: 2, borderColor: 'divider' }}>
                            <Tabs
                                value={activeTab}
                                onChange={(e, val) => setActiveTab(val)}
                                aria-label="project tabs"
                                sx={{ display: "flex", width: "100%" }}
                            >
                                {leftTabs.map(({ label, value }) => (
                                    <Tab
                                        key={value}
                                        label={label}
                                        value={value}
                                        sx={{
                                            textTransform: "none",
                                            mx: 0.5,
                                            bgcolor: activeTab === value ? "action.hover" : "transparent",
                                            color: activeTab === value ? "white" : "inherit",
                                            "&:hover": { bgcolor: "action.hover" },
                                        }}
                                    />
                                ))}

                                {rightTabs.map(({ label, value }, idx) => (
                                    <Tab
                                        key={value}
                                        label={label}
                                        value={value}
                                        sx={{
                                            textTransform: "none",
                                            fontSize: 12,
                                            mx: 0.5,
                                            bgcolor: activeTab === value ? "action.hover" : "transparent",
                                            color: activeTab === value ? "white" : "inherit",
                                            "&:hover": { bgcolor: "action.hover" },
                                            ...(idx === 0 ? { marginLeft: 'auto' } : {}), // Add marginLeft: auto to the first of the right tabs
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                        <TabPanel value="repos">
                            <ReposTab projectId={project.id} repoLanguages={stats.language_stats.repositoryLanguageAnalytics} />
                        </TabPanel>
                        <TabPanel value="pipelines">
                            <PipelinesTab projectId={project.id} />
                        </TabPanel>
                        <TabPanel value="builds">
                            <BuildsTab projectId={project.id} />
                        </TabPanel>
                        <TabPanel value="service-connections">
                            <ServiceConnectionsTab projectId={project.id} />
                        </TabPanel>
                        <TabPanel value="variable-groups">
                            <VariableGroupsTab projectId={project.id} />
                        </TabPanel>
                        <TabPanel value="secure-files">
                            <SecureFilesTab projectId={project.id} />
                        </TabPanel>
                        <TabPanel value="queues">
                            <QueuesTab projectId={project.id} />
                        </TabPanel>
                        {/* <TabPanel value="environments">
                            <EnvironmentsTab projectId={project.id} />
                        </TabPanel> */}
                        <TabPanel value="artifacts">
                            <ArtifactsTab projectId={project.id} projectName={project.name} />
                        </TabPanel>
                    </TabContext>
                </CardContent>
            </Card>
        </Grid>
    );
};

// Remove repositories from propTypes
ProjectCard.propTypes = {
    project: PropTypes.object.isRequired,
    showBarChart: PropTypes.bool.isRequired,
    setShowBarChart: PropTypes.func.isRequired
};

export default ProjectCard;
