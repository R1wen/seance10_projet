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
      <Link to="/products" className="text-xl font-bold text-blue-600">
        E-Shop
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/products" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
          Products
        </Link>
        {isAdmin && (
          <Link to="/admin" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
            Admin
          </Link>
        )}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-md font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md font-medium"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
