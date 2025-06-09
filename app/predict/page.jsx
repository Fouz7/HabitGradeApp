'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {
    Container, TextField, Button, Typography, Box, CircularProgress, Alert,
    Paper, AppBar, Toolbar, IconButton, Select, MenuItem, FormControl,
    InputLabel, Card, CardContent, Collapse, FormHelperText, Grid
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SendIcon from '@mui/icons-material/Send';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


const genderOptions = [
    {value: 0, label: 'Female'},
    {value: 1, label: 'Male'},
    {value: 2, label: 'Other'}
];
const booleanOptions = [
    {value: 0, label: 'No'},
    {value: 1, label: 'Yes'}
];
const dietOptions = [
    {value: 0, label: 'Fair'},
    {value: 1, label: 'Good'},
    {value: 2, label: 'Poor'}
];
const educationOptions = [
    {value: 0, label: 'Bachelor'},
    {value: 1, label: 'High School'},
    {value: 2, label: 'Master'},
    {value: 3, label: 'Unknown'}
];
const internetOptions = [
    {value: 0, label: 'Average'},
    {value: 1, label: 'Good'},
    {value: 2, label: 'Poor'}
];

const initialFormData = {
    studentName: '',
    age: '',
    gender_code: '',
    study_hours_per_day: '',
    social_media_hours: '',
    netflix_hours: '',
    part_time_job_code: '',
    attendance_percentage: '',
    sleep_hours: '',
    diet_quality_code: '',
    exercise_frequency: '',
    parental_education_level_code: '',
    internet_quality_code: '',
    mental_health_rating: '',
    extracurricular_participation_code: '',
};

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': {borderColor: '#606c38'},
        '&:hover fieldset': {borderColor: '#283618'},
        '&.Mui-focused fieldset': {borderColor: '#283618'},
    },
    '& label': {color: '#606c38'},
    '& label.Mui-focused': {color: '#283618'},
};

const selectStyles = {
    width: '100%',
    color: '#283618',
    '.MuiOutlinedInput-notchedOutline': {borderColor: '#606c38'},
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: '#283618'},
    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: '#283618'},
    '.MuiSvgIcon-root': {color: '#606c38'},
};


