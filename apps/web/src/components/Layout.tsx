import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="border-t border-xpay-line/60 bg-black/20 px-4 py-6 text-center text-xs text-gray-500">
        X-PAY CHECK - Controlla se la tua busta paga torna davvero.
      </footer>
    </div>
  );
}
