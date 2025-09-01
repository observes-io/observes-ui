import { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const initialJobs = [
  { id: '1', content: 'SAST' },
  { id: '2', content: 'CICD' },
];

const DraggableItem = ({ id, content }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <ListItem ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <ListItemText primary={content} />
    </ListItem>
  );
};

const DroppableArea = ({ id, children }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <Paper ref={setNodeRef} sx={{ width: '45%', padding: 2 }}>
      {children}
    </Paper>
  );
};

const TemplateManagement = () => {
  const [jobs, setJobs] = useState(initialJobs);
  const [pipeline, setPipeline] = useState([]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && over.id === 'pipeline') {
      const job = jobs.find((job) => job.id === active.id);
      setPipeline([...pipeline, job]);
    }
  };

  const handleRemove = (id) => {
    setPipeline(pipeline.filter((job) => job.id !== id));
  };

  return (
    <Box>
      <DndContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <DroppableArea id="jobs">
            <Typography variant="h6">Available Jobs</Typography>
            <List>
              {jobs.map((job) => (
                <DraggableItem key={job.id} id={job.id} content={job.content} />
              ))}
            </List>
          </DroppableArea>
          <DroppableArea id="pipeline">
            <Typography variant="h6">Pipeline Builder</Typography>
            <List>
              {pipeline.map((job) => (
                <ListItem key={job.id}>
                  <ListItemText primary={job.content} />
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemove(job.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </DroppableArea>
        </Box>
      </DndContext>
    </Box>
  );
};

export default TemplateManagement;