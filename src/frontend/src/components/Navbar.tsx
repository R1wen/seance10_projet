import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/products" className="text-xl font-bold text-black">
        E-Shop
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/products" className="text-gray-600 hover:text-black text-sm font-medium">
          Products
        </Link>
        {isAdmin && (
          <Link to="/admin" className="text-gray-600 hover:text-black text-sm font-medium">
            Admin
          </Link>
        )}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-black font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-black hover:bg-gray-900 text-white text-sm px-4 py-1.5 rounded-full font-medium"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
