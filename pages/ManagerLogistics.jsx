import React, { useEffect, useState } from 'react';
import { Truck, Play } from 'lucide-react';

const ManagerLogistics = () => {
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);

  const startRoute = async (riderId) => {
    try {
      const assigned = orders.filter(o => o.assignedRider && (o.assignedRider._id === riderId || o.assignedRider === riderId) && o.status === 'ASSIGNED');
      for (const o of assigned) {
        await fetch(`/api/orders/${o._id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
          body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' })
        });
      }
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-8">
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>}

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-secondary">Logistics</h3>
          <button onClick={load} className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-3">Rider</th>
                <th className="py-2 px-3">Assigned</th>
                <th className="py-2 px-3">Start Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riders.map(r => {
                const assigned = orders.filter(o => o.assignedRider && (o.assignedRider._id === r._id || o.assignedRider === r._id) && o.status === 'ASSIGNED');
                return (
                  <tr key={r._id}>
                    <td className="py-2 px-3 flex items-center gap-2"><Truck className="w-4 h-4" /> {r.name}</td>
                    <td className="py-2 px-3">{assigned.length}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => startRoute(r._id)} className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded flex items-center gap-2">
                        <Play className="w-4 h-4" /> Start
                      </button>
                    </td>
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

export default ManagerLogistics;
