/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import React, { useEffect, useState } from 'react';
import useStore from '../../state/stores/store';
import observesLogo from '../theme/Observes-logoonly-giant.png';

import { styled, useColorScheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { FormControl, Container, Toolbar, Box, Button, Typography, ListItemIcon, ListItemText, ListSubheader, MenuItem, Select } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import SettingsIcon from '@mui/icons-material/Settings';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import { AppBar } from '@mui/material';
import { DownloadOutlined } from '@mui/icons-material';



const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});


const mainListItems = [
  { id: 'overview', text: 'Overview', icon: <HomeRoundedIcon /> },
  { id: 'resource', text: 'Tracker', icon: <ScatterPlotIcon /> },
  { id: 'platform', text: 'Platform Manager', icon: <BadgeIcon /> },
  { id: 'settings', text: 'Settings', icon: <SettingsIcon /> },
];


export default function Header({ onMenuItemClick }) {

  // dont use scans, use a list of orgs
  const { current_page, scans, selectedScan, selectedProject, setCurrentPage, fetchScans, setSelectedScan, setSelectedProject, globalSettings } = useStore();
  // const { mode, systemMode } = useColorScheme();

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleMenuItemClick = (id, text) => {
    setCurrentPage(text);
    onMenuItemClick(id, text);
  };
  const handleChange = (event) => {
    const selectedValue = event.target.value;
    let selectedScanLocal = null;
    let selectedProj = null;

    if (selectedValue === 'demo') {
      const demoScanUrl = './demo-scan.json';
      const link = document.createElement('a');
      link.href = demoScanUrl;
      link.download = 'demo-scan.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


    scans.forEach(scan => {
      if (scan.id === selectedValue) {
        selectedScanLocal = scan;
      } else {
        const proj = scan.projectRefs.find(proj => proj.id === selectedValue);
        if (proj) {
          selectedScanLocal = scan;
          selectedProj = proj;
        }
      }
    });

    if (selectedScanLocal && !selectedProj) {
      setSelectedScan(selectedScanLocal);
      setSelectedProject(null);
    } else if (selectedProj) {
      setSelectedScan(selectedScanLocal);
      setSelectedProject(selectedProj);
    }
  };

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  // Determine AppBar position based on MenuLayout
  const appBarPosition = globalSettings?.MenuLayout === "Header" ? "fixed" : "static";

  return (
    <AppBar position={appBarPosition} sx={{ background: 'white', color: 'black', boxShadow: 'none', borderBottom: '1px solid #e0e0e0', mb: 3 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <img src={observesLogo} alt="Bee Logo" style={{ width: '50px', height: '50px' }} />
          {/* LIST ITEMS */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {mainListItems
              .filter((item) => {
                if (scans.length === 0) {
                  return !['policy', 'platform', 'resource'].includes(item.id);
                }
                return true;
              })
              .map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id, item.text)}
                  disabled={item.isDisabled}
                  variant="text"
                  sx={{
                    px: 2,
                    py: 1,
                    minWidth: 0,
                    fontWeight: current_page === item.text ? 700 : 500,
                    color: current_page === item.text ? '#1976d2' : 'inherit',
                    borderBottom: current_page === item.text ? '2px solid #1976d2' : '2px solid transparent',
                    borderRadius: 0,
                    background: 'none',
                    boxShadow: 'none',
                    textTransform: 'none',
                    transition: 'border-bottom 0.2s',
                    '&:hover': {
                      background: 'none',
                      borderBottom: '2px solid #1976d2',
                      color: '#1976d2',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
          </Box>

          {/* SELECT SCOPE */}
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }} size="small">
            <Select
              id="project-select"
              value={selectedProject?.id || selectedScan?.id || ''}
              onChange={handleChange}
              displayEmpty
              renderValue={(value) => {
                if (!value) {
                  return <em>Onboard</em>;
                }
                const project = scans
                  .flatMap(scan => scan.projectRefs)
                  .find(proj => proj.id === value);
                if (project) {
                  return (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', display: 'inline-block', verticalAlign: 'bottom' }}>
                      {project.name}
                    </span>
                  );
                }
                return value
              }}
              sx={{
                height: 60,
                width: 215,
                padding: '0 8px',
                '& .MuiSelect-select': {
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                },
                '&.MuiList-root': {
                  p: '8px',
                },
              }}
            >
              <ListSubheader sx={{ mt: 2, mb: 2, fontWeight: "bold" }}>Azure DevOps</ListSubheader>
              {scans.length === 0 && (
                <MenuItem disabled>
                  <ListItemText
                    primary="Upload scanner results"
                    sx={{ fontStyle: 'italic', color: 'gray' }}
                  />
                </MenuItem>
              )}
              {scans.flatMap((scan) => [
                <ListSubheader sx={{}} key={`${scan.id}-header`}>{scan.name}</ListSubheader>,
                <MenuItem key={scan.id} value={scan.name} sx={{ maxWidth: '200px', height: '48px', mt: 1, mb: 2 }}>
                  <ListItemAvatar>
                    <Avatar alt={scan.name}>
                      <BusinessIcon sx={{ fontSize: '1rem' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={scan.name}
                    sx={{
                      fontWeight: 'bold',
                    }}
                  />
                </MenuItem>,
                scan.projectRefs.map((project) => (
                  <MenuItem
                    key={project.id}
                    value={project.id}
                    sx={() => { }}
                  >
                    {/* <ListItemAvatar>
                      <Avatar alt={project.name}>
                        <FolderIcon sx={{ fontSize: '1rem' }} />
                      </Avatar>
                    </ListItemAvatar> */}
                    <ListItemText
                      primary={
                        <>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {open ? scan.name : ""}
                          </Typography>
                          <span
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '120px',
                              display: 'inline-block',
                              verticalAlign: 'bottom',
                            }}
                            title={project.name}
                          >
                            {project.name}
                          </span>
                        </>
                      }
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px',
                      }}
                    />
                  </MenuItem>
                )),
              ])}

              <Divider sx={{ mx: -1 }} />

              <MenuItem key="demo" value="demo" sx={{ maxWidth: '200px', height: '48px' }}>
                <ListItemIcon>
                  <DownloadOutlined />
                </ListItemIcon>
                <ListItemText primary="Observes Sample" />
              </MenuItem>
            </Select>
          </FormControl>
          {/* <Select
              id="project-select"
              value={selectedProject?.id || selectedScan?.id || ''}
              onChange={handleChange}
              displayEmpty
              sx={{
                ml: 2,
                maxHeight: 56,
                width: 215,
                '&.MuiList-root': {
                  p: '8px',
                }
              }}
            >
              <ListSubheader sx={{ mt: 2, mb: 2, fontWeight: "bold", background: "white" }}>Azure DevOps</ListSubheader>
              {scans.flatMap((org) => [
                <ListSubheader sx={{ background: "white" }} key={`${org.id}-header`}>{org.name}</ListSubheader>,
                <MenuItem key={org.id} value={org.id} sx={{ maxWidth: '200px', height: '48px' }}>
                  <ListItemAvatar>
                    <Avatar alt={org.name}>
                      <BusinessIcon sx={{ fontSize: '1rem' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={org.name} />
                </MenuItem>,
                ...org.projects.map((project) => (
                  <MenuItem
                    key={project.id}
                    value={project.id}
                    sx={{
                      maxWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      height: '48px',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar alt={project.name}>
                        <FolderIcon sx={{ fontSize: '1rem' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              display: 'block',
                            }}
                          >
                            {open ? org.name : ""}
                          </Typography>
                          {project.name}
                        </>
                      }
                      secondary={project.description}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px',
                      }}
                    />
                  </MenuItem>
                )),
              ])}

              <ListSubheader sx={{ mt: 2, mb: 2, fontWeight: "bold" }}>GitHub (soon)</ListSubheader>
              <Divider sx={{ mx: 1 }} />
              <MenuItem value={40} sx={{ height: '48px' }}>
                <ListItemIcon>
                  <AddRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Add new project" />
              </MenuItem>
            </Select> */}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
