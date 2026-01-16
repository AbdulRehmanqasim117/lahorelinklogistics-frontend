import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Phone, User, Search, Copy, CheckCircle, XCircle, RefreshCw, Key, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * CEO Riders Management Page
 * Full access to rider information including password management
 */
const CeoRiders = () => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Reset password modal state
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState('');

  // Selected rider detail modal
  const [selectedRider, setSelectedRider] = useState(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    filterRiders();
  }, [riders, searchTerm, statusFilter]);

  const fetchRiders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/riders', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch riders');
      setRiders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadDailyReport = async (riderId, riderName) => {
    if (!token || !riderId) return;
    try {
      const res = await fetch(`/api/riders/${riderId}/daily-report?date=${reportDate}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      if (!res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch (_) {}
        throw new Error((data && data.message) || 'Failed to download report');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rider-${riderName || riderId}-${reportDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e.message || 'Failed to download report');
    }
  };

  const filterRiders = () => {
    let filtered = [...riders];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.phone?.toLowerCase().includes(term)
      );
    }

    setFilteredRiders(filtered);
  };

  const validateResetPasswordForm = () => {
    const errors = {};
    if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (!resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setResetPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPasswordErrors({});
    setResetPasswordSuccess(null);
    setCopiedPassword('');

    if (!validateResetPasswordForm()) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${resetPasswordModal._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ newPassword: resetPasswordForm.newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      setResetPasswordSuccess({
        message: 'Password updated successfully!',
        password: data.password,
        isTemporary: data.isTemporary
      });
      setCopiedPassword(data.password);
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (e) {
      setResetPasswordErrors({ submit: e.message });
    }
  };

  const handleGenerateTemporaryPassword = async (rider) => {
    try {
      const res = await fetch(`/api/users/${rider._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({}) // Empty body = generate temporary
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate password');

      setResetPasswordModal(rider);
      setResetPasswordSuccess({
        message: 'Temporary password generated successfully!',
        password: data.password,
        isTemporary: true
      });
      setCopiedPassword(data.password);
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (e) {
      setResetPasswordErrors({ submit: e.message });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Password copied to clipboard!');
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      await fetchRiders();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary">Riders Management</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Report Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : filteredRiders.length === 0 ? (
          <p className="text-sm text-gray-500">No riders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-4">Rider Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Assigned Orders</th>
                  <th className="py-3 px-4">COD Collected</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRiders.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {r.email || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {r.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">{r.assignedOrders || 0}</td>
                    <td className="py-3 px-4">PKR {Number(r.codCollected || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                          onClick={() => updateStatus(r._id, r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        >
                          {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1"
                          onClick={() => {
                            setResetPasswordModal(r);
                            setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                            setResetPasswordErrors({});
                            setResetPasswordSuccess(null);
                            setCopiedPassword('');
                          }}
                        >
                          <Key className="w-3 h-3" />
                          Reset Password
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-green-200 text-green-600 rounded hover:bg-green-50 flex items-center gap-1"
                          onClick={() => handleGenerateTemporaryPassword(r)}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Generate Temp
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-purple-200 text-purple-600 rounded hover:bg-purple-50"
                          onClick={() => setSelectedRider(r)}
                        >
                          <User className="w-3 h-3 inline" /> Details
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-purple-200 text-purple-600 rounded hover:bg-purple-50"
                          onClick={() => navigate(`/ceo/riders/${r._id}/settlements`, { state: { rider: r } })}
                        >
                          Settlements
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1"
                          onClick={() => downloadDailyReport(r._id, r.name)}
                        >
                          <Download className="w-3 h-3" />
                          Report
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

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => {
          setResetPasswordModal(null);
          setResetPasswordForm({ newPassword: '', confirmPassword: '' });
          setResetPasswordErrors({});
          setResetPasswordSuccess(null);
          setCopiedPassword('');
        }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Reset Password for {resetPasswordModal.name}</h3>
              <button onClick={() => {
                setResetPasswordModal(null);
                setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                setResetPasswordErrors({});
                setResetPasswordSuccess(null);
                setCopiedPassword('');
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetPasswordSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    <p className="font-semibold mb-2">{resetPasswordSuccess.message}</p>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {resetPasswordSuccess.isTemporary ? 'Temporary Password (copy this):' : 'New Password (copy this):'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={resetPasswordSuccess.password}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(resetPasswordSuccess.password)}
                          className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-1"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordModal(null);
                        setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                        setResetPasswordErrors({});
                        setResetPasswordSuccess(null);
                        setCopiedPassword('');
                      }}
                      className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {resetPasswordErrors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                      {resetPasswordErrors.submit}
                    </div>
                  )}
                  <div>
                    <Input 
                      label="New Password" 
                      type="password" 
                      value={resetPasswordForm.newPassword} 
                      onChange={(e)=>setResetPasswordForm({...resetPasswordForm,newPassword:e.target.value})} 
                      required 
                    />
                    {resetPasswordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">{resetPasswordErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <Input 
                      label="Confirm Password" 
                      type="password" 
                      value={resetPasswordForm.confirmPassword} 
                      onChange={(e)=>setResetPasswordForm({...resetPasswordForm,confirmPassword:e.target.value})} 
                      required 
                    />
                    {resetPasswordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{resetPasswordErrors.confirmPassword}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600" 
                      onClick={() => {
                        setResetPasswordModal(null);
                        setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                        setResetPasswordErrors({});
                        setResetPasswordSuccess(null);
                        setCopiedPassword('');
                      }}
                    >
                      Cancel
                    </button>
                    <Button type="submit">Reset Password</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Rider Detail Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedRider(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Rider Details</h3>
              <button onClick={() => setSelectedRider(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-semibold">{selectedRider.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm">{selectedRider.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{selectedRider.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedRider.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedRider.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Vehicle Info</label>
                  <p className="text-sm">{selectedRider.vehicleInfo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Assigned Orders</label>
                  <p className="text-sm font-semibold">{selectedRider.assignedOrders || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">COD Collected</label>
                  <p className="text-sm font-semibold">PKR {Number(selectedRider.codCollected || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Service Charges</label>
                  <p className="text-sm font-semibold">PKR {Number(selectedRider.serviceCharges || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedRider(null)}
                  className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeoRiders;

