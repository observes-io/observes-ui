/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import InventoryIcon from '@mui/icons-material/Inventory';

import MyAccountSettings from './MyAccountSettings';
import UserManagementSettings from './UserManagementSettings';
import SupplyChainSettings from './SupplyChainSettings';

import useStore from '../../state/stores/store';
import { useAuth } from '../../contexts/AuthContext';

const Settings = () => {
  const { setCurrentPage } = useStore();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('myAccount');

  // Check if user is tenant admin - FOR DEVELOPMENT PURPOSES, DEFAULT TO TRUE @TODO REMOVE
  const isTenantAdmin = user?.roles?.includes('TenantAdmin') || false;

  useEffect(() => {
    setCurrentPage("Settings");
  }, [setCurrentPage]);

  const menuItems = [
    { id: 'myAccount', label: 'My Account', icon: <PersonIcon />, show: true },
    { id: 'userManagement', label: 'User Management', icon: <PeopleIcon />, show: isTenantAdmin },
    { id: 'supplyChain', label: 'Supply Chain', icon: <InventoryIcon />, show: true },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'myAccount':
        return <MyAccountSettings />;
      case 'userManagement':
        return <UserManagementSettings />;
      case 'supplyChain':
        return <SupplyChainSettings />;
      default:
        return <MyAccountSettings />;
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* <Typography variant="h3" gutterBottom sx={{ fontSize: '1.3rem' }}>
        Settings
      </Typography> */}

      <Grid container spacing={1} sx={{ flexGrow: 1, flexWrap: 'nowrap' }}>
        {/* Sidebar Menu */}
        <Grid size={{ md: 3 }} sx={{ minWidth: 250, maxWidth: 300, mr: 2}}>
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <List component="nav">
              {menuItems
                .filter(item => item.show)
                .map((item) => (
                  <ListItemButton
                    key={item.id}
                    selected={selectedSection === item.id}
                    onClick={() => setSelectedSection(item.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'secondary.light',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'secondary.light',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                ))}
            </List>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid size={{ md: 9 }} sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderContent()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;