/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import { useColorScheme } from '@mui/material/styles';

import { useState, useEffect } from 'react';
import useStore from '../../state/stores/store';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Button,
  TextField,
  Stack,
  Grid,
  Card,
  CardContent,
  MenuItem,
  IconButton,
  Menu,
  Chip,
  Tooltip,
} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import PlatformAzureDevOpsCard from './azuredevops/PlatformAzureDevOpsCard';
import GenericPlatformCard from './generic/GenericPlatformCard';
import PlatformDetailsAzureDevOpsCard from './azuredevops/PlatformDetailsAzureDevOpsCard';
import GenericPlatformDetailsCard from './generic/GenericPlatformDetailsCard';



// Platform card registry - maps platform types to their specific card components

const PLATFORM_CARD_REGISTRY = {
  'AzureDevOps': PlatformAzureDevOpsCard,
};
const PLATFORM_DETAILS_CARD_REGISTRY = {
  'AzureDevOps': PlatformDetailsAzureDevOpsCard,
};



// Function to get the appropriate card component for a platform
const getPlatformCard = (platformType) => {
  return PLATFORM_CARD_REGISTRY[platformType] || GenericPlatformCard;
};

const getPlatformDetailsCard = (platformType) => {
  return PLATFORM_DETAILS_CARD_REGISTRY[platformType] || GenericPlatformDetailsCard;
};

// Runtime type guard/coercion for PlatformScanResults
function coerceToPlatformScanResults(data) {
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
  throw new Error('Uploaded JSON does not match PlatformScanResults structure.');
}

