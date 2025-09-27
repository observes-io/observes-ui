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
    MenuItem,
    Select,
    Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import useStore from '../../../state/stores/store';

const VariableGroupsTab = ({ projectId }) => {
    const [variableGroups, setVariableGroups] = useState([]);
    const [variableGroupsTotal, setVariableGroupsTotal] = useState(0);
    const [variableGroupsPage, setVariableGroupsPage] = useState(1);
    const [variableGroupsSearch, setVariableGroupsSearch] = useState('');
    const [variableGroupsMatchType, setVariableGroupsMatchType] = useState('contains');
    const [variableGroupsSearchField, setVariableGroupsSearchField] = useState('name'); // 'name', 'id', 'type'
    const [variableGroupsPerPage, setVariableGroupsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { selectedScan, fetchProtectedResourcesByTypeOrgProject } = useStore();

    useEffect(() => {
        async function fetchGroups() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchProtectedResourcesByTypeOrgProject(selectedScan.id, 'variablegroup', projectId);
                    let allGroups = [];
                    if (result && Array.isArray(result.resources)) {
                        allGroups = result.resources;
                    } else {
                        allGroups = [];
                    }
                    setVariableGroups(allGroups);
                    setVariableGroupsTotal(allGroups.length);
                } else {
                    setVariableGroups([]);
                    setVariableGroupsTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch variable groups');
                setVariableGroups([]);
                setVariableGroupsTotal(0);
            }
            setLoading(false);
        }
        fetchGroups();
    }, [selectedScan, projectId, fetchProtectedResourcesByTypeOrgProject]);

    // Filtered groups and local pagination
    const filteredGroups = variableGroupsSearch
        ? variableGroups.filter(vg => {
            let fieldValue = '';
            if (variableGroupsSearchField === 'name') {
                fieldValue = vg.name?.toLowerCase() || '';
            } else if (variableGroupsSearchField === 'variable') {
                // Search variable names
                fieldValue = Object.keys(vg.variables || {}).join(' ').toLowerCase();
            }
            const search = variableGroupsSearch.toLowerCase();
            switch (variableGroupsMatchType) {
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
        : variableGroups;

    // Count of all shared groups (from filteredGroups)
    const sharedCount = filteredGroups.filter(vg => vg.isShared).length;

    // Local pagination
    const pagedGroups = filteredGroups.slice((variableGroupsPage - 1) * variableGroupsPerPage, variableGroupsPage * variableGroupsPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setVariableGroupsPage(1); }, [variableGroupsSearch, variableGroupsMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredGroups.length;
                            const start = filteredTotal === 0 ? 0 : (variableGroupsPage - 1) * variableGroupsPerPage + 1;
                            const end = Math.min(variableGroupsPage * variableGroupsPerPage, filteredTotal);
                            return `Variable Groups (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for variable groups */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={variableGroupsSearchField}
                        onChange={e => setVariableGroupsSearchField(e.target.value)}
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
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="variable">Variable Name</MenuItem>
                    </Select>
                    <Select
                        size="small"
                        value={variableGroupsMatchType}
                        onChange={e => setVariableGroupsMatchType(e.target.value)}
                        sx={{
                            width: 120,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 'none',
                            ml: '-1px',
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
                        placeholder={`Search by ${variableGroupsSearchField}`}
                        value={variableGroupsSearch}
                        onChange={e => setVariableGroupsSearch(e.target.value)}
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
                {/* Chip counter for shared */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
                    <Chip label={`Shared: ${sharedCount}`} color="info" size="small" />
                </Box>
            </Box>
            {loading ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading variable groups...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : variableGroups.length === 0 ? (
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
                    No variable groups found.
                </Typography>
            ) : pagedGroups.length === 0 ? (
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
                    No variable groups found.
                </Typography>
            ) : (
                pagedGroups.map((vg) => {
                    const displayName = `${vg.name || 'N/A'}`;

                    // Shared chip logic (k_project_shared_from is an array)
                    let sharedChip = null;
                    if (vg.isShared && Array.isArray(vg.k_project_shared_from)) {
                        const isSharedOut = vg.k_project_shared_from.some(f => f.id === projectId);
                        if (isSharedOut) {
                            sharedChip = <Chip label="Shared Out" color="info" size="small" sx={{ ml: 1 }} />;
                        } else {
                            sharedChip = <Chip label="Shared In" color="secondary" size="small" sx={{ ml: 1 }} />;
                        }
                    }

                    return (
                        <Accordion
                            key={vg.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{displayName}</Typography>
                                    {sharedChip}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {vg.id}<br />
                                    <strong>Name:</strong> {vg.name || 'N/A'}<br />
                                    <strong>Description:</strong> {vg.description || 'N/A'}<br />
                                    <strong>Type:</strong> {vg.type || 'N/A'}<br />
                                    {/* <strong>Project:</strong> {vg.k_project?.name || 'N/A'}<br /> */}
                                    <strong>Created By:</strong> {vg.createdBy?.displayName || 'N/A'} ({vg.createdBy?.uniqueName || 'N/A'})<br />
                                    <strong>Created On:</strong> {vg.createdOn ? dayjs(vg.createdOn).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Modified By:</strong> {vg.modifiedBy?.displayName || 'N/A'} ({vg.modifiedBy?.uniqueName || 'N/A'})<br />
                                    <strong>Modified On:</strong> {vg.modifiedOn ? dayjs(vg.modifiedOn).format('YYYY-MM-DD HH:mm') : 'N/A'}<br />
                                    <strong>Variables:</strong><br />
                                    {vg.variables && Object.keys(vg.variables).length > 0 ? (
                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                            {Object.entries(vg.variables).map(([varName, varObj]) => (
                                                <li key={varName}>
                                                    <strong>{varName}:</strong> {varObj.isSecret ? <em>***</em> : (varObj.value ?? 'N/A')}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : 'N/A'}
                                    <br />
                                    {/* <strong>Pipeline Permissions:</strong> {Array.isArray(vg.pipelinepermissions) && vg.pipelinepermissions.length > 0 ? vg.pipelinepermissions.join(', ') : 'N/A'}<br /> */}
                                    <strong>URL:</strong> {vg.k_project?.self_attribute ? (
                                        <a href={vg.k_project.self_attribute} target="_blank" rel="noopener noreferrer">View in Azure DevOps</a>
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
                    onClick={() => setVariableGroupsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={variableGroupsPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {variableGroupsPage} of {Math.max(1, Math.ceil(variableGroupsTotal / variableGroupsPerPage))}
                </Typography>
                <Button
                    onClick={() => setVariableGroupsPage((prev) => prev + 1)}
                    disabled={variableGroupsPage * variableGroupsPerPage >= variableGroupsTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
}

VariableGroupsTab.propTypes = {
    projectId: PropTypes.string.isRequired
};

export default VariableGroupsTab;