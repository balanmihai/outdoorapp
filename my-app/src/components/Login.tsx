// src/components/Login.tsx
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';

const Login = () => {
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');  // Redirect to homepage after login
    } catch (error) {
      console.error("Error logging in: ", error);
    }
  };

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
