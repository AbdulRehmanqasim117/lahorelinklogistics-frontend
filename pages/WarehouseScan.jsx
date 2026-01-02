import React, { useState, useEffect } from 'react';
import {
  Package,
  Scale,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  Truck,
  DollarSign,
  Edit3,
  Save,
  X,
  Loader,
  Building2,
  Info
} from 'lucide-react';
import QRScanner from '../src/components/QRScanner';
import { useAuth } from '../src/contexts/AuthContext';
import { getToken } from '../src/utils/auth';

const WarehouseScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [overrideWeight, setOverrideWeight] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const { user } = useAuth();
  const token = user?.token || getToken();

  // Load scan history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('warehouseScanHistory');
    if (stored) {
      try {
        setScanHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load scan history:', e);
      }
    }
  }, []);

  // Save scan history to localStorage
  const updateScanHistory = (order) => {
    const newEntry = {
      bookingId: order.bookingId,
      consigneeName: order.consigneeName,
      scannedAt: new Date().toISOString(),
      scannedBy: user?.name || 'Unknown',
      weightKg: order.weightKg,
      status: order.status
    };

    const updated = [newEntry, ...scanHistory.slice(0, 9)]; // Keep last 10
    setScanHistory(updated);
    localStorage.setItem('warehouseScanHistory', JSON.stringify(updated));
  };

  const handleScan = async (scannedCode) => {
    setError('');
    setSuccess('');

    // Extract booking ID from QR format if needed
    let bookingId = scannedCode;
    if (scannedCode.includes('|')) {
      const parts = scannedCode.split('|');
      if (parts.length === 2 && parts[0] === 'LLL') {
        bookingId = parts[1];
      }
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/orders/${bookingId}/scan-preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ORDER_NOT_FOUND') {
          setError(`Order "${bookingId}" not found. Please check the booking ID.`);
        } else if (data.code === 'INVALID_STATUS') {
          setError(`Cannot scan order: ${data.message}`);
        } else {
          setError(data.message || 'Failed to fetch order details');
        }
        return;
      }

      if (data.success) {
        const order = data.data.order;
        setSelectedOrder(order);
        setWeightInput(order.weightKg.toString());
        setOverrideWeight(false);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error scanning order:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmScan = async () => {
    if (!selectedOrder) return;

    try {
      setProcessing(true);
      setError('');

      const requestBody = {};

      // Only include weight if overriding
      if (overrideWeight && weightInput !== selectedOrder.weightKg.toString()) {
        const weight = parseFloat(weightInput);
        if (isNaN(weight) || weight <= 0) {
          setError('Please enter a valid weight greater than 0');
          return;
        }
        if (weight > 50) {
          setError('Weight cannot exceed 50kg');
          return;
        }
        requestBody.scannedWeightKg = weight;
      }

      const response = await fetch(`/api/orders/${selectedOrder.bookingId}/warehouse-scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ORDER_INVOICED') {
          setError('This order has already been invoiced and cannot be modified.');
        } else if (data.code === 'INVALID_WEIGHT') {
          setError(data.message);
        } else {
          setError(data.message || 'Failed to process warehouse scan');
        }
        return;
      }

      if (data.success) {
        const updatedOrder = data.data.order;
        const changes = data.data.changes;

        // Update scan history
        updateScanHistory(updatedOrder);

        // Show success message
        let successMsg = 'Order successfully scanned into warehouse!';
        if (changes.weightChanged) {
          successMsg += ` Weight updated from ${changes.oldWeight}kg to ${changes.newWeight}kg.`;
        }
        if (changes.serviceChargesRecalculated) {
          successMsg += ' Service charges recalculated.';
        }

        setSuccess(successMsg);
        setShowModal(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Error processing scan:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      CREATED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Created' },
      ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
      AT_LLL_WAREHOUSE: { bg: 'bg-green-100', text: 'text-green-800', label: 'At Warehouse' },
      OUT_FOR_DELIVERY: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Out for Delivery' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      RETURNED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Returned' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.CREATED;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Warehouse Scanner</h1>
              <p className="text-gray-600">Scan parcels to mark arrival and verify weight</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-6 h-6 mr-2 text-green-600" />
                Scan Parcel QR Code
              </h2>

              <QRScanner
                onScan={handleScan}
                onError={setError}
                isActive={!showModal}
                showManualInput={true}
              />

              {loading && (
                <div className="mt-6 text-center py-4">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Loading order details...</p>
                </div>
              )}
            </div>
          </div>

          {/* Scan History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Recent Scans
              </h2>

              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scans yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{scan.bookingId}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(scan.scannedAt).split(',')[1]?.trim()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{scan.consigneeName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{scan.weightKg}kg</span>
                        {getStatusBadge(scan.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Package className="w-6 h-6 mr-2 text-green-600" />
                    Confirm Warehouse Scan
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={processing}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
                      <p className="text-lg font-mono font-semibold text-gray-900">{selectedOrder.bookingId}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consignee</label>
                      <p className="text-gray-900">{selectedOrder.consigneeName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <div className="flex items-center text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                        {selectedOrder.destinationCity}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipper</label>
                      <div className="flex items-center text-gray-900">
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        {selectedOrder.shipper?.name || selectedOrder.shipper?.companyName || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      {getStatusBadge(selectedOrder.status)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">COD Amount</label>
                      <div className="flex items-center text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        {formatCurrency(selectedOrder.codAmount)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Charges</label>
                      <div className="flex items-center text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        {formatCurrency(selectedOrder.serviceCharges)}
                      </div>
                    </div>

                    {selectedOrder.assignedRider && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Rider</label>
                        <div className="flex items-center text-gray-900">
                          <Truck className="w-4 h-4 mr-1 text-gray-500" />
                          {selectedOrder.assignedRider.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight Verification Section */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Scale className="w-5 h-5 mr-2 text-green-600" />
                    Weight Verification
                  </h4>

                  {selectedOrder.isInvoiced && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <Info className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          This order is already invoiced. Weight cannot be changed.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Weight: <span className="font-semibold">{selectedOrder.weightKg} kg</span>
                      </label>
                      {selectedOrder.weightSource && (
                        <p className="text-xs text-gray-500">
                          Source: {selectedOrder.weightSource.replace('_', ' ').toLowerCase()}
                          {selectedOrder.weightVerifiedAt && ` • Verified: ${formatDate(selectedOrder.weightVerifiedAt)}`}
                        </p>
                      )}
                    </div>

                    {!selectedOrder.isInvoiced && (
                      <>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="override-weight"
                            checked={overrideWeight}
                            onChange={(e) => setOverrideWeight(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <label htmlFor="override-weight" className="text-sm font-medium text-gray-700">
                            Verify/Override weight at warehouse
                          </label>
                        </div>

                        {overrideWeight && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Actual Weight (kg)
                            </label>
                            <div className="relative">
                              <Scale className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                step="0.1"
                                min="0.1"
                                max="50"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter actual weight"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              This will recalculate service charges based on the new weight
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmScan}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Confirm Scan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseScan;
