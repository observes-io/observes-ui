
/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import React from "react";
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    MenuItem,
    IconButton,
    Stack
} from "@mui/material";
import { useState, useEffect } from "react";
import ProjectCard from "./project/ProjectCard";
import CommitterCard from "./project/CommitterCard";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const PlatformDetailsAzureDevOpsCard = ({ plat_source, selectedPlatformSource, fetchCommitterStats, handleChange, projects, currentPage, setCurrentPage }) => {
    
    const platformType = 'AzureDevOps';
    // LOCAL STATE
    const [showProjects, setShowProjects] = useState(true);
    const [showCommitters, setShowCommitters] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState('committer'); // committer, author, pusher
    const [showProjectsTab, setShowProjectsTab] = useState(true);
    const [committersStats, setCommittersStats] = useState({});
    const [currentPageCommitters, setCurrentPageCommitters] = useState(1);
    const committerCardsPerPage = 20;
    const [showBarChart, setShowBarChart] = useState(true);
    const cardsPerPage = 3;


    // PAGINATION FOR PROJECTS - Manage internally
    // Filter projects first, then paginate
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(filterText.toLowerCase()) ||
        project.id.toLowerCase().includes(filterText.toLowerCase())
    );
    const totalFiltered = filteredProjects.length;
    const totalPages = Math.ceil(totalFiltered / cardsPerPage);
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * cardsPerPage,
        currentPage * cardsPerPage
    );


    // Toggle state for committers filtering
    const [usesBuildServiceAccount, setUsesBuildServiceAccount] = useState(undefined); // undefined means 'all'
    const [hasMultipleAuthors, setHasMultipleAuthors] = useState(undefined);
    const [hasMultiplePushers, setHasMultiplePushers] = useState(undefined);


    // Filter committersStats for committers tab
    const filteredCommitters = Array.isArray(committersStats)
        ? committersStats.filter(committer => {
            if (typeof usesBuildServiceAccount === 'number' && committer.usesBuildServiceAccount !== usesBuildServiceAccount) return false;
            if (typeof hasMultipleAuthors === 'number' && committer.hasMultipleAuthors !== hasMultipleAuthors) return false;
            if (typeof hasMultiplePushers === 'number' && committer.hasMultiplePushers !== hasMultiplePushers) return false;
            const filter = filterText.trim().toLowerCase();
            if (!filter) return true;
            if (filterType === 'committer') {
                return committer.committerEmail?.toLowerCase().includes(filter);
            } else if (filterType === 'author') {
                return Array.isArray(committer.authorEmails) && committer.authorEmails.some(email => email.toLowerCase().includes(filter));
            } else if (filterType === 'pusher') {
                return Array.isArray(committer.pusherEmails) && committer.pusherEmails.some(email => email.toLowerCase().includes(filter));
            }
            return true;
        })
        : [];
    const totalFilteredCommitters = filteredCommitters.length;
    const totalPagesCommitters = Math.max(1, Math.ceil(totalFilteredCommitters / committerCardsPerPage));



    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPageCommitters = () => {
        if (currentPageCommitters < totalPagesCommitters) setCurrentPageCommitters(currentPageCommitters + 1);
    };

    const handlePreviousPageCommitters = () => {
        if (currentPageCommitters > 1) setCurrentPageCommitters(currentPageCommitters - 1);
    };

    // Populate committersStats when committers tab is selected
    async function fetchStats() {
        try {
            const stats = await fetchCommitterStats(plat_source.id);
            if (stats) setCommittersStats(stats);
        } catch (err) {
            console.error('Error fetching committer stats:', err);
            setCommittersStats({});
        }
    }

    useEffect(() => {
        if (!plat_source || !plat_source.id || showProjectsTab) return;
        fetchStats();
    }, [plat_source, showProjectsTab, fetchCommitterStats]);

    // Clear committersStats when navigating away from committers tab
    useEffect(() => {
        if (showProjectsTab) {
            setCommittersStats({});
        }
    }, [showProjectsTab]);

    const handleTabChange = (_, newValue) => {
        setShowProjectsTab(newValue === "projects");
        setFilterText('');
    };



    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPageCommitters(1);
    }, [filterText]);

    // Reset to first page when platform source changes
    useEffect(() => {
        setCurrentPage(1);
    }, [plat_source?.id]);


    return (
        <Box sx={{ width: '100%', mb: 2, mt: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Tabs
                    value={showProjectsTab ? "projects" : "committers"}
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    centered
                >
                    <Tab
                        label="Projects"
                        value="projects"
                        sx={{ textTransform: "none" }}
                    />
                    <Tab label="Committers" value="committers" sx={{ textTransform: "none" }} />
                </Tabs>
            </Box>
            {showProjectsTab && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, mt: 5 }}>
                        <Button
                            onClick={() => setShowProjects(!showProjects)} // Toggle visibility
                            sx={{
                                textTransform: 'none',
                                color: 'primary.main',
                                background: 'none',
                                padding: 0,
                                minWidth: 'auto',
                                '&:hover': {
                                    background: 'none',
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            {showProjects ? 'Hide Projects' : 'Show Projects'}
                        </Button>
                        {showProjects && <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Filter by name or ID"
                            value={filterText}
                            onChange={(e) => {
                                setFilterText(e.target.value);
                            }}
                            sx={{ ml: 2, width: '300px' }}
                        />}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', mt: 2 }}>
                            <Button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                sx={{ mr: 2 }}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                                Page {currentPage} of {totalPages}
                            </Typography>
                            <Button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                sx={{ ml: 2 }}
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                    <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2), display: 'flex', justifyContent: 'center' }}>
                        {showProjects && (
                            <Grid sx={{ width: '100%' }}>
                                {projects?.length === 0 ? (
                                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                        <CardContent>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Oops! No project data was found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                There are no projects available for this {platformType === 'AzureDevOps' ? 'organisation' : 'enterprise'}.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ) : paginatedProjects?.length > 0 ? (
                                    paginatedProjects.map((project) => {
                                        return (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                showBarChart={showBarChart}
                                                setShowBarChart={setShowBarChart}
                                            />
                                        );
                                    })
                                ) : (
                                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                        <CardContent>
                                            <Typography variant="body1" color="text.secondary">
                                                No projects match your filter criteria.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}
                            </Grid>
                        )}
                        {!showProjects && (
                            <Grid gridColumn={{ lg: 'span 9' }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70%', height: '100%' }}>
                                <Card
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '100%',
                                        mb: 2,
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            width: '100%',
                                            mb: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
                                            <Grid>
                                                <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
                                                    {Object.keys(plat_source.projectRefs).length || 0}
                                                </Typography>
                                                <Typography variant="body1" color="textSecondary">
                                                    Total Projects
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                    </Grid>
                </Box>
            )}
            {!showProjectsTab && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, mt: 5 }}>
                        <Button
                            onClick={() => setShowCommitters(!showCommitters)} // Toggle visibility
                            sx={{
                                textTransform: 'none',
                                color: 'primary.main',
                                background: 'none',
                                padding: 0,
                                minWidth: 'auto',
                                '&:hover': {
                                    background: 'none',
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            {showCommitters ? 'Hide Committers' : 'Show Committers'}
                        </Button>
                        {showCommitters && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                {/* InputGroup-like filter controls */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                    <TextField
                                        select
                                        label="Filter By"
                                        value={filterType}
                                        onChange={e => setFilterType(e.target.value)}
                                        size="small"
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
                                        <MenuItem value="committer">Committer</MenuItem>
                                        <MenuItem value="author">Author</MenuItem>
                                        <MenuItem value="pusher">Pusher</MenuItem>
                                    </TextField>
                                    <TextField
                                        variant="outlined"
                                        size="small"
                                        placeholder={`Filter by ${filterType}`}
                                        value={filterText}
                                        onChange={e => setFilterText(e.target.value)}
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
                                {/* Three stage toggles with icons */}
                                <Stack direction="row" spacing={2} sx={{ ml: 2 }}>
                                    {/* Build Service Toggle */}
                                    <Box
                                        sx={{ display: 'flex', alignItems: 'center', border: 2, borderRadius: 2, borderColor: 'divider', px: 1, py: 0.5, bgcolor: 'background.paper', boxShadow: 1, cursor: 'pointer' }}
                                        onClick={() => {
                                            if (usesBuildServiceAccount === undefined) setUsesBuildServiceAccount(1);
                                            else if (usesBuildServiceAccount === 1) setUsesBuildServiceAccount(0);
                                            else setUsesBuildServiceAccount(undefined);
                                            setCurrentPageCommitters(1);
                                        }}
                                    >
                                        <IconButton
                                            color={usesBuildServiceAccount === 1 ? 'success' : usesBuildServiceAccount === 0 ? 'error' : 'default'}
                                            sx={{ mr: 1 }}
                                            tabIndex={-1}
                                            aria-label="Toggle Build Service"
                                        >
                                            {usesBuildServiceAccount === 1 ? <CheckCircleIcon /> : usesBuildServiceAccount === 0 ? <CancelIcon /> : <RemoveCircleOutlineIcon />}
                                        </IconButton>
                                        <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 90 }}>Build Service</Typography>
                                    </Box>

                                    {/* Multiple Authors Toggle */}
                                    <Box
                                        sx={{ display: 'flex', alignItems: 'center', border: 2, borderRadius: 2, borderColor: 'divider', px: 1, py: 0.5, bgcolor: 'background.paper', boxShadow: 1, cursor: 'pointer' }}
                                        onClick={() => {
                                            if (hasMultipleAuthors === undefined) setHasMultipleAuthors(1);
                                            else if (hasMultipleAuthors === 1) setHasMultipleAuthors(0);
                                            else setHasMultipleAuthors(undefined);
                                            setCurrentPageCommitters(1);
                                        }}
                                    >
                                        <IconButton
                                            color={hasMultipleAuthors === 1 ? 'success' : hasMultipleAuthors === 0 ? 'error' : 'default'}
                                            sx={{ mr: 1 }}
                                            tabIndex={-1}
                                            aria-label="Toggle Multiple Authors"
                                        >
                                            {hasMultipleAuthors === 1 ? <CheckCircleIcon /> : hasMultipleAuthors === 0 ? <CancelIcon /> : <RemoveCircleOutlineIcon />}
                                        </IconButton>
                                        <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 120 }}>Multiple Authors</Typography>
                                    </Box>

                                    {/* Multiple Pushers Toggle */}
                                    <Box
                                        sx={{ display: 'flex', alignItems: 'center', border: 2, borderRadius: 2, borderColor: 'divider', px: 1, py: 0.5, bgcolor: 'background.paper', boxShadow: 1, cursor: 'pointer' }}
                                        onClick={() => {
                                            if (hasMultiplePushers === undefined) setHasMultiplePushers(1);
                                            else if (hasMultiplePushers === 1) setHasMultiplePushers(0);
                                            else setHasMultiplePushers(undefined);
                                            setCurrentPageCommitters(1);
                                        }}
                                    >
                                        <IconButton
                                            color={hasMultiplePushers === 1 ? 'success' : hasMultiplePushers === 0 ? 'error' : 'default'}
                                            sx={{ mr: 1 }}
                                            tabIndex={-1}
                                            aria-label="Toggle Multiple Pushers"
                                        >
                                            {hasMultiplePushers === 1 ? <CheckCircleIcon /> : hasMultiplePushers === 0 ? <CancelIcon /> : <RemoveCircleOutlineIcon />}
                                        </IconButton>
                                        <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 120 }}>Multiple Pushers</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                        {/* Pagination controls for committers tab */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', mt: 2 }}>
                            <Button
                                onClick={handlePreviousPageCommitters}
                                disabled={currentPageCommitters === 1}
                                sx={{ mr: 2 }}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                                Page {currentPageCommitters} of {totalPagesCommitters}
                            </Typography>
                            <Button
                                onClick={handleNextPageCommitters}
                                disabled={currentPageCommitters === totalPagesCommitters}
                                sx={{ ml: 2 }}
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                    <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2), display: 'flex', justifyContent: 'center' }}>
                        {showCommitters && (
                            <Grid sx={{ width: '100%' }}>
                                {!Array.isArray(committersStats) || committersStats.length === 0 ? (
                                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                        <CardContent>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Oops! No committer data was found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                There are no committers that match your filter criteria for this {platformType === 'AzureDevOps' ? 'organisation' : 'enterprise'}.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ) : filteredCommitters.length > 0 ? (
                                    filteredCommitters
                                        .slice((currentPageCommitters - 1) * committerCardsPerPage, currentPageCommitters * committerCardsPerPage)
                                        .map(committer => (
                                            <CommitterCard
                                                key={committer.committerEmail}
                                                committer={committer}
                                            />
                                        ))
                                ) : (
                                    <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                                        <CardContent>
                                            <Typography variant="body1" color="text.secondary">
                                                No committers match your filter criteria.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )}
                            </Grid>
                        )}
                        {!showCommitters && (
                            <Grid gridColumn={{ lg: 'span 9' }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '70%', height: '100%' }}>
                                <Card
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '100%',
                                        mb: 2,
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            width: '100%',
                                            mb: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
                                            <Grid>
                                                <Typography variant="h1" sx={{ fontWeight: 'bold' }}>
                                                    {Array.isArray(committersStats) ? committersStats.length : 0}
                                                </Typography>
                                                <Typography variant="body1" color="textSecondary">
                                                    Total Committers
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default PlatformDetailsAzureDevOpsCard;