import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GrassIcon from '@mui/icons-material/Grass';
import HikingIcon from '@mui/icons-material/Hiking';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import {
  Avatar,
  Box,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type SvgIcon from '@mui/material/SvgIcon';
import { blue, brown, green, grey, orange, purple, red, teal } from '@mui/material/colors';

import { skipToken } from '@reduxjs/toolkit/query';
import bbox from '@turf/bbox';
import { feature, featureCollection } from '@turf/helpers';

import {
  useGetOrganizationMemberPositionsQuery,
  useGetTeamPositionsQuery,
  useGetTeamSafetyLogsQuery,
  useGetWeidesQuery,
} from '../../services/linker.ts';
import type { Position, TeamSafetyLog } from '../../services/types.ts';
import { PositionSource } from '../../services/types.ts';
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

// A stretch between two consecutive fixes longer than this reads as "no recorded
// positions" and is drawn gray on the slider rail.
const GAP_THRESHOLD_MS = 10 * 60 * 1000;

// Any real-time gap between two consecutive events (fix or safety change) longer than
// this is compressed down to this width on the slider, so long idle stretches (tracker
// online early, team only starts moving much later) don't dominate the timeline.
const COMPRESS_CAP_MS = 10 * 60 * 1000;

function sourceColor(source: PositionSource): string {
  switch (source) {
    case PositionSource.MANUAL:
      return orange[500];
    case PositionSource.PHONE_GPS:
      return blue[500];
    default:
      return green[500];
  }
}

function sourceLabel(source: PositionSource): string {
  switch (source) {
    case PositionSource.MANUAL:
      return 'Manueel';
    case PositionSource.PHONE_GPS:
      return 'Telefoon';
    default:
      return 'Tracker';
  }
}

type IconComponent = typeof SvgIcon;

function sourceIcon(source: PositionSource): IconComponent {
  switch (source) {
    case PositionSource.MANUAL:
      return EditLocationAltIcon;
    case PositionSource.PHONE_GPS:
      return SmartphoneIcon;
    default:
      return GpsFixedIcon;
  }
}

type SafetyStatus = 'unknown' | 'unsafe' | 'bus' | 'weide' | 'slotweide';

function safetyStatus(
  log: TeamSafetyLog | null,
  weideSlotweide: Map<string, boolean>,
): SafetyStatus {
  if (!log || !log.location) {
    return log ? 'unsafe' : 'unknown';
  }
  const location = log.location.trim();
  if (location.toLowerCase() === 'bus') {
    return 'bus';
  }
  return weideSlotweide.get(location) === true ? 'slotweide' : 'weide';
}

function safetyColor(status: SafetyStatus): string {
  switch (status) {
    case 'unsafe':
      return red[500];
    case 'bus':
      return brown[500];
    case 'weide':
      return teal[500];
    case 'slotweide':
      return purple[500];
    default:
      return grey[400];
  }
}

function safetyIcon(status: SafetyStatus): IconComponent {
  switch (status) {
    case 'unsafe':
      return HikingIcon;
    case 'bus':
      return DirectionsBusIcon;
    case 'weide':
      return GrassIcon;
    case 'slotweide':
      return SportsScoreIcon;
    default:
      return QuestionMarkIcon;
  }
}

// Text color contrasting each segment's background; only the "no data"/"unknown" gray
// is light enough to need dark text.
function textColorFor(bgColor: string): string {
  return bgColor === grey[400] ? grey[900] : '#fff';
}

const POSITION_LEGEND: { color: string; label: string; icon: IconComponent }[] = [
  { color: green[500], label: 'Tracker', icon: GpsFixedIcon },
  { color: blue[500], label: 'Telefoon', icon: SmartphoneIcon },
  { color: orange[500], label: 'Manueel', icon: EditLocationAltIcon },
  { color: grey[400], label: 'Geen data', icon: LocationOffIcon },
];

const SAFETY_LEGEND: { color: string; label: string; icon: IconComponent }[] = [
  { color: purple[500], label: 'Slotweide', icon: SportsScoreIcon },
  { color: teal[500], label: 'Weide', icon: GrassIcon },
  { color: brown[500], label: 'Bus', icon: DirectionsBusIcon },
  { color: red[500], label: 'Unsafe', icon: HikingIcon },
];

// Short label shown inside a safety segment on the bar.
function safetyStatusLabel(status: SafetyStatus, location?: string): string {
  switch (status) {
    case 'unsafe':
      return 'Unsafe';
    case 'bus':
      return 'Bus';
    case 'weide':
      return `Weide · ${location}`;
    case 'slotweide':
      return `Slotweide · ${location}`;
    default:
      return 'Onbekend';
  }
}

// Detailed label shown below the bars for the moment the slider is currently at.
function safetyLabel(status: SafetyStatus, log: TeamSafetyLog | null): string {
  switch (status) {
    case 'unsafe':
      return `Unsafe`;
    case 'bus':
      return `Bus`;
    case 'weide':
      return `Weide · ${log?.location}`;
    case 'slotweide':
      return `Slotweide · ${log?.location}`;
    default:
      return 'Geen safe-status';
  }
}

// Index of the position in effect at the given time: the most recent fix at or
// before `timeMs`. Assumes timestamps are sorted ascending.
function activeIndexForTime(timestamps: number[], timeMs: number): number {
  let index = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] <= timeMs) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

