/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Card,
    CardContent,
    Box,
    Button,
    Typography,
    Stack,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar
} from "@mui/material";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';
import useStore from '../../state/stores/store';

function CommitterCard({ committer }) {

    const { selectedScan, fetchCommits } = useStore();
    const [hoveredCommitId, setHoveredCommitId] = React.useState(null);
    const [committerPage, setCommitterPage] = React.useState(1);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [projectStatsPage, setProjectStatsPage] = React.useState(0);
    const commitsPerPage = 10;
    const projectStatsPerPage = 10;
    const [commits, setCommits] = useState({ commits: [], total: 0 });
    const [commitsLoading, setCommitsLoading] = useState(true);

    if (!committer) return null;

    useEffect(() => {
        async function fetchUserCommits() {
            setCommitsLoading(true);
            if (!selectedScan || !selectedScan.id) {
                setCommits({ commits: [], total: 0 });
                setCommitsLoading(false);
                return;
            }
            if (!committer || !committer.committerEmail) {
                setCommits({ commits: [], total: 0 });
                setCommitsLoading(false);
                return;
            }
            try {
                const fetchedCommits = await fetchCommits(selectedScan.id, committer.committerEmail, committerPage, commitsPerPage);
                setCommits(fetchedCommits || { commits: [], total: 0 });
            } catch (err) {
                setCommits({ commits: [], total: 0 });
            }
            setCommitsLoading(false);
        }
        fetchUserCommits();
    }, [selectedScan, committer, committerPage, commitsPerPage, fetchCommits]);

    return (
        <Card sx={{ mb: 2, width: '100%', boxShadow: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                    {/* User Info */}
                    <Box
                        sx={{
                            minWidth: "30%",
                            maxWidth: 350,
                            textAlign: "center",
                            alignContent: "center",
                            alignItems: 'center',
                        }}
                    >
                        {/* Warning icon if email doesn't match authorEmails or pusherEmails */}
                        {committer.committerEmail && Array.isArray(committer.authorEmails) && !committer.authorEmails.includes(committer.committerEmail) && (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="warning.main" fontWeight="bold">
                                    Email does not match any Author Emails
                                </Typography>
                            </Box>
                        )}
                        {committer.committerEmail && Array.isArray(committer.pusherEmails) && !committer.pusherEmails.includes(committer.committerEmail) && (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="warning.main" fontWeight="bold">
                                    Email does not match any Pusher Emails
                                </Typography>
                            </Box>
                        )}
                        {/* Profile Icon */}
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                mx: "auto",
                                mb: 2,
                                bgcolor: "secondary.main",
                                fontSize: 32,
                            }}
                        >
                            {committer.committerEmail ? committer.committerEmail.charAt(0).toUpperCase() : "U"}
                        </Avatar>

                        <CardContent>
                            {/* User Email */}
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {committer.committerEmail}
                            </Typography>

                            {/* Stats Chips */}
                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="center"
                                sx={{ mb: 2 }}
                            >
                                <Chip
                                    label={`Commits: ${committer.commitCount ?? 0}`}
                                    color="secondary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Projects: ${committer.projectCount ?? 0}`}
                                    color="warning"
                                    variant="outlined"
                                    onMouseEnter={e => setAnchorEl(e.currentTarget)}
                                    onMouseLeave={() => setAnchorEl(null)}
                                />
                                {/* Popover for project stats */}
                                {anchorEl && Array.isArray(committer.projectStats) && committer.projectStats.length > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            zIndex: 100,
                                            bgcolor: 'background.paper',
                                            boxShadow: 3,
                                            borderRadius: 2,
                                            p: 2,
                                            minWidth: 220,
                                            left: anchorEl.getBoundingClientRect().left,
                                            top: anchorEl.getBoundingClientRect().bottom + window.scrollY,
                                        }}
                                        onMouseEnter={() => setAnchorEl(anchorEl)}
                                        onMouseLeave={() => setAnchorEl(null)}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                            Project Stats
                                        </Typography>
                                        {committer.projectStats
                                            .slice(projectStatsPage * projectStatsPerPage, (projectStatsPage + 1) * projectStatsPerPage)
                                            .map(stat => (
                                                <Box key={stat.projectId} sx={{ mb: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {stat.projectName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Repos: {stat.repoCount} | Commits: {stat.commitCount}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        {/* Pagination Controls */}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
                                            <Button
                                                size="small"
                                                onClick={() => setProjectStatsPage(prev => Math.max(prev - 1, 0))}
                                                disabled={projectStatsPage === 0}
                                                sx={{ mr: 1 }}
                                            >
                                                Previous
                                            </Button>
                                            <Typography variant="caption" sx={{ mx: 1 }}>
                                                Page {projectStatsPage + 1} of {Math.max(1, Math.ceil(committer.projectStats.length / projectStatsPerPage))}
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() => setProjectStatsPage(prev => prev + 1)}
                                                disabled={(projectStatsPage + 1) * projectStatsPerPage >= committer.projectStats.length}
                                                sx={{ ml: 1 }}
                                            >
                                                Next
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                                <Chip
                                    label={`Repos: ${committer.repoCount ?? 0}`}
                                    color="primary"
                                    variant="outlined"
                                />
                            </Stack>

                            {/* Usage Chips , only display the ones that are relevant */}
                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="center"
                                sx={{ mb: 2 }}
                            >

                                {committer.usesBuildAccount && (
                                    <Chip
                                        label={`Uses Build Account`}
                                        color="error"
                                        variant="outlined"
                                    />
                                )}
                                {committer.prs_merged > 0 && (
                                    <Chip
                                        label={`Merged PRs: ${committer.prs_merged}`}
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </Stack>

                            {/* Change Counts */}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Additions: {committer.totalChangeCounts?.add ?? 0} | Edits:{" "}
                                {committer.totalChangeCounts?.edit ?? 0} | Deletions:{" "}
                                {committer.totalChangeCounts?.delete ?? 0}
                            </Typography>

                            {/* Emails */}
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Author Emails: {committer.authorEmails?.join(", ") || "N/A"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Pusher Emails: {committer.pusherEmails?.join(", ") || "N/A"}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Box>
                    {/* Commits Table Section */}
                    <Box sx={{ flex: '1 1 65%', minWidth: 400 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Commits
                            </Typography>
                            <Tooltip
                                title={
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <span style={{ backgroundColor: '#baf7bfff', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>Light Green</span>: Pull request commit (merged/pushed by bot)
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <span style={{ backgroundColor: '#ffcdd2', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>Light Red</span>: Committer/Author/Pusher mismatch
                                        </Typography>
                                        <Typography variant="body2">
                                            No color: Normal commit
                                        </Typography>
                                    </Box>
                                }
                                placement="right"
                            >
                                <HelpOutlineIcon color="action" sx={{ fontSize: 24, cursor: 'pointer' }} />
                            </Tooltip>
                        </Box>
                        {commitsLoading ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Commits loading...
                            </Typography>
                        ) : commits.commits.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                No commits found.
                            </Typography>
                        ) : (
                            <>
                                <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: 2 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Commit ID</TableCell>
                                                <TableCell>Repository</TableCell>
                                                <TableCell>Project</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Adds</TableCell>
                                                <TableCell>Edits</TableCell>
                                                <TableCell>Deletes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {commits.commits.map((commit) => {
                                                const isLong = commit.commitId.length > 10;
                                                const displayCommitId = isLong
                                                    ? `${commit.commitId.slice(0, 10)}...`
                                                    : commit.commitId;
                                                const botPushEmail = "00000002-0000-8888-8000-000000000000@2c895908-04e0-4952-89fd-54b0046d6288";
                                                let rowColor = {};
                                                if (commit.pushEmail === botPushEmail) {
                                                    rowColor = { backgroundColor: '#baf7bfff' };
                                                } else if (commit.committerAuthorMatch === 0 || commit.committerPusherMatch === 0) {
                                                    rowColor = { backgroundColor: '#ffcdd2' };
                                                }
                                                return (
                                                    <TableRow
                                                        key={commit.commitId}
                                                        hover
                                                        sx={rowColor}
                                                    >
                                                        <TableCell
                                                            sx={{ fontFamily: 'monospace', position: 'relative' }}
                                                            onMouseEnter={() => setHoveredCommitId(commit.commitId)}
                                                            onMouseLeave={() => setHoveredCommitId(null)}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <span>{displayCommitId}</span>
                                                                {isLong && (
                                                                    <>
                                                                        <Box
                                                                            sx={{
                                                                                ml: 1,
                                                                                display: hoveredCommitId === commit.commitId ? 'inline-block' : 'none',
                                                                                position: 'absolute',
                                                                                zIndex: 10,
                                                                                bgcolor: 'background.paper',
                                                                                boxShadow: 2,
                                                                                borderRadius: 1,
                                                                                px: 1,
                                                                                py: 0.5,
                                                                                left: 120,
                                                                            }}
                                                                        >
                                                                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                                                {commit.commitId}
                                                                            </Typography>
                                                                        </Box>
                                                                    </>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <a
                                                                href={`${commit.k_project.self_attribute}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#1976d2', textDecoration: 'underline' }}
                                                            >
                                                                {commit.repositoryName || commit.repositoryId}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            <a
                                                                href={`${commit.k_project.self_attribute}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#1976d2', textDecoration: 'underline' }}
                                                            >
                                                                {commit.k_project?.name || commit.projectId}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(commit.committerDate).toLocaleString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </TableCell>
                                                        <TableCell>{commit.changeCounts.add}</TableCell>
                                                        <TableCell>{commit.changeCounts.edit}</TableCell>
                                                        <TableCell>{commit.changeCounts.delete}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                {/* Pagination Controls */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                                    <Button
                                        onClick={() => setCommitterPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={committerPage === 1}
                                        sx={{ mr: 1 }}
                                    >
                                        Previous
                                    </Button>
                                    <Typography variant="caption" sx={{ mx: 1 }}>
                                        Page {committerPage} of {Math.max(1, Math.ceil(commits.total / commitsPerPage))}
                                    </Typography>
                                    <Button
                                        onClick={() => setCommitterPage((prev) => prev + 1)}
                                        disabled={(committerPage) * commitsPerPage >= commits.total}
                                        sx={{ mr: 1 }}
                                    >
                                        Next
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

CommitterCard.propTypes = {
    committer: PropTypes.shape({
        committerEmail: PropTypes.string,
        authorEmails: PropTypes.arrayOf(PropTypes.string),
        pusherEmails: PropTypes.arrayOf(PropTypes.string),
        commitCount: PropTypes.number,
        projectCount: PropTypes.number,
        repoCount: PropTypes.number,
        usesBuildAccount: PropTypes.bool,
        prs_merged: PropTypes.number,
        totalChangeCounts: PropTypes.shape({
            add: PropTypes.number,
            edit: PropTypes.number,
            delete: PropTypes.number
        }),
        projectStats: PropTypes.arrayOf(
            PropTypes.shape({
                projectId: PropTypes.string,
                projectName: PropTypes.string,
                repoCount: PropTypes.number,
                commitCount: PropTypes.number
            })
        ),
    })
};

export default CommitterCard;


