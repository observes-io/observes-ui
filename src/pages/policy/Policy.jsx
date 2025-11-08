/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Card, CardContent, Container, Paper,
  Chip, Alert, AlertTitle
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import PolicyIcon from '@mui/icons-material/Policy';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BuildIcon from '@mui/icons-material/Build';
import { useColorScheme } from '@mui/material/styles';

import useStore from '../../state/stores/store';

// Future features for compliance policies
const plannedFeatures = [
  {
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
    title: "Saved Search Policies",
    description: "Convert saved searches into compliance policies with automated monitoring and alerting",
    status: "Planning"
  },
  {
    icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
    title: "Resource Compliance",
    description: "Define compliance rules for service connections, variable groups, and other DevOps resources",
    status: "Design"
  },
  {
    icon: <BuildIcon sx={{ fontSize: 40 }} />,
    title: "Pipeline Governance",
    description: "Enforce pipeline standards and security requirements across all build and release processes",
    status: "Research"
  }
];

// Coming Soon Features Component
const ComingSoonFeature = ({ feature }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return 'info';
      case 'Design': return 'warning';
      case 'Research': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Box sx={{ color: 'primary.main', mb: 2 }}>
          {feature.icon}
        </Box>
        <Typography variant="h6" gutterBottom>
          {feature.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
          {feature.description}
        </Typography>

      </CardContent>
    </Card>
  );
};



const Policy = () => {
  const { systemMode } = useColorScheme();
  const { setCurrentPage } = useStore();

  useEffect(() => {
    setCurrentPage('policy');
  }, [setCurrentPage]);




  return (
    <Box sx={{ p: 3, minHeight: '80vh' }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
          <ConstructionIcon sx={{ fontSize: 48, color: 'warning.main' }} />
          <PolicyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        </Box>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: 'primary.main' }}>
          Compliance Manager
        </Typography>
      </Box>

      {/* Under Construction Alert */}
      <Container maxWidth="md" sx={{ mb: 4 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Coming Soon</AlertTitle>
          This page is currently under development. The compliance manager will enable you to build policies 
          that focus on resources and pipelines using saved search functionality.
        </Alert>
      </Container>

      {/* Planned Features */}
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 4, color: 'text.primary' }}>
          Planned Features
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
          gap: 3,
          mb: 6 
        }}>
          {plannedFeatures.map((feature, index) => (
            <ComingSoonFeature key={index} feature={feature} />
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Policy;