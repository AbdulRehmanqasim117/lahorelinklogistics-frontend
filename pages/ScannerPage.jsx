import React, { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import QrScanner from '../src/components/QrScanner';

/**
 * Warehouse Scanner Page for CEO and Manager
 * Allows scanning QR codes from order labels to mark orders as arrived at LLL warehouse
 */
const ScannerPage = () => {
  const [scannedOrder, setScannedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const token = user?.token || getToken();

  const scanOrder = async (bookingId) => {
    if (!bookingId || !bookingId.trim()) {
      setError('Please enter or scan a booking ID');
      return;
    }

    setLoading(true);
    setError('');
    setScannedOrder(null);

    try {
      const res = await fetch('/api/orders/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: bookingId.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to scan order');
      }
      
      setScannedOrder(data.order);
    } catch (e) {
      setError(e.message);
      setScannedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (bookingId) => {
    scanOrder(bookingId);
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">LLL Warehouse Scanner</h3>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Scan QR code from order label to mark order as arrived at LLL warehouse
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
              <p className="font-semibold">Scan Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {scannedOrder && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-lg">
                Order {scannedOrder.bookingId} marked as Arrived at LLL Warehouse
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-2 bg-white p-3 rounded border border-green-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-gray-500">Order ID:</span>
                  <span className="font-mono ml-2">{scannedOrder.bookingId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    {scannedOrder.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Consignee:</span>
                  <span className="ml-2">{scannedOrder.consigneeName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">City:</span>
                  <span className="ml-2">{scannedOrder.destinationCity}</span>
                </div>
                {scannedOrder.shipper && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">Shipper:</span>
                    <span className="ml-2">{scannedOrder.shipper.name || scannedOrder.shipper.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;

