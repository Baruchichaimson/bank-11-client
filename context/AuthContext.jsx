import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import api from '../api/axios';
import { clearJwt, getJwt, setJwt } from '../utils/authStorage.js';
import { disconnectCallSocket } from '../api/socket.js';
import { getAccount } from '../api/accounts.api.js';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 20 * 60 * 1000; 
const DASHBOARD_PATH = '/dashboard';
const PUBLIC_PATHS = ['/login', '/register', '/verify', '/reset-password'];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getJwt());
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const inactivityTimerRef = useRef(null);

  /* ================= LOGOUT ================= */
  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    disconnectCallSocket();
    clearJwt();
    setToken(null);
    setAccount(null);
    setTransactions([]);
    setLoading(false);

    if (inactivityTimerRef.current) 
    {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    window.location.href = '/login';
  }, []);

  /* ================= LOAD ACCOUNT ================= */
  const loadAccount = useCallback(async () => {
    try {
      
      const res = await getAccount({ transactionsLimit: 5, transactionsOffset: 0 });
      setAccount(res.data.account);
      setTransactions(res.data.transactions);
      return true;
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setAccount(null);
        setTransactions([]);

        const path = window.location.pathname;
        const isPublicPath = PUBLIC_PATHS.some((publicPath) =>
          path.startsWith(publicPath)
        );

        if (!isPublicPath) {
          logout();
        }
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  /* ================= RESET INACTIVITY TIMER ================= */
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT);
  };

  const isDashboardAreaEvent = (eventTarget) => {
    if (!(eventTarget instanceof Element)) return false;
    const dashboardRoot = document.getElementById('dashboard-root');
    return Boolean(dashboardRoot && dashboardRoot.contains(eventTarget));
  };

  const shouldResetInactivity = (event) => {
    if (window.location.pathname !== DASHBOARD_PATH) {
      return false;
    }

    const target = event?.target;
    return isDashboardAreaEvent(target);
  };

  /* ================= TOKEN EFFECT ================= */
  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  /* ================= ACTIVITY LISTENERS ================= */
  useEffect(() => {
    if (!account) return;

    const events = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart'
    ];
    const handleActivity = (event) => {
      if (shouldResetInactivity(event)) {
        resetInactivityTimer();
      }
    };

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    if (window.location.pathname === DASHBOARD_PATH) {
      resetInactivityTimer();
    }

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [account, logout]);

  /* ================= LOGIN ================= */
  const login = useCallback(async ({ accessToken }) => {
    setLoading(true);
    setJwt(accessToken);
    setToken(accessToken || null);
    return loadAccount();
  }, [loadAccount]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!account,
      token,
      account,
      transactions,
      loading,
      login,
      logout,
      reloadAccount: loadAccount
    }),
    [token, account, transactions, loading, login, logout, loadAccount]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
