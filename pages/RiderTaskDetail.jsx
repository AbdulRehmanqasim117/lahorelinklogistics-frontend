import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Check, RotateCcw, Play } from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';

const RiderTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusExpanded, setStatusExpanded] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch order');
      setOrder(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setOrder(data);
      setStatusExpanded(false);
    } catch (e) { setError(e.message); }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">{error}</div>;
  if (!order) return null;

  const codText = Number(order.codAmount || 0).toLocaleString();
  const isFinal = ['DELIVERED', 'RETURNED', 'FAILED'].includes(order.status);

  const orderIdDisplay = order.isIntegrated
    ? order.shopifyOrderNumber ||
      order.sourceProviderOrderNumber ||
      order.externalOrderId ||
      order.bookingId
    : order.bookingId;

  return (
    <div className="space-y-6">
      <div className="bg-secondary text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs opacity-80">Collect Cash</div>
          <div className="text-3xl font-bold">PKR {codText}</div>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-secondary">{order.consigneeName}</h3>
              <p className="text-xs text-gray-500">
                Order ID: <span className="font-mono">{orderIdDisplay}</span>
              </p>
              <p className="text-xs text-gray-500">
                Tracking ID:{' '}
                <span className="font-mono">{order.trackingId || 'd'}</span>
              </p>
            </div>
            <Badge status={order.status} />
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {order.consigneeAddress} • {order.destinationCity}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {order.consigneePhone}</div>
            <div>Service Type: {order.serviceType}</div>
            <div>Pieces: {order.pieces}</div>
            <div>Fragile: {order.fragile ? 'Yes' : 'No'}</div>
            <div>Remarks: {order.remarks || '—'}</div>
            <div>Payment Type: {order.paymentType}</div>
          </div>
        </div>
      </div>

      {isFinal && !statusExpanded ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => setStatusExpanded(true)}
            className="w-full sm:flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold"
          >
            Change Status
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => updateStatus('FIRST_ATTEMPT')}
            className="w-full sm:flex-1 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold"
          >
            1st Attempt
          </button>
          <button
            onClick={() => updateStatus('SECOND_ATTEMPT')}
            className="w-full sm:flex-1 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold"
          >
            2nd Attempt
          </button>
          <button
            onClick={() => updateStatus('THIRD_ATTEMPT')}
            className="w-full sm:flex-1 h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold"
          >
            3rd Attempt
          </button>
          <button
            onClick={() => updateStatus('DELIVERED')}
            className="w-full sm:flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            <Check className="w-4 h-4 inline" /> Delivered
          </button>
          <button
            onClick={() => updateStatus('RETURNED')}
            className="w-full sm:flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            <RotateCcw className="w-4 h-4 inline" /> Return
          </button>
        </div>
      )}

      <div className="text-xs text-gray-400">Shipment created on {new Date(order.createdAt).toDateString()}</div>
    </div>
  );
};

export default RiderTaskDetail;
