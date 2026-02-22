import React, { useCallback, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { Box, Button, Container, TextField, Typography } from '@mui/material';

import { useSnackbar } from 'notistack';

import chirolinkLogo from '../assets/chirolink_logo.svg';
import {
  useGetUserQuery,
  useLoginUserMutation,
  useLoginWithTokenMutation,
} from '../services/linker.ts';

export default function LoginPage() {
  const { currentData: user, isLoading } = useGetUserQuery();
  const [loginUser] = useLoginUserMutation();
  const [loginWithToken] = useLoginWithTokenMutation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const tokenAttempted = useRef(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token && !tokenAttempted.current && !isLoading && !user?.username) {
      tokenAttempted.current = true;
      loginWithToken(token)
        .unwrap()
        .then(() => navigate('/'))
        .catch(() => {
          enqueueSnackbar('Ongeldige of verlopen loginlink', { variant: 'error' });
        });
    }
  }, [token, isLoading, user?.username, loginWithToken, navigate, enqueueSnackbar]);

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

  const handleTokenLogin = useCallback(() => {
    if (!token) return;
    loginWithToken(token)
      .unwrap()
      .then(() => navigate('/'))
      .catch(() => {
        enqueueSnackbar('Ongeldige of verlopen loginlink', { variant: 'error' });
      });
  }, [token, loginWithToken, navigate, enqueueSnackbar]);

  if (user?.username && token) {
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
          <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
            Al ingelogd
          </Typography>
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Je bent momenteel ingelogd als <strong>{user.username}</strong>. Wil je inloggen met de
            loginlink?
          </Typography>
          <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={handleTokenLogin}>
            Inloggen met link
          </Button>
          <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/')}>
            Naar startpagina
          </Button>
        </Box>
      </Container>
    );
  }

  if (user?.username) {
    return <Navigate to={'/'} />;
  }

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
