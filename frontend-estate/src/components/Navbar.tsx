import { useState } from "react";
import { Menu, X} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from '../assets/estatepadilogo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = [
    // { label: "Testimonials", href: "#" },
    // { label: "Pricing", href: "/pricing" },
    { label: "Contact Us", href: "#contact" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to='/' className="flex items-center space-x-2 cursor-pointer hover:underline">
            <img src={Logo} alt="EstatePadi Logo" className="h-6 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6 items-center">
            {links.map(({ label, href }) => (
              <a key={label} href={href} className="text-gray-700 hover:text-blue-600">
                {label}
              </a>
            ))}

            {isAuthenticated && user ? (
              <>
                <Link
                  to={`/${user.role}/dashboard`}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow px-4 py-4 space-y-3">
          {links.map(({ label, href }) => (
            <a key={label} href={href} className="block text-gray-700 hover:text-blue-600">
              {label}
            </a>
          ))}

          {isAuthenticated && user ? (
            <>
              <Link
                to={`/${user.role}/dashboard`}
                className="block w-full bg-blue-50 text-blue-600 px-4 py-2 rounded text-center mt-2"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full bg-red-600 text-white px-4 py-2 rounded text-center mt-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block w-full bg-blue-50 text-blue-600 px-4 py-2 rounded text-center mt-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded text-center mt-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
