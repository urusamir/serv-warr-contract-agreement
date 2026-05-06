import { Link } from "react-router-dom";
import { History } from "lucide-react";

const NavBar = () => (
  <nav className="w-full flex items-center justify-between px-6 py-4">
    <Link to="/" className="text-white font-black text-xl tracking-tight hover:opacity-80 transition-opacity">
      Kavak
    </Link>
    <Link
      to="/history"
      className="inline-flex items-center gap-2 bg-white text-primary rounded-full px-6 py-3 text-base font-bold hover:bg-white/90 transition-all shadow-lg"
    >
      <History className="h-4 w-4" />
      History
    </Link>
  </nav>
);

export default NavBar;
