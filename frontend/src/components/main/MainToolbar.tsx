import React, { memo, useCallback, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Badge,
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

import { filterActions, selectFilterActive, useAppDispatch, useAppSelector } from '../../store';

interface MainToolbarProps {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onSearchEnter: (value: string) => void;
  listOpen: boolean;
  setListOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainToolbar = memo(function MainToolbar({
  keyword,
  onChangeKeyword,
  onSearchEnter,
  listOpen,
  setListOpen,
}: MainToolbarProps) {
  const theme = useTheme();

  const showSafe = useAppSelector((state) => state.filter.showSafe);
  const showMembers = useAppSelector((state) => state.filter.showMembers);
  const showRed = useAppSelector((state) => state.filter.showRed);
  const showBlue = useAppSelector((state) => state.filter.showBlue);
  const filterActive = useAppSelector(selectFilterActive);
  const dispatch = useAppDispatch();

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
    </Toolbar>
  );
});

export default MainToolbar;
