import { createTheme } from '@mui/material/styles';

// MUI theme mapped to Fondly's HSL design tokens, so MUI inputs/buttons
// share the same palette as the Tailwind layout layer.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: 'hsl(328, 86%, 59%)', contrastText: '#fff' },
    secondary: { main: 'hsl(24, 95%, 53%)', contrastText: '#fff' },
    background: {
      default: 'hsl(280, 50%, 5%)',
      paper: 'hsl(280, 40%, 8%)',
    },
    text: {
      primary: 'hsl(0, 0%, 98%)',
      secondary: 'hsl(280, 20%, 60%)',
    },
    divider: 'hsl(280, 30%, 15%)',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'hsl(280, 34%, 11%)',
          borderRadius: 14,
          '& fieldset': { borderColor: 'hsl(280, 30%, 18%)' },
          '&:hover fieldset': { borderColor: 'hsl(280, 30%, 28%)' },
          '&.Mui-focused fieldset': {
            borderColor: 'hsl(45, 95%, 58%)',
            boxShadow: '0 0 18px hsl(45 95% 58% / 0.35)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14, fontSize: '1rem' },
      },
    },
  },
});

export default theme;
