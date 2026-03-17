import { HiOutlineBell, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-white text-lg font-semibold">
          Welcome back, {user?.firstName}
        </h2>
        <p className="text-gray-500 text-sm">
          {user?.roles?.join(', ')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors relative">
          <HiOutlineBell className="text-xl" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-xs">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-colors ml-2"
            title="Logout"
          >
            <HiOutlineLogout className="text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}
