import { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
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

import {
  useGetOrganizationMemberPositionsQuery,
  useGetTeamPositionsQuery,
} from '../../services/linker.ts';
import {
  selectSelectedItem,
  selectSelectedMember,
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
  const selectedMember = useAppSelector(selectSelectedMember);

  const [index, setIndex] = useState(0);
  const { mainMap } = useMap();

  const code = selectedItem?.code;

  const { currentData: teamPositions } = useGetTeamPositionsQuery(
    selectedTeam && showHistory ? selectedTeam.id : skipToken,
  );
  const { currentData: organizationMemberPositions } = useGetOrganizationMemberPositionsQuery(
    selectedMember && showHistory ? selectedMember.id : skipToken,
  );

  const positions = teamPositions || organizationMemberPositions;

  useEffect(() => {
    if (!positions || positions.length === 0 || !mainMap) {
      return;
    }

    const bounds = bbox(featureCollection(positions.map((l) => feature(l.point))));
    // @ts-expect-error bounds is always 4 elements long
    mainMap.fitBounds(bounds, { padding: 30 });

    setIndex(positions.length - 1);
    const position = positions[positions.length - 1];
    dispatch(
      trackersActions.setHistoryItem({
        point: position.point,
        timestamp: position.timestamp,
      }),
    );
  }, [positions, dispatch, mainMap]);

  const onSliderChange = useCallback(
    (value: number) => {
      setIndex(value);
      if (positions) {
        dispatch(trackersActions.setHistoryItem(positions[value]));
      }
    },
    [dispatch, positions],
  );

  return (
    <MainCard sx={{ width: '540px' }}>
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

      <CardContent>
        {positions ? (
          positions.length > 0 ? (
            <>
              <Box sx={{ pl: 1, pr: 1 }}>
                <Slider
                  value={index}
                  max={positions.length - 1}
                  onChange={(_, v) => onSliderChange(v)}
                />
              </Box>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <IconButton
                  onClick={() => onSliderChange(Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="body2">
                  {formatDateTimeLong(positions?.[index]?.timestamp)}
                </Typography>
                <IconButton
                  onClick={() => onSliderChange(Math.min(positions.length - 1, index + 1))}
                  disabled={index === positions.length - 1}
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
