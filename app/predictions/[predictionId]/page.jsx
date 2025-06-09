'use client';

import React, {useEffect, useState, useCallback} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {
    Container,
    Typography,
    CircularProgress,
    Alert,
    Button,
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

// Helper component for displaying detail items
function DetailItem({label, value}) {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 0.75,
            borderBottom: '1px dashed #ccd5ae',
            mb: 1.5
        }}>
            <Typography variant="subtitle1" sx={{color: '#283618', fontWeight: 'medium'}}>{label}:</Typography>
            <Typography variant="body1" sx={{color: '#606c38', textAlign: 'right'}}>
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
            <Container sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
                <CircularProgress sx={{color: '#606c38'}}/>
            </Container>
        );
    }

    return (
        <>
            <AppBar position="static" sx={{backgroundColor: '#606c38'}}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="back to predictions"
                        onClick={handleBack}
                        sx={{mr: 2}}
                    >
                        <ArrowBackIcon/>
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        Prediction Details
                    </Typography>
                    <Typography variant="subtitle1" sx={{mr: 2}}>
                        Hi, {username}
                    </Typography>
                    <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
                        <ExitToAppIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container sx={{py: 4, backgroundColor: '#fefae0', minHeight: 'calc(100vh - 64px)'}}>
                {error && (
                    <Alert severity="error" sx={{my: 3, backgroundColor: '#d32f2f', color: 'white'}}>
                        {error}
                    </Alert>
                )}

                {!prediction && !loading && !error && (
                    <Typography variant="h6" sx={{textAlign: 'center', color: '#606c38', mt: 4}}>
                        Prediction data could not be loaded or found.
                    </Typography>
                )}

                {prediction && (
                    <Paper elevation={3} sx={{p: {xs: 2, md: 4}, backgroundColor: '#e9edc9', borderRadius: '12px'}}>
                        <Typography variant="h4" component="h1" gutterBottom
                                    sx={{color: '#283618', textAlign: 'center', mb: 1}}>
                            {prediction.studentName}
                        </Typography>
                        <Typography variant="caption" display="block"
                                    sx={{color: '#606c38', textAlign: 'center', mb: 3}}>
                            Prediction ID: {prediction.predictionId} | Generated
                            on: {new Date(prediction.createdAt).toLocaleString()}
                        </Typography>

                        <Divider sx={{my: 3, borderColor: '#ccd5ae'}}/>

                        <Grid container spacing={4}>
                            <Grid item xs={12} md={5} lg={4}>
                                <Card sx={{
                                    backgroundColor: '#f0f3e0',
                                    borderRadius: '8px',
                                    boxShadow: 3,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 2,
                                    minHeight: {md: '250px'}
                                }}>
                                    <CardContent sx={{
                                        textAlign: 'center',
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }}>
                                        <Typography variant="h6" sx={{color: '#283618', mb: 1}}>
                                            Predicted Exam Score
                                        </Typography>
                                        <Typography variant="h2" component="p"
                                                    sx={{color: '#606c38', fontWeight: 'bold', my: 1}}>
                                            {prediction.exam_score.toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" sx={{color: '#606c38'}}>
                                            Out of 100
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Factors Section (Now on the right) */}
                            <Grid item xs={12} md={7} lg={8}>
                                <Typography variant="h5"
                                            sx={{color: '#283618', mb: 2.5, borderBottom: '2px solid #ccd5ae', pb: 1}}>
                                    Influencing Factors
                                </Typography>
                                <Grid container spacing={{xs: 2, sm: 3}}>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItem label="Age" value={prediction.age}/>
                                        <DetailItem label="Gender" value={mapGender(prediction.gender_code)}/>
                                        <DetailItem label="Study Hours/Day"
                                                    value={`${prediction.study_hours_per_day} hrs`}/>
                                        <DetailItem label="Social Media/Day"
                                                    value={`${prediction.social_media_hours} hrs`}/>
                                        <DetailItem label="Netflix Hours/Day"
                                                    value={`${prediction.netflix_hours} hrs`}/>
                                        <DetailItem label="Parental Education"
                                                    value={mapParentalEducation(prediction.parental_education_level_code)}/>
                                        <DetailItem label="Mental Health (1-10)"
                                                    value={`${prediction.mental_health_rating}/10`}/>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <DetailItem label="Part-time Job"
                                                    value={mapBooleanCode(prediction.part_time_job_code)}/>
                                        <DetailItem label="Attendance" value={`${prediction.attendance_percentage}%`}/>
                                        <DetailItem label="Sleep Hours" value={`${prediction.sleep_hours} hrs`}/>
                                        <DetailItem label="Diet Quality"
                                                    value={mapDietQuality(prediction.diet_quality_code)}/>
                                        <DetailItem label="Exercise Frequency"
                                                    value={`${prediction.exercise_frequency} times/wk`}/>
                                        <DetailItem label="Internet Quality"
                                                    value={mapInternetQuality(prediction.internet_quality_code)}/>
                                        <DetailItem label="Extracurricular"
                                                    value={mapBooleanCode(prediction.extracurricular_participation_code)}/>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Divider sx={{my: 3, borderColor: '#ccd5ae'}}/>

                        <Card sx={{mt: 2, backgroundColor: '#f0f3e0', borderRadius: '8px'}}>
                            <CardContent>
                                <Typography variant="h6" sx={{color: '#283618', mb: 1}}>
                                    Generated Suggestion:
                                </Typography>
                                <Typography variant="body1" sx={{color: '#606c38', whiteSpace: 'pre-wrap'}}>
                                    {prediction.generatedSuggestion || "No suggestion available."}
                                </Typography>
                            </CardContent>
                        </Card>

                        {prediction.user && (
                            <Typography variant="body2" sx={{color: '#606c38', mt: 3, textAlign: 'right'}}>
                                Prediction requested by: {prediction.user.username} (ID: {prediction.user.userId})
                            </Typography>
                        )}
                    </Paper>
                )}
            </Container>
        </>
    );
}