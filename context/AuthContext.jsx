import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import api from '../api/axios';
import { clearJwt, getJwt, setJwt } from '../utils/authStorage.js';

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 2 * 60 * 1000; 

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getJwt());
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const inactivityTimerRef = useRef(null);

  /* ================= LOGOUT ================= */
  const logout = () => {
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
  };

  /* ================= LOAD ACCOUNT ================= */
  const loadAccount = async () => {
    try {
      
      const res = await api.get('/accounts/me');
      setAccount(res.data.account);
      setTransactions(res.data.transactions);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET INACTIVITY TIMER ================= */
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_LIMIT);
  };

  /* ================= TOKEN EFFECT ================= */
  useEffect(() => {
    if (token) {
      loadAccount();
    } else {
      setLoading(false);
    }
  }, [token]);

  /* ================= ACTIVITY LISTENERS ================= */
  useEffect(() => {
    if (!token) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );

    resetInactivityTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [token]);

  /* ================= LOGIN ================= */
  const login = ({ accessToken }) => {
    if (!accessToken) return;
    setJwt(accessToken);
    setToken(accessToken);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: !!token,
      token,
      account,
      transactions,
      loading,
      login,
      logout,
      reloadAccount: loadAccount
    }),
    [token, account, transactions, loading]
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
