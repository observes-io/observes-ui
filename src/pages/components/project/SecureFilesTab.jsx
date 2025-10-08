/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {

    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Chip,
    Tooltip as MuiTooltip
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import resourceTypeStyle from '../../theme/resourceTypeStyle';
import dayjs from 'dayjs';
import useStore from '../../../state/stores/store';


const SecureFilesTab = ({ projectId }) => {
    const [secureFiles, setSecureFiles] = useState([]);
    const [secureFilesTotal, setSecureFilesTotal] = useState(0);
    const [secureFilesPage, setSecureFilesPage] = useState(1);
    const [secureFilesSearch, setSecureFilesSearch] = useState('');
    const [secureFilesMatchType, setSecureFilesMatchType] = useState('contains');
    const [secureFilesPerPage, setSecureFilesPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { selectedScan, fetchProtectedResourcesByTypeOrgProject } = useStore();

    useEffect(() => {
        async function fetchSecureFiles() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchProtectedResourcesByTypeOrgProject(selectedScan.id, 'securefile', projectId);
                    let allFiles = [];
                    if (result && Array.isArray(result.resources)) {
                        allFiles = result.resources;
                    } else {
                        allFiles = [];
                    }
                    setSecureFiles(allFiles);
                    setSecureFilesTotal(allFiles.length);
                } else {
                    setSecureFiles([]);
                    setSecureFilesTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch secure files');
                setSecureFiles([]);
                setSecureFilesTotal(0);
            }
            setLoading(false);
        }
        fetchSecureFiles();
    }, [selectedScan, projectId, fetchProtectedResourcesByTypeOrgProject]);

    // Filtered secure files and local pagination
    const filteredFiles = secureFilesSearch
        ? secureFiles.filter(sf => {
            let fieldValue = sf.name?.toLowerCase() || '';
            const search = secureFilesSearch.toLowerCase();
            switch (secureFilesMatchType) {
                case 'exact':
                    return fieldValue === search;
                case 'starts':
                    return fieldValue.startsWith(search);
                case 'ends':
                    return fieldValue.endsWith(search);
                default:
                    return fieldValue.includes(search);
            }
        })
        : secureFiles;

    // Local pagination
    const pagedFiles = filteredFiles.slice((secureFilesPage - 1) * secureFilesPerPage, secureFilesPage * secureFilesPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setSecureFilesPage(1); }, [secureFilesSearch, secureFilesMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredFiles.length;
                            const start = filteredTotal === 0 ? 0 : (secureFilesPage - 1) * secureFilesPerPage + 1;
                            const end = Math.min(secureFilesPage * secureFilesPerPage, filteredTotal);
                            return `Secure Files (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for secure files */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={secureFilesMatchType}
                        onChange={e => setSecureFilesMatchType(e.target.value)}
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
                        <MenuItem value="contains">Contains</MenuItem>
                        <MenuItem value="exact">Exact</MenuItem>
                        <MenuItem value="starts">Starts with</MenuItem>
                        <MenuItem value="ends">Ends with</MenuItem>
                    </Select>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Search secure files"
                        value={secureFilesSearch}
                        onChange={e => setSecureFilesSearch(e.target.value)}
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
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading secure files...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : secureFiles.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No secure files found.
                </Typography>
            ) : pagedFiles.length === 0 ? (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                        mt: 2,
                        textAlign: 'center',
                        width: '100%',
                        color: 'black',
                        backgroundColor: 'rgba(128,128,128,0.08)',
                        borderRadius: 1,
                        py: 2
                    }}
                >
                    No secure files found.
                </Typography>
            ) : (
                pagedFiles.map((sf) => {
                    return (
                        <Accordion
                            key={sf.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{sf.name || 'N/A'}</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {sf.id}<br />
                                    <strong>Name:</strong> {sf.name || 'N/A'}<br />
                                    <strong>Project:</strong> {sf.k_project?.name || 'N/A'}<br />
                                    <strong>Created By:</strong> {sf.createdBy?.displayName || 'N/A'} ({sf.createdBy?.uniqueName || 'N/A'})<br />
                                    <strong>Created On:</strong> {sf.createdOn ? dayjs(sf.createdOn).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Modified By:</strong> {sf.modifiedBy?.displayName || 'N/A'} ({sf.modifiedBy?.uniqueName || 'N/A'})<br />
                                    <strong>Modified On:</strong> {sf.modifiedOn ? dayjs(sf.modifiedOn).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Azure DevOps Link:</strong> {sf.k_project?.self_attribute ? (
                                        <a href={sf.k_project.self_attribute} target="_blank" rel="noopener noreferrer">View in Azure DevOps</a>
                                    ) : 'N/A'}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                <Button
                    onClick={() => setSecureFilesPage((prev) => Math.max(prev - 1, 1))}
                    disabled={secureFilesPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {secureFilesPage} of {Math.max(1, Math.ceil(secureFilesTotal / secureFilesPerPage))}
                </Typography>
                <Button
                    onClick={() => setSecureFilesPage((prev) => prev + 1)}
                    disabled={secureFilesPage * secureFilesPerPage >= secureFilesTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
}


SecureFilesTab.propTypes = {
    projectId: PropTypes.string.isRequired
};

export default SecureFilesTab;