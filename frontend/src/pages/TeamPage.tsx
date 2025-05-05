import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';

import SafeSelector from '../components/SafeSelector.jsx';
import ContactPersonsList from '../components/team/ContactPersonsList.jsx';
import {
  useCreateTeamNoteMutation,
  useDeleteTeamNoteMutation,
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetForbiddenAreasQuery,
  useGetStatsQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetUserQuery,
  useGetWeidesQuery,
  useUploadGroupPictureMutation,
} from '../services/linker.ts';
import { teamColor } from '../theme/colors.ts';
import { getPositionDescription } from '../utils/data.ts';
import {
  formatDateTimeLong,
  formatDateTimeShorter,
  formatFromNow,
  secondsToHoursMinutes,
} from '../utils/time.ts';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function TeamPage() {
  const { teamId } = useParams();

  const { data: teams } = useGetTeamsQuery();
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: forbiddenAreas } = useGetForbiddenAreasQuery();
  const { data: stats } = useGetStatsQuery();
  const { data: trackers } = useGetTrackersQuery();
  const { data: user } = useGetUserQuery();
  const deleteTeamNote = useDeleteTeamNoteMutation()[0];
  const createTeamNote = useCreateTeamNoteMutation()[0];
  const uploadGroupPicture = useUploadGroupPictureMutation()[0];

  const [newNoteText, setNewNoteText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const team = teams && teamId !== undefined ? teams.entities[Number(teamId)] : null;
  const teamStats = stats && teamId !== undefined ? stats.teams[+teamId] : null;

  const teamLogs = useMemo(() => {
    if (!checkpointLogs || !fiches) {
      return [];
    }
    const result = Object.values(checkpointLogs.entities)
      .filter((l) => l.team === Number(teamId))
      .map((l) => {
        return {
          ficheName: fiches.entities[l.fiche].display_name,
          ...l,
        };
      });
    result.sort((a, b) => new Date(a.arrived).valueOf() - new Date(b.arrived).valueOf());
    return result;
  }, [teamId, checkpointLogs, fiches]);

  const positionDescription = useMemo(() => {
    if (!(teams && trackers && fiches && tochten && weides && forbiddenAreas && teamId)) {
      return '-';
    }
    const trackerId = teams.entities[+teamId].tracker;
    if (!trackerId) {
      return '-';
    }
    return getPositionDescription(
      trackers.entities[trackerId],
      fiches,
      tochten,
      weides,
      forbiddenAreas,
    );
  }, [teamId, teams, trackers, fiches, tochten, weides, forbiddenAreas]);

  const createNote = useCallback(() => {
    if (newNoteText && teamId) {
      createTeamNote({
        text: newNoteText,
        team: +teamId,
      });
      setNewNoteText('');
    }
  }, [createTeamNote, newNoteText, teamId]);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFile(event.target.files[0]);
    }
  }, []);

  const onUpload = useCallback(() => {
    if (uploadedFile && teamId) {
      const data = new FormData();
      data.append('picture', uploadedFile);
      uploadGroupPicture({
        id: Number(teamId),
        data,
      });
      setUploadedFile(null);
    }
  }, [uploadedFile, teamId, uploadGroupPicture]);

  const tracker = trackers && team?.tracker ? trackers.entities[team.tracker] : null;

  const canSeeTeamNotes = user ? user.permissions.includes('view_teamnote') : false;
  const canSeeContactPersons = user ? user.permissions.includes('view_contactperson') : false;
  const canSeeStats = user ? user.permissions.includes('view_stats') : false;

  if (!team) {
    return <div>Team not found</div>;
  }

  return (
    <>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          {/* @ts-expect-error to is not expected but it works? */}
          <IconButton sx={{ mr: 2 }} component={RouterLink} to={-1} color="inherit">
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: teamColor(team), mr: 2 }}>{team.code}</Avatar>
          <Typography variant="h6" sx={{ mr: 2 }}>
            {team.name}
          </Typography>
          <Typography variant="body2">{team.chiro}</Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid container size={{ xs: 12, md: 8 }}>
            <Stack flex="1 1 0" spacing={2}>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Typography variant="h6">Tracing</Typography>
                  <Table>
                    <TableBody>
                      {canSeeStats && (
                        <>
                          <TableRow>
                            <TableCell>Gem. afwijking per tocht</TableCell>
                            <TableCell>
                              {secondsToHoursMinutes(teamStats?.avgPartialTochtDeviation)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Gem. afwijking per tochttechniek</TableCell>
                            <TableCell>
                              {secondsToHoursMinutes(teamStats?.avgFicheDeviation)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      <TableRow>
                        <TableCell>GPS-locatie</TableCell>
                        <TableCell>{positionDescription}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Safe?</TableCell>
                        <TableCell>
                          <SafeSelector team={team} />{' '}
                          {team.safe_weide_updated_at && team.safe_weide_updated_by && (
                            <>
                              ({formatFromNow(team.safe_weide_updated_at)} door{' '}
                              {team.safe_weide_updated_by})
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Container>
              </Paper>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Typography variant="h6">Tracker</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Tracker online</TableCell>
                        <TableCell>
                          <Alert severity={tracker?.is_online ? 'success' : 'warning'}>
                            <Tooltip
                              title={formatDateTimeLong(tracker?.last_log?.gps_datetime)}
                              enterTouchDelay={0}
                            >
                              <Typography variant="body2" color="textSecondary">
                                Laatste update {formatFromNow(tracker?.last_log?.gps_datetime)}
                              </Typography>
                            </Tooltip>
                          </Alert>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Trackercode</TableCell>
                        <TableCell>{tracker?.tracker_name}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Container>
              </Paper>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Typography variant="h6">Fiches</Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fiche</TableCell>
                        <TableCell>Aankomst</TableCell>
                        <TableCell>Vertrek</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.ficheName}</TableCell>
                          <TableCell>{formatDateTimeShorter(log.arrived)}</TableCell>
                          <TableCell>{formatDateTimeShorter(log.left)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Container>
              </Paper>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack flex="1 1 0" spacing={2}>
              {canSeeTeamNotes && (
                <Paper>
                  <Container sx={{ pt: 2, pb: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="h6">Notities</Typography>
                      {team.team_notes && (
                        <List>
                          {team.team_notes.map((note) => (
                            <ListItem
                              key={note.id}
                              secondaryAction={
                                <IconButton onClick={() => deleteTeamNote(note.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={note.text}
                                secondary={
                                  formatFromNow(note.created) +
                                  (note.author ? ` door ${note.author}` : '')
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                      {team.team_notes.length === 0 && (
                        <Typography variant="body2" color="textSecondary">
                          Nog geen notities
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1}>
                        <TextField
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          multiline
                          slotProps={{ input: { spellCheck: false } }}
                        />
                        <Button variant="contained" onClick={createNote}>
                          Post
                        </Button>
                      </Stack>
                    </Stack>
                  </Container>
                </Paper>
              )}
              {canSeeContactPersons && (
                <Paper>
                  <Container sx={{ pt: 2, pb: 2 }}>
                    <Typography variant="h6">Leden</Typography>
                    <ContactPersonsList team={team} />
                  </Container>
                </Paper>
              )}
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="h6">Groepsfoto</Typography>
                    {team.group_picture ? (
                      <a href={team.group_picture} target="_blank">
                        <Box
                          component="img"
                          src={team.group_picture}
                          sx={{
                            maxWidth: '100%',
                          }}
                        />
                      </a>
                    ) : (
                      <Typography variant="body2">Nog geen groepsfoto.</Typography>
                    )}
                    {uploadedFile && <Typography variant="body2">{uploadedFile.name}</Typography>}
                    <Stack direction="row" spacing={1}>
                      <Button
                        component="label"
                        role={undefined}
                        variant="contained"
                        color="secondary"
                        startIcon={<CloudUploadIcon />}
                      >
                        Kies foto
                        <VisuallyHiddenInput type="file" onChange={onFileInputChange} />
                      </Button>
                      <Button variant="contained" onClick={onUpload}>
                        Upload
                      </Button>
                    </Stack>
                  </Stack>
                </Container>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
