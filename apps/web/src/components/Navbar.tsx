import { Link } from 'react-router-dom';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-xpay-line/70 bg-xpay-ink/86 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-xpay-mint/12 text-2xl font-black text-xpay-mint">X</span>
          <span className="tracking-wide">X-PAY CHECK</span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link to="/dashboard" className="text-sm text-gray-300 transition hover:text-white">Dashboard</Link>
          <Link to="/audit/payslip" className="text-sm text-gray-300 transition hover:text-white">Analisi</Link>
          <Link to="/calendar" className="text-sm text-gray-300 transition hover:text-white">Turni</Link>
          <Link to="/archive" className="text-sm text-gray-300 transition hover:text-white">Archivio</Link>
          <Link to="/profile" className="text-sm text-gray-300 transition hover:text-white">Profilo</Link>
          <Link to="/login" className="text-sm text-gray-300 transition hover:text-white">Login</Link>
          <Link to="/plans" className="xpay-primary !px-4 !py-2">
            <ShieldCheck size={16} /> Inizia gratis
          </Link>
        </div>

        <button className="rounded-lg border border-xpay-line p-2 text-gray-300 md:hidden" onClick={() => setOpen(!open)} aria-label="Apri menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-xpay-line bg-xpay-panel px-4 py-4 md:hidden">
          <Link to="/dashboard" className="block text-gray-300" onClick={() => setOpen(false)}>Dashboard</Link>
          <Link to="/audit/payslip" className="block text-gray-300" onClick={() => setOpen(false)}>Analisi</Link>
          <Link to="/calendar" className="block text-gray-300" onClick={() => setOpen(false)}>Turni</Link>
          <Link to="/archive" className="block text-gray-300" onClick={() => setOpen(false)}>Archivio</Link>
          <Link to="/profile" className="block text-gray-300" onClick={() => setOpen(false)}>Profilo</Link>
          <Link to="/settings" className="block text-gray-300" onClick={() => setOpen(false)}>Impostazioni</Link>
          <Link to="/login" className="block text-gray-300" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/plans" className="block font-semibold text-xpay-mint" onClick={() => setOpen(false)}>Inizia gratis</Link>
        </div>
      )}
    </nav>
  );
}