// The safety entry in effect at the given time: the most recent change at or
// before `timeMs`. Assumes logs are sorted ascending by `created`.
function activeSafety(
  safetyLogs: TeamSafetyLog[] | undefined,
  timeMs: number,
): TeamSafetyLog | null {
  if (!safetyLogs) {
    return null;
  }
  let result: TeamSafetyLog | null = null;
  for (const log of safetyLogs) {
    if (new Date(log.created).getTime() <= timeMs) {
      result = log;
    } else {
      break;
    }
  }
  return result;
}

// Cumulative "compressed" offset for each breakpoint: real gaps beyond COMPRESS_CAP_MS
// count only as COMPRESS_CAP_MS, so long idle stretches take a fixed, small amount of
// slider space instead of being proportional to their real duration.
function buildCompression(breakpoints: number[]): number[] {
  const cum = [0];
  for (let i = 1; i < breakpoints.length; i++) {
    const gap = breakpoints[i] - breakpoints[i - 1];
    cum.push(cum[i - 1] + Math.min(gap, COMPRESS_CAP_MS));
  }
  return cum;
}

function compressedToReal(breakpoints: number[], cum: number[], value: number): number {
  if (value <= cum[0]) return breakpoints[0];
  const last = cum.length - 1;
  if (value >= cum[last]) return breakpoints[last];
  let i = 0;
  while (i < last && cum[i + 1] < value) i++;
  const span = cum[i + 1] - cum[i];
  const frac = span > 0 ? (value - cum[i]) / span : 0;
  return breakpoints[i] + frac * (breakpoints[i + 1] - breakpoints[i]);
}

function realToCompressed(breakpoints: number[], cum: number[], realMs: number): number {
  const last = breakpoints.length - 1;
  if (realMs <= breakpoints[0]) return cum[0];
  if (realMs >= breakpoints[last]) return cum[last];
  let i = 0;
  while (i < last && breakpoints[i + 1] < realMs) i++;
  const span = breakpoints[i + 1] - breakpoints[i];
  const frac = span > 0 ? (realMs - breakpoints[i]) / span : 0;
  return cum[i] + frac * (cum[i + 1] - cum[i]);
}

interface RenderedSegment {
  widthPct: number;
  color: string;
  textColor: string;
  label: string;
  icon: IconComponent;
}

interface Timeline {
  positionTimestamps: number[];
  minTime: number;
  maxTime: number;
  minCompressed: number;
  maxCompressed: number;
  breakpoints: number[];
  cum: number[];
  positionSegments: RenderedSegment[];
  safetySegments: RenderedSegment[];
}

