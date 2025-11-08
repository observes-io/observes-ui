/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    IconButton,
    CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Save Search Dialog Component
export const SaveSearchDialog = React.memo(function SaveSearchDialog({
    open,
    initialName = "",
    initialDescription = "",
    isFilteredResource,
    isFilteredPipeline,
    editingSearchId,
    isSaving,
    onClose,
    onSave,
}) {
    const [localName, setLocalName] = React.useState(initialName);
    const [localDescription, setLocalDescription] = React.useState(initialDescription);

    // Reset when dialog opens (important!)
    React.useEffect(() => {
        if (open) {
            setLocalName(initialName);
            setLocalDescription(initialDescription);
        }
    }, [open, initialName, initialDescription]);

    const handleSave = () => {
        onSave({
            name: localName.trim(),
            description: localDescription.trim()
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{editingSearchId ? 'Edit search' : 'Save new search'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        autoFocus
                        label="Search Name"
                        placeholder="Enter a name for this search..."
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        required
                    />
                    <TextField
                        label="Description (Optional)"
                        placeholder="Describe what this search is for..."
                        value={localDescription}
                        onChange={(e) => setLocalDescription(e.target.value)}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                    />

                    {/* Preview of what will be saved */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            This search will save:
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                            {isFilteredResource > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    • {isFilteredResource} resource filter{isFilteredResource !== 1 ? 's' : ''}
                                </Typography>
                            )}
                            {isFilteredPipeline > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    • {isFilteredPipeline} pipeline filter{isFilteredPipeline !== 1 ? 's' : ''}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isSaving || !localName.trim()}
                    startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                >
                    {isSaving ? (editingSearchId ? 'Updating...' : 'Saving...') : (editingSearchId ? 'Update Search Metadata' : 'Save Search')}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

// Load Search Dialog Component
export const LoadSearchDialog = React.memo(function LoadSearchDialog({
    open,
    savedSearches,
    isDeleting,
    onClose,
    onLoadSearch,
    onEditSearch,
    onDeleteSearch,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Saved Searches</DialogTitle>
            <DialogContent>
                {savedSearches.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Saved Searches
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You haven't saved any searches yet. Create and save a search to see it here.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 0 }}>
                        {savedSearches.map((search) => {
                            return (
                                <Box key={search.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ListItemButton
                                        onClick={() => onLoadSearch(search)}
                                        sx={{ flex: 1 }}
                                    >
                                        <ListItemText
                                            primary={search.name}
                                            secondary={
                                                <Box component="span">
                                                    {search.description && (
                                                        <Typography component="span" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                            {search.description}
                                                        </Typography>
                                                    )}
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        Created: {new Date(search.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            aria-label="edit search"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditSearch(search);
                                            }}
                                            size="small"
                                            color="primary"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            aria-label="delete search"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteSearch(search.id);
                                            }}
                                            size="small"
                                            color="error"
                                            disabled={isDeleting}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
});

// Confirmation Dialog Component
export const ConfirmDeleteDialog = React.memo(function ConfirmDeleteDialog({
    open,
    isDeleting,
    onClose,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this search? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    disabled={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
});