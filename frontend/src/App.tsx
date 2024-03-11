import { Outlet } from 'react-router-dom';

import { useMediaQuery, useTheme } from '@mui/material';

import { css } from '@emotion/react';

import './App.css';
import BottomMenu from './components/main/BottomMenu.tsx';

export default function App() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const main = css`
    flex-grow: 1;
    overflow: auto;
  `;

  return (
    <>
      <div css={main}>
        <Outlet />
      </div>
      {!desktop && <BottomMenu />}
    </>
  );
}
