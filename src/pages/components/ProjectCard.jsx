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
    Tooltip as MuiTooltip
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
                    {console.log('buildSettings:', buildSettings)}
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
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);

    const [stats, setStats] = useState(null);
    const [repos, setRepos] = useState([]);
    const [reposTotal, setReposTotal] = useState(0);
    const [repoPage, setRepoPage] = useState(1);
    const [repoSearch, setRepoSearch] = useState('');
    const [repoMatchType, setRepoMatchType] = useState('contains');
    const [showDisabledRepos, setShowDisabledRepos] = useState(true);
    const [reposPerPage, setReposPerPage] = useState(10);
    const { fetchProjectStats, selectedScan, fetchProjectRepositories } = useStore();

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

    // Fetch all repositories for this project once, handle pagination locally
    useEffect(() => {
        async function fetchRepos() {
            try {
                if (selectedScan && selectedScan.id && project.id) {
                    const result = await fetchProjectRepositories(selectedScan.id, project.id, null, null);
                    const allRepos = Array.isArray(result) ? result : (result.repositories || []);
                    setRepos(allRepos);
                    setReposTotal(allRepos.length);
                } else {
                    setRepos([]);
                    setReposTotal(0);
                }
            } catch {
                setRepos([]);
                setReposTotal(0);
            }
        }
        fetchRepos();
    }, [selectedScan, project.id, fetchProjectRepositories]);

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

    // Filtered repos and local pagination
    const filteredRepos = repoSearch
        ? repos.filter(r => {
            if (!r.name) return false;
            if (!showDisabledRepos && r.isDisabled) return false;
            const name = r.name.toLowerCase();
            const search = repoSearch.toLowerCase();
            switch (repoMatchType) {
                case 'exact':
                    return name === search;
                case 'starts':
                    return name.startsWith(search);
                case 'ends':
                    return name.endsWith(search);
                default:
                    return name.includes(search);
            }
        })
        : repos.filter(r => showDisabledRepos || !r.isDisabled);

    // Local pagination
    const pagedRepos = filteredRepos.slice((repoPage - 1) * reposPerPage, repoPage * reposPerPage);

    // Repo state counts for chips (only for disabled repos, except active)
    const disabledCount = filteredRepos.filter(r => r.isDisabled).length;
    const emptyCount = filteredRepos.filter(r => r.size === 0).length;
    const staleCount = filteredRepos.filter(r => r.stats?.state === 'stale').length;
    const dormantCount = filteredRepos.filter(r => r.stats?.state === 'dormant').length;
    // Active count: only for disabled repos, but for chip counts show all active
    const activeCount = filteredRepos.filter(r => r.stats?.state === 'active').length;

    // Reset to page 1 if search changes
    useEffect(() => { setRepoPage(1); }, [repoSearch, repoMatchType, showDisabledRepos]);

    // Memoized chart data (must be before early return)
    const repoCount = stats?.resource_counts?.repository || 0;
    const serviceConnectionCount = stats?.resource_counts?.endpoint || 0;
    const variableGroupCount = stats?.resource_counts?.variablegroup || 0;
    const pipelineCount = stats?.resource_counts?.pipelines || 0;
    const buildCount = stats?.resource_counts?.builds || 0;
    const securefileCount = stats?.resource_counts?.securefile || 0;
    const queuesCount = stats?.resource_counts?.queue || 0;
    const commitCount = stats?.resource_counts?.commits || 0;
    const committerCount = stats?.resource_counts?.unique_committers || 0;

    const barChartData = useMemo(() => ({
        labels: ['Pipes', 'Builds', 'Repos', 'SvcConns', 'VarGroups', 'SecFile', 'Queue', 'Commits', 'Committers'],
        datasets: [
            {
                data: [pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, queuesCount, commitCount, committerCount],
                backgroundColor: [
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.pipeline.fill,
                    resourceTypeStyle.repo.fill,
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
                ],
                borderWidth: 1,
            },
        ],
    }), [pipelineCount, buildCount, repoCount, serviceConnectionCount, variableGroupCount, securefileCount, queuesCount, commitCount, committerCount]);

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
        const mid = Math.ceil(barChartData.labels.length / 2);
        const leftLabels = barChartData.labels.slice(0, mid);
        const rightLabels = barChartData.labels.slice(mid);
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 2 }}>
                <TableContainer sx={{ maxWidth: 180, margin: '0 auto', overflowX: 'visible' }}>
                    <Table size="small">
                        <TableBody>
                            {leftLabels.map((label, idx) => (
                                <TableRow key={label}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '50%' }}>{label}</TableCell>
                                    <TableCell>{barChartData.datasets[0].data[idx]}</TableCell>
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
                                    <TableCell>{barChartData.datasets[0].data[mid + idx]}</TableCell>
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
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                                {
                                    (() => {
                                        const filteredTotal = filteredRepos.length;
                                        const start = filteredTotal === 0 ? 0 : (repoPage - 1) * reposPerPage + 1;
                                        const end = Math.min(repoPage * reposPerPage, filteredTotal);
                                        return `Repositories (${start}-${end} of ${filteredTotal})`;
                                    })()
                                }
                            </Typography>
                            {/* InputGroup-like filter controls for repos */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                <Select
                                    size="small"
                                    value={repoMatchType}
                                    onChange={e => setRepoMatchType(e.target.value)}
                                    sx={{
                                        width: 120,
                                        borderTopRightRadius: 0,
                                        borderBottomRightRadius: 0,
                                        borderRight: 'none',
                                        '& .MuiOutlinedInput-root': {
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                        },
                                    }}
                                >
                                    <MenuItem value="contains">Contains</MenuItem>
                                    <MenuItem value="exact">Exact</MenuItem>
                                    <MenuItem value="starts">Starts with</MenuItem>
                                    <MenuItem value="ends">Ends with</MenuItem>
                                </Select>
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    placeholder="Search repos"
                                    value={repoSearch}
                                    onChange={e => setRepoSearch(e.target.value)}
                                    sx={{
                                        width: 200,
                                        borderTopLeftRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        borderLeft: 'none',
                                        ml: '-1px',
                                        '& .MuiOutlinedInput-root': {
                                            borderTopLeftRadius: 0,
                                            borderBottomLeftRadius: 0,
                                        },
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 1.5,
                                width: '100%',
                                maxWidth: 450,
                                mx: 'auto',
                            }}>
                                <Chip label={`Active: ${activeCount}`} color="success" size="small" />
                                <Chip label={`Stale: ${staleCount}`} color="info" size="small" />
                                <Chip label={`Dormant: ${dormantCount}`} color="default" size="small" />
                                <Chip label={`Empty: ${emptyCount}`} color="warning" size="small" />
                                <Chip label={`Disabled: ${disabledCount}`} color="error" size="small" />
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={showDisabledRepos}
                                            onChange={e => setShowDisabledRepos(e.target.checked)}
                                            size="small"
                                        />
                                    }
                                    label={<Typography variant="caption" color="textSecondary">Show disabled</Typography>}
                                    sx={{ ml: 1, mr: 0 }} />
                            </Box>
                            <MuiTooltip
                                title={
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <Chip label="Disabled" color="error" size="small" sx={{ mr: 1 }} />: Repository is disabled
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <Chip label="Empty" color="warning" size="small" sx={{ mr: 1 }} />: Repository size is 0 (empty)
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <Chip label="Stale" color="info" size="small" sx={{ mr: 1 }} />: Last commit was more than 3 months ago
                                        </Typography>
                                        <Typography variant="body2">
                                            <Chip label="Dormant" color="default" size="small" sx={{ mr: 1 }} />: Last commit was more than 1 year ago
                                        </Typography>
                                    </Box>
                                }
                                placement="right"
                            >
                                <HelpOutlineIcon color="action" sx={{ fontSize: 24, cursor: 'pointer', ml: 2 }} />
                            </MuiTooltip>
                        </Box>
                        {pagedRepos.map((repo) => {
                            let stateLabel = 'Enabled';
                            if (repo.isMaintenance) {
                                stateLabel = 'In Maintenance';
                            } else if (repo.isDisabled) {
                                stateLabel = 'Disabled';
                            }
                            return (
                                <Accordion
                                    key={repo.id}
                                    sx={{
                                        mt: 1,
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': { boxShadow: 3 },
                                    }}
                                >
                                    <AccordionSummary expandIcon="+">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography>{repo.name}</Typography>
                                            {repo.isDisabled && (
                                                <Chip label="Disabled" color="error" size="small" />
                                            )}
                                            {repo.size === 0 && (
                                                <Chip label="Empty" color="warning" size="small" />
                                            )}
                                            {/* Only show Dormant/Stale chips for disabled repos, using repo.stats.state */}
                                            {repo.stats?.state === 'stale' && (
                                                <Chip label="Stale" color="info" size="small" />
                                            )}
                                            {repo.stats?.state === 'dormant' && (
                                                <Chip label="Dormant" color="default" size="small" />
                                            )}
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Size:</strong> {(repo.size / 1024).toFixed(2)} KB<br />
                                            <strong>Default Branch:</strong> {repo.defaultBranch || 'N/A'}<br />
                                            <strong>State:</strong> {stateLabel}<br />
                                            <strong>First Commit:</strong> {repo.stats?.firstCommitDate ? formatDateWithDaysAgo(repo.stats.firstCommitDate) : 'N/A'}<br />
                                            <strong>Last Commit:</strong> {repo.stats?.lastCommitDate ? formatDateWithDaysAgo(repo.stats.lastCommitDate) : 'N/A'}<br />
                                            <strong>Age:</strong> {repo.stats?.age ? formatAge(repo.stats.age) : 'N/A'}<br />
                                            <strong>Number of Branches:</strong> {repo.stats?.branches ?? 'N/A'}<br />
                                            <strong>Total Pull Requests:</strong> {repo.stats?.pullRequests?.all ?? 'N/A'}<br />
                                            <strong>Active Pull Requests:</strong> {repo.stats?.pullRequests?.active ?? 'N/A'}<br />
                                            <strong>Total Commits (Last 90 days):</strong> {repo.stats?.committers?.totalCommits ?? 'N/A'}<br />
                                            <strong>Committers Count (Last 90 days):</strong> {repo.stats?.committers?.count ?? 'N/A'}<br />
                                            <strong>Unique Committers (Last 90 days):</strong> {repo.stats?.committers?.uniqueCommitters ?? 'N/A'}<br />
                                            <strong>URL:</strong> <a href={repo.webUrl} target="_blank" rel="noopener noreferrer">{repo.webUrl ? decodeURIComponent(repo.webUrl) : ''}</a>
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                        {/* Pagination Controls */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                            <Button
                                onClick={() => setRepoPage((prev) => Math.max(prev - 1, 1))}
                                disabled={repoPage === 1}
                                sx={{ mr: 1 }}
                            >
                                Previous
                            </Button>
                            <Typography variant="caption" sx={{ mx: 1 }}>
                                Page {repoPage} of {Math.max(1, Math.ceil(reposTotal / reposPerPage))}
                            </Typography>
                            <Button
                                onClick={() => setRepoPage((prev) => prev + 1)}
                                disabled={repoPage * reposPerPage >= reposTotal}
                                sx={{ mr: 1 }}
                            >
                                Next
                            </Button>
                        </Box>
                        {pagedRepos.length === 0 && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                No repositories found.
                            </Typography>
                        )}
                    </Box>
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
