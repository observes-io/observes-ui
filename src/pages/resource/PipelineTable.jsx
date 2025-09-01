import React, { useState, useEffect, useRef } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
    Badge,
    Box,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Collapse,
    Typography,
    List,
    ListItem,
    ListItemText,
    Grid,
    Accordion, AccordionSummary, AccordionDetails,
    Tab,
    TablePagination,
    Link
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, ErrorOutline } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as d3 from 'd3';
import resourceTypeStyle from '../theme/resourceTypeStyle.js';
import { CheckCircle, Cancel } from '@mui/icons-material';
import MemoryIcon from '@mui/icons-material/Memory';
import FolderIcon from '@mui/icons-material/Folder';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import KeyIcon from '@mui/icons-material/Key';
import MailLockIcon from '@mui/icons-material/MailLock';
import PipelineDetail from './PipelineDetail';


const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options).replace(',', '');
};

const formatResourcePermissions = (permissions) => {
    let formatedPermissions = {};
    permissions.forEach((permission) => {
        let [type, id] = permission.split(/_(?=[^_]*$)/);
        if (type !== 'queue') {
            if (!formatedPermissions[type]) {
                formatedPermissions[type] = [];
            }
            formatedPermissions[type].push(permission);
        }
    })

    return formatedPermissions;
}

const formatKey = (key) => {
    switch (key.toLowerCase()) {
        case 'repository':
            return 'Repositories';
        case 'endpoint':
            return 'Service Connections';
        case 'pool_merged':
            return 'Pools';
        case 'variablegroup':
            return 'Variable Groups';
        case 'securefile':
            return 'Secure File';
        default:
            return key;
    }
};



