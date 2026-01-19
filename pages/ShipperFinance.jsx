import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Download, Filter } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';
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

const formatWeight = (value) => {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(num) || num <= 0) return null;
  const rounded = Math.round(num * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.0+$/, '')
    .replace(/\.([1-9])0$/, '.$1');
};

const ShipperFinance = () => {
  const { user } = useAuth();
  const token = user?.token || getToken();

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState({ rows: [], totals: null, total: 0, page: 1, totalPages: 1 });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [paidStatus, setPaidStatus] = useState('UNPAID');
  const [search, setSearch] = useState('');
  // Ledger is loaded without pagination; we always fetch all filtered rows in one go.

  // Prefer using the ledger totals (which respect current filters) for the
  // Balance card so that it always matches the visible ledger/journal.
  const ledgerReceivable = Number(ledger?.totals?.totalReceivable ?? 0);
  const balance =
    ledger && ledger.totals != null
      ? ledgerReceivable
      : Number(summary?.balance || 0);
  const balanceMeta = useMemo(() => {
    const positive = balance >= 0;
    return {
      positive,
      colorClass: positive ? 'text-green-700' : 'text-red-600',
      helper: positive ? 'Payable to Shipper' : 'Payable by Shipper',
    };
  }, [balance]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setError('');
    try {
      const res = await fetch('/api/shipper/finance/summary', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load finance summary');
      setSummary(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchLedger = async (opts = {}) => {
    setLoadingLedger(true);
    setError('');
    try {
      const params = new URLSearchParams();

      const fromVal = opts.from ?? from;
      if (fromVal) params.set('from', fromVal);

      const toVal = opts.to ?? to;
      if (toVal) params.set('to', toVal);

      const statusRaw = opts.paidStatus ?? paidStatus;
      const statusVal = statusRaw || 'UNPAID';
      if (statusVal === 'ALL' || statusVal === 'PAID' || statusVal === 'UNPAID') {
        params.set('status', statusVal);
      }

      const s = opts.search ?? search;
      if (s && String(s).trim()) params.set('search', String(s).trim());

      // Always request all filtered rows in a single response for consistent totals/balance
      params.set('page', '1');
      params.set('limit', 'all');

      const res = await fetch(`/api/shipper/finance/ledger?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load ledger');
      setLedger(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token]);

  useEffect(() => {
    fetchLedger();
  }, [token]);

  const applyFilters = async () => {
    await fetchLedger();
  };

  const downloadCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (paidStatus === 'ALL' || paidStatus === 'PAID' || paidStatus === 'UNPAID') params.set('status', paidStatus || 'UNPAID');
      if (search && String(search).trim()) params.set('search', String(search).trim());
      params.set('format', 'csv');
      params.set('limit', 'all');

      const res = await fetch(`/api/shipper/finance/ledger?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to download CSV');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shipper-ledger.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  const policy = summary?.serviceChargesPolicy;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-secondary">Finance</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadCsv} className="text-xs">
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-secondary">Info</div>
            <div className="text-xs text-gray-500 mt-1">Shipper profile (read-only)</div>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Name</div><div className="font-medium text-secondary text-right">{summary?.shipper?.name || (loadingSummary ? '—' : '—')}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Company</div><div className="font-medium text-secondary text-right">{summary?.shipper?.companyName || '—'}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Phone</div><div className="font-medium text-secondary text-right">{summary?.shipper?.phone || '—'}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Email</div><div className="font-medium text-secondary text-right">{summary?.shipper?.email || '—'}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Address</div><div className="font-medium text-secondary text-right">{summary?.shipper?.address || '—'}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">CNIC/NTN</div><div className="font-medium text-secondary text-right">{summary?.shipper?.cnic || '—'}</div></div>
            <div className="flex items-center justify-between gap-4"><div className="text-gray-500">Account Created</div><div className="font-medium text-secondary text-right">{formatDateTime(summary?.shipper?.createdAt)}</div></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-secondary">Services / Charges</div>
            <div className="text-xs text-gray-500 mt-1">Pricing policy decided by management</div>
          </div>
          <div className="p-5">
            {!policy ? (
              <div className="text-sm text-gray-500">No pricing policy found.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  <div className="text-xs text-gray-500">Policy</div>
                  <div className="font-medium text-secondary">Weight Brackets (PKR / parcel)</div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b bg-gray-50">
                        <th className="py-2 px-3">Min (kg)</th>
                        <th className="py-2 px-3">Max (kg)</th>
                        <th className="py-2 px-3 text-right">Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(policy.weightBrackets || []).map((b, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">{Number(b.minKg || 0)}</td>
                          <td className="py-2 px-3">{b.maxKg === null || b.maxKg === undefined ? '∞' : Number(b.maxKg)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatCurrency(b.charge)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-gray-500">
                  Units:
                  <span className="font-medium text-gray-700"> PKR per parcel</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-secondary">Balance</div>
            <div className="text-xs text-gray-500 mt-1">Computed from ledger entries</div>
          </div>
          <div className="p-6">
            <div className={`text-4xl font-extrabold tracking-tight ${balanceMeta.colorClass}`}>
              {loadingLedger && !ledger?.totals ? '—' : formatCurrency(balance)}
            </div>
            <div className="mt-2 text-sm text-gray-500">{balanceMeta.helper}</div>
            <div className="mt-4 text-xs text-gray-500">
              Positive/Zero:
              <span className="text-green-700 font-medium"> payable to shipper</span>
              <span className="mx-2">|</span>
              Negative:
              <span className="text-red-600 font-medium"> payable by shipper</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-lg text-secondary">Ledger / Journal</h3>
            </div>
            <div className="text-sm text-gray-500">Newest first</div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Paid Status</label>
              <select value={paidStatus} onChange={(e) => setPaidStatus(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                <option value="ALL">All</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="text-xs text-gray-500 mb-1">Search Booking ID</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. BKG-000123" className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <Button onClick={applyFilters} className="w-full sm:w-auto text-xs">Apply Filters</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setPaidStatus('ALL');
                  setSearch('');
                  fetchLedger({ from: '', to: '', paidStatus: 'ALL', search: '' });
                }}
                className="w-full sm:w-auto text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="text-xs text-gray-500 w-full sm:w-auto">
              Totals (filtered):
              <span className="ml-2">COD: <span className="font-medium text-secondary">{formatCurrency(ledger?.totals?.totalCod || 0)}</span></span>
              <span className="ml-2">Charges: <span className="font-medium text-secondary">{formatCurrency(ledger?.totals?.totalServiceCharges || 0)}</span></span>
              <span className="ml-2">Receivable: <span className="font-medium text-secondary">{formatCurrency(ledger?.totals?.totalReceivable || 0)}</span></span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] md:min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4">Particular</th>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Weight (kg)</th>
                <th className="py-3 px-4 text-right">COD Amount</th>
                <th className="py-3 px-4 text-right">Service Charges</th>
                <th className="py-3 px-4 text-right">Receivable</th>
                <th className="py-3 px-4 text-center">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingLedger ? (
                <tr><td colSpan={9} className="py-10 px-4 text-center text-gray-500">Loading transactions…</td></tr>
              ) : (ledger?.rows || []).length === 0 ? (
                <tr><td colSpan={9} className="py-10 px-4 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                (ledger.rows || []).map((r) => {
                  const receivable = Number(r.receivable ?? r.amount ?? 0);
                  const weightStr = formatWeight(r.weightKg);
                  const rawStatus = r.orderStatus || '';
                  const statusLabel = rawStatus || '—';
                  const statusColor =
                    rawStatus === 'DELIVERED'
                      ? 'bg-green-100 text-green-700'
                      : rawStatus === 'RETURNED'
                        ? 'bg-red-100 text-red-700'
                        : rawStatus === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : rawStatus === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-100 text-blue-700'
                            : rawStatus
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-gray-50 text-gray-400';
                  return (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-600">{formatDateTime(r.date)}</td>
                      <td className="py-3 px-4">{r.particular || '—'}</td>
                      <td className="py-3 px-4 font-mono text-xs">{r.bookingId || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{weightStr ?? 'N/A'}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(r.codAmount ?? 0)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(r.serviceCharges ?? 0)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${receivable >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(receivable)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.status === 'PAID' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Shipper ledger shows all filtered rows at once; no pagination footer needed */}
      </div>
    </div>
  );
};

export default ShipperFinance;