export default function MainGrid({ platformSources, onPlatformSourceSelect }) {

  const { selectedPlatformSource, addPlatformSource, deletePlatformSource, projects, fetchProjects, fetchCommitterStats } = useStore();

  // Modal state for upload warning
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // Menu and configure dialog state
  const [anchorEl, setAnchorEl] = useState(null);
  const [showConfigureDialog, setShowConfigureDialog] = useState(false);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUploadClick = () => {
    handleMenuClose();
    document.getElementById('ondemand-plat_source-upload-input')?.click();
  };

  const handleConfigureClick = () => {
    handleMenuClose();
    setShowConfigureDialog(true);
  };

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
        data = coerceToPlatformScanResults(JSON.parse(text));
      } catch (err) {
        alert('Invalid on-demand platform source file: ' + err.message);
        if (inputEl) inputEl.value = "";
        return;
      }
      await addPlatformSource({
        id: data.id,
        scan: { start: data.scan_start, end: data.scan_end },
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
      alert('Failed to import on-demand scan: ' + err);
      if (inputEl) inputEl.value = "";
    }
  };





  const { systemMode } = useColorScheme();
  const [selectedPlatformSourceId, setSelectedPlatformSourceId] = useState(selectedPlatformSource?.id || null);
  const [showProjects, setShowProjects] = useState(true);
  const [showCommitters, setShowCommitters] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('committer'); // committer, author, pusher

  const [platformTypeFilter, setPlatformTypeFilter] = useState('all'); // all, AzureDevOps, GitHub, etc.
  const [platformSourceTypeFilter, setPlatformSourceTypeFilter] = useState('all'); // all, integrated, on-demand
  const [showFilters, setShowFilters] = useState(false);


  const [currentPagePlatformSources, setCurrentPagePlatformSources] = useState(1);
  const platformCardsPerPage = 3;

  const [currentPage, setCurrentPage] = useState(1);


  // Fetch all projects for the selected org/scan ONCE
  useEffect(() => {
    if (selectedPlatformSource && selectedPlatformSource.id) {
      fetchProjects(selectedPlatformSource.id);
      setSelectedPlatformSourceId(selectedPlatformSource.id);
      setCurrentPage(1); // Reset to first page on org change
    }
  }, [selectedPlatformSource, fetchProjects]);




  // Get unique platform types for filter dropdown
  const uniquePlatformTypes = ['all', ...new Set(platformSources.map(plat_source => plat_source.type).filter(Boolean))];

  const filteredPlatformSources = platformSources.filter(plat_source => {
    if (!plat_source.name || !plat_source.id) return false;

    // Filter by name
    const nameMatch = !filterText ||
      plat_source.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      plat_source.id?.toLowerCase().includes(filterText.toLowerCase()) ||
      plat_source.description?.toLowerCase().includes(filterText.toLowerCase());

    // Filter by platform type
    const platformMatch = platformTypeFilter === 'all' || plat_source.type === platformTypeFilter;
    // Filter by scan type
    const pltformSourceType = plat_source.source_type || (plat_source.type === 'integrated' ? 'Integrated' : 'On-Demand');
    const pltformSourceTypeMatch = platformSourceTypeFilter === 'all' ||
      (platformSourceTypeFilter === 'integrated' && pltformSourceType === 'Integrated') ||
      (platformSourceTypeFilter === 'on-demand' && pltformSourceType === 'On-Demand');

    return nameMatch && platformMatch && pltformSourceTypeMatch;
  });

  const totalFilteredPlatformSources = filteredPlatformSources.length;
  const totalPagesPlatformSources = Math.ceil(totalFilteredPlatformSources / platformCardsPerPage);

  const paginatedPlatformSources = filteredPlatformSources.slice(
    (currentPagePlatformSources - 1) * platformCardsPerPage,
    currentPagePlatformSources * platformCardsPerPage
  );


  // Find the full scan object from platformSources using selectedPlatformSource reference
  const selectedPlatformSourceObj = selectedPlatformSource && selectedPlatformSource.id
    ? platformSources.find(scan => scan.id === selectedPlatformSource.id)
    : null;

  useEffect(() => {
    if (!selectedPlatformSource || !selectedPlatformSource.id) {
      return;
    }
    // Set orgStats from the selected scan object if available
    setSelectedPlatformSourceId(selectedPlatformSource.id);
  }, [selectedPlatformSource, platformSources]);


  const handleNextPlatformSources = () => {
    if (currentPagePlatformSources < totalPagesPlatformSources) setCurrentPagePlatformSources(currentPagePlatformSources + 1);
  };

  const handlePreviousPagePlatformSources = () => {
    if (currentPagePlatformSources > 1) setCurrentPagePlatformSources(currentPagePlatformSources - 1);
  };


  // Update handleCardClick to use SelectedPlatformSourceRef
  const handleCardClick = (platformSourceId) => {
    const plat_source = platformSources.find(s => s.id === platformSourceId);
    if (plat_source) {
      onPlatformSourceSelect({ id: plat_source.id, type: plat_source.type || 'organisation' });
      setSelectedPlatformSourceId(plat_source.id);
    }
  };

  const handleCardClickDelete = async (platformSourceId) => {
    try {
      await deletePlatformSource(platformSourceId);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectCardClick = (project) => {
    setSelectedProjectLocalName(project.name);
  };

  // Update filteredProjects and selectedPlatformSourceLocal to use selectedPlatformSourceObj
  const selectedPlatformSourceLocal = selectedPlatformSourceObj;


  // No-op: removed console.log for performance

  return (
    <>
      {/* Dashboard Header */}
      {platformSources.length !== 0 && (
        <>
          <Box sx={{ mb: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Dashboard of Platforms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {platformSources.length} {platformSources.length === 1 ? 'source' : 'sources'} configured
                </Typography>
              </Box>
              <Button
                onClick={handleMenuClick}
                variant="outlined"
                color='#EE4266'
                startIcon={<AddIcon />}
                sx={{
                  borderRadius: 1,
                  color: "#EE4266",
                  borderColor: "#EE4266",
                  "&:hover": {
                    borderColor: "#c73757",
                    backgroundColor: "rgba(238, 66, 102, 0.08)",
                  },
                }}

              >
                Add Platform Source
              </Button>
              <Menu
                sx={{ mt: 0.5 }}
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem
                  disabled
                  sx={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                  Configure Scanner (Coming Soon)
                </MenuItem>
                <MenuItem
                  onClick={handleUploadClick}
                >
                  <UploadFileIcon sx={{ mr: 1, fontSize: 20 }} />
                  Upload On-Demand Scan
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Filter Controls */}
          {platformSources.length > platformCardsPerPage && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>

                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search by name, ID, or description..."
                  value={filterText}
                  onChange={(e) => {
                    setFilterText(e.target.value);
                    setCurrentPagePlatformSources(1);
                  }}
                  sx={{ minWidth: 250 }}
                />

                <TextField
                  select
                  label="Platform Type"
                  value={platformTypeFilter}
                  onChange={(e) => {
                    setPlatformTypeFilter(e.target.value);
                    setCurrentPagePlatformSources(1);
                  }}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  {uniquePlatformTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type === 'all' ? 'All Platforms' : type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Scan Type"
                  value={platformSourceTypeFilter}
                  onChange={(e) => {
                    setPlatformSourceTypeFilter(e.target.value);
                    setCurrentPagePlatformSources(1);
                  }}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="integrated">Integrated</MenuItem>
                  <MenuItem value="on-demand">On-Demand</MenuItem>
                </TextField>

                {(filterText || platformTypeFilter !== 'all' || platformSourceTypeFilter !== 'all') && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setFilterText('');
                      setPlatformTypeFilter('all');
                      setPlatformSourceTypeFilter('all');
                      setCurrentPagePlatformSources(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {totalFilteredPlatformSources} {totalFilteredPlatformSources === 1 ? 'result' : 'results'}
                  </Typography>
                </Box>
              </Box>
            </Box>

          )}
        </>
      )}

      {/* Platform Scans Grid - Carousel Style */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 3 }}
      >
        {paginatedPlatformSources.map((plat_source, indexOrg) => {
          const PlatformCard = getPlatformCard(plat_source.type);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={indexOrg}>
              <PlatformCard
                platform={plat_source.type || 'Platform'}
                plat_source={plat_source}
                isSelected={plat_source.id === selectedPlatformSourceId}
                onClick={() => handleCardClick(plat_source.id)}
                onDelete={handleCardClickDelete}
                fetchCommitterStats={fetchCommitterStats}
              />
            </Grid>
          );
        })}
      </Grid>

      <input
        id="ondemand-plat_source-upload-input"
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

      {/* Carousel Navigation for Platform Scans */}
      {totalFilteredPlatformSources > platformCardsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton
            onClick={handlePreviousPagePlatformSources}
            disabled={currentPagePlatformSources === 1}
            color="primary"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-disabled': { opacity: 0.3 }
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {[...Array(totalPagesPlatformSources)].map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentPagePlatformSources(idx + 1)}
                sx={{
                  width: currentPagePlatformSources === idx + 1 ? 24 : 8,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: currentPagePlatformSources === idx + 1 ? 'primary.main' : 'action.disabled',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { bgcolor: currentPagePlatformSources === idx + 1 ? 'primary.dark' : 'action.hover' }
                }}
              />
            ))}
          </Box>

          <IconButton
            onClick={handleNextPlatformSources}
            disabled={currentPagePlatformSources === totalPagesPlatformSources}
            color="primary"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-disabled': { opacity: 0.3 }
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>

          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {currentPagePlatformSources} / {totalPagesPlatformSources}
          </Typography>
        </Box>
      )}

      {/* Details Section - Only show if a scan is selected */}
      {platformSources.length !== 0 && selectedPlatformSourceLocal && (
        <Box>
          <Divider sx={{ my: 3 }} />

          {(() => {
            const PlatformDetailsCard = getPlatformDetailsCard(selectedPlatformSourceLocal.type);
            return (
              <PlatformDetailsCard
                plat_source={selectedPlatformSourceLocal}
                platform={selectedPlatformSourceLocal.type || 'Platform'}
                onPlatformSourceSelect={onPlatformSourceSelect}
                handleChange={handleCardClick}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                projects={projects}
                fetchCommitterStats={fetchCommitterStats}
              />
            );
          })()}
        </Box>
      )}

      {/* Empty State - Show when no platformSources */}
      {platformSources.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text" sx={{ mb: 3, fontWeight: 500 }}>
            No platforms configured.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Get started by configuring a Platform Source: Integrate a scanner or uploading on-demand scan results
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
            {/* Configure Scanner Card */}
            <Card
              sx={{
                cursor: 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '300px',
                height: '220px',
                p: 3,
                border: '2px dashed',
                borderColor: 'grey.400',
                borderRadius: 2,
                opacity: 0.5,
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
                      backgroundColor: 'grey.500',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" color="textSecondary" fontWeight="600" sx={{ mb: 1 }}>
                    Configure Scanner
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    Coming Soon
                  </Typography>
                </CardContent>
              </Card>

            {/* Upload On-Demand Scan Card */}
            <Card
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '300px',
                  height: '220px',
                  p: 3,
                  border: '2px dashed',
                  borderColor: '#EE4266',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: '#B71C46',
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => {
                  document.getElementById('ondemand-plat_source-upload-input').click();
                }}
                onDragOver={e => {
                  e.preventDefault();
                }}
                onDrop={async e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  // Check localStorage for 'dontAskAgainUploadWarning'
                  if (localStorage.getItem('dontAskAgainUploadWarning') === 'true') {
                    await handleFileUpload(file, null);
                    return;
                  }
                  setPendingFile({ file, input: null });
                  setShowUploadWarning(true);
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
                      backgroundColor: '#EE4266',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <UploadFileIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" color="#EE4266" fontWeight="600" sx={{ mb: 1 }}>
                    Upload Scan Results
                  </Typography>
                  <Typography variant="body2" color="#EE4266" sx={{ textAlign: 'center' }}>
                    Upload on-demand scan results (JSON file)
                  </Typography>
                </CardContent>
              </Card>
          </Box>
        </Box>
      )}

    </>
  );
}
