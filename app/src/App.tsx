import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import Home from './Routes/Home'
import { createTheme, ThemeProvider } from '@mui/material'
import Dashboard from './Routes/Dashboard'
import { useClient } from './Hooks/useClient'
import type APIClient from './API/APIClient'
import { Provider } from 'react-redux'
import { store } from './store'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ad3636',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e47272',
      contrastText: '#ffffff',
    },
    background: {
      default: '#251f1f',
      paper: '#2d2626', // um leve contraste pro card/paper
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0d5d5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const client: APIClient = useClient();

  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path={"/"} element={<Home client={client} />} />
            <Route path={"/dashboard"} element={<Dashboard client={client} />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default App
