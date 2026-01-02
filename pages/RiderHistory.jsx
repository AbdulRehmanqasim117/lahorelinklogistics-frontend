import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

const RiderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">All Orders</h3>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <ul className="space-y-3">
            {orders.map(o => (
              <li key={o._id} className="border border-gray-100 rounded-lg p-4 flex justify-between">
                <span className="text-sm text-gray-700">{o.consigneeName} • {o.destinationCity}</span>
                <span className="text-xs">{o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RiderHistory;
