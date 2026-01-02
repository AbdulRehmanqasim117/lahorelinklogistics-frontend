import React, { useEffect, useState } from 'react';
import { Users, Eye, EyeOff } from 'lucide-react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const CeoUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Create form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'SHIPPER',
    companyName: '',
    address: '',
    cnicNumber: '',
    contactNumber: '',
    emergencyContact: '',
    pickupAddress: '',
    bankAccountDetails: '',
    vehicleInfo: '',
    cnic: '', // Generic CNIC field (used for MANAGER)
  });
  const [formErrors, setFormErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  
  // Reset password modal state
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(null);

  const [shippers, setShippers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [shippersRes, ridersRes, managersRes] = await Promise.all([
        fetch('/api/users/shippers', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }),
        fetch('/api/users/riders', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }),
        fetch('/api/users/managers', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }),
      ]);
      const shippersData = await shippersRes.json();
      const ridersData = await ridersRes.json();
      const managersData = await managersRes.json();
      if (!shippersRes.ok) throw new Error(shippersData.message || 'Failed to fetch shippers');
      if (!ridersRes.ok) throw new Error(ridersData.message || 'Failed to fetch riders');
      if (!managersRes.ok) throw new Error(managersData.message || 'Failed to fetch managers');
      setShippers(shippersData);
      setRiders(ridersData);
      setManagers(managersData);
      setUsers([...shippersData, ...ridersData, ...managersData]);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const validateCreateForm = () => {
    const errors = {};
    if (!form.password || form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    
    if (!validateCreateForm()) {
      return;
    }
    
    try {
      const payload = { 
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      };
      if (form.role === 'SHIPPER') {
        Object.assign(payload, {
          companyName: form.companyName,
          address: form.address,
          cnicNumber: form.cnicNumber,
          contactNumber: form.contactNumber,
          emergencyContact: form.emergencyContact,
          pickupAddress: form.pickupAddress,
          bankAccountDetails: form.bankAccountDetails
        });
        if (!form.companyName) throw new Error('Business Name is required for Shipper');
      }
      if (form.role === 'RIDER') {
        Object.assign(payload, { vehicleInfo: form.vehicleInfo });
        if (!form.vehicleInfo) throw new Error('Vehicle Info is required for Rider');
      }
      if (form.role === 'MANAGER') {
        if (!form.cnic) throw new Error('CNIC is required for Manager');
        Object.assign(payload, { cnic: form.cnic });
      }
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: form.role,
        companyName: '',
        address: '',
        cnicNumber: '',
        contactNumber: '',
        emergencyContact: '',
        pickupAddress: '',
        bankAccountDetails: '',
        vehicleInfo: '',
        cnic: '',
      });
      setFormErrors({});
      setOpen(false);
      await fetchUsers();
    } catch (e) { setError(e.message); }
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
        message: 'Password updated successfully',
        password: data.password // Password shown once for CEO to copy
      });
    } catch (e) {
      setResetPasswordErrors({ submit: e.message });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      await fetchUsers();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-secondary">Users</h3>
          </div>
          <Button onClick={() => setOpen(true)}>Create User</Button>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">{error}</div>}
      
      {/* Shippers Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-secondary mb-4">Shippers</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : shippers.length === 0 ? (
          <p className="text-sm text-gray-500">No shippers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-4">Shipper Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total COD</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippers.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser({ ...s, __type: 'SHIPPER' })}
                  >
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4">{s.email}</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          s.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(
                            s._id,
                            s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                          );
                        }}
                      >
                        {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Managers Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-secondary mb-4">Managers</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : managers.length === 0 ? (
          <p className="text-sm text-gray-500">No managers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-4">Manager Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managers.map((m) => (
                  <tr
                    key={m._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser({ ...m, __type: 'MANAGER' })}
                  >
                    <td className="py-3 px-4 font-medium">{m.name}</td>
                    <td className="py-3 px-4">{m.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          m.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(
                              m._id,
                              m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            );
                          }}
                        >
                          {m.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetPasswordModal(m);
                            setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                            setResetPasswordErrors({});
                            setResetPasswordSuccess(null);
                          }}
                        >
                          Reset Password
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

      {/* Riders Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-secondary mb-4">Riders</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : riders.length === 0 ? (
          <p className="text-sm text-gray-500">No riders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-4">Rider Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Orders</th>
                  <th className="py-3 px-4">COD Collected</th>
                  <th className="py-3 px-4">Service Charges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riders.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser({ ...r, __type: 'RIDER' })}
                  >
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">{r.email}</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          r.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(
                              r._id,
                              r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                            );
                          }}
                        >
                          {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetPasswordModal(r);
                            setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                            setResetPasswordErrors({});
                            setResetPasswordSuccess(null);
                          }}
                        >
                          Reset Password
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => {
            setResetPasswordModal(null);
            setResetPasswordForm({ newPassword: '', confirmPassword: '' });
            setResetPasswordErrors({});
            setResetPasswordSuccess(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">Reset Password</h3>
              <button onClick={() => {
                setResetPasswordModal(null);
                setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                setResetPasswordErrors({});
                setResetPasswordSuccess(null);
              }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Reset password for <span className="font-semibold">{resetPasswordModal.name}</span> ({resetPasswordModal.email})
                </p>
              </div>
              
              {resetPasswordSuccess ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    <p className="font-semibold mb-2">{resetPasswordSuccess.message}</p>
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">New Password (copy this):</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={resetPasswordSuccess.password}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(resetPasswordSuccess.password);
                            alert('Password copied to clipboard!');
                          }}
                          className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover"
                        >
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

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary">
                {selectedUser.__type === 'SHIPPER'
                  ? 'Shipper Details'
                  : selectedUser.__type === 'RIDER'
                    ? 'Rider Details'
                    : selectedUser.__type === 'MANAGER'
                      ? 'Manager Details'
                      : 'User Details'}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-semibold">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Role</label>
                  <p className="text-sm">{selectedUser.role || selectedUser.__type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{selectedUser.phone || selectedUser.contactNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <p className="text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedUser.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </p>
                </div>

                {selectedUser.__type === 'SHIPPER' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Business Name</label>
                      <p className="text-sm">{selectedUser.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">CNIC</label>
                      <p className="text-sm">{selectedUser.cnicNumber || selectedUser.cnic || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Contact Number</label>
                      <p className="text-sm">{selectedUser.contactNumber || selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Emergency Contact</label>
                      <p className="text-sm">{selectedUser.emergencyContact || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Pickup Address</label>
                      <p className="text-sm">{selectedUser.pickupAddress || selectedUser.address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Bank Name</label>
                      <p className="text-sm">{selectedUser.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Account Holder Name</label>
                      <p className="text-sm">{selectedUser.accountHolderName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Account Number</label>
                      <p className="text-sm">{selectedUser.accountNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">IBAN</label>
                      <p className="text-sm">{selectedUser.iban || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Legacy Bank Details</label>
                      <p className="text-sm">{selectedUser.bankAccountDetails || 'N/A'}</p>
                    </div>
                  </>
                )}

                {selectedUser.__type === 'RIDER' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Vehicle Info</label>
                      <p className="text-sm">{selectedUser.vehicleInfo || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">CNIC</label>
                      <p className="text-sm">{selectedUser.cnic || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Assigned Orders</label>
                      <p className="text-sm font-semibold">{selectedUser.assignedOrders ?? '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">COD Collected</label>
                      <p className="text-sm font-semibold">{selectedUser.codCollected ?? '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Service Charges</label>
                      <p className="text-sm font-semibold">{selectedUser.serviceCharges ?? '—'}</p>
                    </div>
                  </>
                )}

                {selectedUser.__type === 'MANAGER' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedUser.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{selectedUser.phone || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e)=>e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-secondary">Create User</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={(e)=>{createUser(e);}} className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Input label="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
                <Input label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
                <Input label="Phone" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
                <div>
                  <Input 
                    label="Password" 
                    type={showCreatePassword ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={(e)=>setForm({...form,password:e.target.value})} 
                    required 
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                      >
                        {showCreatePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                  {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
                </div>
                <div>
                  <Input 
                    label="Confirm Password" 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} 
                    required 
                  />
                  {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
                    <option value="SHIPPER">Shipper</option>
                    <option value="RIDER">Rider</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                {form.role === 'SHIPPER' && (
                  <div className="space-y-3">
                    <Input label="Business Name" value={form.companyName} onChange={(e)=>setForm({...form,companyName:e.target.value})} required />
                    <Input label="CNIC Number" value={form.cnicNumber} onChange={(e)=>setForm({...form,cnicNumber:e.target.value})} />
                    <Input label="Contact Number" value={form.contactNumber} onChange={(e)=>setForm({...form,contactNumber:e.target.value})} />
                    <Input label="Emergency Contact" value={form.emergencyContact} onChange={(e)=>setForm({...form,emergencyContact:e.target.value})} />
                    <Input label="Pickup Address" value={form.pickupAddress} onChange={(e)=>setForm({...form,pickupAddress:e.target.value})} />
                    <Input label="Bank Account Details" value={form.bankAccountDetails} onChange={(e)=>setForm({...form,bankAccountDetails:e.target.value})} />
                    <Input label="Business Address" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} />
                  </div>
                )}
                {form.role === 'RIDER' && (
                  <Input label="Vehicle Info" value={form.vehicleInfo} onChange={(e)=>setForm({...form,vehicleInfo:e.target.value})} required />
                )}
                {form.role === 'MANAGER' && (
                  <Input
                    label="CNIC"
                    value={form.cnic}
                    onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                    required
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600" onClick={()=>setOpen(false)}>Cancel</button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default CeoUsers;
