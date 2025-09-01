import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useTheme } from '@mui/material/styles';

const ResourceButtonGroup = ({ resourceTypes, resourceType, handleResourceTypeChange }) => {
    const theme = useTheme();
    return (
        <ButtonGroup
            variant="text"
            sx={{
                gap: 1,
                backgroundColor: 'transparent',
                border: 'none',
            }}
        >
            {resourceTypes.map((type, idx) => {
                const isActive = resourceType === type.value;
                return (
                    <Button
                        key={type.value}
                        onClick={() => handleResourceTypeChange(type.value)}
                        sx={{
                            color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
                            backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
                            fontWeight: isActive ? 700 : 400,
                            border: `1px solid ${theme.palette.divider}`,
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textTransform: 'none',
                            boxShadow: isActive ? theme.shadows[2] : 'none',
                            transition: 'all 0.3s ease',
                            marginLeft: idx !== 0 ? 1 : 0,
                            '&:hover': {
                                backgroundColor: isActive ? theme.palette.primary.dark : theme.palette.action.hover,
                                color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
                            },
                        }}
                    >
                        {type.label}
                    </Button>
                );
            })}
        </ButtonGroup>
    );
};

export default ResourceButtonGroup;
