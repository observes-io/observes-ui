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
} from '@mui/material';
import dayjs from 'dayjs';
import useStore from '../../../state/stores/store';

const QueuesTab = ({ projectId }) => {
    const [queues, setQueues] = useState([]);
    const [queuesTotal, setQueuesTotal] = useState(0);
    const [queuesPage, setQueuesPage] = useState(1);
    const [queuesSearch, setQueuesSearch] = useState('');
    const [queuesMatchType, setQueuesMatchType] = useState('contains');
    const [queuesPerPage, setQueuesPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { selectedScan, fetchProtectedResourcesByTypeOrgProject } = useStore();

    useEffect(() => {
        async function fetchQueues() {
            setLoading(true);
            setError(null);
            try {
                if (selectedScan && selectedScan.id && projectId) {
                    const result = await fetchProtectedResourcesByTypeOrgProject(selectedScan.id, 'queue', projectId);
                    let allQueues = [];
                    if (result && Array.isArray(result.resources)) {
                        allQueues = result.resources;
                    } else {
                        allQueues = [];
                    }
                    setQueues(allQueues);
                    setQueuesTotal(allQueues.length);
                } else {
                    setQueues([]);
                    setQueuesTotal(0);
                }
            } catch (err) {
                setError('Failed to fetch queues');
                setQueues([]);
                setQueuesTotal(0);
            }
            setLoading(false);
        }
        fetchQueues();
    }, [selectedScan, projectId, fetchProtectedResourcesByTypeOrgProject]);

    // Filtered queues and local pagination
    const filteredQueues = queuesSearch
        ? queues.filter(q => {
            let fieldValue = q.name?.toLowerCase() || '';
            const search = queuesSearch.toLowerCase();
            switch (queuesMatchType) {
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
        : queues;

    // Local pagination
    const pagedQueues = filteredQueues.slice((queuesPage - 1) * queuesPerPage, queuesPage * queuesPerPage);

    // Reset to page 1 if search changes
    useEffect(() => { setQueuesPage(1); }, [queuesSearch, queuesMatchType]);

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mr: 2 }}>
                    {
                        (() => {
                            const filteredTotal = filteredQueues.length;
                            const start = filteredTotal === 0 ? 0 : (queuesPage - 1) * queuesPerPage + 1;
                            const end = Math.min(queuesPage * queuesPerPage, filteredTotal);
                            return `Queues (${start}-${end} of ${filteredTotal})`;
                        })()
                    }
                </Typography>
                {/* InputGroup-like filter controls for queues */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <Select
                        size="small"
                        value={queuesMatchType}
                        onChange={e => setQueuesMatchType(e.target.value)}
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
                        placeholder="Search queues"
                        value={queuesSearch}
                        onChange={e => setQueuesSearch(e.target.value)}
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
                    Loading queues...
                </Typography>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            ) : queues.length === 0 ? (
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
                    No queues found.
                </Typography>
            ) : pagedQueues.length === 0 ? (
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
                    No queues found.
                </Typography>
            ) : (
                pagedQueues.map((q) => {
                    return (
                        <Accordion
                            key={q.id}
                            sx={{
                                mt: 1,
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <AccordionSummary expandIcon={"+"}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{q.name || 'N/A'}</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>ID:</strong> {q.id}<br />
                                    <strong>Name:</strong> {q.name || 'N/A'}<br />
                                    <strong>Project:</strong> {q.k_project?.name || 'N/A'}<br />
                                    <strong>Pool Name:</strong> {q.pool?.name || 'N/A'}<br />
                                    <strong>Pool Type:</strong> {q.pool?.poolType || 'N/A'}<br />
                                    <strong>Hosted:</strong> {q.pool?.isHosted ? 'Yes' : 'No'}<br />
                                    <strong>Azure DevOps Link:</strong> {q.k_project?.self_attribute ? (
                                        <a href={q.k_project.self_attribute} target="_blank" rel="noopener noreferrer">View in Azure DevOps</a>
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
                    onClick={() => setQueuesPage((prev) => Math.max(prev - 1, 1))}
                    disabled={queuesPage === 1}
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Typography variant="caption" sx={{ mx: 1 }}>
                    Page {queuesPage} of {Math.max(1, Math.ceil(queuesTotal / queuesPerPage))}
                </Typography>
                <Button
                    onClick={() => setQueuesPage((prev) => prev + 1)}
                    disabled={queuesPage * queuesPerPage >= queuesTotal}
                    sx={{ mr: 1 }}
                >
                    Next
                </Button>
            </Box>
        </Box>
    );
}

QueuesTab.propTypes = {
    projectId: PropTypes.string.isRequired,
};

export default QueuesTab;