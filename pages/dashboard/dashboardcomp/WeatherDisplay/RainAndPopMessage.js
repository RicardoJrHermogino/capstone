// RainAndPopMessage.js
import React from 'react';
import { Typography } from '@mui/material';

const RainAndPopMessage = ({ pop, rain3h }) => {
  // Determine the rain message based on the pop and rain3h values
  let rainMessage = '';

  if (pop >= 0.7) {
    rainMessage = `There is a high chance of rain for this date and location about ${Math.round(pop * 100)}%. Make sure your crops are protected!`;
  } else if (rain3h > 0.1) {
    rainMessage = `It has rained recently. Expect slightly wet conditions for the next few hours.`;
  } else if (rain3h <= 0.1 && pop > 0) {
    rainMessage = `Light rain is possible today, with a chance of ${Math.round(pop * 100)}%. Keep an eye on the sky!`;
  } else {
    rainMessage = 'No significant rain expected. A good time for farming!';
  }

  return (
    <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '0.80rem', sm: '0.875rem' }, color: '#757575' }}>
      {rainMessage}
    </Typography>
  );
};

export default RainAndPopMessage;
