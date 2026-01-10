import React, { useEffect, useMemo, useState } from 'react';
import { Users, Package, Truck, DollarSign, RefreshCcw, Clock, QrCode } from 'lucide-react';
import StatusCard from '../components/ui/StatusCard.jsx';
import MobileDashboardShell from '../components/ui/MobileDashboardShell.jsx';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import useIsMobile from '../src/utils/useIsMobile';
import { useNavigate } from 'react-router-dom';

const CeoDashboard = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('today');
  const [dashboardStats, setDashboardStats] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get token from user object or localStorage
  const token = user?.token || getToken();

  const fetchData = async () => {
    if (!token) {
      setError('Unauthorized access. Token missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [uRes, oRes, statsRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/dashboard/ceo?period=${timeFilter}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const uData = await uRes.json();
      const oData = await oRes.json();
      const statsData = await statsRes.json();
      if (!uRes.ok) throw new Error(uData.message || 'Failed users');
      if (!oRes.ok) throw new Error(oData.message || 'Failed orders');
      if (!statsRes.ok) throw new Error(statsData.message || 'Failed stats');
      setUsers(uData);
      setOrders(oData);
      setDashboardStats(statsData.stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (token) {
      fetchData();
    }
  }, [token, timeFilter]);

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.amountCollected || o.codAmount || 0), 0);
    const activeRiders = users.filter(u => u.role === 'RIDER' && u.status === 'ACTIVE').length;
    return { totalUsers, totalOrders, totalRevenue, activeRiders };
  }, [users, orders]);

  const last7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const revenueByDay = useMemo(() => {
    const days = last7Days();
    return days.map(d => {
      const dayStr = d.toDateString();
      const value = orders
        .filter(o => o.status === 'DELIVERED' && new Date(o.deliveredAt || o.createdAt).toDateString() === dayStr)
        .reduce((sum, o) => sum + Number(o.amountCollected || o.codAmount || 0), 0);
      return { day: d, value };
    });
  }, [orders]);

  const ordersByDay = useMemo(() => {
    const days = last7Days();
    return days.map(d => {
      const dayStr = d.toDateString();
      const count = orders
        .filter(o => new Date(o.createdAt).toDateString() === dayStr)
        .length;
      return { day: d, count };
    });
  }, [orders]);

  const recentActivity = useMemo(
    () =>
      orders
        .flatMap((o) => {
          const history =
            Array.isArray(o.statusHistory) && o.statusHistory.length
              ? o.statusHistory
              : [
                  {
                    status: o.status,
                    timestamp: o.updatedAt || o.createdAt,
                  },
                ];

          return history.map((h) => ({
            bookingId: o.bookingId,
            status: h.status,
            time: h.timestamp,
          }));
        })
        .filter((e) => e.time)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5),
    [orders],
  );

  const svgPath = useMemo(() => {
    const width = 600;
    const height = 160;
    const padding = 20;
    const max = Math.max(...revenueByDay.map(r => r.value), 1);
    const step = (width - padding * 2) / (revenueByDay.length - 1);
    const points = revenueByDay.map((r, i) => {
      const x = padding + i * step;
      const y = height - padding - (r.value / max) * (height - padding * 2);
      return `${x},${y}`;
    });
    if (points.length === 0) return '';
    return 'M ' + points.map(p => p.replace(',', ' ')).join(' L ');
  }, [revenueByDay]);

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
      icon: Truck,
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
      key: 'totalServiceCharges',
      icon: DollarSign,
      title: 'Service Charges',
      value: `PKR ${formatMoney(dashboardStats?.totalServiceCharges || 0)}`,
      colorClass: 'text-emerald-600',
    },
    {
      key: 'totalCod',
      icon: DollarSign,
      title: 'Total COD',
      value: `PKR ${formatMoney(dashboardStats?.totalCod || 0)}`,
      colorClass: 'text-green-600',
    },
    {
      key: 'totalShippers',
      icon: Users,
      title: 'Total Shippers',
      value: dashboardStats?.totalShippers || 0,
      colorClass: 'text-indigo-600',
    },
    {
      key: 'totalRiders',
      icon: Truck,
      title: 'Total Riders',
      value: dashboardStats?.totalRiders || 0,
      colorClass: 'text-purple-600',
    },
  ];

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
        onRefresh={fetchData}
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
            onClick={() => navigate('/ceo/scanner')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Scan Parcel
          </button>
        </div>
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
            <button onClick={fetchData} className="text-gray-400 hover:text-primary">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Users</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : totals.totalUsers}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Orders</p>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : totals.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : `PKR ${totals.totalRevenue.toLocaleString()}`}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Riders</p>
            <Truck className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : totals.activeRiders}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-secondary">Revenue Analytics</h3>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <svg viewBox="0 0 600 160" className="w-full h-40">
            <path d={svgPath} fill="none" stroke="#14B8A6" strokeWidth="2" />
          </svg>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-secondary">Orders Volume</h3>
            <span className="text-xs text-gray-500">Weekly</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {ordersByDay.map((d, i) => {
              const max = Math.max(...ordersByDay.map(x => x.count), 1);
              const h = Math.round((d.count / max) * 160);
              const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
              return (
                <div key={i} className="flex flex-col items-center justify-end">
                  <div style={{ height: `${h}px` }} className="w-8 bg-secondary/90 rounded" />
                  <span className="mt-1 text-[10px] text-gray-500">{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">Recent System Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">User/Order</th>
                <th className="py-2 px-3">Role/Status</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentActivity.length === 0 ? (
                <tr>
                  <td className="py-2 px-3 text-xs text-gray-500" colSpan={4}>
                    No recent activity.
                  </td>
                </tr>
              ) : (
                recentActivity.map((e, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">{e.bookingId}</td>
                    <td className="py-2 px-3">{e.status}</td>
                    <td className="py-2 px-3">Status updated</td>
                    <td className="py-2 px-3">{new Date(e.time).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );

  if (isMobile) return <MobileDashboardView />;

  return <DesktopDashboardView />;
};

export default CeoDashboard;
