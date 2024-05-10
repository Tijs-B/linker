import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Container, TextField, Typography } from '@mui/material';

import { useSnackbar } from 'notistack';

import chirolinkLogo from '../assets/chirolink_logo.svg';
import { useGetUserQuery, useLoginUserMutation } from '../services/linker.ts';

export default function LoginPage() {
  const { currentData: user } = useGetUserQuery();
  const [loginUser] = useLoginUserMutation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const submitForm = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        username: { value: string };
        password: { value: string };
      };
      loginUser({
        username: target.username.value,
        password: target.password.value,
      })
        .unwrap()
        .then(() => navigate('/'))
        .catch((rejected) => {
          if (rejected.status === 401) {
            enqueueSnackbar('Foute gebruikersnaam of wachtwoord', { variant: 'error' });
          }
        });
    },
    [loginUser, enqueueSnackbar, navigate],
  );

  useEffect(() => {
    if (user?.username) {
      navigate('/');
    }
  }, [navigate, user]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src={chirolinkLogo} width="80%" alt="Chirolink logo" />
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <Box component="form" onSubmit={submitForm} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Gebruikersnaam"
            name="username"
            autoComplete="username"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Wachtwoord"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 3 }}>
            Inloggen
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
