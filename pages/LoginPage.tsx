
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';

const sliderData = [
    {
        image: 'https://myway.cotgincrm.com/assets/images/signin1.webp',
        title: 'Explore Global Opportunities',
        description: 'Efficiently manage your travel leads from all around the world with our powerful CRM.'
    },
    {
        image: 'https://myway.cotgincrm.com/assets/images/signin2.webp',
        title: 'Achieve Growth Together',
        description: 'Collaborate with your team seamlessly and make data-driven decisions to scale your agency.'
    }
];


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@luminacrm.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { login, companyDetails } = useCrm();

  useEffect(() => {
    const slideInterval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliderData.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(slideInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        const success = await login(email, password);
        if (success) {
          navigate('/', { replace: true });
        } else {
          setError('Invalid username or password. Please try again.');
        }
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
        <div className="login-card">
            {/* Left Side - Slider */}
            <div className="login-slider-section">
                 <div className="slider-content">
                    <div className="slider-image-container">
                        {sliderData.map((slide, index) => (
                            <img
                                key={index}
                                src={slide.image}
                                alt={slide.title}
                                className={`slider-image ${currentSlide === index ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                     <div className="slider-text-content">
                        {sliderData.map((slide, index) => (
                            <div key={index} className={`slider-text ${currentSlide === index ? 'active' : ''}`}>
                                <h2 className="text-xl font-semibold text-gray-800 mt-6 text-center">{slide.title}</h2>
                                <p className="text-gray-600 text-center mt-2 px-4">{slide.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="slider-dots">
                    {sliderData.map((_, index) => (
                        <button key={index} onClick={() => setCurrentSlide(index)} className={`dot ${currentSlide === index ? 'active' : ''}`}></button>
                    ))}
                </div>
            </div>
            
            {/* Right Side - Form */}
            <div className="login-form-section">
                <div className="mb-8">
                    <img src={companyDetails.logoUrl || "https://www.luminainfotech.com/assets/img/logo.svg"} alt={companyDetails.companyName} className="h-10 mb-4 rounded-md" />
                    <h1 className="text-3xl font-bold text-gray-800">Login</h1>
                    <p className="text-gray-500 mt-2">Welcome back! Please enter your details.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Enter Your Username or Email</label>
                        <div className="input-group">
                             <i className="ri-mail-line input-icon"></i>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="login-input"
                                placeholder="Username or email"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Enter Password</label>
                        <div className="input-group">
                           <i className="ri-lock-line input-icon"></i>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="login-input"
                                placeholder="Your password"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="password-toggle"
                                tabIndex={-1}
                            >
                                <i className={`ri-${showPassword ? 'eye-off-line' : 'eye-line'}`}></i>
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        {/* Fix: Link component does not support disabled prop. Disabling functionality is now handled via CSS classes. */}
                        <Link 
                            to="/forgot-password" 
                            className={`text-sm text-primary hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                        >
                            Forgot Password?
                        </Link>
                    </div>
                     {error && (
                         <div className="p-3 bg-red-50 border border-red-100 rounded-md animate-shake">
                            <p className="text-xs text-red-600 font-medium text-center flex items-center justify-center gap-2">
                                <i className="ri-error-warning-line"></i> {error}
                            </p>
                         </div>
                     )}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="login-button disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin"></i>
                                    Logging in...
                                </>
                            ) : 'Log in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
         <p className="copyright-text text-center mt-8 text-sm text-gray-500">
            {new Date().getFullYear()} © <a href="https://www.luminainfotech.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary hover:underline">Lumina Infotech</a>. All Rights Reserved
        </p>
        <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            .animate-shake {
                animation: shake 0.4s ease-in-out 0s 1;
            }
        `}</style>
    </div>
  );
};

export default LoginPage;
