import { NavLink } from 'react-router-dom';
import {
  HiOutlineShieldCheck, HiOutlineHome, HiOutlineUsers, HiOutlineDocumentText,
  HiOutlineKey, HiOutlineCog, HiOutlineUserGroup, HiOutlineViewGrid,
  HiOutlineShieldExclamation,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const userNavItems: NavItem[] = [
  { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/api-keys', icon: HiOutlineKey, label: 'API Keys' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const adminNavItems: NavItem[] = [
  { to: '/admin/users', icon: HiOutlineUsers, label: 'Users' },
  { to: '/admin/admins', icon: HiOutlineShieldExclamation, label: 'Admin Management' },
  { to: '/admin/roles', icon: HiOutlineUserGroup, label: 'Roles' },
  { to: '/admin/attributes', icon: HiOutlineViewGrid, label: 'Form Attributes' },
  { to: '/admin/audit-logs', icon: HiOutlineDocumentText, label: 'Audit Logs' },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="text-lg" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <HiOutlineShieldCheck className="text-blue-500 text-3xl" />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">SecureAuth</h1>
            <p className="text-gray-500 text-xs">IAM Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <NavSection title="General" items={userNavItems} />
        {isAdmin && <NavSection title="Admin Console" items={adminNavItems} />}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-600 text-xs text-center">SecureAuth IAM v1.0.0</p>
      </div>
    </aside>
  );
}
