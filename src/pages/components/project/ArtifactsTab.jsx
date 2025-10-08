/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

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


const ArtifactsTab = ({ projectId, projectName }) => {
    const [feeds, setFeeds] = useState([]);
    const [feedsTotal, setFeedsTotal] = useState(0);
    const [feedsPage, setFeedsPage] = useState(1);
    const [feedsSearch, setFeedsSearch] = useState('');
    const [feedsMatchType, setFeedsMatchType] = useState('contains');
    const [feedsPerPage, setFeedsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { selectedScan, fetchArtifactsFeeds } = useStore();

    useEffect(() => {
        async function fetchFeeds() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchArtifactsFeeds(selectedScan.id, projectId);
                    let allFeeds = [];
                    if (Array.isArray(result)) {
                        allFeeds = result;
                    } else if (result && Array.isArray(result.feeds)) {
                        allFeeds = result.feeds;
                    } else {
                        allFeeds = [];
                    }
                    setFeeds(allFeeds);
                    setFeedsTotal(allFeeds.length);
                } else {
                    setFeeds([]);
                    setFeedsTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch artifact feeds');
                setFeeds([]);
                setFeedsTotal(0);
            }
            setLoading(false);
        }
        fetchFeeds();
    }, [selectedScan, projectId, fetchArtifactsFeeds]);

    // Filtered feeds and local pagination
    const filteredFeeds = feedsSearch
        ? feeds.filter(f => {
            const name = f.name?.toLowerCase() || '';
            const search = feedsSearch.toLowerCase();
            switch (feedsMatchType) {
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
        : feeds;


    // Counter chips for feed types (from filteredFeeds)
    const typeCounts = filteredFeeds.reduce((acc, feed) => {
        const type = feed.k_feed_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});


    // Total packages across all filtered feeds
    const totalPackages = filteredFeeds.reduce((sum, feed) => sum + (feed.packagesCount || 0), 0);

    // Local pagination
    const pagedFeeds = filteredFeeds.slice((feedsPage - 1) * feedsPerPage, feedsPage * feedsPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setFeedsPage(1); }, [feedsSearch, feedsMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredFeeds.length;
                            const start = filteredTotal === 0 ? 0 : (feedsPage - 1) * feedsPerPage + 1;
                            const end = Math.min(feedsPage * feedsPerPage, filteredTotal);
                            return `Artifact Feeds (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for feeds */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={feedsMatchType}
                        onChange={e => setFeedsMatchType(e.target.value)}
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
                        placeholder="Search feeds"
                        value={feedsSearch}
                        onChange={e => setFeedsSearch(e.target.value)}
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
                    {Object.entries(typeCounts).map(([type, count]) => (
                        <Chip key={type} label={`${type}: ${count}`} color="secondary" size="small" />
                    ))}
                    <Chip label={`Total Packages: ${totalPackages}`} color="info" size="small" />
                </Box>
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading artifact feeds...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : feeds.length === 0 ? (
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
                    No artifact feeds found.
                </Typography>
            ) : pagedFeeds.length === 0 ? (
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
                    No artifact feeds found.
                </Typography>
            ) : (
                pagedFeeds.map((feed) => {
                    return (
                        <Accordion
                            key={feed.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{feed.name || 'N/A'}</Typography>
                                    {/* Feed type chip */}
                                    {feed.k_feed_type && (
                                        <Chip label={feed.k_feed_type} color="secondary" size="small" />
                                    )}
                                    {feed.isEnabled === false || feed.k_enabled === false ? (
                                        <Chip label="Disabled" color="error" size="small" />
                                    ) : (
                                        <Chip label="Enabled" color="primary" size="small" />
                                    )}
                                    <Chip label={`Packages: ${feed.packagesCount}`} color="info" size="small" />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {feed.id}<br />
                                    <strong>Name:</strong> {feed.name || 'N/A'}<br />
                                    <strong>Description:</strong> {feed.description || 'N/A'}<br />
                                    <strong>Type:</strong> {feed.k_feed_type || 'N/A'}<br />
                                    <strong>Upstream Enabled:</strong> {feed.upstreamEnabled ? 'Yes' : 'No'}<br />
                                    <strong>URL:</strong> {
                                        feed?.k_project?.self_attribute ? (
                                            <a href={feed.k_project.self_attribute} target="_blank" rel="noopener noreferrer">View Feed</a>
                                        ) : (
                                            selectedScan && feed.name ? (
                                                <a
                                                    href={`https://dev.azure.com/${selectedScan.id}/${projectName}/_artifacts/feed/${encodeURIComponent(feed.name)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >View Feed</a>
                                            ) : 'N/A'
                                        )
                                    }<br />
                                    <strong>Packages:</strong> {feed.packagesCount}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                <Button
                    onClick={() => setFeedsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={feedsPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {feedsPage} of {Math.max(1, Math.ceil(feedsTotal / feedsPerPage))}
                </Typography>
                <Button
                    onClick={() => setFeedsPage((prev) => prev + 1)}
                    disabled={feedsPage * feedsPerPage >= feedsTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
}

ArtifactsTab.propTypes = {
    projectId: PropTypes.string.isRequired,
    projectName: PropTypes.string.isRequired
};

export default ArtifactsTab;