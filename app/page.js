'use client';

import React, {useEffect, useState, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Pagination
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function HomePage() {
    const router = useRouter();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const fetchPredictions = useCallback(async (page, limit) => {
        const storedUserId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!token || !storedUserId) {
            router.push('/login');
            return;
        }

        setUserId(storedUserId); // Ensure userId is set for conditional rendering
        setUsername(localStorage.getItem('username') || 'User');


        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/predictions/list/${storedUserId}?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || `Error: ${response.status} ${data.statusMessage}`);
                setPredictions([]);
                setTotalPages(0);
                setTotalItems(0);
            } else {
                if (data.data && data.data.predictions) {
                    setPredictions(data.data.predictions);
                    setTotalPages(data.data.pagination.totalPages || 0);
                    setTotalItems(data.data.pagination.totalItems || 0);
                    setCurrentPage(data.data.pagination.currentPage || 1);
                } else {
                    setPredictions([]);
                    setTotalPages(0);
                    setTotalItems(0);
                }
            }
        } catch (err) {
            console.error('Failed to fetch predictions:', err);
            setError('An unexpected error occurred while fetching predictions.');
            setPredictions([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');

        if (!token || !storedUserId) {
            router.push('/login');
        } else {
            setUserId(storedUserId);
            setUsername(localStorage.getItem('username') || 'User');
            fetchPredictions(currentPage, itemsPerPage);
        }
    }, [fetchPredictions, currentPage, itemsPerPage, router]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        router.push('/login');
    };

    const handlePredictNew = () => {
        router.push('/predict');
    };

    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (event) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    if (!userId && loading) {
        return (
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
                <CircularProgress sx={{color: '#606c38'}}/>
            </Container>
        );
    }


    return (
        <>
            <AppBar position="static" sx={{backgroundColor: '#606c38'}}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        Welcome, {username}
                    </Typography>
                    <Button
                        color="inherit"
                        startIcon={<AddCircleOutlineIcon/>}
                        onClick={handlePredictNew}
                        sx={{mr: 2}}
                    >
                        Predict New Data
                    </Button>
                    <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
                        <ExitToAppIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Container sx={{py: 4, backgroundColor: '#fefae0', minHeight: 'calc(100vh - 64px)'}}>
                <Typography variant="h4" component="h1" gutterBottom
                            sx={{color: '#283618', textAlign: 'center', mb: 3}}>
                    Your Predictions
                </Typography>

                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}>
                        <CircularProgress sx={{color: '#606c38'}}/>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{my: 3, backgroundColor: '#d32f2f', color: 'white'}}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && (
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                        <Typography variant="body2" sx={{color: '#606c38'}}>
                            Total Predictions: {totalItems}
                        </Typography>
                        <FormControl size="small" sx={{minWidth: 120}}>
                            <InputLabel id="items-per-page-label" sx={{color: '#283618'}}>Items per page</InputLabel>
                            <Select
                                labelId="items-per-page-label"
                                id="items-per-page-select"
                                value={itemsPerPage}
                                label="Items per page"
                                onChange={handleItemsPerPageChange}
                                sx={{
                                    color: '#283618',
                                    '.MuiOutlinedInput-notchedOutline': {borderColor: '#606c38'},
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: '#283618'},
                                    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: '#283618'},
                                    '.MuiSvgIcon-root': {color: '#283618'}
                                }}
                            >
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}


                {!loading && !error && predictions.length === 0 && totalItems === 0 && (
                    <Typography variant="subtitle1" sx={{textAlign: 'center', color: '#606c38', mt: 4}}>
                        No predictions found. Click "Predict New Data" to get started!
                    </Typography>
                )}

                {!loading && !error && predictions.length === 0 && totalItems > 0 && (
                    <Typography variant="subtitle1" sx={{textAlign: 'center', color: '#606c38', mt: 4}}>
                        No predictions on this page.
                    </Typography>
                )}


                {!loading && !error && predictions.length > 0 && (
                    <TableContainer component={Paper}
                                    sx={{boxShadow: 3, borderRadius: '8px', backgroundColor: '#e9edc9'}}>
                        <Table aria-label="predictions table">
                            <TableHead sx={{backgroundColor: '#ccd5ae'}}>
                                <TableRow>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}}>Student Name</TableCell>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}} align="right">Age</TableCell>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}}
                                               align="right">Gender</TableCell>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}} align="right">Exam
                                        Score</TableCell>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}}
                                               align="center">Date</TableCell>
                                    <TableCell sx={{color: '#283618', fontWeight: 'bold'}}
                                               align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {predictions.map((prediction) => (
                                    <TableRow
                                        key={prediction.predictionId}
                                        sx={{
                                            '&:nth-of-type(odd)': {backgroundColor: '#f0f3e0'},
                                            '&:hover': {backgroundColor: '#d4d9bA'},
                                        }}
                                    >
                                        <TableCell component="th" scope="row" sx={{color: '#606c38'}}>
                                            {prediction.studentName}
                                        </TableCell>
                                        <TableCell align="right" sx={{color: '#606c38'}}>{prediction.age}</TableCell>
                                        <TableCell align="right" sx={{color: '#606c38'}}>
                                            {prediction.gender_code === 0 ? 'Female' : 'Male'}
                                        </TableCell>
                                        <TableCell align="right"
                                                   sx={{color: '#606c38'}}>{prediction.exam_score}</TableCell>
                                        <TableCell align="center" sx={{color: '#606c38'}}>
                                            {new Date(prediction.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => router.push(`/predictions/${prediction.predictionId}`)}
                                                sx={{
                                                    color: '#283618',
                                                    borderColor: '#283618',
                                                    '&:hover': {
                                                        backgroundColor: '#d4d9bA',
                                                        borderColor: '#283618',
                                                    }
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {!loading && !error && totalPages > 0 && (
                    <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: '#606c38',
                                },
                                '& .Mui-selected': {
                                    backgroundColor: '#606c38 !important',
                                    color: 'white',
                                },
                                '& .MuiPaginationItem-ellipsis': {
                                    color: '#606c38',
                                }
                            }}
                        />
                    </Box>
                )}
            </Container>
        </>
    );
}