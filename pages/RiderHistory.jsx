import React, { useEffect, useMemo, useState } from 'react';
import { Package, Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RiderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const navigate = useNavigate();

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

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orders;
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
        (orderIdStr && orderIdStr.includes(q)) ||
        (trackingStr && trackingStr.includes(q))
      );
    });
  }, [orders, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">All Orders</h3>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID / Tracking ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders found.</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders match your search.</p>
        ) : (
          <ul className="space-y-3">
            {filteredOrders.map((o) => {
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RiderHistory;
