import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Truck, 
  LogOut, 
  Menu,
  DollarSign
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../src/contexts/AuthContext';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getNavItems = () => {
    if (!user) return [];
    
    const common = [
      { icon: LogOut, label: 'Logout', action: handleLogout, variant: 'danger' }
    ];

    switch (user.role) {
      case 'CEO':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/ceo' },
          { icon: Users, label: 'Users', path: '/ceo/users' },
          { icon: Package, label: 'Orders', path: '/ceo/orders' },
          { icon: DollarSign, label: 'Commission', path: '/ceo/commission' },
          { icon: Truck, label: 'Logistics', path: '/ceo/logistics' },
          ...common
        ];
      case 'MANAGER':
        return [
          { icon: LayoutDashboard, label: 'Overview', path: '/manager/dashboard' },
          { icon: Package, label: 'All Orders', path: '/manager/orders' },
          { icon: Truck, label: 'Riders', path: '/manager/riders' },
          { icon: DollarSign, label: 'Commission', path: '/manager/commission' },
          { icon: Truck, label: 'Logistics', path: '/manager/logistics' },
          ...common
        ];
      case 'SHIPPER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/shipper/dashboard' },
          { icon: Package, label: 'My Orders', path: '/shipper/orders' },
          { icon: Package, label: 'Integrations', path: '/shipper/integrations' },
          { icon: Package, label: 'Create Booking', path: '/shipper/create' },
          ...common
        ];
      case 'RIDER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/rider/dashboard' },
          { icon: Package, label: 'All Orders', path: '/rider/history' },
          ...common
        ];
      default:
        return common;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <img src="/assets/logo.png" alt="LahoreLink Logistics" className="h-8" />
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {user && (
              <div className="mb-6">
                <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg mb-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role || 'User'}</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {getNavItems().map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={item.action || (() => item.path && navigate(item.path))}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                          ${item.variant === 'danger' 
                            ? 'text-red-600 hover:bg-red-50' 
                            : (item?.path && location.pathname === item.path)
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-secondary'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-secondary">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