function buildTimeline(
  positions: Position[],
  safetyLogs: TeamSafetyLog[] | undefined,
  weideSlotweide: Map<string, boolean>,
): Timeline {
  const positionTimestamps = positions.map((p) => new Date(p.timestamp).getTime());
  const safetyTimestamps = (safetyLogs ?? []).map((l) => new Date(l.created).getTime());

  const breakpoints = Array.from(new Set([...positionTimestamps, ...safetyTimestamps])).sort(
    (a, b) => a - b,
  );
  const minTime = breakpoints[0];
  const maxTime = breakpoints[breakpoints.length - 1];
  const cum = buildCompression(breakpoints);
  const cumByTime = new Map(breakpoints.map((t, i) => [t, cum[i]]));
  const maxCompressed = cum[cum.length - 1];

  const pct = (timeMs: number) => {
    const value = cumByTime.get(timeMs) ?? 0;
    return maxCompressed > 0 ? (value / maxCompressed) * 100 : 0;
  };

  // Collapse consecutive raw segments that share the same color/label into one: a long
  // stretch of same-source fixes should be a single DOM node, not one per fix pair. This
  // matters a lot - an all-day tracked team can have thousands of fixes, and without
  // merging we'd mount thousands of boxes (each with its own Tooltip), which made
  // dragging the slider freeze the tab.
  const mergeConsecutive = (
    segments: { fromMs: number; toMs: number; color: string; label: string; icon: IconComponent }[],
  ): { fromMs: number; toMs: number; color: string; label: string; icon: IconComponent }[] => {
    const merged: typeof segments = [];
    for (const seg of segments) {
      const last = merged[merged.length - 1];
      if (last && last.color === seg.color && last.label === seg.label) {
        last.toMs = seg.toMs;
      } else {
        merged.push({ ...seg });
      }
    }
    return merged;
  };

  const buildRendered = (
    segments: { fromMs: number; toMs: number; color: string; label: string; icon: IconComponent }[],
  ): RenderedSegment[] => {
    if (maxCompressed <= 0) {
      const first = segments[0];
      return first
        ? [
            {
              widthPct: 100,
              color: first.color,
              textColor: textColorFor(first.color),
              label: first.label,
              icon: first.icon,
            },
          ]
        : [];
    }
    return segments.map(({ fromMs, toMs, color, label, icon }) => ({
      widthPct: pct(toMs) - pct(fromMs),
      color,
      textColor: textColorFor(color),
      label,
      icon,
    }));
  };

  // Position rail: each stretch between two fixes takes the earlier fix's source
  // color, gaps longer than GAP_THRESHOLD_MS and anything outside the fix range go gray.
  const positionRaw: {
    fromMs: number;
    toMs: number;
    color: string;
    label: string;
    icon: IconComponent;
  }[] = [];
  if (positionTimestamps[0] > minTime) {
    positionRaw.push({
      fromMs: minTime,
      toMs: positionTimestamps[0],
      color: grey[400],
      label: 'Geen data',
      icon: LocationOffIcon,
    });
  }
  for (let i = 0; i < positions.length - 1; i++) {
    const isGap =
      positions[i].source !== PositionSource.MANUAL &&
      positionTimestamps[i + 1] - positionTimestamps[i] > GAP_THRESHOLD_MS;
    positionRaw.push({
      fromMs: positionTimestamps[i],
      toMs: positionTimestamps[i + 1],
      color: isGap ? grey[400] : sourceColor(positions[i].source),
      label: isGap ? 'Geen data' : sourceLabel(positions[i].source),
      icon: isGap ? LocationOffIcon : sourceIcon(positions[i].source),
    });
  }
  if (positionTimestamps[positions.length - 1] < maxTime) {
    positionRaw.push({
      fromMs: positionTimestamps[positions.length - 1],
      toMs: maxTime,
      color: grey[400],
      label: 'Geen data',
      icon: LocationOffIcon,
    });
  }

  // Safety rail: each stretch between two safety changes takes the earlier change's
  // status color; before the first known change it's gray (unknown).
  const safetyRaw: {
    fromMs: number;
    toMs: number;
    color: string;
    label: string;
    icon: IconComponent;
  }[] = [];
  const sortedLogs = [...(safetyLogs ?? [])].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
  );
  if (sortedLogs.length === 0) {
    safetyRaw.push({
      fromMs: minTime,
      toMs: maxTime,
      color: grey[400],
      label: 'Onbekend',
      icon: QuestionMarkIcon,
    });
  } else {
    const firstMs = new Date(sortedLogs[0].created).getTime();
    if (firstMs > minTime) {
      safetyRaw.push({
        fromMs: minTime,
        toMs: firstMs,
        color: grey[400],
        label: 'Onbekend',
        icon: QuestionMarkIcon,
      });
    }
    for (let i = 0; i < sortedLogs.length; i++) {
      const fromMs = new Date(sortedLogs[i].created).getTime();
      const toMs =
        i + 1 < sortedLogs.length ? new Date(sortedLogs[i + 1].created).getTime() : maxTime;
      const status = safetyStatus(sortedLogs[i], weideSlotweide);
      safetyRaw.push({
        fromMs,
        toMs,
        color: safetyColor(status),
        label: safetyStatusLabel(status, sortedLogs[i].location),
        icon: safetyIcon(status),
      });
    }
  }

  return {
    positionTimestamps,
    minTime,
    maxTime,
    minCompressed: 0,
    maxCompressed,
    breakpoints,
    cum,
    positionSegments: buildRendered(mergeConsecutive(positionRaw)),
    safetySegments: buildRendered(mergeConsecutive(safetyRaw)),
  };
}

