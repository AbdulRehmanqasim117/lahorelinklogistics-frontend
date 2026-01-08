import React, { useEffect, useMemo, useState } from 'react';
import { Truck, MapPin, Check, RotateCcw, Search, Clock, DollarSign, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileDashboardShell from '../components/ui/MobileDashboardShell.jsx';
import useIsMobile from '../src/utils/useIsMobile';
import { useAuth } from '../src/contexts/AuthContext';

const RiderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finance, setFinance] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [found, setFound] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [portalBlocked, setPortalBlocked] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (!res.ok) {
        // If backend says rider portal is inactive due to missing commission config,
        // keep the whole rider dashboard blocked until management configures it.
        if (
          res.status === 403 &&
          (data?.code === 'RIDER_PORTAL_INACTIVE' ||
            String(data?.message || '')
              .toLowerCase()
              .includes('rider account is under configuration'))
        ) {
          setPortalBlocked(true);
        }
        throw new Error(data.message || 'Failed to fetch orders');
      }
      // If we reach here, rider commission config is present and portal can be used.
      setPortalBlocked(false);
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinance = async () => {
    try {
      const res = await fetch('/api/finance/summary/rider/me', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok) setFinance(data);
    } catch (e) {}
  };

  const lookup = async (e) => {
    e && e.preventDefault();
    setFound(null);
    if (!searchId.trim()) return;
    try {
      const res = await fetch(`/api/orders?q=${encodeURIComponent(searchId.trim())}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setFound(data[0]);
      } else {
        setFound({ notFound: true });
      }
    } catch {}
  };

  useEffect(() => { fetchOrders(); fetchFinance(); }, []);
  const navigate = useNavigate();

  const searchText = searchId.trim().toLowerCase();

  useEffect(() => {
    if (searchText.length < 2) { setSuggestions([]); return; }
    setSuggestions(
      orders
        .filter((o) => {
          const orderIdDisplay = o.isIntegrated
            ? o.shopifyOrderNumber ||
              o.sourceProviderOrderNumber ||
              o.externalOrderId ||
              o.bookingId
            : o.bookingId;
          const orderIdStr = String(orderIdDisplay || '').toLowerCase();
          const trackingStr = String(o.trackingId || '').toLowerCase();
          const consigneeStr = String(o.consigneeName || '').toLowerCase();
          const destStr = String(o.destinationCity || '').toLowerCase();
          return (
            (orderIdStr && orderIdStr.includes(searchText)) ||
            (trackingStr && trackingStr.includes(searchText)) ||
            (consigneeStr && consigneeStr.includes(searchText)) ||
            (destStr && destStr.includes(searchText))
          );
        })
        .slice(0, 8),
    );
  }, [searchText, orders]);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      await fetchOrders();
      setStatusExpanded((prev) => ({ ...prev, [orderId]: false }));
    } catch (e) {
      setError(e.message);
    }
  };

  const formatMoney = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString();
  };

  const statusLabel = (s) =>
    ({
      CREATED: 'Pending',
      ASSIGNED: 'In LLL Warehouse',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      RETURNED: 'Returned',
      DELIVERED: 'Delivered',
      FAILED: 'Failed',
      FIRST_ATTEMPT: 'First Attempt',
      SECOND_ATTEMPT: 'Second Attempt',
      THIRD_ATTEMPT: 'Third Attempt',
    }[s] || s);

  const todayCount = useMemo(
    () =>
      orders.filter(
        (o) => new Date(o.createdAt).toDateString() === new Date().toDateString(),
      ).length,
    [orders],
  );

  const deliveredCount = useMemo(
    () => orders.filter((o) => o.status === 'DELIVERED').length,
    [orders],
  );

  const returnedCount = useMemo(
    () => orders.filter((o) => o.status === 'RETURNED').length,
    [orders],
  );

  const pendingCount = useMemo(
    () => orders.filter((o) => !['DELIVERED', 'RETURNED'].includes(o.status)).length,
    [orders],
  );

  const outForDeliveryCount = useMemo(
    () => orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
    [orders],
  );

  const attemptedCount = useMemo(
    () =>
      orders.filter((o) =>
        ['FIRST_ATTEMPT', 'SECOND_ATTEMPT', 'THIRD_ATTEMPT', 'FAILED'].includes(
          o.status,
        ),
      ).length,
    [orders],
  );

  const mobilePeriodOptions = [
    { label: '7 DAYS', value: '7days' },
    { label: '15 DAYS', value: '15days' },
    { label: '30 DAYS', value: '30days' },
  ];

  const [mobilePeriod, setMobilePeriod] = useState('7days');

  const mobileFilteredOrders = useMemo(() => {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (mobilePeriod === '7days') startDate.setDate(startDate.getDate() - 6);
    else if (mobilePeriod === '15days') startDate.setDate(startDate.getDate() - 14);
    else if (mobilePeriod === '30days') startDate.setDate(startDate.getDate() - 29);

    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      const inPeriod = d.getTime() >= startDate.getTime();
      if (!inPeriod) return false;
      if (!searchText) return true;
      const orderIdDisplay = o.isIntegrated
        ? o.shopifyOrderNumber ||
          o.sourceProviderOrderNumber ||
          o.externalOrderId ||
          o.bookingId
        : o.bookingId;
      const orderIdStr = String(orderIdDisplay || '').toLowerCase();
      const trackingStr = String(o.trackingId || '').toLowerCase();
      return (
        (orderIdStr && orderIdStr.includes(searchText)) ||
        (trackingStr && trackingStr.includes(searchText))
      );
    });
  }, [orders, mobilePeriod, searchText]);

  const mobileDeliveredCount = useMemo(
    () => mobileFilteredOrders.filter((o) => o.status === 'DELIVERED').length,
    [mobileFilteredOrders],
  );

  const mobileReturnedCount = useMemo(
    () => mobileFilteredOrders.filter((o) => o.status === 'RETURNED').length,
    [mobileFilteredOrders],
  );

  const mobileOutForDeliveryCount = useMemo(
    () => mobileFilteredOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
    [mobileFilteredOrders],
  );

  const mobileAttemptedCount = useMemo(
    () =>
      mobileFilteredOrders.filter((o) =>
        ['FIRST_ATTEMPT', 'SECOND_ATTEMPT', 'THIRD_ATTEMPT', 'FAILED'].includes(
          o.status,
        ),
      ).length,
    [mobileFilteredOrders],
  );

  const mobilePendingCount = useMemo(
    () =>
      mobileFilteredOrders.filter((o) => !['DELIVERED', 'RETURNED'].includes(o.status))
        .length,
    [mobileFilteredOrders],
  );

  const desktopFilteredOrders = useMemo(
    () => {
      if (!searchText) return orders;
      return orders.filter((o) => {
        const orderIdDisplay = o.isIntegrated
          ? o.shopifyOrderNumber ||
            o.sourceProviderOrderNumber ||
            o.externalOrderId ||
            o.bookingId
          : o.bookingId;
        const orderIdStr = String(orderIdDisplay || '').toLowerCase();
        const trackingStr = String(o.trackingId || '').toLowerCase();
        return (
          (orderIdStr && orderIdStr.includes(searchText)) ||
          (trackingStr && trackingStr.includes(searchText))
        );
      });
    },
    [orders, searchText],
  );

  const MobileDashboardView = () => (
    <div className="space-y-6">
      <MobileDashboardShell
        heroTitle={
          mobilePeriod === '7days'
            ? '7 Days Tasks'
            : mobilePeriod === '15days'
              ? '15 Days Tasks'
              : '30 Days Tasks'
        }
        heroCount={mobileFilteredOrders.length}
        onRefresh={fetchOrders}
        kpis={[
          {
            prefix: 'PKR',
            value: formatMoney(finance?.totals?.todayCodCollected || 0),
            label: 'COD Today',
          },
          {
            value: mobilePendingCount,
            label: 'Pending',
          },
          {
            value: mobileFilteredOrders.length,
            label: 'Total Orders',
          },
        ]}
        periodOptions={mobilePeriodOptions}
        activePeriod={mobilePeriod}
        onPeriodChange={(p) => setMobilePeriod(p)}
        statCards={[
          {
            key: 'today',
            icon: Clock,
            title: 'Assigned Today',
            value: todayCount,
            colorClass: 'text-gray-600',
          },
          {
            key: 'outForDelivery',
            icon: Truck,
            title: 'Out for Delivery',
            value: mobileOutForDeliveryCount,
            colorClass: 'text-cyan-600',
          },
          {
            key: 'delivered',
            icon: Check,
            title: 'Delivered',
            value: mobileDeliveredCount,
            colorClass: 'text-green-700',
          },
          {
            key: 'returned',
            icon: RotateCcw,
            title: 'Returned',
            value: mobileReturnedCount,
            colorClass: 'text-orange-600',
          },
          {
            key: 'attempted',
            icon: Clock,
            title: 'Attempts',
            value: mobileAttemptedCount,
            colorClass: 'text-red-500',
          },
          ...(finance
            ? [
                {
                  key: 'codToday',
                  icon: DollarSign,
                  title: 'COD Today',
                  value: `PKR ${formatMoney(finance?.totals?.todayCodCollected || 0)}`,
                  colorClass: 'text-green-600',
                },
                {
                  key: 'totalCod',
                  icon: DollarSign,
                  title: 'Total COD',
                  value: `PKR ${formatMoney(finance?.totals?.totalCodCollected || 0)}`,
                  colorClass: 'text-emerald-600',
                },
                {
                  key: 'settledCount',
                  icon: DollarSign,
                  title: 'Settled',
                  value: finance?.totals?.settledCount,
                  colorClass: 'text-indigo-600',
                },
                {
                  key: 'pendingCountFinance',
                  icon: DollarSign,
                  title: 'Pending',
                  value: finance?.totals?.pendingCount,
                  colorClass: 'text-amber-600',
                },
              ]
            : []),
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-secondary">All Orders</h3>
            <button
              onClick={fetchOrders}
              className="px-2 py-1 text-[11px] bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : mobileFilteredOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No assigned orders.</p>
          ) : (
            <ul className="space-y-3">
              {mobileFilteredOrders.map((o) => {
                const orderIdDisplay = o.isIntegrated
                  ? o.shopifyOrderNumber ||
                    o.sourceProviderOrderNumber ||
                    o.externalOrderId ||
                    o.bookingId
                  : o.bookingId;
                return (
                  <li
                    key={o._id}
                    className="border border-gray-100 rounded-lg p-3 active:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/rider/task/${o._id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary truncate">
                          {o.consigneeName || 'Customer'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {o.destinationCity || '—'}
                          {orderIdDisplay ? ` • ${orderIdDisplay}` : ''}
                          {o.trackingId ? ` • ${o.trackingId}` : ''}
                        </p>
                      </div>
                      <span className="ml-2 text-xs font-semibold text-primary whitespace-nowrap">
                        {statusLabel(o.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {o.consigneeAddress}
                    </div>
                    <div className="mt-1 text-right text-sm font-semibold text-secondary">
                      PKR {Number(o.codAmount || 0).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  const DesktopDashboardView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Today</p>
          <h3 className="text-2xl font-bold text-secondary">{orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Delivered</p>
          <h3 className="text-2xl font-bold text-secondary">{orders.filter(o => o.status === 'DELIVERED').length}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Returned</p>
          <h3 className="text-2xl font-bold text-secondary">{orders.filter(o => o.status === 'RETURNED').length}</h3>
        </div>
        {finance && (
          <>
            <div className="bg-white p-5 rounded-xl border border-gray-100 md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">COD Today</p>
                  <h3 className="text-xl font-bold text-secondary">PKR {Number(finance.totals.todayCodCollected || 0).toLocaleString()}</h3>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total COD</p>
                  <h3 className="text-xl font-bold text-secondary">PKR {Number(finance.totals.totalCodCollected || 0).toLocaleString()}</h3>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Settled</p>
                  <h3 className="text-xl font-bold text-secondary">{finance.totals.settledCount}</h3>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <h3 className="text-xl font-bold text-secondary">{finance.totals.pendingCount}</h3>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-sm text-secondary">Recent Payments</h4>
                <ul className="mt-2 space-y-2">
                  {(finance.transactions || []).slice(0,5).map(t => (
                    <li key={t._id} className="flex justify-between text-sm">
                      <span>PKR {Number(t.totalCodCollected||0).toLocaleString()}</span>
                      <span className="text-xs">{t.settlementStatus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-secondary">All Orders</h3>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">No assigned orders.</p>
          ) : desktopFilteredOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders match your search.</p>
          ) : (
            <ul className="space-y-3">
              {desktopFilteredOrders.map((o) => {
                const isFinal = ['DELIVERED', 'RETURNED', 'FAILED'].includes(o.status);
                const isExpanded = !!statusExpanded[o._id];
                const orderIdDisplay = o.isIntegrated
                  ? o.shopifyOrderNumber ||
                    o.sourceProviderOrderNumber ||
                    o.externalOrderId ||
                    o.bookingId
                  : o.bookingId;
                return (
                  <li
                    key={o._id}
                    className="border border-gray-100 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/rider/task/${o._id}`)}
                  >
                    <div className="flex justify-between">
                      <span className="font-mono text-xs">
                        {orderIdDisplay}
                        {o.trackingId ? ` • ${o.trackingId}` : ''}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : o.status === 'RETURNED'
                              ? 'bg-red-100 text-red-800'
                              : o.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {o.consigneeAddress} • {o.destinationCity}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
                    </div>
                    <div className="mt-2 text-right text-sm font-semibold text-secondary">
                      PKR {Number(o.codAmount || 0).toLocaleString()}
                    </div>
                    <div
                      className="flex gap-2 mt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isFinal && !isExpanded ? (
                        <button
                          onClick={() =>
                            setStatusExpanded((prev) => ({
                              ...prev,
                              [o._id]: true,
                            }))
                          }
                          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                        >
                          Change Status
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateStatus(o._id, 'FIRST_ATTEMPT')}
                            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                          >
                            1st Attempt
                          </button>
                          <button
                            onClick={() => updateStatus(o._id, 'SECOND_ATTEMPT')}
                            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                          >
                            2nd Attempt
                          </button>
                          <button
                            onClick={() => updateStatus(o._id, 'THIRD_ATTEMPT')}
                            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                          >
                            3rd Attempt
                          </button>
                          <button
                            onClick={() => updateStatus(o._id, 'DELIVERED')}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            <Check className="w-4 h-4 inline" /> Delivered
                          </button>
                          <button
                            onClick={() => updateStatus(o._id, 'RETURNED')}
                            className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            <RotateCcw className="w-4 h-4 inline" /> Return
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {found && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={()=>setFound(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Order Detail</h3>
              <button onClick={()=>setFound(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-2 text-sm">
              {found.notFound ? (
                <p className="text-red-600">No order found</p>
              ) : (
                <>
                  <div><span className="text-gray-500">Business:</span> {found.shipper?.companyName || found.shipper?.name}</div>
                  <div><span className="text-gray-500">Booking ID:</span> <span className="font-mono">{found.bookingId}</span></div>
                  <div><span className="text-gray-500">Tracking ID:</span> <span className="font-mono">{found.trackingId}</span></div>
                  <div><span className="text-gray-500">Consignee:</span> {found.consigneeName} • {found.destinationCity}</div>
                  <div><span className="text-gray-500">Address:</span> {found.consigneeAddress}</div>
                  <div><span className="text-gray-500">Phone:</span> {found.consigneePhone}</div>
                  <div><span className="text-gray-500">Service Type:</span> {found.serviceType}</div>
                  <div><span className="text-gray-500">Pieces:</span> {found.pieces}</div>
                  <div><span className="text-gray-500">Fragile:</span> {found.fragile ? 'Yes' : 'No'}</div>
                  <div><span className="text-gray-500">Remarks:</span> {found.remarks || '—'}</div>
                  <div><span className="text-gray-500">Payment Type:</span> {found.paymentType}</div>
                  <div><span className="text-gray-500">COD:</span> Rs {Number(found.codAmount||0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Status: {found.status}</div>
                </>
              )}
            </div>
            <div className="p-4 flex justify-end gap-2 border-t border-gray-100">
              <button className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600" onClick={()=>setFound(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  if (portalBlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-gray-100 shadow-sm rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary">Rider Configuration in Progress</h1>
              <p className="text-gray-500 text-sm mt-1">
                Your rider account is under configuration. Please wait for management to set your commission
                rules before using the rider portal.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-gray-600">Commission status</div>
                <div className="font-semibold text-secondary">
                  {user?.commissionStatus
                    ? String(user.commissionStatus).toUpperCase()
                    : 'PENDING'}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Contact management if this takes longer than expected.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) return <MobileDashboardView />;

  return <DesktopDashboardView />;
};

export default RiderDashboard;
