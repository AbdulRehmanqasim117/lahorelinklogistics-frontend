// Utility functions for handling authentication state

export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Returns true if token exists
};

export const getToken = () => {
  // First check for token in localStorage (for backward compatibility)
  const token = localStorage.getItem('token');
  if (token) return token;
  
  // If not in localStorage, check cookies (handled automatically by browser)
  // The actual cookie is httpOnly and handled by the browser
  // This is just a check if we have a token in our state
  return null;
};

export const getUserRole = () => {
  return localStorage.getItem('role');
};

export const getUserInfo = () => {
  return {
    name: localStorage.getItem('name') || '',
    companyName: localStorage.getItem('companyName') || '',
    email: localStorage.getItem('email') || '',
    role: localStorage.getItem('role') || '',
    phone: localStorage.getItem('phone') || '',
    contactNumber: localStorage.getItem('contactNumber') || '',
    emergencyContact: localStorage.getItem('emergencyContact') || '',
    pickupAddress: localStorage.getItem('pickupAddress') || '',
    cnic: localStorage.getItem('cnic') || '',
    bankName: localStorage.getItem('bankName') || '',
    accountType: localStorage.getItem('accountType') || '',
    accountHolderName: localStorage.getItem('accountHolderName') || '',
    accountNumber: localStorage.getItem('accountNumber') || '',
    iban: localStorage.getItem('iban') || '',
    bankAccountDetails: localStorage.getItem('bankAccountDetails') || '',
    vehicleType: localStorage.getItem('vehicleType') || '',
    vehicleNumber: localStorage.getItem('vehicleNumber') || '',
    vehicleModel: localStorage.getItem('vehicleModel') || '',
    portalActive: localStorage.getItem('portalActive') !== null
      ? localStorage.getItem('portalActive') === 'true'
      : null,
    weightBracketsCount: localStorage.getItem('weightBracketsCount') !== null
      ? Number(localStorage.getItem('weightBracketsCount'))
      : null,
    commissionRate: localStorage.getItem('commissionRate') !== null
      ? Number(localStorage.getItem('commissionRate'))
      : null,
    commissionType: localStorage.getItem('commissionType') || null,
    commissionValue: localStorage.getItem('commissionValue') !== null
      ? Number(localStorage.getItem('commissionValue'))
      : null,
    commissionStatus: localStorage.getItem('commissionStatus') || null,
    isCommissionApproved: localStorage.getItem('isCommissionApproved') !== null
      ? localStorage.getItem('isCommissionApproved') === 'true'
      : null
  };
};

