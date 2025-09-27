import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {

    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Chip,
    Tooltip as MuiTooltip
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import resourceTypeStyle from '../../theme/resourceTypeStyle';
import dayjs from 'dayjs';
import useStore from '../../../state/stores/store';


const BuildsTab = ({ projectId }) => {
    const [builds, setBuilds] = useState([]);
    const [buildsTotal, setBuildsTotal] = useState(0);
    const [buildPage, setBuildPage] = useState(1);
    const [buildSearch, setBuildSearch] = useState('');
    const [buildMatchType, setBuildMatchType] = useState('contains');
    const [buildSearchField, setBuildSearchField] = useState('definition'); // 'definition', 'buildNumber', 'id'
    const [buildsPerPage, setBuildsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { selectedScan, fetchBuildsByOrgAndProject } = useStore();

    // Fetch all builds for this project once, handle pagination locally
    useEffect(() => {
        async function fetchBuilds() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchBuildsByOrgAndProject(selectedScan.id, projectId);
                    let allBuilds = [];
                    if (Array.isArray(result)) {
                        allBuilds = result;
                    } else if (result && Array.isArray(result.builds)) {
                        allBuilds = result.builds;
                    } else {
                        allBuilds = [];
                    }
                    setBuilds(allBuilds);
                    setBuildsTotal(allBuilds.length);
                } else {
                    setBuilds([]);
                    setBuildsTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch builds');
                setBuilds([]);
                setBuildsTotal(0);
            }
            setLoading(false);
        }
        fetchBuilds();
    }, [selectedScan, projectId, fetchBuildsByOrgAndProject]);

    // Filtered builds and local pagination
    const filteredBuilds = buildSearch
        ? builds.filter(b => {
            let fieldValue = '';
            if (buildSearchField === 'definition') {
                fieldValue = b.definition?.name?.toLowerCase() || '';
            } else if (buildSearchField === 'buildNumber') {
                fieldValue = b.buildNumber?.toLowerCase() || '';
            } else if (buildSearchField === 'id') {
                fieldValue = String(b.id || '');
            }
            const search = buildSearch.toLowerCase();
            switch (buildMatchType) {
                case 'exact':
                    return fieldValue === search;
                case 'starts':
                    return fieldValue.startsWith(search);
                case 'ends':
                    return fieldValue.endsWith(search);
                default:
                    return fieldValue.includes(search);
            }
        })
        : builds;

    // Chip counters for build status (from filteredBuilds)
    const succeededCount = filteredBuilds.filter(b => b.result === 'succeeded').length;
    const failedCount = filteredBuilds.filter(b => b.result === 'failed').length;
    const cancelledCount = filteredBuilds.filter(b => b.result === 'canceled' || b.result === 'cancelled').length;
    const otherCount = filteredBuilds.length - succeededCount - failedCount - cancelledCount;

    // Local pagination
    const pagedBuilds = filteredBuilds.slice((buildPage - 1) * buildsPerPage, buildPage * buildsPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setBuildPage(1); }, [buildSearch, buildMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredBuilds.length;
                            const start = filteredTotal === 0 ? 0 : (buildPage - 1) * buildsPerPage + 1;
                            const end = Math.min(buildPage * buildsPerPage, filteredTotal);
                            return `Builds (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for builds */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={buildSearchField}
                        onChange={e => setBuildSearchField(e.target.value)}
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
                        <MenuItem value="definition">Definition</MenuItem>
                        <MenuItem value="buildNumber">Build Number</MenuItem>
                        <MenuItem value="id">ID</MenuItem>
                    </Select>
                    <Select
                        size="small"
                        value={buildMatchType}
                        onChange={e => setBuildMatchType(e.target.value)}
                        sx={{
                            width: 120,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 'none',
                            ml: '-1px',
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
                        placeholder={`Search by ${buildSearchField}`}
                        value={buildSearch}
                        onChange={e => setBuildSearch(e.target.value)}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
                    <Chip label={`Succeeded: ${succeededCount}`} color="success" size="small" />
                    <Chip label={`Failed: ${failedCount}`} color="error" size="small" />
                    <Chip label={`Cancelled: ${cancelledCount}`} color="warning" size="small" />
                    <Chip label={`Other: ${otherCount}`} color="default" size="small" />
                </Box>
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading builds...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : builds.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No builds found.
                </Typography>
            ) : pagedBuilds.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No builds found.
                </Typography>
            ) : (
                pagedBuilds.map((build) => {
                    let statusLabel = build.result ? build.result.charAt(0).toUpperCase() + build.result.slice(1) : 'Unknown';
                    let statusColor = 'default';
                    if (build.result === 'succeeded') statusColor = 'success';
                    else if (build.result === 'failed') statusColor = 'error';
                    else if (build.result === 'canceled' || build.result === 'cancelled') statusColor = 'warning';
                    // Display name: definition.name, buildNumber, id
                    const displayName = `${build.definition?.name || 'N/A'} #${build.buildNumber || ''} (${build.id})`;
                    return (
                        <Accordion
                            key={build.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{displayName}</Typography>
                                    <Chip label={statusLabel} color={statusColor} size="small" />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {build.id}<br />
                                    <strong>Definition:</strong> {build.definition?.name || 'N/A'}<br />
                                    <strong>Build Number:</strong> {build.buildNumber || 'N/A'}<br />
                                    <strong>Status:</strong> {statusLabel}<br />
                                    <strong>Result:</strong> {build.result || 'N/A'}<br />
                                    <strong>Source Branch:</strong> {build.sourceBranch || 'N/A'}<br />
                                    <strong>Requested By:</strong> {build.requestedFor?.displayName || 'N/A'}<br />
                                    <strong>Queue Time:</strong> {build.queueTime ? dayjs(build.queueTime).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Start Time:</strong> {build.startTime ? dayjs(build.startTime).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Finish Time:</strong> {build.finishTime ? dayjs(build.finishTime).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>URL:</strong> {build._links?.web?.href ? (
                                        <a href={build._links.web.href} target="_blank" rel="noopener noreferrer">View Build</a>
                                    ) : 'N/A'}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                <Button
                    onClick={() => setBuildPage((prev) => Math.max(prev - 1, 1))}
                    disabled={buildPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {buildPage} of {Math.max(1, Math.ceil(buildsTotal / buildsPerPage))}
                </Typography>
                <Button
                    onClick={() => setBuildPage((prev) => prev + 1)}
                    disabled={buildPage * buildsPerPage >= buildsTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
};

BuildsTab.propTypes = {
    projectId: PropTypes.string.isRequired
};

export default BuildsTab;
