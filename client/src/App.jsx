import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
} from "@mui/material";
import { Link, Routes, Route, Outlet } from "react-router-dom";
import Home from "./Home.jsx";
import About from "./About.jsx";
import NotFound from "./NotFound.jsx";
import styles from "./App.module.css";
import { AuthContext } from "./AuthProvider.jsx";
import { useContext } from "react";
import ColorModeContext from "./ColorModeContext.jsx";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function App() {
  function Layout() {
    const { isLogged, logout, login } = useContext(AuthContext);
      const colorMode = useContext(ColorModeContext);

    return (
      <>
        <AppBar>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Company Name</Typography>
              {/* Theme toggle */}
              <IconButton
                sx={{ ml: 1 }}
                onClick={colorMode.toggleColorMode}
                color="inherit"
                aria-label="toggle theme"
              >
                {colorMode.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>

            {isLogged ? (
              <>
                <Link className={styles.link} to="/">
                  Home
                </Link>
                <Link className={styles.link} to="/about">
                  About
                </Link>
                <Link className={styles.link} to="/does-not-exist">
                  404 Test
                </Link>
                <Link className={styles.link} onClick={logout}>
                  Logout
                </Link>
              </>
            ) : (
              <Link className={styles.link} onClick={login}>
                Login with ServiceNow
              </Link>
            )}
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 10 }}>
          <Outlet />
        </Container>
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
