import React, { useState, useEffect } from 'react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';

// Countdown timer component
const CountdownTimer = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="text-sm text-gray-500 mt-2">
      Code expires in: <span className="font-medium">{formatTime(timeLeft)}</span>
    </div>
  );
};

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Verify Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  // Handle email submission to request verification code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      // In development, show the code for testing
      if (process.env.NODE_ENV !== 'production' && data.verificationCode) {
        console.log('Verification code for testing:', data.verificationCode);
      }
      
      setStatus({ ok: true, message: 'Verification code sent to your email' });
      setStep(2);
      setCountdownActive(true);
    } catch (err) {
      setStatus({ ok: false, message: err.message || 'Failed to send verification code' });
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }
      
      setResetToken(data.resetToken);
      setStatus({ ok: true, message: 'Code verified. Please set a new password.' });
      setStep(3);
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle new password submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus({ ok: false, message: 'Passwords do not match' });
      return;
    }
    
    if (password.length < 6) {
      setStatus({ ok: false, message: 'Password must be at least 6 characters' });
      return;
    }
    
    setStatus(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetToken,
          password,
          confirmPassword 
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      setStatus({ 
        ok: true, 
        message: 'Password reset successfully! Redirecting to login...' 
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = () => {
    setStatus(null);
    setCode('');
    handleEmailSubmit(new Event('submit'));
  };

  // Render step 1: Email input
  const renderEmailStep = () => (
    <>
      <h2 className="text-2xl font-bold mb-4">Reset your password</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter the email address associated with your account and we'll send you a verification code.
      </p>
      
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <Input 
          label="Email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter your email address"
          required 
        />
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading}
          className="mt-4"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </Button>
      </form>
    </>
  );

  // Render step 2: Verification code input
  const renderVerificationStep = () => (
    <>
      <h2 className="text-2xl font-bold mb-4">Enter Verification Code</h2>
      <p className="text-sm text-gray-500 mb-4">
        We've sent a 6-digit code to <span className="font-medium">{email}</span>.
        Please enter it below to verify your identity.
      </p>
      
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            required
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200"
          />
        </div>
        
        {countdownActive && (
          <CountdownTimer 
            seconds={600} // 10 minutes
            onComplete={() => setCountdownActive(false)}
          />
        )}
        
        <div className="flex justify-between items-center mt-2">
          <button 
            type="button" 
            onClick={handleResendCode}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            disabled={countdownActive || loading}
          >
            Resend Code
          </button>
          
          {!countdownActive && (
            <span className="text-sm text-gray-500">
              Didn't receive a code? Try again
            </span>
          )}
        </div>
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading || code.length !== 6}
          className="mt-4"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>
      </form>
    </>
  );

  // Render step 3: New password input
  const renderNewPasswordStep = () => (
    <>
      <h2 className="text-2xl font-bold mb-4">Create New Password</h2>
      <p className="text-sm text-gray-500 mb-4">
        Please create a new password for your account.
      </p>
      
      <form onSubmit={handleResetPassword} className="space-y-4">
        <Input 
          label="New Password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
          minLength={6}
        />
        
        <Input 
          label="Confirm New Password" 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength={6}
        />
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading || !password || password !== confirmPassword}
          className="mt-4"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        {/* Status Message */}
        {status && (
          <div 
            className={`p-3 mb-6 rounded-lg text-sm ${
              status.ok 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            {status.message}
          </div>
        )}
        
        {/* Back button */}
        {step > 1 && step < 3 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        )}
        
        {/* Current Step */}
        {step === 1 && renderEmailStep()}
        {step === 2 && renderVerificationStep()}
        {step === 3 && renderNewPasswordStep()}
      </div>
    </div>
  );
};

export default ForgotPassword;
