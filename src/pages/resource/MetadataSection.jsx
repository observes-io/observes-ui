import React from 'react';
import {
  Grid,
  Typography,
  Link,
  Box
} from '@mui/material';

const MetadataSection = ({ build, pipeline, branch }) => {

  if (build) {
    const {
      buildNumber,
      result,
      status,
      reason,
      queue,
      repository,
      sourceBranch,
      _links,
      startTime,
      finishTime,
      definition
    } = build;

    return (
      <Box sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Execution of pipeline {definition.name} @ branch {sourceBranch}
        </Typography>
        <Grid container spacing={2}>
          <MetadataItem label="Build Number" value={buildNumber} />
          <MetadataItem label="Status" value={status} />
          <MetadataItem label="Result" value={result} />
          <MetadataItem label="Reason" value={reason} />
          <MetadataItem label="Queue" value={queue?.name} />
          <MetadataItem label="Repository" value={repository?.name} />
          <MetadataItem label="Branch" value={sourceBranch} />
          <MetadataItem label="Start Time" value={startTime} />
          <MetadataItem label="Finish Time" value={finishTime} />
          <MetadataItem
            value={
              <Link
                href={_links?.web?.href}
                target="_blank"
                rel="noopener"
                sx={{ color: '#007FFF' }} // Azure blue color
              >
                View in Azure
              </Link>
            }
          />
        </Grid>
      </Box>
    );
  }

  if (pipeline) {
    const {
      name,
      revision,
      authoredBy,
      createdDate,
      _links
    } = pipeline;

    return (
      <Box sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Potential Pipeline Execution {name} @ branch {branch}
        </Typography>
        <Grid container spacing={5}>
          <MetadataItem label="Revision" value={revision} />
          <MetadataItem label="Created By" value={authoredBy?.displayName} />
          <MetadataItem label="Created Date" value={createdDate} />
          <MetadataItem
            value={
              <Link
                href={_links?.web?.href}
                target="_blank"
                rel="noopener"
                sx={{ color: '#007FFF' }} // Azure blue color
              >
                View in Azure
              </Link>
            }
          />
        </Grid>
      </Box>
    );
  }
}

const MetadataItem = ({ label, value }) => (
  <Grid item xs={12}>
    <Box>
      <Typography variant="subtitle2" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Box>
  </Grid>
);

export default MetadataSection;