import { useState, useEffect } from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  Button,
} from '@mui/material'

import useStore from '../../state/stores/store';


const Settings = () => {

  const { globalSettings, setGlobalSettings, setCurrentPage } = useStore();

  const [localSettings, setLocalSettings] = useState(globalSettings)

  // Update local state when global settings change
  useEffect(() => {
    setLocalSettings(globalSettings)
  }, [globalSettings])

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleScanSettingsChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      scanSettings: { ...prev.scanSettings, [key]: value },
    }));
  };

  const handleSave = () => {
    setGlobalSettings(localSettings)
  }

  useEffect(() => {
    setCurrentPage("Settings");
  }, [setCurrentPage]);

  // Validation state for Default Branch Limit
  const [branchLimitError, setBranchLimitError] = useState('');

  // Validate Default Branch Limit on change
  const validateBranchLimit = (value) => {
    if (value === '' || value === 'full') {
      setBranchLimitError('');
      return true;
    }
    if (!/^\d+$/.test(value)) {
      setBranchLimitError("Must be a number or 'full'.");
      return false;
    }
    setBranchLimitError('');
    return true;
  };

  // LOCAL


  return (
    <Box sx={{ p: 3 }}>
      {/* <Typography variant="h3" gutterBottom sx={{ fontSize: '1.3rem' }}>
        Global Settings
            </Typography> */}

            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
        <FormControl fullWidth margin="normal">
          <FormLabel sx={{ color: 'black' }}>Menu Layout</FormLabel>
          <Typography variant="caption" color="textSecondary" sx={{}}>
            Header layout is recommended for the Backstage integration.
          </Typography>
          <RadioGroup
            row
            value={localSettings.MenuLayout}
            onChange={(e) => handleChange('MenuLayout', e.target.value)}
          >
            <FormControlLabel value="Header" control={<Radio />} label="Header" />
            <FormControlLabel value="Sidebar" control={<Radio />} label="Sidebar" />
          </RadioGroup>
        </FormControl>

          

        {/* Language @TODO (not implemented anything yet that looks at these settings) */}
        {/* <TextField
          fullWidth
          margin="normal"
          label="Language"
          value={localSettings.Language}
          onChange={(e) => handleChange('Language', e.target.value)}
          placeholder="e.g. en, es, fr"
        /> */}

        {/* FontSize @TODO (not implemented anything yet that looks at these settings) */}
        {/* <FormControl fullWidth margin="normal">
          <FormLabel>Font Size</FormLabel>
          <RadioGroup
            row
            value={localSettings.FontSize}
            onChange={(e) => handleChange('FontSize', e.target.value)}
          >
            <FormControlLabel value="small" control={<Radio />} label="Small" />
            <FormControlLabel value="medium" control={<Radio />} label="Medium" />
            <FormControlLabel value="large" control={<Radio />} label="Large" />
          </RadioGroup>
        </FormControl> */}

        {/* Primary Color @TODO (not implemented anything yet that looks at these settings) */}
        {/* <TextField
          fullWidth
          margin="normal"
          label="Primary Color"
          type="color"
          value={localSettings.PrimaryColor}
          onChange={(e) => handleChange('PrimaryColor', e.target.value)}
        /> */}

        {/* Toggles that do nothing @TODO (not implemented anything yet that looks at these settings) */}
        {/* <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography>Show Notifications</Typography>
          <Switch
            disabled
            checked={localSettings.ShowNotifications}
            onChange={(e) => handleChange('ShowNotifications', e.target.checked)}
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography>Animations Enabled</Typography>
          <Switch
            disabled
            checked={localSettings.AnimationsEnabled}
            onChange={(e) => handleChange('AnimationsEnabled', e.target.checked)}
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography>Compact Mode</Typography>
          <Switch
            disabled
            checked={localSettings.CompactMode}
            onChange={(e) => handleChange('CompactMode', e.target.checked)}
          />
        </Box>

          <Typography variant="h6" sx={{ mt:3 }} gutterBottom>
            Global Scan Settings
          </Typography>

          <FormControl fullWidth margin="normal">
            <FormLabel>Secret Scan Engine</FormLabel>
            <Select
              multiple
              value={localSettings.scanSettings?.secret_scan_engine || []}
              onChange={(e) => handleScanSettingsChange('secret_scan_engine', e.target.value)}
              renderValue={(selected) => selected.join(', ')}
            >
              <MenuItem value="gitleaks">Gitleaks</MenuItem>
              <MenuItem value="truffleHog">TruffleHog</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <FormLabel>Default Branch Limit</FormLabel>
            <TextField
              fullWidth
              type="text"
              value={localSettings.scanSettings?.default_branch_limit || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (validateBranchLimit(value)) {
                  handleScanSettingsChange('default_branch_limit', value);
                } else {
                  handleScanSettingsChange('default_branch_limit', value); // still update, but show error
                }
              }}
              placeholder="e.g., 10 or 'full'"
              helperText={branchLimitError || "Enter a number or 'full' for no limit."}
              error={!!branchLimitError}
            />
          </FormControl>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography>Enforce Referenced Repo Scoped Token</Typography>
            <Switch
              checked={localSettings.scanSettings?.default_build_settings_expectations?.enforceReferencedRepoScopedToken || false}
              onChange={(e) =>
                handleScanSettingsChange('default_build_settings_expectations', {
                  ...localSettings.scanSettings?.default_build_settings_expectations,
                  enforceReferencedRepoScopedToken: e.target.checked,
                })
              }
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography>Disable Classic Pipeline Creation</Typography>
            <Switch
              checked={localSettings.scanSettings?.default_build_settings_expectations?.disableClassicPipelineCreation || false}
              onChange={(e) =>
                handleScanSettingsChange('default_build_settings_expectations', {
                  ...localSettings.scanSettings?.default_build_settings_expectations,
                  disableClassicPipelineCreation: e.target.checked,
                })
              }
            />
          </Box> */}

        {/* Date Format */}
        {/* <FormControl fullWidth margin="normal">
          <FormLabel>Date Format</FormLabel>
          <TextField
            fullWidth
            value={localSettings.DateFormat || ''}
            onChange={(e) => handleChange('DateFormat', e.target.value)}
            placeholder="e.g. MM/DD/YYYY, DD/MM/YYYY, yyyy-MM-dd"
            helperText="Set your preferred date format. Example: MM/DD/YYYY, DD/MM/YYYY, yyyy-MM-dd"
          />
        </FormControl> */}

        {/* Save Button */}
        <Box mt={3} textAlign="right">
          <Button variant="standard" color="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </Box>
      </Box>

    </Box>
  );
};

export default Settings;