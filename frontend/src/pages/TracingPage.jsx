import {
    AppBar,
    Container,
    IconButton,
    Toolbar,
    Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack.js";
import {memo} from "react";
import {useNavigate} from "react-router-dom";
import {
    useGetCheckpointLogsQuery,
    useGetFichesQuery,
    useGetStatsQuery,
    useGetTochtenQuery
} from "../services/linker.js";

export default memo(function TracingPage() {
    const navigate = useNavigate();

    const fiches = useGetFichesQuery();
    const tochten = useGetTochtenQuery();
    const stats = useGetStatsQuery();
    const checkpointLogs = useGetCheckpointLogsQuery();

    return (
        <>
            <AppBar position="sticky" color="inherit">
                <Toolbar>
                    <IconButton sx={{mr: 2}} onClick={() => navigate(-1)} color="inherit">
                        <ArrowBackIcon/>
                    </IconButton>
                    <Typography variant="h6">Tracing</Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{pt: 2}}>
            </Container>
        </>
    )
})