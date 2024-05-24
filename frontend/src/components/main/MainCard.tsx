import { Card, SxProps, Theme, useTheme } from '@mui/material';

// const root = css`
//   pointer-events: none;
//   position: fixed;
//   z-index: 5;
//   left: 50%;
//
//   ${theme.breakpoints.up('md')} {
//     left: calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2);
//     bottom: ${theme.spacing(3)};
//   }
//
//   ${theme.breakpoints.down('md')} {
//     left: 50%;
//     bottom: calc(${theme.spacing(3)} + 56px);
//   }
//
//   transform: translateX(-50%);
// `;
//
// const card = css`
//   pointer-events: auto;
//   width: 520px;
//   max-width: 90vw;
// `;
//
// const content = css`
//   padding-top: ${theme.spacing(1)};
//   padding-bottom: ${theme.spacing(1)};
// `;
//
// const header = css`
//   padding-top: ${theme.spacing(1.5)};
//   padding-bottom: ${theme.spacing(0.5)};
// `;

interface MainCardProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

export default function MainCard({ children, sx = [] }: MainCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={[
        {
          position: 'fixed',
          zIndex: 5,
          transform: 'translateX(-50%)',
          maxWidth: '90vw',
          left: {
            xs: '50%',
            md: `calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2)`,
          },
          bottom: {
            xs: `calc(${theme.spacing(3)} + 56px)`,
            md: theme.spacing(3),
          },

          '.MuiCardHeader-root': {
            pt: 1.5,
            pb: 0.5,
            display: 'flex',
            overflow: 'hidden',
          },

          '.MuiCardHeader-content': { overflow: 'hidden' },
          '.MuiCardContent-root': { pt: 1, pb: 1.5 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Card>
  );
}
