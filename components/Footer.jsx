import { useEffect, useState } from 'react';

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="app-clock" aria-live="polite">
      {now.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jerusalem'
      })}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span>All rights reserved. 2026 Bank One One.</span>
        <Clock />
      </div>
    </footer>
  );
}
