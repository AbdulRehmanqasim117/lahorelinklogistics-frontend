import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import Button from '../components/ui/Button.jsx';
import { ArrowLeft, Filter, Search } from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const CeoRiderSettlements = () => {
  const { id: riderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token || getToken();

  const [rider, setRider] = useState(location.state?.rider || null);
  const [loadingRider, setLoadingRider] = useState(false);

  const [data, setData] = useState({
    summary: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [settlement, setSettlement] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [shipperId, setShipperId] = useState('');
  const [shippers, setShippers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Load rider meta if not passed via navigation state
  useEffect(() => {
    if (!token || rider || !riderId) return;

    const fetchRiderMeta = async () => {
      setLoadingRider(true);
      try {
        const res = await fetch('/api/users/riders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = await res.json();
        if (res.ok && Array.isArray(list)) {
          const found = list.find((r) => r._id === riderId);
          if (found) setRider(found);
        }
      } catch {
        // best-effort only
      } finally {
        setLoadingRider(false);
      }
    };

    fetchRiderMeta();
  }, [token, rider, riderId]);

  // Load shipper list for filter
  useEffect(() => {
    if (!token) return;
    const fetchShippers = async () => {
      try {
        const res = await fetch('/api/users/shippers?active=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = await res.json();
        if (res.ok && Array.isArray(list)) {
          setShippers(list);
        }
      } catch {
        // optional filter; ignore errors
      }
    };

    fetchShippers();
  }, [token]);

  const fetchSettlements = async (overrides = {}) => {
    if (!token || !riderId) return;

    const effectiveFrom = overrides.from ?? from;
    const effectiveTo = overrides.to ?? to;
    const effectiveStatus = overrides.status ?? status;
    const effectiveSettlement = overrides.settlement ?? settlement;
    const effectiveSortOrder = overrides.sortOrder ?? sortOrder;
    const effectivePage = overrides.page ?? page;
    const effectiveShipperId = overrides.shipperId ?? shipperId;
    const effectiveSearch = overrides.search ?? search;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const params = new URLSearchParams();
      if (effectiveFrom) params.set('from', effectiveFrom);
      if (effectiveTo) params.set('to', effectiveTo);
      if (effectiveStatus && effectiveStatus !== 'all') params.set('status', effectiveStatus);
      if (effectiveSettlement && effectiveSettlement !== 'all')
        params.set('settlement', effectiveSettlement);
      if (effectiveSortOrder && (effectiveSortOrder === 'asc' || effectiveSortOrder === 'desc')) {
        params.set('sortOrder', effectiveSortOrder);
      }
      if (effectiveShipperId) params.set('shipperId', effectiveShipperId);
      if (effectiveSearch && effectiveSearch.trim()) params.set('search', effectiveSearch.trim());
      params.set('page', String(effectivePage));
      params.set('limit', '20');

      const res = await fetch(`/api/riders/${riderId}/settlements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to load rider settlements');

      setData(body);
      setPage(body.page || effectivePage);
    } catch (e) {
      setError(e.message || 'Failed to load rider settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && riderId) {
      fetchSettlements({ page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, riderId]);

  const handleApplyFilters = async () => {
    setPage(1);
    await fetchSettlements({ page: 1 });
  };

  const handleResetFilters = async () => {
    setFrom('');
    setTo('');
    setStatus('all');
    setSettlement('all');
    setSortOrder('desc');
    setSearch('');
    setShipperId('');
    setPage(1);
    await fetchSettlements({
      from: '',
      to: '',
      status: 'all',
      settlement: 'all',
      sortOrder: 'desc',
      page: 1,
      shipperId: '',
      search: '',
    });
  };

  const applyQuickRange = async (days) => {
    // Compute date range in the browser's local timezone and send
    // YYYY-MM-DD strings. The backend will expand these to
    // start-of-day/end-of-day, so we must NOT use toISOString() here
    // (which would shift dates when converted to UTC).
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(today);
    const start = new Date(today);

    if (days > 0) {
      // Inclusive range: e.g. 7 days => today and previous 6 days
      start.setDate(start.getDate() - (days - 1));
    }

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const fromStr = fmt(start);
    const toStr = fmt(end);

    setFrom(fromStr);
    setTo(toStr);
    setPage(1);
    await fetchSettlements({ from: fromStr, to: toStr, page: 1 });
  };

  const handleToggleSettlement = async (orderId, currentStatus) => {
    if (!token || !orderId) return;
    const desired = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/orders/${orderId}/rider-settlement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: desired }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to update rider settlement');

      setSuccess(
        desired === 'PAID'
          ? 'Rider settlement marked as Paid'
          : 'Rider settlement marked as Unpaid',
      );
      await fetchSettlements({ page });
    } catch (e) {
      setError(e.message || 'Failed to update rider settlement');
    } finally {
      setActionLoading(false);
    }
  };

  const summary = data.summary || {};
  const items = data.items || [];

  const titleName =
    (rider && rider.name) || (loadingRider ? 'Loading rider…' : `Rider ${riderId}`);
  const titleEmail = rider?.email || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Riders</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary">Rider Settlements</h1>
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-semibold">{titleName}</span>
            {titleEmail && <span className="ml-2 text-xs text-gray-500">({titleEmail})</span>}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Order-level earnings and settlement status for this rider.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-gray-500 mr-1">Quick range:</span>
          <button
            onClick={() => applyQuickRange(0)}
            className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => applyQuickRange(7)}
            className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            7 days
          </button>
          <button
            onClick={() => applyQuickRange(15)}
            className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            15 days
          </button>
          <button
            onClick={() => applyQuickRange(30)}
            className="px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
          >
            30 days
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">Delivered (range)</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {summary.deliveredCount || 0}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">Returned (range)</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {summary.returnedCount || 0}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">Failed (range)</div>
          <div className="mt-1 text-xl font-bold text-secondary">
            {summary.failedCount || 0}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">COD (range)</div>
          <div className="mt-1 text-sm font-bold text-secondary">
            {formatCurrency(summary.codCollected || 0)}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">Rider Earnings (range)</div>
          <div className="mt-1 text-sm font-bold text-secondary">
            {formatCurrency(summary.riderEarnings || 0)}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] text-gray-500">Unpaid Balance (range)</div>
          <div className="mt-1 text-sm font-bold text-red-600">
            {formatCurrency(summary.unpaidBalance || 0)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
            <Filter className="w-4 h-4 text-gray-500" />
            <span>Filters</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID / Tracking ID"
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
            />
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            >
              <option value="all">All</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">Settlement</label>
            <select
              value={settlement}
              onChange={(e) => setSettlement(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">Shipper</label>
            <select
              value={shipperId}
              onChange={(e) => setShipperId(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            >
              <option value="">All</option>
              {shippers.map((s) => (
                <option key={s._id} value={s._id}>
                  {(s.companyName || s.name || 'Unnamed') + (s.email ? ` - ${s.email}` : '')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] text-gray-500 mb-1">Sort by Date</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
                fetchSettlements({ sortOrder: e.target.value, page: 1 });
              }}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="text-xs">
              Apply
            </Button>
            <Button variant="outline" onClick={handleResetFilters} className="text-xs">
              Reset
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-gray-100">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b">
                <th className="py-2 px-3 text-left">Date/Time</th>
                <th className="py-2 px-3 text-left">Order / CN</th>
                <th className="py-2 px-3 text-left">Shipper</th>
                <th className="py-2 px-3 text-left">Consignee</th>
                <th className="py-2 px-3 text-left">Destination</th>
                <th className="py-2 px-3 text-right">Weight (kg)</th>
                <th className="py-2 px-3 text-left">Weight Bracket</th>
                <th className="py-2 px-3 text-right">COD</th>
                <th className="py-2 px-3 text-right">Service Charges</th>
                <th className="py-2 px-3 text-right">Rider Earning</th>
                <th className="py-2 px-3 text-center">Order Status</th>
                <th className="py-2 px-3 text-center">Settlement</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-8 px-3 text-center text-gray-500 text-xs">
                    Loading settlements...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 px-3 text-center text-gray-500 text-xs">
                    No orders found for selected filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const paid = item.settlementStatus === 'PAID';
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 whitespace-nowrap">{formatDateTime(item.date)}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px]">{item.orderId || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-xs">{item.shipperName || '—'}</td>
                      <td className="py-2 px-3 text-xs">{item.consigneeName || '—'}</td>
                      <td className="py-2 px-3 text-xs">{item.destination || '—'}</td>
                      <td className="py-2 px-3 text-right">
                        {Number(item.weightKg || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-xs">{item.weightBracketLabel || '—'}</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(item.codAmount || 0)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency(item.serviceCharges || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-secondary">
                        {formatCurrency(item.riderEarning || 0)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px]">
                          {item.status || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleToggleSettlement(item.id, item.settlementStatus)}
                          className={`px-3 py-1 text-[11px] rounded border ${
                            paid
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                              : 'bg-primary text-white hover:bg-primary-hover border-primary'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {paid ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CeoRiderSettlements;
