import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, DollarSign, RefreshCcw, Clock, Users, QrCode } from 'lucide-react';
import StatusCard from '../components/ui/StatusCard.jsx';
import MobileDashboardShell from '../components/ui/MobileDashboardShell.jsx';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import useIsMobile from '../src/utils/useIsMobile';

const ManagerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [timeFilter, setTimeFilter] = useState('today');
  const [dashboardStats, setDashboardStats] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const token = user?.token || getToken();

  useEffect(() => {
    if (token) {
    fetchOrders();
    fetchOverview();
      fetchDashboardStats();
    }
  }, [token, timeFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/orders/summary/manager', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOverview(data);
    } catch {}
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/manager?period=${timeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDashboardStats(data.stats);
    } catch {}
  };

  const formatCount = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    return '—';
  };

  const formatMoney = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString();
  };

  const mobilePeriodOptions = [
    { label: '7 DAYS', value: '7days' },
    { label: '15 DAYS', value: '15days' },
    { label: '30 DAYS', value: '30days' },
  ];

  const mobileActivePeriod = timeFilter === 'month' ? '30days' : timeFilter;

  const mobileHeroTitle =
    timeFilter === '7days'
      ? '7 Days Orders'
      : timeFilter === '15days'
        ? '15 Days Orders'
        : timeFilter === 'month'
          ? '30 Days Orders'
          : "Today's Orders";

  const mobileStatCards = [
    {
      key: 'totalOrders',
      icon: Package,
      title: 'Total Orders',
      value: dashboardStats?.totalOrders || 0,
      colorClass: 'text-gray-600',
    },
    {
      key: 'unassignedOrders',
      icon: Package,
      title: 'Unassigned',
      value: dashboardStats?.unassignedOrders || 0,
      colorClass: 'text-amber-600',
    },
    {
      key: 'assignedOrders',
      icon: Users,
      title: 'Assigned',
      value: dashboardStats?.assignedOrders || 0,
      colorClass: 'text-blue-600',
    },
    {
      key: 'warehouseOrdersCount',
      icon: Package,
      title: 'At Warehouse',
      value: dashboardStats?.warehouseOrdersCount || 0,
      colorClass: 'text-cyan-600',
    },
    {
      key: 'completedOrders',
      icon: Truck,
      title: 'Delivered',
      value: dashboardStats?.completedOrders || 0,
      colorClass: 'text-green-700',
    },
    {
      key: 'pendingOrders',
      icon: Clock,
      title: 'Pending',
      value: dashboardStats?.pendingOrders || 0,
      colorClass: 'text-orange-600',
    },
    {
      key: 'totalCod',
      icon: DollarSign,
      title: 'Total COD',
      value: `PKR ${formatMoney(dashboardStats?.totalCod || 0)}`,
      colorClass: 'text-green-600',
    },
    {
      key: 'totalServiceCharges',
      icon: DollarSign,
      title: 'Service Charges',
      value: `PKR ${formatMoney(dashboardStats?.totalServiceCharges || 0)}`,
      colorClass: 'text-emerald-600',
    },
  ];

  const refreshAll = () => {
    fetchOrders();
    fetchOverview();
    fetchDashboardStats();
  };

  const MobileDashboardView = () => (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <MobileDashboardShell
        heroTitle={mobileHeroTitle}
        heroCount={formatCount(dashboardStats?.totalOrders)}
        onRefresh={refreshAll}
        kpis={[
          {
            prefix: 'PKR',
            value: formatMoney(dashboardStats?.totalServiceCharges),
            label: 'Service Charges',
          },
          {
            value: formatCount(dashboardStats?.pendingOrders || 0),
            label: 'Pending Orders',
          },
          {
            value: formatCount(dashboardStats?.totalOrders || 0),
            label: 'Total Orders',
          },
        ]}
        periodOptions={mobilePeriodOptions}
        activePeriod={mobileActivePeriod}
        onPeriodChange={(period) => {
          if (period === '7days') setTimeFilter('7days');
          else if (period === '15days') setTimeFilter('15days');
          else if (period === '30days') setTimeFilter('month');
        }}
        statCards={mobileStatCards}
      />
    </div>
  );

  const DesktopDashboardView = () => (
    <div className="space-y-8">
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>}

      {/* Scanner Button */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-secondary">Warehouse Operations</h3>
            <p className="text-sm text-gray-500 mt-1">Scan parcels to mark as arrived at LLL warehouse</p>
          </div>
          <button
            onClick={() => navigate('/manager/scanner')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Scan Parcel
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary">Manager Dashboard</h3>
          </div>
          <button onClick={() => { fetchOrders(); fetchOverview(); fetchDashboardStats(); }} className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600">Refresh</button>
        </div>
        <p className="text-gray-500 text-sm mt-2">Overview of orders and riders.</p>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-secondary">
              {timeFilter === '7days' ? 'Last 7 Days Stats' : 
               timeFilter === '15days' ? 'Last 15 Days Stats' : 
               timeFilter === 'month' ? 'This Month Stats' : 
               'Today\'s Stats'}
            </h3>
            <button onClick={fetchDashboardStats} className="text-gray-400 hover:text-primary">
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === 'today' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === '7days' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeFilter('15days')}
              className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === '15days' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              15 Days
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 text-xs rounded-full ${timeFilter === 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              This Month
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard 
              icon={Package} 
              title="Total Orders" 
              count={dashboardStats?.totalOrders || 0} 
            />
            <StatusCard 
              icon={Truck} 
              title="Completed Orders" 
              count={dashboardStats?.completedOrders || 0} 
            />
            <StatusCard 
              icon={Clock} 
              title="Pending Orders" 
              count={dashboardStats?.pendingOrders || 0} 
            />
            <StatusCard 
              icon={Users} 
              title="Assigned Orders" 
              count={dashboardStats?.assignedOrders || 0} 
            />
            <StatusCard 
              icon={Package} 
              title="Unassigned Orders" 
              count={dashboardStats?.unassignedOrders || 0} 
            />
            <StatusCard 
              icon={DollarSign} 
              title="Total COD" 
              count={`PKR ${(dashboardStats?.totalCod || 0).toLocaleString()}`} 
            />
            <StatusCard 
              icon={DollarSign} 
              title="Total Service Charges" 
              count={`PKR ${(dashboardStats?.totalServiceCharges || 0).toLocaleString()}`} 
            />
            <StatusCard 
              icon={Package} 
              title="At LLL Warehouse" 
              count={dashboardStats?.warehouseOrdersCount || 0} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Today orders</p>
          <h3 className="text-2xl font-bold text-secondary">{overview ? overview.todayReceived : '-'}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Booked</p>
          <h3 className="text-2xl font-bold text-secondary">{overview ? overview.todayBooked : '-'}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Unbooked</p>
          <h3 className="text-2xl font-bold text-secondary">{overview ? overview.todayUnbooked : '-'}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">In LLL Warehouse</p>
              <h3 className="text-xl font-bold text-secondary">{overview ? overview.warehouseCount : '-'}</h3>
            </div>
            <div>
              <p className="text-xs text-gray-500">Out for delivery</p>
              <h3 className="text-xl font-bold text-secondary">{overview ? overview.outForDeliveryCount : '-'}</h3>
            </div>
            <div>
              <p className="text-xs text-gray-500">Returned</p>
              <h3 className="text-xl font-bold text-secondary">{overview ? overview.returnedCount : '-'}</h3>
            </div>
            <div>
              <p className="text-xs text-gray-500">Delivery under review</p>
              <h3 className="text-xl font-bold text-secondary">{overview ? overview.deliveryUnderReviewCount : '-'}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-secondary">Recent Orders</h3>
          <Link to="/manager/orders" className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600">View All Orders</Link>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading recent orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders found.</p>
          ) : (
            <ul className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <li key={o._id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">{o.shipper?.companyName || o.shipper?.name || 'Unknown'}</span>
                    <span className="font-mono text-xs">{o.bookingId}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span>Created: {new Date(o.createdAt).toLocaleString()}</span>
                    {o.assignedRider && <span className="ml-3">Assigned to: {o.assignedRider.name}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500">{o.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) return <MobileDashboardView />;

  return <DesktopDashboardView />;
};

export default ManagerDashboard;
