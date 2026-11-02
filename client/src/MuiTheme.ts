import { createTheme } from '@mui/material/styles'

// Mirrors the CSS tokens in index.scss (Xpert Dev "Spatial Glass" dark theme).
const FONT = "'General Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2b7fff', light: '#4b93ff', dark: '#0a56d6', contrastText: '#fff' },
    secondary: { main: '#8cc2ff', contrastText: '#030407' },
    success: { main: '#55cd0a' },
    error: { main: '#e94045' },
    warning: { main: '#f5b544' },
    info: { main: '#5aa9ff' },
    background: { default: '#030407', paper: '#16181d' },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.62)',
      disabled: 'rgba(255,255,255,0.4)',
    },
    divider: 'rgba(255,255,255,0.1)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: FONT,
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, height: 40, paddingInline: 16 },
        containedPrimary: {
          boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.25), 0 8px 20px -8px #2b7fff',
          backgroundImage:
            'radial-gradient(120% 120% at 30% -40%, rgb(255 255 255 / 0.35), transparent 55%)',
          '&:hover': { backgroundColor: '#4b93ff' },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.06)',
          color: '#fff',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.22)',
            backgroundColor: 'rgba(255,255,255,0.12)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.06)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2b7fff',
            borderWidth: 1,
          },
          '&.Mui-focused': { boxShadow: '0 0 0 4px rgb(43 127 255 / 0.15)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(22,24,29,0.92)',
          backdropFilter: 'blur(40px) saturate(170%)',
          boxShadow: '0 1px 0 0 rgb(255 255 255 / 0.14) inset, 0 24px 48px -12px rgb(0 0 0 / 0.55)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: '#16181d',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          fontSize: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 999, fontWeight: 500 } },
    },
  },
})

export default muiTheme
