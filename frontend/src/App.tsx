import { Outlet } from 'react-router-dom';

import { css } from '@emotion/react';

import './App.css';

export default function App() {
  const main = css`
    flex-grow: 1;
    overflow: auto;
  `;

  return (
    <>
      <div css={main}>
        <Outlet />
      </div>
    </>
  );
}
