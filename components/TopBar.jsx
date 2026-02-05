import logo from '../assets/icons/bank-one-one-logo.png';
import { useThemeMode } from '../context/ThemeModeContext.jsx';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

export default function TopBar() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <header className="app-topbar">
      <div className="app-topbar__inner">
        <div className="app-brand" aria-label="Bank One One">
          <img src={logo} alt="Bank One One logo" />
          <span>Bank One One</span>
        </div>
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton
            className="theme-toggle"
            onClick={toggleMode}
            aria-label="Toggle dark mode"
            size="large"
          >
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
}
