import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="w-full flex items-center justify-between px-6 py-4">
    <Link to="/" className="text-white font-black text-xl tracking-tight hover:opacity-80 transition-opacity">
      Kavak
    </Link>
  </nav>
);

export default NavBar;
