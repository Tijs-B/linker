import {memo, useEffect, useState} from 'react';
import {useMap} from 'react-map-gl/maplibre';
import {useDispatch, useSelector} from 'react-redux';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import {
    Avatar,
    Box,
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    CircularProgress,
    IconButton,
    Slider,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';

import {css} from '@emotion/react';

import {trackersActions} from '../../store/index.js';
import {itemColor} from '../../theme/colors.js';
import {useGetOrganizationMembersQuery, useGetTeamsQuery, useGetTrackerLogsQuery} from "../../services/linker.js";
import {skipToken} from "@reduxjs/toolkit/query";
import bbox from "@turf/bbox";
import {feature, featureCollection} from "@turf/helpers";

const HistoryCard = memo(function HistoryCard() {
    const theme = useTheme();

    const root = css`
        pointer-events: none;
        position: fixed;
        z-index: 5;
        left: 50%;

        ${theme.breakpoints.up('md')} {
            left: calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2);
            bottom: ${theme.spacing(3)};
        }

        ${theme.breakpoints.down('md')} {
            left: 50%;
            bottom: calc(${theme.spacing(3)} + 56px);
        }

        transform: translateX(-50%);
    `;

    const card = css`
        pointer-events: auto;
        width: 520px;
        max-width: 90vw;
    `;

    const content = css`
        padding-top: ${theme.spacing(1)};
        padding-bottom: ${theme.spacing(1)};
    `;

    const header = css`
        padding-top: ${theme.spacing(1.5)};
        padding-bottom: ${theme.spacing(0.5)};
    `;

    const dispatch = useDispatch();
    const selectedId = useSelector((state) => state.trackers.selectedId);
    const showHistory = useSelector((state) => state.trackers.showHistory);

    const {data: teams} = useGetTeamsQuery();
    const {data: organizationMembers} = useGetOrganizationMembersQuery();

    const [index, setIndex] = useState(0);
    const {mainMap} = useMap();

    const team = teams && Object.values(teams.entities).find((t) => t.tracker === selectedId);
    const member = organizationMembers && Object.values(organizationMembers.entities).find((m) => m.tracker === selectedId);

    const code = member ? member.code : team.number.toString().padStart(2, '0');

    const {currentData: logs} = useGetTrackerLogsQuery((selectedId && showHistory) ? selectedId : skipToken);

    const currentLog = logs?.[index];
    const formattedTime = currentLog ? new Date(currentLog.gps_datetime).toLocaleString() : '-';

    useEffect(() => {
        if (!logs) {
            return;
        }

        let bounds = bbox(featureCollection(logs.map((l) => feature(l.point))))

        mainMap.fitBounds(bounds, {padding: 30});

        setIndex(logs.length - 1);
        dispatch(trackersActions.setHistoryLog(logs[logs.length - 1]));

    }, [logs, dispatch, mainMap])

    function onSliderChange(value) {
        setIndex(value);
        dispatch(trackersActions.setHistoryLog(logs[value]));
    }

    return (
        <div css={root}>
            <Card css={card}>
                <CardActionArea onClick={() => dispatch(trackersActions.setShowHistory(false))}>
                    <CardHeader
                        avatar={
                            <Avatar
                                sx={{
                                    bgcolor: itemColor(team || member),
                                    fontSize: code.length > 2 ? '16px' : '20px',
                                }}
                            >
                                {code}
                            </Avatar>
                        }
                        title={team?.name || member?.name}
                        titleTypographyProps={{noWrap: true}}
                        subheader={team?.chiro}
                        action={
                            <IconButton
                                size="small"
                                onClick={() => {
                                    dispatch(trackersActions.setShowHistory(false));
                                }}
                            >
                                <CloseIcon/>
                            </IconButton>
                        }
                        css={header}
                    />
                </CardActionArea>

                <CardContent css={content}>
                    {logs ? (
                        logs.length > 0 ? (
                            <>
                                <Box sx={{pl: 1, pr: 1}}>
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
                                    sx={{justifyContent: 'center'}}
                                >
                                    <IconButton
                                        onClick={() => onSliderChange(Math.max(0, index - 1))}
                                        disabled={index === 0}
                                    >
                                        <ArrowBackIcon/>
                                    </IconButton>
                                    <Typography variant="body2">{formattedTime}</Typography>
                                    <IconButton
                                        onClick={() => onSliderChange(Math.min(logs.length - 1, index + 1))}
                                        disabled={index === logs.length - 1}
                                    >
                                        <ArrowForwardIcon/>
                                    </IconButton>
                                </Stack>
                            </>
                        ) : (
                            <Typography variant="body2">Geen logs gevonden</Typography>
                        )
                    ) : (
                        <Box sx={{display: 'flex', justifyContent: 'center'}}>
                            <CircularProgress/>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </div>
    );
});

export default HistoryCard;