export const setAuth = (data) => {
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  if (data.role) {
    localStorage.setItem('role', data.role);
  }
  if (data.name) {
    localStorage.setItem('name', data.name);
  }
  if (data.companyName !== undefined) {
    if (!data.companyName) localStorage.removeItem('companyName');
    else localStorage.setItem('companyName', data.companyName);
  }
  if (data.email) {
    localStorage.setItem('email', data.email);
  }
  if (data.id) {
    localStorage.setItem('userId', data.id);
  }

   // Optional profile fields used by finance/invoice flows
   if (data.phone !== undefined) {
     if (!data.phone) localStorage.removeItem('phone');
     else localStorage.setItem('phone', data.phone);
   }
   if (data.contactNumber !== undefined) {
     if (!data.contactNumber) localStorage.removeItem('contactNumber');
     else localStorage.setItem('contactNumber', data.contactNumber);
   }
   if (data.emergencyContact !== undefined) {
     if (!data.emergencyContact) localStorage.removeItem('emergencyContact');
     else localStorage.setItem('emergencyContact', data.emergencyContact);
   }
   if (data.pickupAddress !== undefined) {
     if (!data.pickupAddress) localStorage.removeItem('pickupAddress');
     else localStorage.setItem('pickupAddress', data.pickupAddress);
   }
   if (data.cnic !== undefined) {
     if (!data.cnic) localStorage.removeItem('cnic');
     else localStorage.setItem('cnic', data.cnic);
   }
   if (data.bankName !== undefined) {
     if (!data.bankName) localStorage.removeItem('bankName');
     else localStorage.setItem('bankName', data.bankName);
   }
   if (data.accountType !== undefined) {
     if (!data.accountType) localStorage.removeItem('accountType');
     else localStorage.setItem('accountType', data.accountType);
   }
   if (data.accountHolderName !== undefined) {
     if (!data.accountHolderName) localStorage.removeItem('accountHolderName');
     else localStorage.setItem('accountHolderName', data.accountHolderName);
   }
   if (data.accountNumber !== undefined) {
     if (!data.accountNumber) localStorage.removeItem('accountNumber');
     else localStorage.setItem('accountNumber', data.accountNumber);
   }
   if (data.iban !== undefined) {
     if (!data.iban) localStorage.removeItem('iban');
     else localStorage.setItem('iban', data.iban);
   }
   if (data.bankAccountDetails !== undefined) {
     if (!data.bankAccountDetails) localStorage.removeItem('bankAccountDetails');
     else localStorage.setItem('bankAccountDetails', data.bankAccountDetails);
   }
   if (data.vehicleType !== undefined) {
     if (!data.vehicleType) localStorage.removeItem('vehicleType');
     else localStorage.setItem('vehicleType', data.vehicleType);
   }
   if (data.vehicleNumber !== undefined) {
     if (!data.vehicleNumber) localStorage.removeItem('vehicleNumber');
     else localStorage.setItem('vehicleNumber', data.vehicleNumber);
   }
   if (data.vehicleModel !== undefined) {
     if (!data.vehicleModel) localStorage.removeItem('vehicleModel');
     else localStorage.setItem('vehicleModel', data.vehicleModel);
   }

  if (data.portalActive !== undefined) {
    if (data.portalActive === null) localStorage.removeItem('portalActive');
    else localStorage.setItem('portalActive', String(!!data.portalActive));
  }
  if (data.weightBracketsCount !== undefined) {
    if (data.weightBracketsCount === null || data.weightBracketsCount === undefined) {
      localStorage.removeItem('weightBracketsCount');
    } else {
      localStorage.setItem('weightBracketsCount', String(Number(data.weightBracketsCount)));
    }
  }

  if (data.commissionRate !== undefined) {
    if (data.commissionRate === null) localStorage.removeItem('commissionRate');
    else localStorage.setItem('commissionRate', String(data.commissionRate));
  }
  if (data.commissionType !== undefined) {
    if (!data.commissionType) localStorage.removeItem('commissionType');
    else localStorage.setItem('commissionType', String(data.commissionType));
  }
  if (data.commissionValue !== undefined) {
    if (data.commissionValue === null) localStorage.removeItem('commissionValue');
    else localStorage.setItem('commissionValue', String(data.commissionValue));
  }
  if (data.commissionStatus !== undefined) {
    if (!data.commissionStatus) localStorage.removeItem('commissionStatus');
    else localStorage.setItem('commissionStatus', String(data.commissionStatus));
  }
  if (data.isCommissionApproved !== undefined) {
    if (data.isCommissionApproved === null) localStorage.removeItem('isCommissionApproved');
    else localStorage.setItem('isCommissionApproved', String(!!data.isCommissionApproved));
  }
};

export const clearAuth = () => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  localStorage.removeItem('companyName');
  localStorage.removeItem('email');
  localStorage.removeItem('userId');
  localStorage.removeItem('phone');
  localStorage.removeItem('contactNumber');
  localStorage.removeItem('emergencyContact');
  localStorage.removeItem('pickupAddress');
  localStorage.removeItem('cnic');
  localStorage.removeItem('bankName');
  localStorage.removeItem('accountType');
  localStorage.removeItem('accountHolderName');
  localStorage.removeItem('accountNumber');
  localStorage.removeItem('iban');
  localStorage.removeItem('bankAccountDetails');
  localStorage.removeItem('vehicleType');
  localStorage.removeItem('vehicleNumber');
  localStorage.removeItem('vehicleModel');
  localStorage.removeItem('portalActive');
  localStorage.removeItem('weightBracketsCount');
  localStorage.removeItem('commissionRate');
  localStorage.removeItem('commissionType');
  localStorage.removeItem('commissionValue');
  localStorage.removeItem('commissionStatus');
  localStorage.removeItem('isCommissionApproved');
  
  // Call the logout API to clear the httpOnly cookie
  return fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include' // Important for cookies to be sent
  });
};
