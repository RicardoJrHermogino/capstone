import React, { useState, useEffect } from "react";
import { FormControl, Grid, TextField, Autocomplete } from "@mui/material";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { locationCoordinates } from "@/utils/locationCoordinates";

const LocationSelect = ({ setLocation, initialLocation }) => {
  const [location, setLocalLocation] = useState(initialLocation || "");
  const [inputValue, setInputValue] = useState(initialLocation || "");

  // Update local state when initialLocation prop changes
  useEffect(() => {
    if (initialLocation) {
      setLocalLocation(initialLocation);
      setInputValue(initialLocation);
    }
  }, [initialLocation]);

  const handleLocationChange = (event, newLocation) => {
    if (newLocation) {
      setLocalLocation(newLocation);
      setLocation(newLocation);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    if (!/\d/.test(newInputValue)) {
      setInputValue(newInputValue);
    }
  };

  return (
    <Grid item xs={12}>
      <FormControl fullWidth>
      <Autocomplete
            value={location}
            onChange={handleLocationChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            options={Object.keys(locationCoordinates)}
            renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select Location"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <LocationOnIcon sx={{ mr: 1 }} />,

                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "transparent", // Transparent input background
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#ccc", // Border color
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#48ccb4", // Hover border color
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#48ccb4", // Focus border color
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <LocationOnIcon sx={{ mr: 1 }} />
                        {option}
                      </li>
                    )}
        />

      </FormControl>
    </Grid>
  );
};

export default LocationSelect;