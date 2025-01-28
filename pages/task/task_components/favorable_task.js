import React, { useState } from 'react';
import { Grid, Typography, CssBaseline, Card, CardContent, Container, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box } from '@mui/material';
import { ArrowBack, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Navbar from '../../components/navbar';

const initialTasks = {
  FavorableTask: [
    { id: 1, name: 'Task 1', location: 'Location 1', date: '2024-05-01', time: '09:00' },
    { id: 2, name: 'Task 2', location: 'Location 2', date: '2024-05-02', time: '10:00' },
  ],
};

const gradientStyle = {
  padding: "20px",
  borderRadius: "5px"
};

const FavorableTask = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);

  const handleGoBack = () => {
    router.back();
  };

  const handleTaskDelete = (task) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = () => {
    setTasks(prevTasks => ({
      FavorableTask: prevTasks.FavorableTask.filter(t => t.id !== selectedTask.id)
    }));
    setOpenDialog(false);
  };

  const handleDeleteCancel = () => {
    setOpenDialog(false);
  };

  const handleTaskEdit = (task) => {
    setEditedTask(task);
    setOpenDialog(true);
  };

  const handleEditConfirm = () => {
    const updatedTasks = tasks.FavorableTask.map(t =>
      t.id === editedTask.id ? editedTask : t
    );
    setTasks({ FavorableTask: updatedTasks });
    setOpenDialog(false);
  };

  const handleEditCancel = () => {
    setEditedTask(null);
    setOpenDialog(false);
  };

  return (
    <>
      <CssBaseline />
          <IconButton onClick={handleGoBack} sx={{ position: 'absolute', top: 15, left: 20 }}>
            <ArrowBack />
          </IconButton>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom align="left"><strong> Feasible Tasks</strong></Typography>
            <Grid container spacing={2} mt={1}>
              {tasks.FavorableTask.map((task, index) => (
                <Grid item key={task.id} xs={12}>
                  <Card style={{ position: 'relative', zIndex: tasks.FavorableTask.length - index }}>
                    <CardContent>
                      <Typography variant="subtitle1">{task.name}</Typography>
                      <Typography variant="body2" color="textSecondary">{task.location}</Typography>
                      <Typography variant="body2" color="textSecondary">{task.date}</Typography>
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <IconButton aria-label="edit" onClick={() => handleTaskEdit(task)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton aria-label="delete" onClick={() => handleTaskDelete(task)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

      <Dialog open={openDialog} onClose={handleEditCancel}>
        <DialogTitle>{editedTask ? 'Edit Task' : 'Confirm Delete'}</DialogTitle>
        <DialogContent>
          {editedTask ? (
            <>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Name"
                fullWidth
                defaultValue={editedTask.name}
                onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
              />
              <TextField
                margin="dense"
                id="location"
                label="Location"
                fullWidth
                defaultValue={editedTask.location}
                onChange={(e) => setEditedTask({ ...editedTask, location: e.target.value })}
              />
              <TextField
                margin="dense"
                id="date"
                label="Date"
                fullWidth
                defaultValue={editedTask.date}
                onChange={(e) => setEditedTask({ ...editedTask, date: e.target.value })}
              />
            </>
          ) : (
            <Typography>Are you sure you want to delete {selectedTask?.name}?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={editedTask ? handleEditCancel : handleDeleteCancel}>Cancel</Button>
          <Button onClick={editedTask ? handleEditConfirm : handleDeleteConfirm} color="error">
            {editedTask ? 'Save' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FavorableTask;
