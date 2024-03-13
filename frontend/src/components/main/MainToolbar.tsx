import React, { memo, useCallback, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
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

interface MainToolbarProps {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onSearchEnter: (value: string) => void;
  listOpen: boolean;
  setListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filterSafe: boolean;
  setFilterSafe: React.Dispatch<React.SetStateAction<boolean>>;
  filterMembers: boolean;
  setFilterMembers: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainToolbar = memo(function MainToolbar({
  keyword,
  onChangeKeyword,
  onSearchEnter,
  listOpen,
  setListOpen,
  filterSafe,
  setFilterSafe,
  filterMembers,
  setFilterMembers,
}: MainToolbarProps) {
  const theme = useTheme();

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
        <FilterIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => setFilterSafe(!filterSafe)}>
          <ListItemIcon>{filterSafe && <CheckIcon />}</ListItemIcon>
          Safe teams
        </MenuItem>
        <MenuItem onClick={() => setFilterMembers(!filterMembers)}>
          <ListItemIcon>{filterMembers && <CheckIcon />}</ListItemIcon>
          Organisatie
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
