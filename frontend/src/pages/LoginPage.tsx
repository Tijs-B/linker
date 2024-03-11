import React, { useCallback, useEffect } from 'react';
import {Button, Container, Grid, Paper, TextField} from "@mui/material";
import {useGetTeamsQuery, useLoginUserMutation} from "../services/linker.ts";
import {useNavigate} from "react-router-dom";

export default function LoginPage() {
    const [loginUser, { error, isError, isSuccess }] = useLoginUserMutation();
    const {data: teams, error: queryError} = useGetTeamsQuery();

    const navigate = useNavigate();

    const submitForm = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        const target = event.target as typeof event.target & {
            username: {value: string};
            password: {value: string};
        }
        const body = {
            username: target.username.value,
            password: target.password.value,
        };
        loginUser(body);
    }, [loginUser]);

    useEffect(() => {
        console.log(isSuccess);
        if (isSuccess) {
            navigate('/');
        }
    }, [navigate, isSuccess])

    useEffect(() => {
        if (teams && !queryError) {
            navigate('/');
        }
    }, [navigate, teams, queryError]);

    return (
        <Container sx={{pt: 2}}>
            <Grid container alignItems='center' justifyContent='center'>
                <Grid item xs={8} md={4}>
                    <Paper>
                        <form onSubmit={submitForm}>
                            <TextField required label='Gebruikersnaam' name='username' autoFocus/>
                            <TextField required label='Wachtwoord' type='password' name='password'/>
                            <Button type='submit'>Login</Button>
                        </form>
                        { isError && 'status' in error && error.status === 404 && (
                            <p>Fout wachtwoord</p>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}