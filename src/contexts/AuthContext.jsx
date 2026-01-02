import React, { createContext, useState, useEffect, useContext } from 'react';
import { isAuthenticated, clearAuth as clearAuthStorage, setAuth, getToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async (tokenOverride) => {
    const token = tokenOverride || getToken();
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data?.message || `Failed to fetch profile (HTTP ${res.status})`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const u = data?.user;

    // Derive portalActive with proper defaults:
    // - CEO / MANAGER / RIDER: always active unless backend explicitly sends false
    // - SHIPPER: inactive until commission is approved, even if backend omits portalActive
    const role = u?.role;
    const explicitPortalActive =
      typeof u?.portalActive === 'boolean' ? u.portalActive : null;
    const commissionStatus = String(u?.commissionStatus || '').toUpperCase();
    const commissionApprovedFlag = u?.isCommissionApproved === true;

    const derivedPortalActive = (() => {
      if (role === 'SHIPPER') {
        if (explicitPortalActive !== null) return explicitPortalActive;
        const hasApprovedCommission =
          commissionApprovedFlag || commissionStatus === 'APPROVED';
        return hasApprovedCommission;
      }

      // For CEO, MANAGER, RIDER (and any other roles), default to active
      if (explicitPortalActive !== null) return explicitPortalActive;
      return true;
    })();

    const normalized = {
      token,
      id: u?._id || u?.id,
      role,
      name: u?.name,
      email: u?.email,
      companyName: u?.companyName || null,
      // Contact/profile fields used across finance/invoice UIs
      phone: u?.phone || null,
      contactNumber: u?.contactNumber || null,
      emergencyContact: u?.emergencyContact || null,
      pickupAddress: u?.pickupAddress || u?.address || null,
      cnic: u?.cnic || u?.cnicNumber || null,
      // Structured bank fields
      bankName: u?.bankName || null,
      accountHolderName: u?.accountHolderName || null,
      accountNumber: u?.accountNumber || null,
      iban: u?.iban || null,
      bankAccountDetails: u?.bankAccountDetails || null,
      // Rider vehicle details
      vehicleType: u?.vehicleType || null,
      vehicleNumber: u?.vehicleNumber || null,
      vehicleModel: u?.vehicleModel || null,
      portalActive: derivedPortalActive,
      weightBracketsCount:
        u?.weightBracketsCount !== undefined && u?.weightBracketsCount !== null
          ? Number(u.weightBracketsCount)
          : null,
      commissionRate: u?.commissionRate ?? null,
      commissionType: u?.commissionType ?? null,
      commissionValue: u?.commissionValue ?? null,
      commissionStatus,
      isCommissionApproved: u?.isCommissionApproved ?? null,
    };

    setAuth(normalized);
    setUser(normalized);
    return normalized;
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const token = getToken();
          await refreshMe(token);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        try {
          await clearAuthStorage();
        } finally {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async ({ token }) => {
    setAuth({ token });
    return refreshMe(token);
  };

  const logout = async () => {
    try {
      await clearAuthStorage();
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
