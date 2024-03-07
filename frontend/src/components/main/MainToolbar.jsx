import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
    IconButton,
    InputAdornment, ListItemIcon, Menu, MenuItem,
    OutlinedInput,
    Toolbar,
    useTheme,
} from '@mui/material';

import {css} from '@emotion/react';
import {memo, useState} from "react";

const MainToolbar = memo(function MainToolbar({
                                                  keyword,
                                                  setKeyword,
                                                  onSearchEnter,
                                                  listOpen,
                                                  setListOpen,
                                                  filterSafe,
                                                  setFilterSafe,
                                                  filterMembers,
                                                  setFilterMembers
                                              }) {
    const theme = useTheme();

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    return (
        <Toolbar
            css={css`
                gap: ${theme.spacing(1)};
            `}
        >
            <IconButton edge="start" onClick={() => setListOpen(!listOpen)}>
                {listOpen ? <MapIcon/> : <ViewListIcon/>}
            </IconButton>
            <IconButton edge="start" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                <FilterIcon/>
            </IconButton>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
                <MenuItem onClick={() => setFilterSafe(!filterSafe)}>
                    <ListItemIcon>{filterSafe && (<CheckIcon/>)}</ListItemIcon>
                    Safe teams
                </MenuItem>
                <MenuItem onClick={() => setFilterMembers(!filterMembers)}>
                    <ListItemIcon>{filterMembers && (<CheckIcon/>)}</ListItemIcon>
                    Organisatie
                </MenuItem>
            </Menu>
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
                                <CloseIcon/>
                            </IconButton>
                        </InputAdornment>
                    )
                }
                fullWidth
            />
        </Toolbar>
    );
})

export default MainToolbar;
