import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter } from 'lucide-react';
import { getToken } from '../src/utils/auth';
import Button from '../components/ui/Button.jsx';

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

const quickRanges = [
  { key: 'today', label: 'Today' },
  { key: '7', label: '7 Days' },
  { key: '15', label: '15 Days' },
  { key: '30', label: '30 Days' },
];

const RiderFinance = () => {
  const token = getToken();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState({ summary: null, items: [], page: 1, totalPages: 1, total: 0 });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const applyQuickRange = (key) => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (key === 'today') {
      // already set
    } else {
      const days = Number(key);
      if (!Number.isNaN(days) && days > 0) {
        start = new Date(end);
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
      }
    }

    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
    setPage(1);
  };

  const fetchFinance = async (opts = {}) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams();
      const f = opts.from ?? from;
      const t = opts.to ?? to;
      const st = opts.status ?? status;
      const so = opts.sortOrder ?? sortOrder;
      const p = opts.page ?? page;

      if (f) params.set('from', f);
      if (t) params.set('to', t);
      if (st && st !== 'all') params.set('status', st);
      if (so && (so === 'asc' || so === 'desc')) params.set('sortOrder', so);
      params.set('page', String(p));
      params.set('limit', String(limit));

      const res = await fetch(`/api/riders/finance/me?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load rider finance');
      setData(json);
      if (!json.items || json.items.length === 0) {
        setSuccess('No records found for selected range');
      } else {
        setSuccess('Finance loaded successfully');
      }
    } catch (e) {
      setError(e.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance({ page: 1 });
  }, [token]);

  useEffect(() => {
    const onFocus = () => {
      fetchFinance({ page: 1 });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [token]);

  const summary = data.summary || {};

  const unpaidBalanceMeta = useMemo(() => {
    const bal = Number(summary.unpaidBalance || 0);
    const positive = bal >= 0;
    return {
      value: bal,
      positive,
      colorClass: positive ? 'text-green-700' : 'text-red-600',
      helper: positive ? 'Payable to Rider' : 'Payable by Rider',
    };
  }, [summary.unpaidBalance]);

  const handleApplyFilters = async () => {
    setPage(1);
    await fetchFinance({ page: 1 });
  };

  const handleReset = () => {
    setFrom('');
    setTo('');
    setStatus('all');
    setSortOrder('desc');
    setPage(1);
    fetchFinance({ from: '', to: '', status: 'all', sortOrder: 'desc', page: 1 });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-secondary">Rider Finance</h3>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">Your earnings and settlements overview.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>
      )}
      {success && !error && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-sm rounded">{success}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Delivered (range)</div>
          <div className="mt-1 text-2xl font-bold text-secondary">{summary.deliveredCount || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Returned (range)</div>
          <div className="mt-1 text-2xl font-bold text-secondary">{summary.returnedCount || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">COD Collected (range)</div>
          <div className="mt-1 text-xl font-bold text-secondary">{formatCurrency(summary.codCollected || 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500">Unpaid Balance</div>
          <div className={`mt-1 text-xl font-extrabold ${unpaidBalanceMeta.colorClass}`}>
            {formatCurrency(unpaidBalanceMeta.value)}
          </div>
          <div className="mt-1 text-xs text-gray-500">{unpaidBalanceMeta.helper}</div>
        </div>
      </div>

      {/* Filters + sort */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-lg text-secondary">Transactions</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {quickRanges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => applyQuickRange(r.key)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">All</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Sort by Date</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                  fetchFinance({ sortOrder: e.target.value, page: 1 });
                }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="desc">Sort by Date • Newest First</option>
                <option value="asc">Sort by Date • Oldest First</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <Button onClick={handleApplyFilters} className="w-full sm:w-auto text-xs">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto text-xs">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] md:min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Shipper</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">COD Amount</th>
                <th className="py-3 px-4 text-right">Rider Earning</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-gray-500">
                    Loading transactions…
                  </td>
                </tr>
              ) : (data.items || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                (data.items || []).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs text-gray-600">{formatDateTime(item.date)}</td>
                    <td className="py-3 px-4 font-mono text-xs">{item.orderId || '—'}</td>
                    <td className="py-3 px-4">{item.shipperName || '—'}</td>
                    <td className="py-3 px-4">{item.destination || '—'}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.codAmount || 0)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-secondary">
                      {formatCurrency(item.riderEarning || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {item.status || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.settlementStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.settlementStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-gray-500">
            Showing page {data.page || 1} of {data.totalPages || 1} (Total {data.total || 0})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, (data.page || 1) - 1);
                setPage(newPage);
                fetchFinance({ page: newPage });
              }}
              disabled={(data.page || 1) <= 1}
              className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => {
                const newPage = Math.min(data.totalPages || 1, (data.page || 1) + 1);
                setPage(newPage);
                fetchFinance({ page: newPage });
              }}
              disabled={(data.page || 1) >= (data.totalPages || 1)}
              className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderFinance;
