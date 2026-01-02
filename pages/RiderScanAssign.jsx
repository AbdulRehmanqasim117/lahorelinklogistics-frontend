import React, { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Package, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import QrScanner from '../src/components/QrScanner';

/**
 * Rider Scanner Page (Read-Only)
 * Allows riders to scan QR codes to view order details
 * Riders can only view orders assigned to them - no self-assignment
 */
const RiderScanAssign = () => {
  const [scannedOrder, setScannedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const token = user?.token || getToken();

  const fetchOrderDetails = async (bookingId) => {
    if (!bookingId || !bookingId.trim()) {
      setError('Please enter or scan a booking ID');
      return;
    }

    setLoading(true);
    setError('');
    setScannedOrder(null);

    try {
      const res = await fetch(`/api/orders/details/${encodeURIComponent(bookingId.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch order details');
      }
      
      setScannedOrder(data);
    } catch (e) {
      setError(e.message);
      setScannedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (bookingId) => {
    fetchOrderDetails(bookingId);
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">Scan Parcel QR</h3>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Scan QR code from parcel label to view order details (read-only)
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <QrScanner onScan={handleScan} onError={handleScanError} />
      </div>

      {loading && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Processing scan...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Assignment Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {scannedOrder && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" />
              <p className="font-semibold">Order Details</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Booking ID:</span>
                <span className="font-mono">{scannedOrder.bookingId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Tracking ID:</span>
                <span className="font-mono">{scannedOrder.trackingId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Consignee:</span>
                <span>{scannedOrder.consigneeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Address:</span>
                <span>{scannedOrder.consigneeAddress}, {scannedOrder.destinationCity}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Phone:</span>
                <span>{scannedOrder.consigneePhone}</span>
              </div>
              {scannedOrder.codAmount > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">COD Amount:</span>
                  <span>PKR {Number(scannedOrder.codAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="font-medium">Status:</span>
                <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-semibold">
                  {scannedOrder.status}
                </span>
              </div>
              {scannedOrder.assignedRider && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium">Assigned Rider:</span>
                  <span className="ml-2">{scannedOrder.assignedRider.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderScanAssign;

