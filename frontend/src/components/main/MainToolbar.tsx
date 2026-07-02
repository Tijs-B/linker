import React, { useCallback, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Badge,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Toolbar,
  useTheme,
} from '@mui/material';

import { css } from '@emotion/react';

import { useGetNotificationsQuery, useGetUserQuery } from '../../services/linker.ts';
import { DEFAULT_VIEW_ID, getAvailableViews, useAppSelector } from '../../store';
import ViewPickerDialog from './ViewPickerDialog.tsx';

interface MainToolbarProps {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onSearchEnter: (value: string) => void;
  listOpen: boolean;
  setListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdating: boolean;
  onForceUpdate: () => void;
  onOpenNotifications: () => void;
}

export default function MainToolbar({
  keyword,
  onChangeKeyword,
  onSearchEnter,
  listOpen,
  setListOpen,
  isUpdating,
  onForceUpdate,
  onOpenNotifications,
}: MainToolbarProps) {
  const theme = useTheme();

  const activeViewId = useAppSelector((state) => state.filter.activeViewId);

  const { data: user } = useGetUserQuery();
  const canViewNotifications = Boolean(user?.permissions.includes('view_notification'));
  const availableViews = getAvailableViews(user?.permissions ?? []);
  const { data: notifications } = useGetNotificationsQuery(undefined, {
    skip: !canViewNotifications,
  });

  const [viewPickerOpen, setViewPickerOpen] = useState(false);

  const onSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeKeyword(event.target.value);
    },
    [onChangeKeyword],
  );

  const onSearchKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onSearchEnter(keyword);
      }
    },
    [keyword, onSearchEnter],
  );

  const onClearKeyword = useCallback(() => {
    onChangeKeyword('');
  }, [onChangeKeyword]);

  const nbUnreadNotifications = notifications ? notifications.filter((n) => !n.read).length : 0;

  return (
    <Toolbar
      css={css`
        gap: ${theme.spacing(1)};
      `}
    >
      <IconButton edge="start" onClick={() => setListOpen(!listOpen)}>
        {listOpen ? <MapIcon /> : <ViewListIcon />}
      </IconButton>
      {availableViews.length > 1 && (
        <IconButton edge="start" onClick={() => setViewPickerOpen(true)}>
          <Badge variant="dot" invisible={activeViewId === DEFAULT_VIEW_ID} color="primary">
            <LayersIcon />
          </Badge>
        </IconButton>
      )}
      <ViewPickerDialog open={viewPickerOpen} onClose={() => setViewPickerOpen(false)} />
      <OutlinedInput
        placeholder="Zoeken"
        size="small"
        value={keyword}
        onChange={onSearchChange}
        onKeyUp={onSearchKeyUp}
        endAdornment={
          keyword && (
            <InputAdornment position="end">
              <IconButton onClick={onClearKeyword}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          )
        }
        fullWidth
      />
      {canViewNotifications && (
        <IconButton edge="end" onClick={onOpenNotifications}>
          <Badge badgeContent={nbUnreadNotifications} color="primary">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      )}
      <Box sx={{ position: 'relative' }}>
        <IconButton edge="end" onClick={onForceUpdate}>
          <RefreshIcon />
        </IconButton>
        {isUpdating && (
          <CircularProgress
            size={32}
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
            }}
          />
        )}
      </Box>
    </Toolbar>
  );
}
