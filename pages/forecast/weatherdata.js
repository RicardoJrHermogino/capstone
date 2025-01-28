import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CssBaseline, Button, Skeleton, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, CircularProgress, IconButton, Badge, FormControl, InputLabel, Select, MenuItem, TextField  } from "@mui/material";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import axios from 'axios';


const WeatherData = () => {
  return (
    <>
                  <Grid item xs={12}>
                    <Typography color="#757575" sx={{fontSize: '0.8rem'}} textAlign={'center'}>
                      The average temperature for the next 5 days will be 21 degrees, it will rain for 7 days
                    </Typography>
                  </Grid>
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 5 }}>
                        <CardContent>
                            <Grid container spacing={6} sx={{ textAlign: "center" }}>
                                <Grid item xs={4}>
                                <Icon icon="uil:cloud-wind"  fontSize={45} />
                                <Typography variant="h6"  sx={{ mt: 1 }}>
                                    136
                                </Typography>
                                <Typography color="#b3b3b3">Air Quality</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                <Icon icon="lets-icons:pressure"  fontSize={45} />
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    846hpa
                                </Typography>
                                <Typography color="#b3b3b3">Pressure</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                <Icon icon="mdi:uv-ray-outline" fontSize={45} />
                                <Typography variant="h6"  sx={{ mt: 1 }}>
                                    2
                                </Typography>
                                <Typography color="#b3b3b3">UV</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                <Icon icon="mingcute:rain-line"  fontSize={45} />
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    4mm
                                </Typography>
                                <Typography color="#b3b3b3">Precipitation</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                <Icon icon="bx:wind" fontSize={45} />
                                <Typography variant="h6"  sx={{ mt: 1 }}>
                                    11km/h
                                </Typography>
                                <Typography color="#b3b3b3">Wind</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                <Icon icon="ph:eye-bold"  fontSize={45} />
                                <Typography variant="h6"  sx={{ mt: 1 }}>
                                    6.4 km
                                </Typography>
                                <Typography color="#b3b3b3">Visibility</Typography>
                                </Grid>
                            </Grid>
                    </CardContent>
                </Card>
                </Grid>
    </>
  );
};

export default WeatherData;