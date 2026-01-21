import React, { useState } from 'react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignupShipper = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    businessAddress: '',
    cnicNumber: '',
    contactNumber: '',
    emergencyContact: '',
    pickupAddress: '',
    accountType: '',
    accountHolderName: '',
    accountNumber: '',
    iban: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.companyName.trim()) errors.companyName = 'Business name is required';
    if (!formData.businessAddress.trim()) errors.businessAddress = 'Address is required';
    if (!formData.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
    if (!formData.accountType.trim()) errors.accountType = 'Account type is required';
    if (!formData.accountHolderName.trim()) errors.accountHolderName = 'Account holder name is required';
    if (!formData.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...userData,
          role: 'SHIPPER',
          accountType: formData.accountType
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-2xl font-bold text-secondary mb-6">Sign up as Shipper</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Input 
              label="Name" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              error={formErrors.name}
              required 
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>
          
          <div>
            <Input 
              label="Email" 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              error={formErrors.email}
              required 
            />
            {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
          </div>
          
          <div>
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              error={formErrors.password}
              required 
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
          </div>
          
          <div>
            <Input 
              label="Confirm Password" 
              type={showConfirmPassword ? 'text' : 'password'} 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              error={formErrors.confirmPassword}
              required 
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>}
          </div>
          
          <div>
            <Input 
              label="Business Name" 
              name="companyName"
              value={formData.companyName} 
              onChange={handleChange} 
              error={formErrors.companyName}
              required 
            />
            {formErrors.companyName && <p className="mt-1 text-sm text-red-500">{formErrors.companyName}</p>}
          </div>

          <div>
            <Input
              label="Business Address"
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              error={formErrors.businessAddress}
              required
            />
            {formErrors.businessAddress && <p className="mt-1 text-sm text-red-500">{formErrors.businessAddress}</p>}
          </div>
          
          <div>
            <Input 
              label="CNIC Number" 
              name="cnicNumber"
              value={formData.cnicNumber} 
              onChange={handleChange} 
              placeholder="#####-#######-#"
              error={formErrors.cnicNumber}
            />
            {formErrors.cnicNumber && <p className="mt-1 text-sm text-red-500">{formErrors.cnicNumber}</p>}
          </div>
          
          <div>
            <Input 
              label="Contact Number" 
              name="contactNumber"
              value={formData.contactNumber} 
              onChange={handleChange} 
              placeholder="03XXXXXXXXX"
              error={formErrors.contactNumber}
              required
            />
            {formErrors.contactNumber && <p className="mt-1 text-sm text-red-500">{formErrors.contactNumber}</p>}
          </div>
          
          <div>
            <Input 
              label="Emergency Contact" 
              name="emergencyContact"
              value={formData.emergencyContact} 
              onChange={handleChange} 
              error={formErrors.emergencyContact}
            />
            {formErrors.emergencyContact && <p className="mt-1 text-sm text-red-500">{formErrors.emergencyContact}</p>}
          </div>
          
          <div>
            <Input 
              label="Pickup Address" 
              name="pickupAddress"
              value={formData.pickupAddress} 
              onChange={handleChange} 
              error={formErrors.pickupAddress}
            />
            {formErrors.pickupAddress && <p className="mt-1 text-sm text-red-500">{formErrors.pickupAddress}</p>}
          </div>

          <div>
            <Input
              label="Bank Name"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              placeholder="e.g. Meezan Current, Easypaisa, JazzCash"
              error={formErrors.accountType}
              required
            />
            {formErrors.accountType && (
              <p className="mt-1 text-sm text-red-500">{formErrors.accountType}</p>
            )}
          </div>

          <div>
            <Input 
              label="Account Holder Name" 
              name="accountHolderName"
              value={formData.accountHolderName} 
              onChange={handleChange} 
              error={formErrors.accountHolderName}
              required
            />
            {formErrors.accountHolderName && <p className="mt-1 text-sm text-red-500">{formErrors.accountHolderName}</p>}
          </div>

          <div>
            <Input 
              label="Account Number" 
              name="accountNumber"
              value={formData.accountNumber} 
              onChange={handleChange} 
              error={formErrors.accountNumber}
              required
            />
            {formErrors.accountNumber && <p className="mt-1 text-sm text-red-500">{formErrors.accountNumber}</p>}
          </div>

          <div>
            <Input 
              label="IBAN (optional)" 
              name="iban"
              value={formData.iban} 
              onChange={handleChange} 
              error={formErrors.iban}
            />
            {formErrors.iban && <p className="mt-1 text-sm text-red-500">{formErrors.iban}</p>}
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            className="mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignupShipper;
