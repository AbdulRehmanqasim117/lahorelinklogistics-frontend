import React, { useEffect, useState } from 'react';
import { Truck, Package } from 'lucide-react';

const CeoLogistics = () => {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, oRes] = await Promise.all([
        fetch('/api/users/riders', { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
        fetch('/api/orders', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      ]);
      const rData = await rRes.json();
      const oData = await oRes.json();
      if (!rRes.ok) throw new Error(rData.message || 'Failed riders');
      if (!oRes.ok) throw new Error(oData.message || 'Failed orders');
      setRiders(rData);
      setOrders(oData);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toDateString();
  const ordersToday = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const deliveredToday = orders.filter(o => o.status === 'DELIVERED' && new Date(o.deliveredAt || o.createdAt).toDateString() === today);
  const activeRiders = riders.filter(r => r.status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Riders</p>
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : activeRiders.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Orders Today</p>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : ordersToday.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Delivered Today</p>
            <Package className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-secondary">{loading ? '—' : deliveredToday.length}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">Rider Load</h3>
          <button onClick={load} className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Rider</th>
                <th className="py-2 px-3">Assigned</th>
                <th className="py-2 px-3">OFD</th>
                <th className="py-2 px-3">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riders.map(r => {
                const assigned = orders.filter(o => o.assignedRider && (o.assignedRider._id === r._id || o.assignedRider === r._id));
                const ofd = assigned.filter(o => o.status === 'OUT_FOR_DELIVERY');
                const delivered = assigned.filter(o => o.status === 'DELIVERED');
                return (
                  <tr key={r._id}>
                    <td className="py-2 px-3">{r.name}</td>
                    <td className="py-2 px-3">{assigned.length}</td>
                    <td className="py-2 px-3">{ofd.length}</td>
                    <td className="py-2 px-3">{delivered.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">Rider Orders & Status</h3>
          <button onClick={load} className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Rider</th>
                <th className="py-2 px-3">Booking</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">City</th>
                <th className="py-2 px-3">COD/Collected</th>
                <th className="py-2 px-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders
                .filter(o => !!o.assignedRider && ["OUT_FOR_DELIVERY","DELIVERED","RETURNED","FAILED","ASSIGNED"].includes(o.status))
                .map(o => (
                  <tr key={o._id}>
                    <td className="py-2 px-3">{typeof o.assignedRider === 'object' ? o.assignedRider?.name : riders.find(r=>r._id===o.assignedRider)?.name || '—'}</td>
                    <td className="py-2 px-3 font-mono text-xs">{o.bookingId}</td>
                    <td className="py-2 px-3">{o.status}</td>
                    <td className="py-2 px-3">{o.destinationCity}</td>
                    <td className="py-2 px-3">{o.status === 'DELIVERED' ? `Rs ${Number((o.amountCollected||o.codAmount)||0).toLocaleString()}` : `Rs ${Number(o.codAmount||0).toLocaleString()}`}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">{new Date(o.updatedAt || o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CeoLogistics;
