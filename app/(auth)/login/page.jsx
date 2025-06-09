'use client'

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Snackbar
} from '@mui/material';

function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        setInfoOpen(true);
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setInfoOpen(false); // Close info snackbar on submit attempt

        if (!username || !password) {
            setError('Username and password are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password}),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || `Error: ${response.status} ${data.statusMessage}`);
            } else {
                setSuccess(data.message);
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('userId', data.data.userId);
                localStorage.setItem('username', data.data.username);
                setError('');
                router.push('/');
            }
        } catch (err) {
            console.error('Login API error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = (event, reason, type) => {
        if (reason === 'clickaway') {
            return;
        }
        if (type === 'error') {
            setError('');
        } else if (type === 'success') {
            setSuccess('');
        } else if (type === 'info') {
            setInfoOpen(false);
        }
    };

    return (
        <>
            <Snackbar
                open={infoOpen}
                autoHideDuration={7000}
                onClose={(event, reason) => handleCloseSnackbar(event, reason, 'info')}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setInfoOpen(false)} // Allow manual close
                    severity="info"
                    sx={{width: '100%', backgroundColor: '#606c38', color: 'white'}}
                    variant="filled"
                >
                    Hey! Since this is a demo version, enter username 'admin' and password 'admin123'.
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={(event, reason) => handleCloseSnackbar(event, reason, 'error')}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert onClose={() => setError('')} severity="error" sx={{width: '100%'}} variant="filled">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000} // Success message can also auto-hide
                onClose={(event, reason) => handleCloseSnackbar(event, reason, 'success')}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert onClose={() => setSuccess('')} severity="success" sx={{width: '100%'}} variant="filled">
                    {success}
                </Alert>
            </Snackbar>

            <Container
                component="main"
                maxWidth="xs"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    py: 4,
                }}
            >
                <Card sx={{
                    backgroundColor: '#ccd5ae',
                    minWidth: 275,
                    width: '100%',
                    boxShadow: 6,
                    borderRadius: '12px', // Consistent border radius
                }}>
                    <CardContent sx={{p: 3}}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                component="h1"
                                variant="h5"
                                sx={{
                                    mb: 3,
                                    color: '#606c38',
                                    fontWeight: 'medium', // MUI uses 'medium' not 'bold' for this weight
                                }}
                            >
                                Login
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} noValidate sx={{width: '100%'}}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    name="username"
                                    autoComplete="username"
                                    autoFocus
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#283618', // Darker green for focused border
                                            },
                                        },
                                        '& label.Mui-focused': {
                                            color: '#283618', // Darker green for focused label
                                        },
                                    }}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#283618',
                                            },
                                        },
                                        '& label.Mui-focused': {
                                            color: '#283618',
                                        },
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        mt: 3,
                                        mb: 2,
                                        backgroundColor: '#606c38', // Main button color
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: '#283618', // Darker green on hover
                                        },
                                        py: 1.5, // Padding Y
                                        fontSize: '1rem', // Font size
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit"/> : 'Login'}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </>
    );
}

export default LoginPage;