export default function PredictPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState(null);

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiSuccessMessage, setApiSuccessMessage] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        const storedUserId = localStorage.getItem('userId');
        if (!token || !storedUserId) {
            router.push('/login');
        } else {
            setUsername(storedUsername || 'User');
            setUserId(storedUserId);
        }
    }, [router]);

    const handleInputChange = (event) => {
        const {name, value} = event.target;
        let processedValue = value;

        const numericIntegerFields = [
            'age', 'study_hours_per_day', 'social_media_hours', 'netflix_hours',
            'attendance_percentage', 'sleep_hours', 'exercise_frequency', 'mental_health_rating'
        ];

        if (numericIntegerFields.includes(name)) {
            processedValue = value.replace(/[^0-9]/g, ''); // Allow only digits

            if (name === 'age') processedValue = processedValue ? String(Math.min(Math.max(Number(processedValue), 1), 100)) : '';
            else if (['study_hours_per_day', 'social_media_hours', 'netflix_hours', 'sleep_hours'].includes(name)) {
                processedValue = processedValue ? String(Math.min(Math.max(Number(processedValue), 0), 24)) : '';
            } else if (name === 'attendance_percentage') processedValue = processedValue ? String(Math.min(Math.max(Number(processedValue), 0), 100)) : '';
            else if (name === 'exercise_frequency') processedValue = processedValue ? String(Math.min(Math.max(Number(processedValue), 0), 21)) : ''; // Max 3 times a day for a week
            else if (name === 'mental_health_rating') processedValue = processedValue ? String(Math.min(Math.max(Number(processedValue), 1), 10)) : '';
        }

        setFormData(prev => ({...prev, [name]: processedValue}));
        if (formErrors[name]) {
            setFormErrors(prev => ({...prev, [name]: ''}));
        }
        if (formErrors.totalHours && ['study_hours_per_day', 'social_media_hours', 'netflix_hours', 'sleep_hours'].includes(name)) {
            setFormErrors(prev => ({...prev, totalHours: ''}));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.studentName.trim()) errors.studentName = 'Student Name is required.';
        if (formData.age === '') errors.age = 'Age is required.'; else if (Number(formData.age) <= 0 || Number(formData.age) > 100) errors.age = 'Age must be between 1 and 100.';
        if (formData.gender_code === '') errors.gender_code = 'Gender is required.';

        const hourFields = {
            study_hours_per_day: 'Study Hours', social_media_hours: 'Social Media Hours',
            netflix_hours: 'Netflix Hours', sleep_hours: 'Sleep Hours',
        };
        let currentTotalHours = 0;
        for (const [field, label] of Object.entries(hourFields)) {
            if (formData[field] === '') errors[field] = `${label} is required.`;
            else if (Number(formData[field]) < 0 || Number(formData[field]) > 24) errors[field] = `${label} must be between 0 and 24.`;
            currentTotalHours += Number(formData[field] || 0);
        }

        if (currentTotalHours > 24) {
            errors.totalHours = 'Total hours for study, social media, Netflix, and sleep cannot exceed 24 hours per day.';
        }

        if (formData.part_time_job_code === '') errors.part_time_job_code = 'Part-time Job status is required.';
        if (formData.attendance_percentage === '') errors.attendance_percentage = 'Attendance is required.'; else if (Number(formData.attendance_percentage) < 0 || Number(formData.attendance_percentage) > 100) errors.attendance_percentage = 'Attendance must be 0-100%.';
        if (formData.diet_quality_code === '') errors.diet_quality_code = 'Diet Quality is required.';
        if (formData.exercise_frequency === '') errors.exercise_frequency = 'Exercise Frequency is required.'; else if (Number(formData.exercise_frequency) < 0 || Number(formData.exercise_frequency) > 21) errors.exercise_frequency = 'Exercise frequency must be 0-21 times/week.';
        if (formData.parental_education_level_code === '') errors.parental_education_level_code = 'Parental Education is required.';
        if (formData.internet_quality_code === '') errors.internet_quality_code = 'Internet Quality is required.';
        if (formData.mental_health_rating === '') errors.mental_health_rating = 'Mental Health Rating is required.'; else if (Number(formData.mental_health_rating) < 1 || Number(formData.mental_health_rating) > 10) errors.mental_health_rating = 'Rating must be 1-10.';
        if (formData.extracurricular_participation_code === '') errors.extracurricular_participation_code = 'Extracurricular Participation is required.';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setApiSuccessMessage('');

        if (!validateForm()) {
            setError("Please correct the errors in the form.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        const payload = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => {
                const numericFields = [
                    'age', 'gender_code', 'study_hours_per_day', 'social_media_hours', 'netflix_hours',
                    'part_time_job_code', 'attendance_percentage', 'sleep_hours', 'diet_quality_code',
                    'exercise_frequency', 'parental_education_level_code', 'internet_quality_code',
                    'mental_health_rating', 'extracurricular_participation_code'
                ];
                if (numericFields.includes(key)) {
                    return [key, Number(value)];
                }
                return [key, value];
            })
        );
        payload.userId = userId;


        try {
            const response = await fetch('/api/predictions/predict', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || `Error: ${response.status} ${data.statusMessage}`);
                setShowResults(false);
            } else {
                setApiSuccessMessage(data.message || 'Prediction generated successfully!');
                setPredictionResult(data.data);
                setShowResults(true);
                setError('');
            }
        } catch (err) {
            console.error('Prediction API error:', err);
            setError('An unexpected error occurred. Please try again.');
            setShowResults(false);
        } finally {
            setLoading(false);
        }
    };

    const handleResetForm = () => {
        setShowResults(false);
        setPredictionResult(null);
        setFormData(initialFormData);
        setFormErrors({});
        setError('');
        setApiSuccessMessage('');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        router.push('/login');
    };

    const handleBack = () => {
        router.push('/');
    };

    if (!userId && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
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
                        aria-label="back to home"
                        onClick={handleBack}
                        sx={{mr: 2}}
                    >
                        <ArrowBackIcon/>
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        Student Exam Score Prediction
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
                <Typography variant="h4" component="h1" gutterBottom
                            sx={{color: '#283618', textAlign: 'center', mb: 1}}>
                    Predict New Score
                </Typography>
                <Typography variant="subtitle1" sx={{color: '#606c38', textAlign: 'center', mb: 3}}>
                    Fill in the details below to generate a prediction.
                </Typography>


                {error &&
                    <Alert severity="error" sx={{my: 2, backgroundColor: '#d32f2f', color: 'white'}}>{error}</Alert>}
                {apiSuccessMessage && !error && showResults && <Alert severity="success" sx={{
                    my: 2,
                    backgroundColor: '#2e7d32',
                    color: 'white'
                }}>{apiSuccessMessage}</Alert>}

                <Box sx={{position: 'relative', overflowX: 'hidden' /* Prevent horizontal scroll during transition */}}>
                    <Collapse in={!showResults} timeout={500} unmountOnExit>
                        <Paper elevation={3} sx={{p: {xs: 2, md: 3}, backgroundColor: '#e9edc9', borderRadius: '12px'}}>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2.5}>
                                    <Grid xs={12} width="100%">
                                        <TextField
                                            fullWidth
                                            label="Student Name"
                                            name="studentName"
                                            value={formData.studentName}
                                            onChange={handleInputChange}
                                            error={!!formErrors.studentName}
                                            helperText={formErrors.studentName}
                                            sx={inputStyles}
                                        />
                                    </Grid>
                                    <Grid gap={2}
                                          sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Age (1-100)"
                                                name="age"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.age}
                                                onChange={handleInputChange}
                                                error={!!formErrors.age}
                                                helperText={formErrors.age}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth error={!!formErrors.gender_code} sx={inputStyles}>
                                                <InputLabel>Gender</InputLabel>
                                                <Select
                                                    name="gender_code"
                                                    fullWidth
                                                    value={formData.gender_code}
                                                    label="Gender"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {genderOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.gender_code &&
                                                    <FormHelperText error>{formErrors.gender_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <Grid gap={2}
                                          sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Study Hours/Day (0-24)"
                                                name="study_hours_per_day"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.study_hours_per_day}
                                                onChange={handleInputChange}
                                                error={!!formErrors.study_hours_per_day}
                                                helperText={formErrors.study_hours_per_day}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Social Media Hours/Day (0-24)"
                                                name="social_media_hours"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.social_media_hours}
                                                onChange={handleInputChange}
                                                error={!!formErrors.social_media_hours}
                                                helperText={formErrors.social_media_hours}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Netflix Hours/Day (0-24)"
                                                name="netflix_hours"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.netflix_hours}
                                                onChange={handleInputChange}
                                                error={!!formErrors.netflix_hours}
                                                helperText={formErrors.netflix_hours}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Sleep Hours/Day (0-24)"
                                                name="sleep_hours"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.sleep_hours}
                                                onChange={handleInputChange}
                                                error={!!formErrors.sleep_hours}
                                                helperText={formErrors.sleep_hours}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid gap={2}
                                          sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Attendance (0-100%)"
                                                name="attendance_percentage"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.attendance_percentage}
                                                onChange={handleInputChange}
                                                error={!!formErrors.attendance_percentage}
                                                helperText={formErrors.attendance_percentage}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Exercise (times/week, 0-21)"
                                                name="exercise_frequency"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.exercise_frequency}
                                                onChange={handleInputChange}
                                                error={!!formErrors.exercise_frequency}
                                                helperText={formErrors.exercise_frequency}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <TextField
                                                fullWidth
                                                label="Mental Health (1-10)"
                                                name="mental_health_rating"
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.mental_health_rating}
                                                onChange={handleInputChange}
                                                error={!!formErrors.mental_health_rating}
                                                helperText={formErrors.mental_health_rating}
                                                sx={inputStyles}
                                            />
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth error={!!formErrors.part_time_job_code}
                                                         sx={inputStyles}>
                                                <InputLabel>Part-time Job?</InputLabel>
                                                <Select
                                                    name="part_time_job_code"
                                                    value={formData.part_time_job_code}
                                                    label="Part-time Job?"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {booleanOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.part_time_job_code &&
                                                    <FormHelperText
                                                        error>{formErrors.part_time_job_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    <Grid gap={2}
                                          sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth error={!!formErrors.diet_quality_code}
                                                         sx={inputStyles}>
                                                <InputLabel>Diet Quality</InputLabel>
                                                <Select
                                                    name="diet_quality_code"
                                                    value={formData.diet_quality_code}
                                                    label="Diet Quality"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {dietOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.diet_quality_code &&
                                                    <FormHelperText
                                                        error>{formErrors.diet_quality_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth error={!!formErrors.parental_education_level_code}
                                                         sx={inputStyles}>
                                                <InputLabel>Parental Education</InputLabel>
                                                <Select
                                                    name="parental_education_level_code"
                                                    value={formData.parental_education_level_code}
                                                    label="Parental Education"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {educationOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.parental_education_level_code && <FormHelperText
                                                    error>{formErrors.parental_education_level_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth error={!!formErrors.internet_quality_code}
                                                         sx={inputStyles}>
                                                <InputLabel>Internet Quality</InputLabel>
                                                <Select
                                                    name="internet_quality_code"
                                                    value={formData.internet_quality_code}
                                                    label="Internet Quality"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {internetOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.internet_quality_code && <FormHelperText
                                                    error>{formErrors.internet_quality_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={12} sm={6} width={'100%'}>
                                            <FormControl fullWidth
                                                         error={!!formErrors.extracurricular_participation_code}
                                                         sx={inputStyles}>
                                                <InputLabel>Extracurricular?</InputLabel>
                                                <Select
                                                    name="extracurricular_participation_code"
                                                    value={formData.extracurricular_participation_code}
                                                    label="Extracurricular?"
                                                    onChange={handleInputChange}
                                                    sx={selectStyles}
                                                >
                                                    {booleanOptions.map(opt =>
                                                        <MenuItem key={opt.value}
                                                                  value={opt.value}>{opt.label}</MenuItem>
                                                    )}
                                                </Select>
                                                {formErrors.extracurricular_participation_code && <FormHelperText
                                                    error>{formErrors.extracurricular_participation_code}</FormHelperText>}
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    {formErrors.totalHours && (
                                        <Grid xs={12}>
                                            <Alert severity="warning"
                                                   sx={{width: '100%', mt: 1}}>{formErrors.totalHours}</Alert>
                                        </Grid>
                                    )}

                                    <Grid width={'100%'}
                                          sx={{mt: 2, display: 'flex', alignItems: 'end', justifyContent: 'flex-end'}}>
                                        <Button type="submit" variant="contained" startIcon={<SendIcon/>} sx={{
                                            backgroundColor: '#606c38',
                                            '&:hover': {backgroundColor: '#283618'},
                                            color: 'white',
                                            px: 4,
                                            py: 1.25,
                                            fontSize: '1rem'
                                        }} disabled={loading}>
                                            {loading ? <CircularProgress size={24} color="inherit"/> : 'Submit'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Collapse>

                    <Collapse in={showResults} timeout={500} mountOnEnter>
                        <Card elevation={3} sx={{p: {xs: 2, md: 3}, backgroundColor: '#e9edc9', borderRadius: '12px'}}>
                            <CardContent>
                                <Typography variant="h5" sx={{color: '#283618', mb: 2, textAlign: 'center'}}>
                                    Prediction Result for {predictionResult?.studentName || formData.studentName}
                                </Typography>
                                {predictionResult && (
                                    <Box>
                                        <Card sx={{
                                            backgroundColor: '#f0f3e0',
                                            borderRadius: '8px',
                                            p: {xs: 2, sm: 3},
                                            textAlign: 'center',
                                            mb: 2.5,
                                            boxShadow: 2
                                        }}>
                                            <Typography variant="h6" sx={{color: '#283618'}}>Predicted Exam
                                                Score</Typography>
                                            <Typography variant="h2" component="p"
                                                        sx={{color: '#606c38', fontWeight: 'bold', my: 1}}>
                                                {typeof predictionResult.exam_score === 'number' ? predictionResult.exam_score.toFixed(2) : 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" sx={{color: '#606c38'}}>Out of
                                                100</Typography>
                                        </Card>

                                        <Card sx={{
                                            backgroundColor: '#f0f3e0',
                                            borderRadius: '8px',
                                            p: {xs: 2, sm: 3},
                                            boxShadow: 2
                                        }}>
                                            <Typography variant="h6" sx={{color: '#283618', mb: 1}}>Generated
                                                Suggestion:</Typography>
                                            <Typography variant="body1" sx={{
                                                color: '#606c38',
                                                whiteSpace: 'pre-wrap',
                                                maxHeight: '200px',
                                                overflowY: 'auto'
                                            }}>
                                                {predictionResult.generatedSuggestion || "No suggestion available."}
                                            </Typography>
                                        </Card>
                                    </Box>
                                )}
                                <Box sx={{mt: 3, display: 'flex', justifyContent: 'center'}}>
                                    <Button variant="outlined" startIcon={<RestartAltIcon/>} onClick={handleResetForm}
                                            sx={{
                                                color: '#606c38',
                                                borderColor: '#606c38',
                                                '&:hover': {backgroundColor: '#d4d9bA', borderColor: '#283618'},
                                                px: 3,
                                                py: 1
                                            }}>
                                        Predict for Another Student
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Collapse>
                </Box>
            </Container>
        </>
    );
}