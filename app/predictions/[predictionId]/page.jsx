'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Paper,
    Grid,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const mapGender = (code) => {
    switch (code) {
        case 0: return 'Female';
        case 1: return 'Male';
        case 2: return 'Other';
        default: return 'N/A';
    }
};
const mapBooleanCode = (code) => (code === 0 ? 'No' : code === 1 ? 'Yes' : 'N/A');
const mapDietQuality = (code) => {
    switch (code) {
        case 0: return 'Fair';
        case 1: return 'Good';
        case 2: return 'Poor';
        default: return 'N/A';
    }
};
const mapParentalEducation = (code) => {
    switch (code) {
        case 0: return 'Bachelor';
        case 1: return 'High School';
        case 2: return 'Master';
        case 3: return 'Unknown';
        default: return 'N/A';
    }
};
const mapInternetQuality = (code) => {
    switch (code) {
        case 0: return 'Average';
        case 1: return 'Good';
        case 2: return 'Poor';
        default: return 'N/A';
    }
};

function DetailItem({ label, value }) {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 3,
            py: 0.30,
            borderBottom: '1px dashed #ccd5ae',
            mb: 0.5
        }}>
            <Typography variant="body2" sx={{ color: '#283618', fontWeight: 500, fontSize: '0.8rem' }}>{label}:</Typography>
            <Typography variant="body2" sx={{ color: '#606c38', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600 }}>
                {value}
            </Typography>
        </Box>
    );
}

export default function PredictionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const predictionId = params?.predictionId;

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');

    const fetchPredictionDetails = useCallback(async () => {
        if (!predictionId) {
            setError('Prediction ID is missing.');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        if (!token) {
            router.push('/login');
            return;
        }
        setUsername(storedUsername || 'User');
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/predictions/${predictionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || `Error: ${response.status} ${data.statusMessage}`);
                setPrediction(null);
            } else {
                setPrediction(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch prediction details:', err);
            setError('An unexpected error occurred while fetching prediction details.');
            setPrediction(null);
        } finally {
            setLoading(false);
        }
    }, [predictionId, router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else if (predictionId) {
            fetchPredictionDetails();
        } else {
            setLoading(false);
            setError("Prediction ID not found in URL.");
        }
    }, [predictionId, fetchPredictionDetails, router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        router.push('/login');
    };

    const handleBack = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress sx={{ color: '#606c38' }} />
            </Container>
        );
    }

    return (
        <>
            <AppBar position="static" sx={{ backgroundColor: '#606c38' }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="back to predictions"
                        onClick={handleBack}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Prediction Details
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                        Hi, {username}
                    </Typography>
                    <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
                        <ExitToAppIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container sx={{ py: 4, backgroundColor: '#fefae0', minHeight: 'calc(100vh - 64px)' }}>
                {error && (
                    <Alert severity="error" sx={{ my: 3, backgroundColor: '#d32f2f', color: 'white' }}>
                        {error}
                    </Alert>
                )}

                {!prediction && !loading && !error && (
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#606c38', mt: 4 }}>
                        Prediction data could not be loaded or found.
                    </Typography>
                )}

                {prediction && (
                    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#e9edc9', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h4" component="h1" gutterBottom
                            sx={{ color: '#283618', textAlign: 'left', mb: 2, fontWeight: 'bold' }}>
                            {prediction.studentName}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', width: '100%' }}>
                            <Box sx={{ flex: 5.5, minWidth: 0 }}>
                                <Box sx={{
                                    backgroundColor: '#f0f3e0',
                                    borderRadius: '8px',
                                    p: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    <Typography variant="h6"
                                        sx={{ color: '#283618', mb: 1, textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #ccd5ae', pb: 1 }}>
                                        Influencing Factor
                                    </Typography>
                                    <Grid container spacing={3} sx={{ flexGrow: 1, mt: 0, alignContent: 'center', justifyContent: 'center' }}>
                                        <Grid item xs={6} sx={{ pt: '0 !important' }}>
                                            <DetailItem label="Age" value={prediction.age} />
                                            <DetailItem label="Gender" value={mapGender(prediction.gender_code)} />
                                            <DetailItem label="Study" value={`${prediction.study_hours_per_day}h`} />
                                            <DetailItem label="Social Media" value={`${prediction.social_media_hours}h`} />
                                            <DetailItem label="Netflix" value={`${prediction.netflix_hours}h`} />
                                            <DetailItem label="Parent Edu" value={mapParentalEducation(prediction.parental_education_level_code)} />
                                            <DetailItem label="Mental Health" value={`${prediction.mental_health_rating}/10`} />
                                        </Grid>
                                        <Grid item xs={6} sx={{ pt: '0 !important' }}>
                                            <DetailItem label="Part-time" value={mapBooleanCode(prediction.part_time_job_code)} />
                                            <DetailItem label="Attendance" value={`${prediction.attendance_percentage}%`} />
                                            <DetailItem label="Sleep" value={`${prediction.sleep_hours}h`} />
                                            <DetailItem label="Diet" value={mapDietQuality(prediction.diet_quality_code)} />
                                            <DetailItem label="Exercise" value={`${prediction.exercise_frequency}x`} />
                                            <DetailItem label="Internet" value={mapInternetQuality(prediction.internet_quality_code)} />
                                            <DetailItem label="Extracurricular" value={mapBooleanCode(prediction.extracurricular_participation_code)} />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>

                            <Box sx={{ flex: 2.5, minWidth: 0 }}>
                                <Box sx={{
                                    backgroundColor: '#f0f3e0',
                                    borderRadius: '8px',
                                    p: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    <Typography variant="h6"
                                        sx={{ color: '#283618', mb: 2, textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #ccd5ae', pb: 1 }}>
                                        Predicted Exam Score
                                    </Typography>
                                    <Box sx={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Typography variant="h2" component="p"
                                            sx={{ color: '#283618', fontWeight: 'bold', mb: 1 }}>
                                            {prediction.exam_score.toFixed(2)}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ color: '#606c38' }}>
                                            Out of 100
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ flex: 4, minWidth: 0 }}>
                                <Box sx={{
                                    backgroundColor: '#f0f3e0',
                                    borderRadius: '8px',
                                    p: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}>
                                    <Typography variant="h6"
                                        sx={{ color: '#283618', mb: 2, textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #ccd5ae', pb: 1 }}>
                                        Suggestion
                                    </Typography>
                                    <Box sx={{ position: 'relative', flexGrow: 1, minHeight: '100px' }}>
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 0, bottom: 0, left: 0, right: 0,
                                            overflowY: 'auto',
                                            pr: 1,
                                            '&::-webkit-scrollbar': {
                                                width: '6px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                background: 'transparent',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: '#606c38',
                                                borderRadius: '4px',
                                            },
                                            '&::-webkit-scrollbar-button': {
                                                display: 'none',
                                            },
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#606c38 transparent'
                                        }}>
                                            <Typography variant="body2" sx={{ color: '#606c38', whiteSpace: 'pre-wrap', lineHeight: 1.6, textAlign: 'justify' }}>
                                                {prediction.generatedSuggestion || "No suggestion available."}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="caption" sx={{ color: '#606c38', mt: 3, pt: 2, borderTop: '1px solid #ccd5ae', textAlign: 'right', display: 'block' }}>
                            Generated on: {new Date(prediction.createdAt).toLocaleString()} | Prediction requested by: {prediction.user ? prediction.user.username : 'Unknown'}
                        </Typography>
                    </Paper>
                )}
            </Container>
        </>
    );
}