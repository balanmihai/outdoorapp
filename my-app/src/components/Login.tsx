import React, { useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  browserPopupRedirectResolver,
  browserLocalPersistence
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set persistence to LOCAL to maintain the session
    auth.setPersistence(browserLocalPersistence);

    // Check for redirect result on component mount
    const checkRedirect = async () => {
      try {
        setIsLoading(true);
        const result = await getRedirectResult(auth, browserPopupRedirectResolver);
        if (result?.user) {
          navigate("/");
        }
      } catch (err) {
        console.error("Redirect error:", err);
        setError("Failed to complete sign-in. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkRedirect();
  }, [navigate]);

  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Check if the device is mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use redirect method for mobile devices
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Use popup for desktop devices
        const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
        if (result?.user) {
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome Back
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={signInWithGoogle}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-6 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;
