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

const ReposTab = ({ projectId, repoLanguages }) => {

    const [repos, setRepos] = useState([]);
    const [reposTotal, setReposTotal] = useState(0);
    const [repoPage, setRepoPage] = useState(1);
    const [repoSearch, setRepoSearch] = useState('');
    const [repoMatchType, setRepoMatchType] = useState('contains');
    const [showDisabledRepos, setShowDisabledRepos] = useState(true);
    const [reposPerPage, setReposPerPage] = useState(10);
    const { selectedScan, fetchProjectRepositories } = useStore();

    // Fetch all repositories for this project once, handle pagination locally
    useEffect(() => {
        async function fetchRepos() {
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchProjectRepositories(selectedScan.id, projectId, null, null);
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
    }, [selectedScan, projectId, fetchProjectRepositories]);

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

    // Helper to render GitHub-style language breakdown for a repo
    function RepoLanguageBreakdown({ repoName, repoLanguages }) {
        if (!repoName || !Array.isArray(repoLanguages)) return null;
        const repoLang = repoLanguages.find(l => l.name === repoName);
        if (!repoLang || !Array.isArray(repoLang.languageBreakdown) || repoLang.languageBreakdown.length === 0) {
            return <Typography variant="caption" color="textSecondary">No language data</Typography>;
        }
        const total = repoLang.languageBreakdown.reduce((sum, lang) => sum + lang.languagePercentage, 0) || 1;
        return (
            <Box sx={{ mt: 1, mb: 0.5, outline: '1px solid #ddd', p: 1, borderRadius: 1, maxWidth: 300 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mb: 0.25, fontSize: '0.75rem' }}>Language Breakdown:</Typography>
                <Box sx={{
                    display: 'flex',
                    height: 6,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px #eee',
                    mb: 0.5,
                    minWidth: 60,
                    maxWidth: 300,
                }}>
                    {repoLang.languageBreakdown.map(lang => (
                        <Box
                            key={lang.name}
                            sx={{
                                width: `${(lang.languagePercentage / total) * 100}%`,
                                backgroundColor: resourceTypeStyle.languages?.[lang.name]?.fill || '#e0e0e0',
                                height: '100%',
                                transition: 'width 0.3s',
                            }}
                            title={`${lang.name}: ${lang.languagePercentage}%`}
                        />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', fontSize: '0.75rem' }}>
                    {repoLang.languageBreakdown.map(lang => {
                        const fontColor = resourceTypeStyle.languages?.[lang.name]?.fontColor || '#222';
                        return (
                            <Box key={lang.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: resourceTypeStyle.languages?.[lang.name]?.fill || '#e0e0e0',
                                    border: '1px solid #ccc',
                                    mr: 0.5
                                }} />
                                <Typography variant="caption" sx={{ color: fontColor, fontSize: '0.75rem' }}>{lang.name} ({lang.languagePercentage}%)</Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    }

    // Helper to get the primary language of a repository
    function getRepoPrimaryLanguage(repoName, languageAnalytics) {
        if (!repoName || !Array.isArray(languageAnalytics)) return null;
        const repoLang = languageAnalytics.find(l => l.name === repoName);
        if (!repoLang || !Array.isArray(repoLang.languageBreakdown) || repoLang.languageBreakdown.length === 0) return null;
        // Find the language with the highest percentage
        return repoLang.languageBreakdown.reduce((max, lang) => lang.languagePercentage > (max?.languagePercentage || 0) ? lang : max, null);
    }

    return (
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
                // Find the repo's primary language
                const primaryLang = repoLanguages
                    ? getRepoPrimaryLanguage(repo.name, repoLanguages)
                    : null;
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
                                {primaryLang && (
                                    <Chip
                                        label={primaryLang.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: resourceTypeStyle.languages?.[primaryLang.name]?.fill || '#e0e0e0',
                                            '& .MuiChip-label': {
                                                color: resourceTypeStyle.languages?.[primaryLang.name]?.fontColor || '#b90e0eff',
                                                fontWeight: 500,
                                                fontSize: '0.75rem',
                                            },
                                            height: 22,
                                        }}
                                    />
                                )}
                                {repo.isDisabled && (
                                    <Chip label="Disabled" color="error" size="small" />
                                )}
                                {repo.size === 0 && (
                                    <Chip label="Empty" color="warning" size="small" />
                                )}
                                {repo.isMaintenance && (
                                    <Chip label="In Maintenance" color="info" size="small" />
                                )}
                                {repo.stats?.state === 'active' && (
                                    <Chip label="Active" color="success" size="small" />
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
                            {repoLanguages && (
                                <RepoLanguageBreakdown
                                    repoName={repo.name}
                                    repoLanguages={repoLanguages}
                                />
                            )}
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
                    No repos found.
                </Typography>
            )}
        </Box>
    );
};


ReposTab.propTypes = {
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    repoLanguages: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            resultPhase: PropTypes.string,
            updatedTime: PropTypes.string,
            id: PropTypes.string,
            languageBreakdown: PropTypes.arrayOf(
                PropTypes.shape({
                    name: PropTypes.string.isRequired,
                    files: PropTypes.number,
                    filesPercentage: PropTypes.number,
                    bytes: PropTypes.number,
                    languagePercentage: PropTypes.number
                })
            )
        })
    )
};

export default ReposTab;