export default function HistoryCard() {
  const dispatch = useAppDispatch();
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const selectedItem = useAppSelector(selectSelectedItem);
  const selectedTeam = useAppSelector(selectSelectedTeam);
  const selectedMember = useAppSelector(selectSelectedMember);

  const [sliderTime, setSliderTime] = useState<number | null>(null);
  const { mainMap } = useMap();

  const code = selectedItem?.code;

  const { currentData: teamPositions } = useGetTeamPositionsQuery(
    selectedTeam && showHistory ? selectedTeam.id : skipToken,
  );
  const { currentData: organizationMemberPositions } = useGetOrganizationMemberPositionsQuery(
    selectedMember && showHistory ? selectedMember.id : skipToken,
  );
  const { currentData: safetyLogs } = useGetTeamSafetyLogsQuery(
    selectedTeam && showHistory ? selectedTeam.id : skipToken,
  );
  const { data: weides } = useGetWeidesQuery();

  const positions = teamPositions || organizationMemberPositions;

  const weideSlotweide = useMemo(
    () => new Map(weides ? Object.values(weides.entities).map((w) => [w.name, w.slotweide]) : []),
    [weides],
  );

  const timeline = useMemo(
    () =>
      positions && positions.length > 0
        ? buildTimeline(positions, safetyLogs, weideSlotweide)
        : null,
    [positions, safetyLogs, weideSlotweide],
  );

  // Reset the slider to the most recent moment whenever the timeline changes.
  const [prevTimeline, setPrevTimeline] = useState(timeline);
  if (timeline !== prevTimeline) {
    setPrevTimeline(timeline);
    setSliderTime(timeline ? timeline.maxTime : null);
  }

  const currentTime = timeline ? (sliderTime ?? timeline.maxTime) : null;
  const currentCompressed =
    timeline && currentTime !== null
      ? realToCompressed(timeline.breakpoints, timeline.cum, currentTime)
      : null;
  const activeIndex =
    timeline && currentTime !== null
      ? activeIndexForTime(timeline.positionTimestamps, currentTime)
      : -1;
  const activeSafetyLog = currentTime !== null ? activeSafety(safetyLogs, currentTime) : null;
  const activeSafetyStatus = safetyStatus(activeSafetyLog, weideSlotweide);

  useEffect(() => {
    if (!positions || positions.length === 0 || !mainMap) {
      return;
    }

    const bounds = bbox(featureCollection(positions.map((l) => feature(l.point))));
    // @ts-expect-error bounds is always 4 elements long
    mainMap.fitBounds(bounds, { padding: 30 });

    const position = positions[positions.length - 1];
    dispatch(
      trackersActions.setHistoryItem({
        point: position.point,
        timestamp: position.timestamp,
        source: position.source,
      }),
    );
  }, [positions, dispatch, mainMap]);

  const onSliderChange = useCallback(
    (timeMs: number) => {
      setSliderTime(timeMs);
      if (positions && timeline) {
        const position = positions[activeIndexForTime(timeline.positionTimestamps, timeMs)];
        dispatch(
          trackersActions.setHistoryItem({
            point: position.point,
            timestamp: position.timestamp,
            source: position.source,
          }),
        );
      }
    },
    [dispatch, positions, timeline],
  );

  const onSliderChangeCompressed = useCallback(
    (compressedValue: number) => {
      if (timeline) {
        onSliderChange(compressedToReal(timeline.breakpoints, timeline.cum, compressedValue));
      }
    },
    [onSliderChange, timeline],
  );

  return (
    <MainCard sx={{ width: '600px' }}>
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
        slotProps={{ title: { noWrap: true } }}
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
          timeline && activeIndex >= 0 ? (
            <>
              <Box sx={{ position: 'relative', pl: 1, pr: 1 }}>
                <Stack spacing={0.5}>
                  {(
                    [
                      { key: 'position', segments: timeline.positionSegments },
                      { key: 'safety', segments: timeline.safetySegments },
                    ] as const
                  ).map(({ key, segments }) => (
                    <Box
                      key={key}
                      sx={{ display: 'flex', height: 32, borderRadius: 1, overflow: 'hidden' }}
                    >
                      {segments.map((seg, i) => (
                        <Tooltip key={i} title={seg.label}>
                          <Box
                            sx={{
                              width: `${seg.widthPct}%`,
                              flexShrink: 0,
                              bgcolor: seg.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderRight: '1px solid rgba(255,255,255,0.4)',
                            }}
                          >
                            <seg.icon sx={{ color: seg.textColor, fontSize: 18 }} />
                          </Box>
                        </Tooltip>
                      ))}
                    </Box>
                  ))}
                </Stack>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    pl: 1,
                    pr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Slider
                    value={currentCompressed ?? timeline.maxCompressed}
                    min={timeline.minCompressed}
                    max={timeline.maxCompressed > 0 ? timeline.maxCompressed : 1}
                    onChange={(_, v) => onSliderChangeCompressed(v as number)}
                    track={false}
                    disabled={timeline.maxCompressed <= 0}
                    sx={{
                      pointerEvents: 'auto',
                      '& .MuiSlider-rail': { opacity: 0 },
                      '& .MuiSlider-thumb': {
                        width: 4,
                        height: 48,
                        borderRadius: 0,
                        bgcolor: grey[900],
                        border: 'none',
                        '&::before': { boxShadow: 'none' },
                      },
                    }}
                  />
                </Box>
              </Box>
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', justifyContent: 'center', mt: 1 }}
              >
                <IconButton
                  onClick={() => onSliderChange(timeline.positionTimestamps[activeIndex - 1])}
                  disabled={activeIndex === 0}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="body2">
                  {formatDateTimeLong(positions[activeIndex]?.timestamp)}
                </Typography>
                <IconButton
                  onClick={() => onSliderChange(timeline.positionTimestamps[activeIndex + 1])}
                  disabled={activeIndex === positions.length - 1}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Stack>

              {safetyLogs && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ textAlign: 'center', mt: 0.5 }}
                >
                  {safetyLabel(activeSafetyStatus, activeSafetyLog)}
                </Typography>
              )}

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 1 }}
              >
                {POSITION_LEGEND.map((item) => (
                  <Stack
                    key={item.label}
                    direction="row"
                    spacing={0.5}
                    sx={{ alignItems: 'center' }}
                  >
                    <item.icon sx={{ fontSize: 14, color: item.color }} />
                    <Typography variant="caption" color="textSecondary">
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              {safetyLogs && (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 0.5 }}
                >
                  {SAFETY_LEGEND.map((item) => (
                    <Stack
                      key={item.label}
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: 'center' }}
                    >
                      <item.icon sx={{ fontSize: 14, color: item.color }} />
                      <Typography variant="caption" color="textSecondary">
                        {item.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
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
