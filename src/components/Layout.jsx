import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  LogOut,
  Menu,
  DollarSign,
  Bell,
  QrCode,
  FileText,
  Building2,
  Scan,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getToken } from "../utils/auth";
import InstallPWAButton from "./InstallPWAButton.jsx";

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = user?.token || getToken();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchNotifications = async () => {
    if (!token || (user?.role !== "CEO" && user?.role !== "MANAGER")) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.filter((n) => !n.read));
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/mark-read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  useEffect(() => {
    if (user && (user.role === "CEO" || user.role === "MANAGER")) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Sidebar header identity display
  let headerName = "User";
  let headerRoleLabel = user?.role || "User";

  if (user?.role === "CEO") {
    // CEO has no regular signup; always show known identity
    headerName = "Abdul Rehman Qasim";
    headerRoleLabel = "CEO";
  } else if (user?.role === "MANAGER") {
    headerName = user.name || "Manager";
    headerRoleLabel = "MANAGER";
  } else if (user?.role === "SHIPPER") {
    // For shippers, emphasize business/company name
    headerName = user.companyName || user.name || "Shipper";
    headerRoleLabel = "SHIPPER";
  } else if (user?.name) {
    headerName = user.name;
  }

  const getNavItems = () => {
    if (!user) return [];

    const common = [
      {
        icon: LogOut,
        label: "Logout",
        action: handleLogout,
        variant: "danger",
      },
    ];

    switch (user.role) {
      case "CEO":
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/ceo" },
          { icon: Users, label: "Users", path: "/ceo/users" },
          { icon: Truck, label: "Riders", path: "/ceo/riders" },
          { icon: Package, label: "Orders", path: "/ceo/orders" },
          { icon: QrCode, label: "Assign by Scan", path: "/ceo/assign-scan" },
          { icon: DollarSign, label: "Commission", path: "/ceo/commission" },
          {
            icon: FileText,
            label: "Finance → Company",
            path: "/ceo/finance/company",
          },
          {
            icon: FileText,
            label: "Finance → Invoice",
            path: "/ceo/finance/invoice",
          },
          { icon: Truck, label: "Logistics", path: "/ceo/logistics" },
          {
            icon: Scan,
            label: "Warehouse Scan",
            path: "/ceo/warehouse-scan",
          },
          {
            icon: Building2,
            label: "Company Profile",
            path: "/ceo/company-profile",
          },
          ...common,
        ];
      case "MANAGER":
        return [
          {
            icon: LayoutDashboard,
            label: "Overview",
            path: "/manager/dashboard",
          },
          { icon: Package, label: "All Orders", path: "/manager/orders" },
          { icon: Truck, label: "Riders", path: "/manager/riders" },
          {
            icon: QrCode,
            label: "Assign by Scan",
            path: "/manager/assign-scan",
          },
          {
            icon: DollarSign,
            label: "Commission",
            path: "/manager/commission",
          },
          {
            icon: FileText,
            label: "Finance → Invoice",
            path: "/manager/finance/invoice",
          },
          { icon: Truck, label: "Logistics", path: "/manager/logistics" },
          {
            icon: Scan,
            label: "Warehouse Scan",
            path: "/manager/warehouse-scan",
          },
          ...common,
        ];
      case "SHIPPER":
        return [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            path: "/shipper/dashboard",
          },
          { icon: Package, label: "My Orders", path: "/shipper/orders" },
          {
            icon: Package,
            label: "Integrations",
            path: "/shipper/integrations",
          },
          {
            icon: Package,
            label: "Integrated Orders",
            path: "/shipper/integrated-orders",
          },
          { icon: Package, label: "Create Booking", path: "/shipper/create" },
          { icon: DollarSign, label: "Finance", path: "/shipper/finance" },
          ...common,
        ];
      case "RIDER":
        return [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            path: "/rider/dashboard",
          },
          { icon: Package, label: "All Orders", path: "/rider/history" },
          { icon: QrCode, label: "Scanner", path: "/rider/scan" },
          { icon: DollarSign, label: "Finance", path: "/rider/finance" },
          ...common,
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

      <aside
        className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <img src="/logo.png" alt="Company Logo" className="h-10 w-auto" />
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {user && (
              <div className="mb-6">
                <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg mb-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {headerName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary truncate">
                      {headerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {headerRoleLabel}
                    </p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {getNavItems().map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={
                          item.action ||
                          (() => item.path && navigate(item.path))
                        }
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                          ${
                            item.variant === "danger"
                              ? "text-red-600 hover:bg-red-50"
                              : item?.path && location.pathname === item.path
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-50 hover:text-secondary"
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
            <InstallPWAButton />
            {(user?.role === "CEO" || user?.role === "MANAGER") && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="font-bold text-secondary">
                        Notifications
                      </h4>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {n.shipper?.name || "Shipper"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {n.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {n.totalPendingParcels} pending parcels
                                </p>
                              </div>
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
                              >
                                Mark as picked up
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="hidden md:block text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
