import { Outlet } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import Footer from '../components/Footer.jsx';

export default function BankLayout() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
