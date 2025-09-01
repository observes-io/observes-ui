import React, { useEffect, useState } from 'react';
import useStore from '../../state/stores/store';
import observesLogo from '../theme/Observes-logoonly-giant.png';
// STYLE
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import { Box, IconButton, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, MenuItem, Select, Tooltip } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import SettingsIcon from '@mui/icons-material/Settings';
import BadgeIcon from '@mui/icons-material/Badge';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import BusinessIcon from '@mui/icons-material/Business';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import { selectClasses } from '@mui/material/Select';

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

const mainListItems = [
  { id: 'overview', text: 'Overview', icon: <HomeRoundedIcon /> },
  { id: 'resource', text: 'Tracker', icon: <ScatterPlotIcon /> },
  { id: 'platform', text: 'Platform Manager', icon: <BadgeIcon /> },
  { id: 'settings', text: 'Settings', icon: <SettingsIcon /> },
];

const secondaryListItems = [
  { text: 'Settings', icon: <SettingsRoundedIcon /> },
  { text: 'About', icon: <InfoRoundedIcon /> },
  { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

export default function Sidebar({ onMenuItemClick }) {
  const { current_page, scans, selectedScan, selectedProject, setCurrentPage, fetchScans, setSelectedScan, setSelectedProject } = useStore();



  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const [open, setOpen] = useState(true);

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

    let selectedScanLocal = null;
    let selectedProj = null;
    scans.forEach(scan => {
      if (scan.id === selectedValue) {
        selectedScanLocal = scan;
      } else {
        const proj = scan.projectRefs?.find(proj => proj.id === selectedValue);
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
              value={selectedProject?.id || selectedScan?.id || ''}
              onChange={handleChange}
              displayEmpty
              renderValue={(value) => {
                if (!value) {
                  return <em>Onboard</em>;
                }
                const project = scans
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
              {scans.flatMap((scan) => [
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
            if (scans.length === 0) {
              return !['policy', 'platform', 'resource'].includes(item.id);
            }
            return true;
          }).map((item, index) => (
            <ListItem key={index} disablePadding sx={{ transition: 'padding-left 0.3s ease' }}>
              {open ? (
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
                    height: '48px'
                  }}
                >
                  <ListItemIcon sx={{ fontSize: open ? '24px' : '32px' }}>{item.icon}</ListItemIcon>
                  {open && <ListItemText primary={item.text} />}
                </ListItemButton>
              ) : (
                <Tooltip title={item.text} placement="right">
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
                      height: '48px'
                    }}
                  >
                    <ListItemIcon sx={{ fontSize: open ? '24px' : '32px' }}>{item.icon}</ListItemIcon>
                    {open && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </Tooltip>
              )}
            </ListItem>
          ))}
        </List>
        <Box
          sx={{
            display: 'flex',
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5,
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        </Box>
      </Drawer>
    </div>
  );
}
