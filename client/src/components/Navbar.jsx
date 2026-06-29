import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          JobPortal
        </Link>
        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
          Companies
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;