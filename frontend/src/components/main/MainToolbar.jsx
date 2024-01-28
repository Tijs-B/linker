import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  IconButton,
  InputAdornment,
  OutlinedInput,
  Toolbar,
  useTheme,
} from '@mui/material';

import { css } from '@emotion/react';

export default function MainToolbar({ keyword, setKeyword, onSearchEnter, listOpen, setListOpen }) {
  const theme = useTheme();

  return (
    <Toolbar
      css={css`
        gap: ${theme.spacing(1)};
      `}
    >
      <IconButton edge="start" onClick={() => setListOpen(!listOpen)}>
        {listOpen ? <MapIcon /> : <ViewListIcon />}
      </IconButton>
      <OutlinedInput
        placeholder="Zoeken"
        size="small"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            onSearchEnter(e.target.value);
          }
        }}
        endAdornment={
          keyword && (
            <InputAdornment position="end">
              <IconButton onClick={() => setKeyword('')}>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          )
        }
        fullWidth
      />
    </Toolbar>
  );
}
