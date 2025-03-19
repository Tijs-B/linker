import React, { useCallback, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
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
  ListItemIcon,
  Menu,
  MenuItem,
  OutlinedInput,
  Toolbar,
  useTheme,
} from '@mui/material';

import { css } from '@emotion/react';

import { useGetNotificationsQuery, useGetUserQuery } from '../../services/linker.ts';
import { filterActions, selectFilterActive, useAppDispatch, useAppSelector } from '../../store';

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

  const showSafe = useAppSelector((state) => state.filter.showSafe);
  const showMembers = useAppSelector((state) => state.filter.showMembers);
  const showRed = useAppSelector((state) => state.filter.showRed);
  const showBlue = useAppSelector((state) => state.filter.showBlue);
  const filterActive = useAppSelector(selectFilterActive);
  const dispatch = useAppDispatch();

  const { data: user } = useGetUserQuery();
  const canViewNotifications = Boolean(user?.permissions.includes('view_notification'));
  const { data: notifications } = useGetNotificationsQuery(undefined, {
    skip: !canViewNotifications,
  });

  const [menuAnchorEl, setMenuAnchorEl] = useState<Element | null>(null);

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
      <IconButton edge="start" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
        <Badge variant="dot" invisible={!filterActive} color="primary">
          <FilterIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => dispatch(filterActions.toggleShowSafe())}>
          <ListItemIcon>{showSafe && <CheckIcon />}</ListItemIcon>
          Toon safe teams
        </MenuItem>
        <MenuItem onClick={() => dispatch(filterActions.toggleShowMembers())}>
          <ListItemIcon>{showMembers && <CheckIcon />}</ListItemIcon>
          Toon organisatie
        </MenuItem>
        <MenuItem onClick={() => dispatch(filterActions.toggleShowBlue())}>
          <ListItemIcon>{showBlue && <CheckIcon />}</ListItemIcon>
          Toon blauwe teams
        </MenuItem>
        <MenuItem onClick={() => dispatch(filterActions.toggleShowRed())}>
          <ListItemIcon>{showRed && <CheckIcon />}</ListItemIcon>
          Toon rode teams
        </MenuItem>
      </Menu>
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
