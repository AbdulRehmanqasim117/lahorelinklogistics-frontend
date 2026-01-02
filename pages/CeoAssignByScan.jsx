import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, Package, MapPin, DollarSign, Truck, User } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';
import QrScanner from '../src/components/QrScanner';
import Button from '../components/ui/Button';

/**
 * CEO Assign Orders by QR Scan
 * Allows CEO to select a rider and assign orders by scanning QR codes
 */
const CeoAssignByScan = () => {
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [riders, setRiders] = useState([]);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const { user } = useAuth();
  const token = user?.token || getToken();

  // Fetch riders on mount
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await fetch('/api/users/riders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          // Filter only active riders
          setRiders(data.filter(r => r.status === 'ACTIVE'));
        }
      } catch (e) {
        console.error('Failed to fetch riders:', e);
      }
    };
    fetchRiders();
  }, [token]);

  const fetchOrderDetails = async (bookingId) => {
    if (!bookingId || !bookingId.trim()) {
      setError('Please enter or scan a booking ID');
      return;
    }

    if (!selectedRiderId) {
      setError('Please select a rider first');
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

  const assignOrder = async () => {
    if (!scannedOrder || !selectedRiderId) {
      setError('Please select a rider and scan an order');
      return;
    }

    setAssigning(true);
    setError('');

    try {
      const res = await fetch('/api/orders/assign-by-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: scannedOrder.bookingId,
          assignedRiderId: selectedRiderId
        })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to assign order');
      }

      // Add to recent assignments
      const selectedRider = riders.find(r => r._id === selectedRiderId);
      setRecentAssignments(prev => [{
        bookingId: scannedOrder.bookingId,
        riderName: selectedRider?.name || 'Unknown',
        timestamp: new Date().toLocaleString()
      }, ...prev.slice(0, 9)]); // Keep last 10

      // Clear scanned order and show success
      setScannedOrder(null);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleScan = (bookingId) => {
    fetchOrderDetails(bookingId);
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
  };

  const selectedRider = riders.find(r => r._id === selectedRiderId);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold text-secondary">Assign Orders by QR Scan</h3>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Select a rider and scan QR codes to assign orders. Orders will be automatically marked as Out for Delivery.
        </p>
      </div>

      {/* Rider Selection */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Select Rider (Required)
        </label>
        <select
          value={selectedRiderId}
          onChange={(e) => {
            setSelectedRiderId(e.target.value);
            setScannedOrder(null);
            setError('');
          }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">-- Select a Rider --</option>
          {riders.map(rider => (
            <option key={rider._id} value={rider._id}>
              {rider.name} {rider.email ? `(${rider.email})` : ''}
            </option>
          ))}
        </select>
        {selectedRider && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: <span className="font-semibold">{selectedRider.name}</span>
            {selectedRider.phone && <span className="ml-2">- {selectedRider.phone}</span>}
          </p>
        )}
      </div>

      {/* Scanner */}
      {selectedRiderId && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <QrScanner onScan={handleScan} onError={handleScanError} />
        </div>
      )}

      {loading && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching order details...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Preview & Assign */}
      {scannedOrder && selectedRiderId && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5" />
              <p className="font-semibold">Order Preview</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
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
                <span className="font-medium">Current Status:</span>
                <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-semibold">
                  {scannedOrder.status}
                </span>
              </div>
              {scannedOrder.assignedRider && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium">Currently Assigned:</span>
                  <span className="ml-2">{scannedOrder.assignedRider.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={assignOrder}
              disabled={assigning}
              className="flex-1"
            >
              {assigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Assign to {selectedRider?.name}
                </>
              )}
            </Button>
            <button
              onClick={() => {
                setScannedOrder(null);
                setError('');
              }}
              className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recent Assignments */}
      {recentAssignments.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h4 className="text-md font-bold text-secondary mb-4">Recent Assignments</h4>
          <div className="space-y-2">
            {recentAssignments.map((assignment, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{assignment.bookingId}</span>
                  <span className="text-sm text-gray-600">→ {assignment.riderName}</span>
                </div>
                <span className="text-xs text-gray-500">{assignment.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CeoAssignByScan;

