import {memo, useEffect} from "react";
import {Button, Container, Grid, Paper, TextField} from "@mui/material";
import {useGetTeamsQuery, useLoginUserMutation} from "../services/linker.js";
import {useNavigate} from "react-router-dom";

export default memo(function LoginPage() {
    const [loginUser, { error, isError, isSuccess }] = useLoginUserMutation();
    const {data: teams, error: queryError} = useGetTeamsQuery();

    const navigate = useNavigate();

    function submitForm(event) {
        event.preventDefault();
        const body = {
            username: event.target.username.value,
            password: event.target.password.value,
        };
        loginUser(body);
    }

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
                        { isError && error.status === 404 && (
                            <p>Fout wachtwoord</p>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
})