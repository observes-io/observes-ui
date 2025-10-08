/*
SPDX-FileCopyrightText: 2025 Observes.io
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Link,
    Chip,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

// GitHub API constants
const GITHUB_API = 'https://api.github.com/repos/observes-io/supply-chain/contents';

// Fetch list of components (folders)
async function fetchComponents() {
    const res = await fetch(GITHUB_API);
    const folders = await res.json();
    return folders.filter(f => f.type === 'dir').map(f => f.name);
}

// Fetch list of versions for a component
async function fetchVersions(component) {
    const res = await fetch(`${GITHUB_API}/${component}`);
    const versions = await res.json();
    return versions.filter(v => v.type === 'dir').map(v => v.name);
}

// Fetch SBOM JSON for a component/version
async function fetchSBOM(component, version) {
    const rawUrl = `https://raw.githubusercontent.com/observes-io/supply-chain/main/${component}/${version}/sbom.json`;
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error('SBOM not found');
    return await res.json();
}

// Get direct dependencies from SBOM
function getDirectDependencies(sbom) {
    if (!sbom.metadata?.component?.['bom-ref'] || !sbom.dependencies) {
        return [];
    }

    let rootRef = sbom.metadata.component['bom-ref'];

    // Check if metadata properties indicate a different component type
    const componentTypeProperty = sbom.metadata.properties?.find(p => p.name === 'cdx:bom:componentTypes');
    if (componentTypeProperty && componentTypeProperty.value === 'pypi') {
        // Replace 'application' with 'pypi' in the bom-ref
        rootRef = rootRef.replace('pkg:application/', 'pkg:pypi/');
    }

    const rootDependency = sbom.dependencies.find(dep => dep.ref === rootRef);

    if (!rootDependency?.dependsOn) {
        return [];
    }

    // Get component details for each direct dependency
    return rootDependency.dependsOn.map(bomRef => {
        const component = sbom.components?.find(c => c['bom-ref'] === bomRef);
        return component;
    }).filter(Boolean);
}

// Get dependencies for a specific component (recursive)
function getDependencyTree(bomRef, sbom, visited = new Set()) {
    if (visited.has(bomRef)) {
        return []; // Prevent circular dependencies
    }
    visited.add(bomRef);

    const dependency = sbom.dependencies?.find(dep => dep.ref === bomRef);
    if (!dependency?.dependsOn) {
        return [];
    }

    return dependency.dependsOn.map(childBomRef => {
        const component = sbom.components?.find(c => c['bom-ref'] === childBomRef);
        if (!component) return null;

        return {
            component,
            children: getDependencyTree(childBomRef, sbom, new Set(visited))
        };
    }).filter(Boolean);
}

// Render dependency tree recursively
function renderDependencyTree(dependencies, depth = 0) {
    if (!dependencies || dependencies.length === 0) return null;

    return dependencies.map((dep, i) => {
        const { component, children } = dep;
        const license = component.licenses && component.licenses.length > 0 ? component.licenses[0].license : null;
        const pkgUrl = getPackageUrl(component.purl);
        const indent = depth * 20;

        return (
            <Box key={component['bom-ref'] || i} sx={{ ml: `${indent}px`, mb: 1 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    backgroundColor: depth > 0 ? 'grey.50' : 'transparent',
                    borderLeft: depth > 0 ? '2px solid #ccc' : 'none',
                    borderRadius: 1
                }}>
                    <Typography variant="body2" sx={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}>
                        {component.group ? `${component.group}/` : ''}{component.name}
                    </Typography>
                    <Chip label={component.version} size="small" sx={{ ml: 1 }} />
                    {license && (
                        <Chip
                            label={license.id || 'Licensed'}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                        />
                    )}
                    {pkgUrl && (
                        <Link
                            href={pkgUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ ml: 1, fontSize: '0.75rem' }}
                        >
                            View
                        </Link>
                    )}
                </Box>
                {children && children.length > 0 && renderDependencyTree(children, depth + 1)}
            </Box>
        );
    });
}

// Generate package manager URL from PURL
function getPackageUrl(purl) {
    if (!purl) return null;

    const match = purl.match(/^pkg:([^/]+)\/([^@]+)@([^?]+)/);
    if (!match) return null;

    const [, type, name, version] = match;

    switch (type) {
        case 'npm':
            return `https://www.npmjs.com/package/${name}/v/${version}`;
        case 'pypi':
            return `https://pypi.org/project/${name}/${version}/`;
        case 'maven':
            return `https://search.maven.org/search?q=g:${name.split('/')[0]}+AND+a:${name.split('/')[1]}+AND+v:${version}`;
        case 'nuget':
            return `https://www.nuget.org/packages/${name}/${version}`;
        default:
            return null;
    }
}

export default function ThirdPartyComponents() {
    const [components, setComponents] = useState([]);
    const [versions, setVersions] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [sbom, setSBOM] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedAccordions, setExpandedAccordions] = useState(new Set());
    const [dependencyTrees, setDependencyTrees] = useState({});

    // On mount, fetch components
    useEffect(() => {
        setLoading(true);
        fetchComponents()
            .then(list => {
                setComponents(list);
                if (list.length) setSelectedComponent(list[0]);
            })
            .catch(e => setError(e.message || 'Failed to fetch components'))
            .finally(() => setLoading(false));
    }, []);

    // When selectedComponent changes, fetch versions
    useEffect(() => {
        if (!selectedComponent) return;
        setLoading(true);
        fetchVersions(selectedComponent)
            .then(list => {
                // Sort highest version first
                const sorted = list.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
                setVersions(sorted);
                if (sorted.length) setSelectedVersion(sorted[0]);
            })
            .catch(e => setError(e.message || 'Failed to fetch versions'))
            .finally(() => setLoading(false));
    }, [selectedComponent]);

    // When both selectedComponent and selectedVersion are set, fetch SBOM
    useEffect(() => {
        if (!selectedComponent || !selectedVersion) return;
        setLoading(true);
        fetchSBOM(selectedComponent, selectedVersion)
            .then(json => {
                setSBOM(json);
                setDependencyTrees({}); // Clear cached dependency trees when SBOM changes
                setExpandedAccordions(new Set()); // Reset expanded accordions
            })
            .catch(e => setError(e.message || 'Failed to fetch SBOM'))
            .finally(() => setLoading(false));
    }, [selectedComponent, selectedVersion]);

    // Handle accordion expansion
    const handleAccordionChange = (bomRef) => (event, isExpanded) => {
        const newExpanded = new Set(expandedAccordions);
        if (isExpanded) {
            newExpanded.add(bomRef);
            // Load dependency tree if not already loaded
            if (!dependencyTrees[bomRef] && sbom) {
                const tree = getDependencyTree(bomRef, sbom);
                setDependencyTrees(prev => ({ ...prev, [bomRef]: tree }));
            }
        } else {
            newExpanded.delete(bomRef);
        }
        setExpandedAccordions(newExpanded);
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /><Typography>Loading...</Typography></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!components.length) return <Alert severity="info">No components found.</Alert>;

    const directDependencies = sbom ? getDirectDependencies(sbom) : [];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Third Party Components (SBOM)</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Component</InputLabel>
                    <Select
                        value={selectedComponent}
                        label="Component"
                        onChange={e => setSelectedComponent(e.target.value)}
                    >
                        {components.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Version</InputLabel>
                    <Select
                        value={selectedVersion}
                        label="Version"
                        onChange={e => setSelectedVersion(e.target.value)}
                    >
                        {versions.map((v) => (
                            <MenuItem key={v} value={v}>{v}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            {sbom && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Root Component: {sbom.metadata?.component?.name || 'Unknown'}
                        {sbom.metadata?.component?.version && (
                            <Chip label={sbom.metadata.component.version} size="small" sx={{ ml: 1 }} />
                        )}
                    </Typography>
                </Box>
            )}

            {directDependencies.length > 0 ? (
                <Box>
                    <Typography variant="h6" gutterBottom>Direct Dependencies ({directDependencies.length})</Typography>
                    {directDependencies.map((component, i) => {
                        const license = component.licenses && component.licenses.length > 0 ? component.licenses[0].license : null;
                        const pkgUrl = getPackageUrl(component.purl);
                        const bomRef = component['bom-ref'];
                        const isExpanded = expandedAccordions.has(bomRef);
                        const dependencyTree = dependencyTrees[bomRef] || [];

                        return (
                            <Accordion
                                key={bomRef || i}
                                expanded={isExpanded}
                                onChange={handleAccordionChange(bomRef)}
                                sx={{ mb: 2 }}
                            >
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                                            {component.group ? `${component.group}/` : ''}{component.name}
                                        </Typography>
                                        <Chip label={component.version} size="small" sx={{ ml: 1 }} />
                                        {license && (
                                            <Chip
                                                label={license.id || 'Licensed'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                        {pkgUrl && (
                                            <Link
                                                href={pkgUrl}
                                                target="_blank"
                                                rel="noopener"
                                                sx={{ ml: 1, fontSize: '0.875rem' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                View Package
                                            </Link>
                                        )}
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ p: 2, width: '100%' }}>
                                        {component.description && (
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Description:</strong> {component.description}
                                            </Typography>
                                        )}
                                        {license && (
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>License:</strong> {license.id}
                                                {license.url && (
                                                    <Link href={license.url} target="_blank" rel="noopener" sx={{ ml: 1 }}>
                                                        (View License)
                                                    </Link>
                                                )}
                                            </Typography>
                                        )}
                                        {isExpanded && (
                                            <>
                                                {dependencyTree.length > 0 ? (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                            Dependency Tree:
                                                        </Typography>
                                                        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, backgroundColor: '#fafafa' }}>
                                                            {renderDependencyTree(dependencyTree)}
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                                                        No transitive dependencies found
                                                    </Typography>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            ) : (
                <Typography>No direct dependencies found in SBOM.</Typography>
            )}
        </Box>
    );
}
