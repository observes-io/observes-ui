/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    IconButton,
    Paper,
    FormControl,
    Checkbox,
    Autocomplete
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DataQueryBuilder from './DataQueryBuilder.json';
import './QueryBuilder.css';
import useStore from '../../state/stores/store';


const QueryBuilder = ({ Title, TypeQueryBuilder, onSubmit, highlightCard }) => {
    const { selectedOrganisation, protectedResourcesGroup, fetchProtectedResourcesGroup, fetchLogicContainers  } = useStore();


    useEffect(() => {
        try {
            fetchLogicContainers();
        } catch (err) {
            console.error("Failed to fetch logic containers:", err);
        }
    }, []); // Only run once on mount


    const [conditions, setConditions] = useState([
        { component: "", field: "", negate: false, value: "" },
    ]);

    const components = DataQueryBuilder[TypeQueryBuilder] ? Object.keys(DataQueryBuilder[TypeQueryBuilder]).map(key => {
        const component = DataQueryBuilder[TypeQueryBuilder][key];
        return {
            key,
            label: component?.Label || "Unknown",
            fields: component?.fields || {}
        };
    }) : [];

    const handleAddCondition = () => {
        setConditions((prev) => [...prev, { component: "", field: "", negate: false, value: "" }]);
    };

    const handleRemoveCondition = (index) => {
        setConditions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleConditionChange = (index, field, value) => {
        setConditions((prev) => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const handleSubmit = async () => {
        try {
            onSubmit(conditions);
        } catch (err) {
            console.error("Error submitting query:", err);
        }
    };

    const getFields = (component) => {
        if (component) {
            return DataQueryBuilder[TypeQueryBuilder][component].fields;
        }
        return [];
    };

    const getFieldValues = (component, field) => {
        if (component && field) {
            const fieldData = DataQueryBuilder[TypeQueryBuilder][component].fields[field];
            if (fieldData) {
                switch (fieldData.select_value) {
                    case "direct":
                        return fieldData.select;
                    case "dynamic":
                        // @TODO get the data from fetchProtectedResourcesGroup.Resources[].Name instead of being static
                        return fieldData.select;
                    default:
                        return fieldData.select.map(item => item[fieldData.select_value]);
                }
            } else {
                return [];
            }
        }
        return [];
    };

    return (
        <Box>
            <Typography variant="h6">{Title}</Typography>
            <Paper
                elevation={1}
                sx={{
                    p: 3,
                    mb: 3,
                    mt: 1,
                    border: highlightCard ? '1px solid rgb(50, 71, 255)' : 'none',
                    transition: 'border-color 0.3s, box-shadow 0.3s, opacity 0.3s',
                    opacity: highlightCard ? 1 : 0.7,
                    "&:hover": {
                        borderColor: "#007bff", // Modern blue highlight
                        boxShadow: "0px 4px 12px rgba(33, 34, 36, 0.2)", // Soft glowing effect
                        opacity: 1,
                    },
                }}
            >
                {conditions.map((condition, index) => (
                    <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        mb={2}
                    >
                        <FormControl sx={{ minWidth: 120, width: '30%' }}>
                            <Autocomplete
                                options={components}
                                getOptionLabel={(option) => option.label}
                                value={components.find(component => component.key === condition.component) || null}
                                onChange={(event, newValue) =>
                                    handleConditionChange(index, "component", newValue ? newValue.key : "")
                                }
                                renderInput={(params) => <TextField {...params} label="Component" />}
                                sx={{
                                    "& .MuiAutocomplete-popupIndicator": {
                                        minWidth: "10px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"
                                    },
                                    "& .MuiAutocomplete-clearIndicator": {
                                        minWidth: "10px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"  // Make it a circle
                                    }
                                }}
                            />
                        </FormControl>
                        <FormControl sx={{ minWidth: 120, width: '30%' }}>
                            <Autocomplete
                                options={Object.keys(getFields(condition.component)).map((fieldKey) => ({
                                    key: fieldKey,
                                    label: getFields(condition.component)[fieldKey].label
                                }))}
                                getOptionLabel={(option) => option.label}
                                value={Object.keys(getFields(condition.component)).map((fieldKey) => ({
                                    key: fieldKey,
                                    label: getFields(condition.component)[fieldKey].label
                                })).find(field => field.key === condition.field) || null}
                                onChange={(event, newValue) =>
                                    handleConditionChange(index, "field", newValue ? newValue.key : "")
                                }
                                renderInput={(params) => <TextField {...params} label="Field" />}
                                disabled={!condition.component}
                                sx={{
                                    "& .MuiAutocomplete-popupIndicator": {
                                        minWidth: "20px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"
                                    },
                                    "& .MuiAutocomplete-clearIndicator": {
                                        minWidth: "20px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"  // Make it a circle
                                    },
                                }}
                            />
                        </FormControl>
                        <FormControl sx={{ minWidth: 120, width: '40%' }}>
                            <Autocomplete
                                options={getFieldValues(condition.component, condition.field)}
                                getOptionLabel={(option) => option}
                                value={condition.value || ""}
                                onChange={(event, newValue) =>
                                    handleConditionChange(index, "value", newValue || "")
                                }
                                renderInput={(params) => <TextField {...params} label="Value" />}
                                disabled={!condition.field || getFieldValues(condition.component, condition.field).length === 0}
                                sx={{
                                    "& .MuiAutocomplete-popupIndicator": {
                                        minWidth: "20px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"
                                    },
                                    "& .MuiAutocomplete-clearIndicator": {
                                        minWidth: "20px",  // Reduce width
                                        height: "80%",     // Reduce height
                                        padding: "2px",     // Adjust padding for better alignment
                                        border: "none"  // Make it a circle
                                    },
                                }}
                            />
                        </FormControl>
                        <label style={{ fontSize: '10px' }}>
                            Negate
                            <Checkbox
                                checked={condition.negate || false}
                                onChange={(e) =>
                                    handleConditionChange(index, "negate", e.target.checked)
                                }
                            />
                        </label>
                        <IconButton
                            color="error"
                            onClick={() => handleRemoveCondition(index)}
                        >
                            <DeleteIcon/>
                        </IconButton>
                    </Box>
                ))}
                <Button onClick={handleAddCondition} sx={{
                    fontSize: '0.875rem',    // Adjusts font size for a more compact look
                    textTransform: 'none',  // Removes uppercase text style
                    fontWeight: 400,        // Lighter font weight for subtlety
                    padding: '6px 12px',    // Minimal padding for a clean, simple look
                    borderRadius: '4px',    // Rounded corners for a soft look
                    color: 'grey', // Using secondary color for text
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',  // Subtle hover effect
                    },
                    '& .MuiButton-startIcon': {
                        marginRight: '8px',  // Adjusts space between the icon and text
                    },
                }}>
                    Add Condition
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleSubmit} sx={{
                    textTransform: 'none',
                    fontWeight: 400,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    }
                }}>
                    Submit Query
                </Button>
            </Paper>
        </Box>
    );
};

export default QueryBuilder;
