
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    // In a real app, you would call an API here.
    // For this demo, we'll just show a success message.
    if (email) {
      setMessage(`A password reset link has been sent to ${email}.`);
      setEmail('');
    }
  };

  return (
    <div className="login-container">
        <div className="login-card">
            {/* Left Side - Image */}
            <div className="forgot-image-section">
                <img src="https://myway.cotgincrm.com/assets/images/forgetpassword.webp" alt="Forgot Password Illustration" className="forgot-image" />
            </div>

            {/* Right Side - Form */}
            <div className="login-form-section">
                <div className="mb-8">
                    <img src="https://www.luminainfotech.in/assets/img/logo.svg" alt="Lumina Infotech" className="h-10 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                        <div className="input-group">
                             <i className="ri-mail-line input-icon"></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@theglobalvisa.in"
                                className="login-input"
                            />
                        </div>
                    </div>
                   
                    {message && <p className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">{message}</p>}
                    
                    <div>
                        <button type="submit" className="login-button">
                           Send Reset Link
                        </button>
                    </div>
                </form>
                 <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center">
                        <i className="ri-arrow-left-line mr-2"></i>
                        Back to Log in
                    </Link>
                </div>
            </div>
        </div>
        <p className="copyright-text">
            2025 © <a href="https://www.luminainfotech.in/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary hover:underline">Lumina Infotech</a>. All Rights Reserved
        </p>
    </div>
  );
};

export default ForgotPasswordPage;
