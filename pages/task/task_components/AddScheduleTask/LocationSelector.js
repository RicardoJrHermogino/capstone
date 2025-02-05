import React from 'react';
import { Autocomplete, FormControl, TextField, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const LocationSelector = ({ location, locationInput, handleLocationChange, setLocationInput, locationOptions }) => {
  return (
    <FormControl fullWidth>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Location
      </Typography>
      <Autocomplete
        value={location}
        onChange={handleLocationChange}
        inputValue={locationInput}
        onInputChange={(event, newInputValue) => {
          if (!/\d/.test(newInputValue)) {
            setLocationInput(newInputValue);
          }
        }}
        options={locationOptions}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Select Location"
            InputProps={{
              ...params.InputProps,
              startAdornment: <LocationOnIcon sx={{ mr: 1 }} />
            }}
            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#f5f7fa", borderRadius: "10px" } }}
          />
        )}
      />
    </FormControl>
  );
};

export default LocationSelector;
