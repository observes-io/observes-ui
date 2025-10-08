/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import { useState, useEffect } from 'react';
import OrgCard from './OrgCard';
import ProjectCard from './ProjectCard';
import CommitterCard from './CommitterCard';
import useStore from '../../state/stores/store';
import { useColorScheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  Button,
  TextField,
  Stack,
  Grid,
  Card,
  CardContent,
  MenuItem,
  IconButton
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// Decided to start calling it platform... 

// Runtime type guard/coercion for ScanResults
function coerceToScanResults(data) {
  // Basic shape check; expand as needed for deeper validation
  if (
    typeof data === 'object' && data !== null &&
    typeof data.organisation === 'object' &&
    typeof data.projects === 'object' &&
    typeof data.build_definitions === 'object' &&
    typeof data.builds === 'object' &&
    typeof data.protected_resources === 'object'
  ) {
    return data;
  }
  throw new Error('Uploaded JSON does not match ScanResults structure.');
}

export default function MainGrid({ platformType, scans, onScanSelect }) {
  
  const { selectedScan, addScan, deleteScan, projects, fetchProjects, fetchCommitterStats } = useStore();

  // Modal state for upload warning
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // File upload handler function
  const handleFileUpload = async (file, inputEl) => {
    if (!file) {
      if (inputEl) inputEl.value = "";
      return;
    }
    try {
      const text = await file.text();
      let data;
      try {
        data = coerceToScanResults(JSON.parse(text));
      } catch (err) {
        alert('Invalid scan file: ' + err.message);
        if (inputEl) inputEl.value = "";
        return;
      }
      await addScan({
        id: data.id,
        scan: {start: data.scan_start, end: data.scan_end},
        organisation: data.organisation,
        projects: data.projects,
        protected_resources: data.protected_resources,
        build_definitions: data.build_definitions,
        builds: data.builds,
        stats: data.stats || {},
        commits: data.commits || [],
        committer_stats: data.committer_stats || {},
        build_service_accounts: data.build_service_accounts || [],
        artifacts: data.artifacts || [],
      });
      window.location.reload();
    } catch (err) {
      alert('Failed to import scan: ' + err);
      if (inputEl) inputEl.value = "";
    }
  };

  // Toggle state for committers filtering
  const [usesBuildServiceAccount, setUsesBuildServiceAccount] = useState(undefined); // undefined means 'all'
  const [hasMultipleAuthors, setHasMultipleAuthors] = useState(undefined);
  const [hasMultiplePushers, setHasMultiplePushers] = useState(undefined);

  // LOCAL STATE
  const [showProjectsTab, setShowProjectsTab] = useState(true);
  const [committersStats, setCommittersStats] = useState({});

  // Populate committersStats when committers tab is selected
  useEffect(() => {
    async function fetchStats() {
      if (!selectedScan || !selectedScan.id || showProjectsTab) return;
      try {
        const stats = await fetchCommitterStats(selectedScan.id);
        if (stats) setCommittersStats(stats);
      } catch (err) {
        setCommittersStats({});
      }
    }
    fetchStats();
  }, [selectedScan, showProjectsTab, fetchCommitterStats]);

  // Clear committersStats when navigating away from committers tab
  useEffect(() => {
    if (showProjectsTab) {
      // console.log('Navigating away from committers tab');
      setCommittersStats({});
    }
  }, [showProjectsTab]);

  const { systemMode } = useColorScheme();
  const [selectedScanId, setSelectedScanId] = useState(selectedScan?.id || null);
  const [showProjects, setShowProjects] = useState(true);
  const [showCommitters, setShowCommitters] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('committer'); // committer, author, pusher
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (_, newValue) => setTabIndex(newValue);

  const TabPanel = ({ children, value, index }) => {
    if (value !== index) return null;
    return <Box p={2}>{children}</Box>;
  };


  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setCurrentPageCommitters(1);
  }, [filterText]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageOrg, setCurrentPageOrg] = useState(1);
  const [currentPageCommitters, setCurrentPageCommitters] = useState(1);
  const cardsPerPage = 3;
  const committerCardsPerPage = 20;
  const orgCardsPerPage = 3;
  const [showBarChart, setShowBarChart] = useState(true);


  // Fetch all projects for the selected org/scan ONCE
  useEffect(() => {
    if (selectedScan && selectedScan.id) {
      fetchProjects(selectedScan.id);
      setSelectedScanId(selectedScan.id);
      setCurrentPage(1); // Reset to first page on org change
    }
  }, [selectedScan, fetchProjects]);


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


  const filteredOrgs = [];
  for (const scan of scans) {
    if (!scan.name || !scan.id) {
      continue;
    }
    filteredOrgs.push(scan);
  }

  const totalFilteredOrgs = filteredOrgs.length;
  const totalPagesOrg = Math.ceil(totalFilteredOrgs / orgCardsPerPage);

  const paginatedOrgs = filteredOrgs.slice(
    (currentPageOrg - 1) * orgCardsPerPage,
    currentPageOrg * orgCardsPerPage
  );

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


  // Find the full scan object from scans using selectedScan reference
  const selectedScanObj = selectedScan && selectedScan.id
    ? scans.find(scan => scan.id === selectedScan.id)
    : null;

  useEffect(() => {
    if (!selectedScan || !selectedScan.id) {
      return;
    }
    // Set orgStats from the selected scan object if available
    setSelectedScanId(selectedScan.id);
  }, [selectedScan, scans]);


  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPageOrgs = () => {
    if (currentPageOrg < totalPagesOrg) setCurrentPageOrg(currentPageOrg + 1);
  };

  const handlePreviousPageOrgs = () => {
    if (currentPageOrg > 1) setCurrentPageOrg(currentPageOrg - 1);
  };

  const handleNextPageCommitters = () => {
    if (currentPageCommitters < totalPagesCommitters) setCurrentPageCommitters(currentPageCommitters + 1);
  };

  const handlePreviousPageCommitters = () => {
    if (currentPageCommitters > 1) setCurrentPageCommitters(currentPageCommitters - 1);
  };

  const visibleScans = scans.slice(
    (currentPageOrg - 1) * orgCardsPerPage,
    currentPageOrg * orgCardsPerPage
  );

  const handleDeleteConfig = (orgToDelete) => {
    scans = scans.filter(org => org.id !== orgToDelete.id);
    setSelectedScanId(null);
  };


  // Update handleCardClick to use SelectedScanRef
  const handleCardClick = (scanId) => {
    const scan = scans.find(s => s.id === scanId);
    if (scan) {
      onScanSelect({ id: scan.id, type: scan.type || 'organisation' });
      setSelectedScanId(scan.id);
    }
  };

  const handleCardClickDelete = async (organisationId) => {
    try {
      await deleteScan(organisationId);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectCardClick = (project) => {
    setSelectedProjectLocalName(project.name);
  };

  // Update filteredProjects and selectedScanLocal to use selectedScanObj
  const selectedScanLocal = selectedScanObj;

  const handleChange = (event, newValue) => {
    setShowProjectsTab(newValue === "projects");
    setCurrentPage(1);
    setCurrentPageCommitters(1);
    setFilterText('');
  };



  // No-op: removed console.log for performance

  return (
    <>
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
        <Grid
          container
          spacing={2}
          columns={12}
          sx={{ mb: (theme) => theme.spacing(2), display: 'flex', justifyContent: 'center', mt: 2 }}
        >
          {paginatedOrgs.map((scan, indexOrg) => (
            <Grid key={indexOrg} gridColumn={{ sm: 'span 6', lg: 'span 3' }} sx={{ mx: 2 }}>
              <OrgCard
                handleCardClick={handleCardClick}
                handleCardClickDelete={handleCardClickDelete}
                scan={scan}
                isSelected={scan.id === selectedScanId}
                onDelete={handleDeleteConfig}
              />
            </Grid>
          ))}
          {currentPageOrg === totalPagesOrg &&
            <Grid gridColumn={{ sm: 'span 6', lg: 'span 3' }}>
              <Button
                onClick={() => {
                  document.getElementById('org-scan-upload-input')?.click();
                }}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  boxShadow: 3,
                  minWidth: 0,
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 19 }} />
              </Button>
            </Grid>
          }
        </Grid>

        <input
          id="org-scan-upload-input"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          aria-label="Upload organization scan JSON file"
          title="Upload organization scan JSON file"
          placeholder="Upload organization scan JSON file"
          onChange={async e => {
            const file = e.target.files[0];
            if (!file) {
              e.target.value = "";
              return;
            }
            // Check localStorage for 'dontAskAgainUploadWarning'
            if (localStorage.getItem('dontAskAgainUploadWarning') === 'true') {
              await handleFileUpload(file, e.target);
              return;
            }
            setPendingFile({ file, input: e.target });
            setShowUploadWarning(true);
          }}
        />

        {showUploadWarning && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              bgcolor: 'rgba(0,0,0,0.3)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Card sx={{ minWidth: 350, maxWidth: 400, p: 3, boxShadow: 6 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ⚠️ Before uploading, please make sure you have the appropriate approvals.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                If you're working in an enterprise environment, ensure you follow internal processes before proceeding.<br /><br />
                This is a client-side only version of Observes. Your data is processed locally in your browser and not sent to any server. Still, it's better to keep out of trouble.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <input
                  type="checkbox"
                  id="dont-ask-again-upload"
                  checked={dontAskAgain}
                  onChange={e => setDontAskAgain(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="dont-ask-again-upload" style={{ fontSize: '0.95em' }}>
                  Don't ask again
                </label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    if (dontAskAgain) {
                      localStorage.setItem('dontAskAgainUploadWarning', 'true');
                    }
                    setShowUploadWarning(false);
                    if (pendingFile?.file && pendingFile?.input) {
                      await handleFileUpload(pendingFile.file, pendingFile.input);
                    }
                    setPendingFile(null);
                  }}
                >
                  Continue
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setShowUploadWarning(false);
                    if (pendingFile?.input) pendingFile.input.value = "";
                    setPendingFile(null);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Card>
          </Box>
        )}

        {scans.length !== 0 && (
          <span>
            <Grid sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                onClick={handlePreviousPageOrgs}
                disabled={currentPageOrg === 1}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                Page {currentPageOrg} of {totalPagesOrg}
              </Typography>
              <Button
                onClick={handleNextPageOrgs}
                disabled={currentPageOrg === totalPagesOrg}
                sx={{ ml: 2 }}
              >
                Next
              </Button>
            </Grid>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Tabs
                  value={showProjectsTab ? "projects" : "committers"}
                  onChange={handleChange}
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
              {showProjectsTab && selectedScanLocal && (
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
                        {paginatedProjects?.length > 0 ? (
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
                          <Typography variant="body1" color="textSecondary">
                            Select an onboarded {platformType === 'AzureDevOps' ? 'organisation' : 'enterprise'} platform. Or onboard additional ones.
                          </Typography>
                        )}
                      </Grid>
                    )}
                    {!showProjects && selectedScanLocal && (
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
                                  {Object.keys(selectedScanLocal?.projects).length || 0}
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
              {!showProjectsTab && selectedScanLocal && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, mt: 5 }}>
                    <Button
                      onClick={() => setShowCommitters(!showCommitters )} // Toggle visibility
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
                        {filteredCommitters.length > 0 ? (
                          filteredCommitters
                            .slice((currentPageCommitters - 1) * committerCardsPerPage, currentPageCommitters * committerCardsPerPage)
                            .map(committer => (
                              <CommitterCard
                                key={committer.committerEmail}
                                committer={committer}
                              />
                            ))
                        ) : (
                          <Typography variant="body1" color="textSecondary">
                            No committers found matching your filter.
                          </Typography>
                        )}
                      </Grid>
                    )}
                    {!showCommitters && selectedScanLocal && (
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
          </span>
        )}

        {/* if scans.length == 0 */}
        {scans.length === 0 && (
          <span>
            {scans.length === 0 && (
              <Grid gridColumn={{ sm: 'span 6', lg: 'span 3' }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '200px',
                    mb: 2,
                    p: 3,
                    border: '2px dashed #ccc',
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: (theme) => systemMode === 'dark' ? theme.palette.grey[800] : theme.palette.action.hover,
                      borderColor: 'primary.main',
                      boxShadow: (theme) => systemMode === 'dark'
                        ? '0 4px 24px 0 rgba(255,255,255,0.12), 0 1.5px 6px 0 rgba(0,0,0,0.25)'
                        : theme.shadows[3],
                    },
                  }}
                  onClick={() => {
                    document.getElementById('org-scan-upload-input').click();
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (!file) return;
                    try {

                      const text = await file.text();
                      let data;
                      try {
                        data = coerceToScanResults(JSON.parse(text));
                      } catch (err) {
                        alert('Invalid scan file: ' + err.message);
                        return;
                      }
                      await addScan({
                        id: data.id,
                        scan: {start: data.scan_start, end: data.scan_end},
                        organisation: data.organisation,
                        projects: data.projects,
                        protected_resources: data.protected_resources,
                        build_definitions: data.build_definitions,
                        builds: data.builds,
                        stats: data.stats || {},
                        commits: data.commits || [],
                        committer_stats: data.committer_stats || {},
                        build_service_accounts: data.build_service_accounts || [],
                        artifacts: data.artifacts || [],
                      });

                      window.location.reload();

                    } catch (err) {
                      alert('Failed to import scan: ' + err);
                    }
                  }}
                >

                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 2,
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <Typography variant="h4" color="primary.contrastText">+</Typography>
                    </Box>
                    <Typography variant="body1" color="textPrimary" fontWeight="medium">
                      Drag & Drop Org Scan JSON or Click to Upload
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                      Drop or select a scan file to onboard an organisation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

          </span>
        )}

      </Box>
    </>
  );
}
