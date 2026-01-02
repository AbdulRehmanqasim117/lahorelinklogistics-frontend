import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) setStatus({ ok: false, message: 'Missing token. Use the link from your email.' });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (password.length < 6) return setStatus({ ok: false, message: 'Password too short (min 6 chars)' });
    if (password !== confirm) return setStatus({ ok: false, message: 'Passwords do not match' });
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setStatus({ ok: true, message: 'Password reset successfully. Redirecting to login...' });
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Choose a new password</h2>
        {status && (
          <div className={`p-3 mb-4 rounded ${status.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.message}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" fullWidth disabled={loading || !token}>{loading ? 'Resetting...' : 'Reset password'}</Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
