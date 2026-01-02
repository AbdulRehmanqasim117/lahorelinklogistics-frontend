import React, { useEffect, useState } from "react";
import { Shield, RefreshCcw, AlertCircle, LogOut } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../src/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ShipperPendingApproval = () => {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(() => {
    if (!user) return null;
    return {
      role: user.role,
      portalActive: user.portalActive ?? null,
      weightBracketsCount: user.weightBracketsCount ?? null,
    };
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError("");
      const fresh = await refreshMe();
      setStatus({
        role: fresh?.role,
        portalActive: fresh?.portalActive,
        weightBracketsCount: fresh?.weightBracketsCount,
      });
    } catch (e) {
      if (e?.status === 401) {
        await logout();
        navigate('/', { replace: true });
        return;
      }
      setError(e.message || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const portalActive = status?.portalActive === true;

  useEffect(() => {
    if (portalActive) {
      navigate('/shipper/dashboard', { replace: true });
    }
  }, [portalActive, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border border-gray-100 shadow-sm rounded-2xl p-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary">Verification in Progress</h1>
            <p className="text-gray-500 text-sm mt-1">
              Your account is under configuration. Please wait until management sets your weight brackets. You will get access once configured.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Portal access</div>
              <div className="font-semibold text-secondary">
                {status ? (portalActive ? 'ACTIVE' : 'PENDING') : '—'}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-600">Weight brackets</div>
              <div className="font-semibold text-secondary">
                {typeof status?.weightBracketsCount === 'number'
                  ? status.weightBracketsCount
                  : '—'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Contact support if this takes longer than expected.
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} disabled={loading} variant="outline">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button onClick={fetchStatus} disabled={loading} variant="outline">
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Status
              </Button>
            </div>
          </div>

          {portalActive && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
              Your portal is now active. Redirecting you to your dashboard...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipperPendingApproval;
