import { ChangeEvent, memo, useCallback, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import {
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
  useGetStatsQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetWeidesQuery,
  useUploadGroupPictureMutation,
} from '../services/linker.ts';
import { teamColor } from '../theme/colors.ts';
import { getPositionDescription } from '../utils/data.ts';
import { secondsToHoursMinutes } from '../utils/time.ts';

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

const TeamPage = memo(function TeamPage() {
  const { teamId } = useParams();

  const { data: teams } = useGetTeamsQuery();
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: stats } = useGetStatsQuery();
  const { data: trackers } = useGetTrackersQuery();
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
    if (!(teams && trackers && fiches && tochten && weides && teamId)) {
      return '-';
    }
    const trackerId = teams.entities[+teamId].tracker;
    if (!trackerId) {
      return '-';
    }
    return getPositionDescription(trackers.entities[trackerId], fiches, tochten, weides);
  }, [teamId, teams, trackers, fiches, tochten, weides]);

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
          <Grid container item xs={12} md={8}>
            <Stack flex="1 1 0" spacing={2}>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Typography variant="h6">Tracing</Typography>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Gem. afwijking voor tochten</TableCell>
                        <TableCell>{secondsToHoursMinutes(teamStats?.avgTochtDeviation)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Gem. afwijking voor fiches</TableCell>
                        <TableCell>{secondsToHoursMinutes(teamStats?.avgFicheDeviation)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Locatie</TableCell>
                        <TableCell>{positionDescription}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Safe?</TableCell>
                        <TableCell>
                          <SafeSelector team={team} />
                        </TableCell>
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
                          <TableCell>{new Date(log.arrived).toLocaleString()}</TableCell>
                          <TableCell>
                            {log.left ? new Date(log.left).toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Container>
              </Paper>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack flex="1 1 0" spacing={2}>
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
                              secondary={new Date(note.created).toLocaleString()}
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
                        inputProps={{ spellCheck: 'false' }}
                      />
                      <Button variant="contained" onClick={createNote}>
                        Post
                      </Button>
                    </Stack>
                  </Stack>
                </Container>
              </Paper>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
                  <Typography variant="h6">Leden</Typography>
                  <ContactPersonsList team={team} />
                </Container>
              </Paper>
              <Paper>
                <Container sx={{ pt: 2, pb: 2 }}>
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
                  {uploadedFile && <Typography variant="body2">{uploadedFile.name}</Typography>}
                  <Button variant="contained" onClick={onUpload}>
                    Upload
                  </Button>
                </Container>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
});

export default TeamPage;
