import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Container, Grid, Paper, TextField } from '@mui/material';

import { useSnackbar } from 'notistack';

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
    <Container sx={{ pt: 2 }}>
      <Grid container alignItems="center" justifyContent="center">
        <Grid item xs={8} md={4}>
          <Paper>
            <form onSubmit={submitForm}>
              <TextField
                required
                label="Gebruikersnaam"
                name="username"
                autoFocus
                inputProps={{ style: { textTransform: 'none' } }}
                autoCapitalize="off"
              />
              <TextField required label="Wachtwoord" type="password" name="password" />
              <Button type="submit">Login</Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
