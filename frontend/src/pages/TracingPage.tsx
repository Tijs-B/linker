import { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppBar, Box, Container, IconButton, Stack, Toolbar, Typography } from '@mui/material';

import StatsTable from '../components/tracing/StatsTable.jsx';
import TeamsTable from '../components/tracing/TeamsTable.jsx';
import TochtenTable from '../components/tracing/TochtenTable.jsx';
import {
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetStatsQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetWeidesQuery,
} from '../services/linker.ts';

const TracingPage = memo(function TracingPage() {
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: stats } = useGetStatsQuery();
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: trackers } = useGetTrackersQuery();

  return (
    <>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          {/* @ts-expect-error to is not expected but it works? */}
          <IconButton sx={{ mr: 2 }} component={RouterLink} to={-1} color="inherit">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Tracing</Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {tochten && stats && (
            <Box>
              <h2>Tochten</h2>
              <TochtenTable stats={stats} tochten={tochten} />
            </Box>
          )}
          {tochten && fiches && weides && teams && stats && trackers && (
            <Box>
              <h2>Teams</h2>
              <TeamsTable
                teams={teams}
                tochten={tochten}
                fiches={fiches}
                weides={weides}
                stats={stats}
                trackers={trackers}
              />
            </Box>
          )}
          {fiches && tochten && stats && checkpointLogs && teams && (
            <Box>
              <h2>Fiches</h2>
              <StatsTable
                stats={stats}
                fiches={fiches}
                tochten={tochten}
                checkpointLogs={checkpointLogs}
                teams={teams}
              />
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
});

export default TracingPage;
