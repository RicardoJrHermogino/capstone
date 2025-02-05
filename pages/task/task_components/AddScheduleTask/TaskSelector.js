import React from 'react';
import { FormControl, InputAdornment, MenuItem, OutlinedInput, Select, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const TaskSelector = ({ availableTasks, selectedTask, handleTaskChange }) => {
  return (
    <FormControl fullWidth>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Task
      </Typography>
      <Select
        value={selectedTask?.task_name || ''}
        onChange={handleTaskChange}
        input={
          <OutlinedInput
            label="Task"
            startAdornment={<InputAdornment position="start"><LocationOnIcon /></InputAdornment>}
          />
        }
        sx={{ backgroundColor: "#f5f7fa", borderRadius: "10px" }}
        MenuProps={{ PaperProps: { style: { maxHeight: 560 } } }}
      >
        {availableTasks.map((task) => (
          <MenuItem key={task.id} value={task.task_name}>
            {task.task_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TaskSelector;
