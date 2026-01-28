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
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../../contexts/AuthContext';

const UserManagementSettings = () => {
  const { user } = useAuth();

  // User Management state
  const [users, setUsers] = useState([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('User');
  const [userError, setUserError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is tenant admin
  const isTenantAdmin = user?.roles?.includes('TenantAdmin') || false;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users');
      // if (!response.ok) {
      //   if (response.status === 403) {
      //     setLoadError(true);
      //     setUsers([]);
      //     return;
      //   }
      //   throw new Error('Failed to load users');
      // }
      // const data = await response.json();
      // setUsers(data);

      // Mock data - simulate permission check
      if (!isTenantAdmin) {
        setLoadError(true);
        setUsers([]);
        return;
      }

      setUsers([
        { id: '1', email: user?.email || 'user@example.com', role: 'TenantAdmin', status: 'Active', created: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoadError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      setUserError('Please enter a valid email address');
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: newUserEmail, role: newUserRole })
      // });
      // if (!response.ok) throw new Error('Failed to create user');

      // Mock user creation
      const newUser = {
        id: Date.now().toString(),
        email: newUserEmail,
        role: newUserRole,
        status: 'Pending',
        created: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      setOpenUserDialog(false);
      setNewUserEmail('');
      setNewUserRole('User');
      setUserError('');
    } catch (error) {
      setUserError('Error creating user: ' + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/users/${userId}`, { method: 'DELETE' });

        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Identity and Access Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage users and roles within your Observes.io tenant.
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {loadError && false ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ErrorOutlineIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Unable to Load Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You might not have the right permissions to view this information.
                Please contact your tenant administrator if you believe this is an error.
              </Typography>
              <Button
                variant="outlined"
                onClick={loadUsers}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : (
            <>
              {/* User Management Actions */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Users: {users.length}
                </Typography>
                <Tooltip
                  title={!isTenantAdmin ? 'Only Tenant Admins can add users' : 'Add a new user to your tenant'}
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setOpenUserDialog(true)}
                      disabled={!isTenantAdmin}
                    >
                      Add User
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {/* Users Table */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Loading users...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No users found. Add a user to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Chip label={u.role} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.status}
                              size="small"
                              color={u.status === 'Active' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{new Date(u.created).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            {u.id !== user?.id && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteUser(u.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {userError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {userError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <FormLabel>Role</FormLabel>
              <RadioGroup
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <FormControlLabel value="User" control={<Radio />} label="User" />
                <FormControlLabel value="ProjectAdmin" control={<Radio />} label="Project Admin" />
                <FormControlLabel value="TenantAdmin" control={<Radio />} label="Tenant Admin" />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createUser}>Add User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementSettings;
