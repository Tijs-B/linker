import React, { useCallback, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  AppBar,
  Box,
  Container,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material';

import StatsTable from '../components/tracing/StatsTable.jsx';
import TeamsTable from '../components/tracing/TeamsTable.jsx';
import TochtenTable from '../components/tracing/TochtenTable.jsx';
import TrackersTable from '../components/tracing/TrackersTable.tsx';
import {
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetForbiddenAreasQuery,
  useGetOrganizationMembersQuery,
  useGetStatsQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetUserQuery,
  useGetWeidesQuery,
} from '../services/linker.ts';

export default function TracingPage() {
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: forbiddenAreas } = useGetForbiddenAreasQuery();
  const { data: stats } = useGetStatsQuery(undefined, {
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
  });
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: members } = useGetOrganizationMembersQuery();
  const { data: trackers } = useGetTrackersQuery();
  const { data: user } = useGetUserQuery();

  const [showFull, setShowFull] = useState(false);
  const [currentTab, setCurrentTab] = useState('tochten');

  const onSwitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowFull(e.target.checked);
  }, []);

  const onTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

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
        {user && !user.permissions.includes('change_team') && (
          <Alert severity="warning">
            Maak geen beslissingen op basis van deze gegevens. Contacteer altijd de basis.
          </Alert>
        )}
        <FormControlLabel
          control={<Switch onChange={onSwitchChange} />}
          label="Gebruik statistieken op basis van volledige tocht (A1-B1 i.p.v. A2-A9)"
        />
        <Tabs value={currentTab} onChange={onTabChange}>
          <Tab value="tochten" label="tochten" />
          <Tab value="teams" label="teams" />
          <Tab value="trackers" label="trackers" />
          <Tab value="fiches" label="den hele excel" />
        </Tabs>
        {currentTab === 'tochten' && tochten && stats && fiches && (
          <Box>
            <h2>Tochten</h2>
            <TochtenTable stats={stats} tochten={tochten} fiches={fiches} showFull={showFull} />
          </Box>
        )}
        {currentTab === 'teams' &&
          tochten &&
          fiches &&
          weides &&
          forbiddenAreas &&
          teams &&
          stats &&
          trackers && (
            <Box>
              <h2>Teams</h2>
              <TeamsTable
                teams={teams}
                tochten={tochten}
                fiches={fiches}
                weides={weides}
                forbiddenAreas={forbiddenAreas}
                stats={stats}
                trackers={trackers}
                showFull={showFull}
              />
            </Box>
          )}
        {currentTab === 'trackers' && trackers && teams && members && (
          <Box>
            <h2>Trackers</h2>
            <TrackersTable teams={teams} trackers={trackers} members={members} />
          </Box>
        )}
        {currentTab === 'fiches' && fiches && tochten && stats && checkpointLogs && teams && (
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
      </Container>
    </>
  );
}
