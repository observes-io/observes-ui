/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../state/stores/store';
import observesLogo from '../theme/Observes-logoonly-giant.png';
// STYLE
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import { Box, IconButton, Snackbar, Alert, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, MenuItem, Select, Tooltip, Menu, Chip } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import { selectClasses } from '@mui/material/Select';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../../contexts/AuthContext';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import LoginIcon from '@mui/icons-material/Login';

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});


export default function Sidebar({ onMenuItemClick, mainListItems }) {
  const { current_page, platformSources, selectedPlatformSource, selectedProject, setCurrentPage, fetchPlatformSources, setSelectedPlatformSource, setSelectedProject } = useStore();
  const { user, logout, isGuestMode, exitGuestMode } = useAuth();
  const navigate = useNavigate();



  useEffect(() => {
    fetchPlatformSources();
  }, [fetchPlatformSources]);

  const [open, setOpen] = useState(true);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleAccountSettings = () => {
    handleCloseUserMenu();
    handleMenuItemClick('settings', 'Settings');
    navigate('/settings');
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login', { replace: true });
  };

  const handleContactUs = async () => {
    handleCloseUserMenu();
    try {
      await navigator.clipboard.writeText('contact@observes.io');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const handleBackToLogin = () => {
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleMenuItemClick = (id, text) => {
    setCurrentPage(text);
    onMenuItemClick(id, text);
  };

  const handleChange = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === 'demo') {
      const demoScanUrl = './demo-scan.json';
      const link = document.createElement('a');
      link.href = demoScanUrl;
      link.download = 'demo-scan.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    let selectedPlatformSourceLocal = null;
    let selectedProj = null;
    platformSources.forEach(scan => {
      if (scan.id === selectedValue) {
        selectedPlatformSourceLocal = scan;
      } else {
        const proj = scan.projectRefs?.find(proj => proj.id === selectedValue);
        if (proj) {
          selectedPlatformSourceLocal = scan;
          selectedProj = proj;
        }
      }
    });

    if (selectedPlatformSourceLocal && !selectedProj) {
      setSelectedPlatformSource(selectedPlatformSourceLocal);
      setSelectedProject(null);
    } else if (selectedProj) {
      setSelectedPlatformSource(selectedPlatformSourceLocal);
      setSelectedProject(selectedProj);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        anchor="left"
        open={open}
        sx={{
          width: open ? 240 : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? 240 : 72,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: open ? 'flex-end' : 'center',
            alignItems: 'center',
            padding: '8px',
          }}
        >
          <IconButton onClick={toggleDrawer} aria-label="toggle drawer" style={{ width: '100%', backgroundColor: 'white' }} >
            <img src={observesLogo} alt="Observes Logo" style={{ width: '50px', height: '50px' }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {open ? (
            <Select
              id="project-select"
              value={selectedProject?.id || selectedPlatformSource?.id || ''}
              onChange={handleChange}
              displayEmpty
              renderValue={(value) => {
                if (!value) {
                  return <em>Onboard Platforms</em>;
                }
                const project = platformSources
                  .flatMap(scan => scan.projectRefs || [])
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
              fullWidth
              sx={{
                maxHeight: 56,
                width: open ? 215 : 56,
                transition: 'width 0.3s ease',
                '&.MuiList-root': {
                  p: '8px',
                },
                [`& .${selectClasses.select}`]: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  pl: open ? 1 : 0,
                  justifyContent: open ? 'flex-start' : 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <ListSubheader sx={{ mt: 2, mb: 2, fontWeight: "bold", background: "white" }}>Azure DevOps</ListSubheader>
              {platformSources.flatMap((scan) => [
                <ListSubheader sx={{ background: "white" }} key={`${scan.id}-header`}>{scan.name}</ListSubheader>,
                <MenuItem key={scan.id} value={scan.id} sx={{ maxWidth: '200px', height: '48px' }}>
                  <ListItemAvatar>
                    <Avatar alt={scan.name}>
                      <BusinessIcon sx={{ fontSize: '1rem' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={scan.name}
                    sx={{
                      fontWeight: 'bold',
                      color: '#333',
                    }}
                  />
                </MenuItem>,
                ...(scan.projectRefs || []).map((project) => (
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
                          {project.name}
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
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary="Observes Sample" />
              </MenuItem>
            </Select>
          ) : (
            <ListItemIcon onClick={() => setOpen(true)} sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BusinessIcon sx={{ fontSize: '1.5rem' }} />
            </ListItemIcon>
          )}
        </Box>
        <Divider />

        <Divider />
        <List>
          {mainListItems.filter((item) => {
            if (platformSources.length === 0) {
              return !['policy', 'platform', 'resource'].includes(item.id);
            }
            return true;
          }).map((item, index) => (
            <ListItem key={index} disablePadding sx={{ transition: 'padding-left 0.3s ease' }}>
              <ListItemButton
                onClick={() => handleMenuItemClick(item.id, item.text)}
                selected={current_page === item.text}
                sx={{
                  display: 'flex',
                  justifyContent: open ? 'flex-start' : 'center',
                  alignItems: 'center',
                  minWidth: 0,
                  paddingLeft: open ? '16px' : '12px',
                  transition: 'padding-left 0.3s ease',
                  height: '48px',
                }}
              >
                <ListItemIcon sx={{ fontSize: open ? '24px' : '32px' }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* User Account Section at Bottom */}
        <Box
          sx={{
            mt: 'auto',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {open ? (
            <Box sx={{ p: 1.5 }}>
              <ListItemButton
                onClick={handleOpenUserMenu}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <Box sx={{ overflow: 'hidden', ml: 1 }}>
                  <Typography variant="body2" fontWeight="600" noWrap>
                    {user?.isGuest ? 'Guest' : (user?.email?.split('@')[0] || user?.name || 'User')}
                  </Typography>
                  {user?.isGuest && (
                    <Typography variant="caption" color="primary" noWrap>
                      Demo Mode
                    </Typography>
                  )}
                </Box>
              </ListItemButton>
            </Box>
          ) : (
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Tooltip title="Account" placement="right">
                <IconButton onClick={handleOpenUserMenu} size="small">
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="body2" fontWeight="600">
                {user?.email || user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.isGuest ? 'Guest Mode' : (user?.tenantName || 'Tenant User')}
              </Typography>
            </Box>
            <Divider />
            {isGuestMode && (
              <>
                <MenuItem onClick={handleBackToLogin}>
                  <ListItemIcon>
                    <LoginIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Back to Login</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleContactUs}>
                  <ListItemIcon>
                    <ContactMailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Contact Us (Copy Email)</ListItemText>
                </MenuItem>
                <Divider />
              </>
            )}
            {!isGuestMode && (
              <>
                <MenuItem onClick={handleAccountSettings}>
                  <ListItemIcon>
                    <ManageAccountsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Account Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>
      </Drawer>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Email copied to clipboard!
        </Alert>
      </Snackbar>
    </div>
  );
}
