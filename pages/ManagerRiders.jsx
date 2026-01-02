import React, { useEffect, useState } from 'react';
import { Truck, DollarSign, Download, Check, X, Filter, Search } from 'lucide-react';
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

const ManagerRiders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();
  const token = user?.token || getToken();

  const [settlementsRider, setSettlementsRider] = useState(null);
  const [settlementsData, setSettlementsData] = useState({
    summary: null,
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [settlementsError, setSettlementsError] = useState('');
  const [settlementsSuccess, setSettlementsSuccess] = useState('');
  const [settlementsFrom, setSettlementsFrom] = useState('');
  const [settlementsTo, setSettlementsTo] = useState('');
  const [settlementsStatus, setSettlementsStatus] = useState('all');
  const [settlementsSettlement, setSettlementsSettlement] = useState('all');
  const [settlementsSortOrder, setSettlementsSortOrder] = useState('desc');
  const [settlementsSearch, setSettlementsSearch] = useState('');
  const [settlementsPage, setSettlementsPage] = useState(1);
  const [settlementsShipperId, setSettlementsShipperId] = useState('');
  const [settlementsShippers, setSettlementsShippers] = useState([]);
  const [settlementActionLoading, setSettlementActionLoading] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/riders/finance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch riders');
      setRiders(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchSettlementsShippers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/shippers?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSettlementsShippers(data);
      }
    } catch {
      // Best-effort; panel can work without shipper filter data
    }
  };

  const toggleServiceChargeStatus = async (riderId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
      const res = await fetch(`/api/riders/${riderId}/service-charges-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchRiders();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update status');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchRiderSettlements = async (rider, overrides = {}) => {
    if (!rider || !token) return;
    const riderId = rider._id;
    setSettlementsLoading(true);
    setSettlementsError('');
    setSettlementsSuccess('');
    try {
      const params = new URLSearchParams();
      const from = overrides.from ?? settlementsFrom;
      const to = overrides.to ?? settlementsTo;
      const status = overrides.status ?? settlementsStatus;
      const settlement = overrides.settlement ?? settlementsSettlement;
      const sortOrder = overrides.sortOrder ?? settlementsSortOrder;
      const page = overrides.page ?? settlementsPage;
      const shipperId = overrides.shipperId ?? settlementsShipperId;
      const search = overrides.search ?? settlementsSearch;

      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (status && status !== 'all') params.set('status', status);
      if (settlement && settlement !== 'all') params.set('settlement', settlement);
      if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
        params.set('sortOrder', sortOrder);
      }
      if (shipperId) params.set('shipperId', shipperId);
      if (search && search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(
        `/api/riders/${riderId}/settlements?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load rider settlements');
      setSettlementsData(data);
      setSettlementsPage(data.page || page);
    } catch (e) {
      setSettlementsError(e.message || 'Failed to load rider settlements');
    } finally {
      setSettlementsLoading(false);
    }
  };

  const openSettlementsForRider = (rider) => {
    setSettlementsRider(rider);
    setSettlementsFrom('');
    setSettlementsTo('');
    setSettlementsStatus('all');
    setSettlementsSettlement('all');
    setSettlementsSortOrder('desc');
    setSettlementsSearch('');
    setSettlementsShipperId('');
    setSettlementsPage(1);
    setSettlementsError('');
    setSettlementsSuccess('');
    fetchRiderSettlements(rider, { page: 1 });
  };

  const handleApplySettlementsFilters = async () => {
    if (!settlementsRider) return;
    setSettlementsPage(1);
    await fetchRiderSettlements(settlementsRider, { page: 1 });
  };

  const handleResetSettlementsFilters = async () => {
    if (!settlementsRider) return;
    setSettlementsFrom('');
    setSettlementsTo('');
    setSettlementsStatus('all');
    setSettlementsSettlement('all');
    setSettlementsSortOrder('desc');
    setSettlementsSearch('');
    setSettlementsShipperId('');
    setSettlementsPage(1);
    await fetchRiderSettlements(settlementsRider, {
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

  const handleOrderSettlementToggle = async (orderId, currentStatus) => {
    if (!orderId || !settlementsRider || !token) return;
    const desired = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    setSettlementActionLoading(true);
    setSettlementsError('');
    setSettlementsSuccess('');
    try {
      const res = await fetch(`/api/orders/${orderId}/rider-settlement`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: desired }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update rider settlement');
      setSettlementsSuccess(
        desired === 'PAID' ? 'Rider settlement marked as Paid' : 'Rider settlement marked as Unpaid',
      );
      await fetchRiderSettlements(settlementsRider, { page: settlementsPage });
    } catch (e) {
      setSettlementsError(e.message || 'Failed to update rider settlement');
    } finally {
      setSettlementActionLoading(false);
    }
  };

  const downloadDailyReport = async (riderId, riderName) => {
    try {
      const res = await fetch(`/api/riders/${riderId}/daily-report?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rider-${riderName}-${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { 
    if (token) {
      fetchRiders();
      fetchSettlementsShippers();
    }
  }, [token]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">Riders Finance</h3>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-4">Rider Name</th>
                  <th className="py-3 px-4">Assigned Orders</th>
                  <th className="py-3 px-4">COD Collected</th>
                  <th className="py-3 px-4">Service Charges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
            {riders.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{r.assignedOrders || 0}</td>
                    <td className="py-3 px-4">PKR {Number(r.codCollected || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">PKR {Number(r.serviceCharges || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        r.serviceChargeStatus === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {r.serviceChargeStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleServiceChargeStatus(r._id, r.serviceChargeStatus)}
                          className={`px-3 py-1 text-xs rounded ${
                            r.serviceChargeStatus === 'paid'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-primary text-white hover:bg-primary-hover'
                          }`}
                        >
                          {r.serviceChargeStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                        <button
                          onClick={() => downloadDailyReport(r._id, r.name)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Report
                        </button>
                        <button
                          onClick={() => openSettlementsForRider(r)}
                          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Settlements
                        </button>
                      </div>
                    </td>
                  </tr>
            ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {settlementsRider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => {
            setSettlementsRider(null);
            setSettlementsError('');
            setSettlementsSuccess('');
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-secondary">
                  Rider Settlements - {settlementsRider.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Order-level rider earnings and settlement status for this rider.
                </p>
              </div>
              <button
                onClick={() => {
                  setSettlementsRider(null);
                  setSettlementsError('');
                  setSettlementsSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settlementsError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded">
                {settlementsError}
              </div>
            )}
            {settlementsSuccess && !settlementsError && (
              <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded">
                {settlementsSuccess}
              </div>
            )}

            <div className="p-6 pt-4 space-y-5 overflow-y-auto">
              {(() => {
                const summary = settlementsData.summary || {};
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                );
              })()}

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
                      value={settlementsSearch}
                      onChange={(e) => setSettlementsSearch(e.target.value)}
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
                      value={settlementsFrom}
                      onChange={(e) => setSettlementsFrom(e.target.value)}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={settlementsTo}
                      onChange={(e) => setSettlementsTo(e.target.value)}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-1">Status</label>
                    <select
                      value={settlementsStatus}
                      onChange={(e) => setSettlementsStatus(e.target.value)}
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
                      value={settlementsSettlement}
                      onChange={(e) => setSettlementsSettlement(e.target.value)}
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
                      value={settlementsShipperId}
                      onChange={(e) => setSettlementsShipperId(e.target.value)}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">All</option>
                      {settlementsShippers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {(s.companyName || s.name || 'Unnamed') + (s.email ? ` - ${s.email}` : '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-1">Sort by Date</label>
                    <select
                      value={settlementsSortOrder}
                      onChange={(e) => {
                        setSettlementsSortOrder(e.target.value);
                        setSettlementsPage(1);
                        if (settlementsRider) {
                          fetchRiderSettlements(settlementsRider, {
                            sortOrder: e.target.value,
                            page: 1,
                          });
                        }
                      }}
                      className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-end gap-2">
                    <Button onClick={handleApplySettlementsFilters} className="text-xs">
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetSettlementsFilters}
                      className="text-xs"
                    >
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
                        <th className="py-2 px-3 text-right">Rider Earning</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Settlement</th>
                        <th className="py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {settlementsLoading ? (
                        <tr>
                          <td
                            colSpan={12}
                            className="py-8 px-3 text-center text-gray-500 text-xs"
                          >
                            Loading settlements...
                          </td>
                        </tr>
                      ) : (settlementsData.items || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={12}
                            className="py-8 px-3 text-center text-gray-500 text-xs"
                          >
                            No orders found for selected filters.
                          </td>
                        </tr>
                      ) : (
                        (settlementsData.items || []).map((item) => {
                          const paid = item.settlementStatus === 'PAID';
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-2 px-3 whitespace-nowrap">
                                {formatDateTime(item.date)}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px]">
                                    {item.orderId || '—'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-xs">{item.shipperName || '—'}</td>
                              <td className="py-2 px-3 text-xs">{item.consigneeName || '—'}</td>
                              <td className="py-2 px-3 text-xs">{item.destination || '—'}</td>
                              <td className="py-2 px-3 text-right">
                                {Number(item.weightKg || 0).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-xs">
                                {item.weightBracketLabel || '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {formatCurrency(item.codAmount || 0)}
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
                                    paid
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  disabled={settlementActionLoading}
                                  onClick={() =>
                                    handleOrderSettlementToggle(item.id, item.settlementStatus)
                                  }
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

                <div className="p-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <div>
                    Showing page {settlementsData.page || 1} of{' '}
                    {settlementsData.totalPages || 1} (Total {settlementsData.total || 0})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, (settlementsData.page || 1) - 1);
                        setSettlementsPage(newPage);
                        if (settlementsRider) {
                          fetchRiderSettlements(settlementsRider, { page: newPage });
                        }
                      }}
                      disabled={(settlementsData.page || 1) <= 1 || settlementsLoading}
                      className="px-3 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => {
                        const newPage = Math.min(
                          settlementsData.totalPages || 1,
                          (settlementsData.page || 1) + 1,
                        );
                        setSettlementsPage(newPage);
                        if (settlementsRider) {
                          fetchRiderSettlements(settlementsRider, { page: newPage });
                        }
                      }}
                      disabled={
                        (settlementsData.page || 1) >= (settlementsData.totalPages || 1) ||
                        settlementsLoading
                      }
                      className="px-3 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedRider && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h4 className="font-bold mb-4">Download Daily Report</h4>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            />
            <Button onClick={() => downloadDailyReport(selectedRider._id, selectedRider.name)}>
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRiders;