const PipelineTable = ({ filteredPipelines, filterFocus, filteredBadge, filteredResourcesTypes_Ids, builds, repositories, variableGroups, secureFiles, pools, endpoints, resourceTypeSelected, setResourceTypeSelected, getProtectedResourcesByOrgTypeAndIdsSummary, selectedScan }) => {
    const [openRows, setOpenRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [highlightedPipelines, setHighlightedPipelines] = useState(new Set());



    useEffect(() => {
        if (filteredPipelines === null) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [filteredPipelines]);

    useEffect(() => {
        const highlighted = new Set();
        Object.values(filteredPipelines).map((pipeline) => {
            if (pipeline.resourcepermissions) {
                Object.entries(pipeline.resourcepermissions).forEach(([key, value]) => {
                    if (value.some((id) => filteredResourcesTypes_Ids.includes(key + "_" + id))) {
                        highlighted.add(pipeline.id);
                    }
                });
            }
        });
        setHighlightedPipelines(highlighted);
    }, [filteredPipelines, filteredResourcesTypes_Ids]);

    const handleClick = (id) => {
        setOpenRows((prevOpenRows) => ({
            ...prevOpenRows,
            [id]: !prevOpenRows[id],
        }));
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };



    return (
        <TableContainer
            sx={{
                mt: 3,
                mb: 3,
                mx: 2,
                ...(filterFocus && {
                    border: "1px solid grey",
                    boxShadow: "0 0 5px grey",
                }),
            }}
            component={Paper}
        >
            <Typography
                variant="h6"
                sx={{
                    mt: 3,
                    mb: 2,
                    alignSelf: "center",
                    alignContent: "center",
                    textAlign: "center",
                    color: '#5669b3'
                }}
            >
                Pipelines
                <Badge
                    badgeContent={filteredBadge}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                >
                    <FilterAltIcon fontSize="small" sx={{ marginLeft: 1 }} />
                </Badge>
            </Typography>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Pipeline Name</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Type</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Created</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Project Name</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>Repository</TableCell>
                        <TableCell sx={{ overflow: 'hidden', textAlign: 'center' }}>PBAC</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.values(filteredPipelines).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((pipeline) => (
                        <React.Fragment key={pipeline.id}>
                            <TableRow
                                sx={{
                                    ...(highlightedPipelines.has(pipeline.id) && {
                                        backgroundColor: 'rgba(232, 202, 240, 0.3)', // Highlight row
                                    }),
                                }}
                            >
                                <TableCell>
                                    <IconButton
                                        aria-label={openRows[pipeline.id] ? "close row" : "expand row"}
                                        size="small"
                                        onClick={() => setOpenRows((prev) => ({ ...prev, [pipeline.id]: !prev[pipeline.id] }))}
                                    >
                                        {openRows[pipeline.id] ? (
                                            <KeyboardArrowUp />
                                        ) : (
                                            <KeyboardArrowDown />
                                        )}
                                    </IconButton>
                                </TableCell>
                                <TableCell>
                                    <Link href={pipeline._links.web.href} target="_blank" rel="noopener noreferrer" underline="hover">
                                        {pipeline.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{pipeline.type}</TableCell>
                                <TableCell><Link href={pipeline.authoredBy.url} target="_blank" rel="noopener noreferrer">
                                    {pipeline.authoredBy.displayName}
                                </Link> on {formatDate(pipeline.createdDate)} </TableCell>
                                <TableCell sx={{ overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            alignContent: 'center',
                                            alignItems: 'center',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                        }}
                                    >
                                        <Box
                                            key={pipeline.project.id}
                                            sx={(theme) => ({
                                                backgroundColor: theme.palette.action.selected,
                                                color: theme.palette.text.primary,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.9em',
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                            })}
                                            title={pipeline.project.name}
                                        >
                                            {pipeline.project.name}
                                        </Box>

                                    </Box>

                                </TableCell>
                                <TableCell>
                                    {pipeline.repository?.url ? (
                                        <a
                                            href={pipeline.repository.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'blue', textDecoration: 'underline' }}
                                        >
                                            {pipeline.repository.name}
                                        </a>
                                    ) : (
                                        pipeline.repository?.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {pipeline.resourcepermissions ? (
                                        Object.entries(pipeline.resourcepermissions).map(([key, value]) => (
                                            key.toLowerCase() === 'queue' ? null : (
                                                <Box
                                                    key={key}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: 1,
                                                        borderRadius: '4px',
                                                        padding: '4px',
                                                        ...(value.some((id) => filteredResourcesTypes_Ids.includes(key + "_" + id)) && {
                                                            border: '1px solid purple',
                                                            boxShadow: "0 0 5px grey",
                                                        })
                                                    }}
                                                >
                                                    <Tooltip title={formatKey(key)} placement="left">
                                                        <Badge
                                                            badgeContent={value.length}
                                                            color="secondary"
                                                            sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                                                        >
                                                            {(() => {
                                                                switch (key.toLowerCase()) {
                                                                    case 'pool_merged':
                                                                        return <MemoryIcon fontSize="small" />;
                                                                    case 'repository':
                                                                        return <FolderIcon fontSize="small" />;
                                                                    case 'endpoint':
                                                                        return <FingerprintIcon fontSize="small" />;
                                                                    case 'variablegroup':
                                                                        return <KeyIcon fontSize="small" />;
                                                                    case 'securefile':
                                                                        return <MailLockIcon fontSize="small" />;
                                                                    default:
                                                                        return <ErrorOutline fontSize="small" />;
                                                                }
                                                            })()}
                                                        </Badge>
                                                    </Tooltip>
                                                </Box>
                                            )
                                        ))
                                    ) : (
                                        <></>
                                    )}
                                </TableCell>
                            </TableRow>
                            {openRows[pipeline.id] && (
                                <TableRow>
                                    <TableCell
                                        style={{ paddingBottom: 0, paddingTop: 0 }}
                                        colSpan={8}
                                    >
                                        <Collapse
                                            in={openRows[pipeline.id]}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <Box margin={1}>
                                                <PipelineDetail builds={builds} pipeline={pipeline} filteredResourcesTypes_Ids={filteredResourcesTypes_Ids} formatKey={formatKey} repositories={repositories}
                                                    endpoints={endpoints}
                                                    secureFiles={secureFiles}
                                                    pools={pools}
                                                    variableGroups={variableGroups}
                                                    resourceTypeSelected={resourceTypeSelected}
                                                    setResourceTypeSelected={setResourceTypeSelected}
                                                    getProtectedResourcesByOrgTypeAndIdsSummary={getProtectedResourcesByOrgTypeAndIdsSummary}
                                                    selectedScan={selectedScan}
                                                />
                                                <Box sx={{ textAlign: 'right', mt: 1 }}>
                                                    <IconButton aria-label="close row" size="small" onClick={() => setOpenRows((prev) => ({ ...prev, [pipeline.id]: false }))}>
                                                        <KeyboardArrowUp /> Close
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPipelines.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </TableContainer>
    );
};

export default PipelineTable;