import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  CardActionArea,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  Slider,
  Stack,
  Typography,
} from '@mui/material';

import { skipToken } from '@reduxjs/toolkit/query';
import bbox from '@turf/bbox';
import { feature, featureCollection } from '@turf/helpers';

import { useGetTrackerLogsQuery } from '../../services/linker.ts';
import {
  selectSelectedItem,
  selectSelectedTeam,
  trackersActions,
  useAppDispatch,
  useAppSelector,
} from '../../store/index.ts';
import { itemColor } from '../../theme/colors.ts';
import { formatDateTimeLong } from '../../utils/time.ts';
import MainCard from './MainCard.tsx';

export default function HistoryCard() {
  const dispatch = useAppDispatch();
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const selectedItem = useAppSelector(selectSelectedItem);
  const selectedTeam = useAppSelector(selectSelectedTeam);

  const [index, setIndex] = useState(0);
  const { mainMap } = useMap();

  const code = selectedItem?.code;

  const { currentData: logs } = useGetTrackerLogsQuery(
    selectedItem?.tracker && showHistory ? selectedItem.tracker : skipToken,
  );

  useEffect(() => {
    if (!logs || !mainMap) {
      return;
    }

    const bounds = bbox(featureCollection(logs.map((l) => feature(l.point))));
    // @ts-expect-error bounds is always 4 elements long
    mainMap.fitBounds(bounds, { padding: 30 });

    setIndex(logs.length - 1);
    dispatch(trackersActions.setHistoryLog(logs[logs.length - 1]));
  }, [logs, dispatch, mainMap]);

  const onSliderChange = useCallback(
    (value: number) => {
      setIndex(value);
      if (logs) {
        dispatch(trackersActions.setHistoryLog(logs[value]));
      }
    },
    [dispatch, logs],
  );

  return (
    <MainCard sx={{ width: '540px' }}>
      <CardActionArea onClick={() => dispatch(trackersActions.setShowHistory(false))}>
        <CardHeader
          avatar={
            <Avatar
              sx={{
                bgcolor: selectedItem ? itemColor(selectedItem) : '#000',
                fontSize: code && code.length > 2 ? '16px' : '20px',
              }}
            >
              {code}
            </Avatar>
          }
          title={selectedItem?.name}
          titleTypographyProps={{ noWrap: true }}
          subheader={selectedTeam?.chiro || ''}
          action={
            <IconButton
              size="small"
              onClick={() => {
                dispatch(trackersActions.setShowHistory(false));
              }}
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </CardActionArea>

      <CardContent>
        {logs ? (
          logs.length > 0 ? (
            <>
              <Box sx={{ pl: 1, pr: 1 }}>
                <Slider
                  value={index}
                  max={logs.length - 1}
                  onChange={(_, v) => onSliderChange(v)}
                />
              </Box>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ justifyContent: 'center' }}
              >
                <IconButton
                  onClick={() => onSliderChange(Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="body2">
                  {formatDateTimeLong(logs?.[index]?.gps_datetime)}
                </Typography>
                <IconButton
                  onClick={() => onSliderChange(Math.min(logs.length - 1, index + 1))}
                  disabled={index === logs.length - 1}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Stack>
            </>
          ) : (
            <Typography variant="body2">Geen logs gevonden</Typography>
          )
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
      </CardContent>
    </MainCard>
  );
}
