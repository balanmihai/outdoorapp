// src/components/Login.tsx
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";

const Login = () => {
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Error initiating login: ", error);
    }
  };

  useEffect(() => {
    const fetchRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          navigate("/"); // Redirect to homepage after successful login
        }
      } catch (error) {
        console.error("Error getting redirect result: ", error);
      }
    };
    fetchRedirectResult();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded"
        onClick={signInWithGoogle}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
