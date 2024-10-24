import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import TripList from "./components/TripList";
import CreateTrip from "./components/CreateTrip";
import TripDetail from "./components/TripDetail";
import { googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { FiMenu, FiX } from "react-icons/fi"; // Icons for mobile menu

const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/"); // Redirect to homepage after login
    } catch (error) {
      console.error("Error logging in: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <nav className="p-4 bg-gray-800 text-white flex justify-between items-center shadow-lg">
        {/* Logo and main links */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-2xl font-bold text-white hover:text-gray-300 transition"
          >
            MyTrips
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-4">
            <Link
              to="/create"
              className="text-lg hover:text-gray-300 transition"
            >
              Create
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Auth & Profile Section */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Show user's profile picture */}
              <img
                src={user.photoURL || "https://via.placeholder.com/40"}
                alt={user.displayName || "Unknown User"}
                className="rounded-full w-8 h-8 border-2 border-gray-200"
              />
              <span className="text-sm font-medium">
                Welcome, {user.displayName || "User"}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Links */}
      {menuOpen && (
        <div className="md:hidden bg-gray-700 text-white p-4 flex flex-col gap-4">

          <Link
            to="/create"
            className="hover:text-gray-300"
            onClick={() => setMenuOpen(false)}
          >
            Create
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || "https://via.placeholder.com/40"}
                alt={user.displayName || "Unknown User"}
                className="rounded-full w-8 h-8 border-2 border-gray-200"
              />
              <span>Welcome, {user.displayName || "User"}!</span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}

      <Routes>
        <Route path="/" element={<TripList user={user} />} />
        <Route path="/create" element={<CreateTrip user={user} />} />
        <Route path="/trip/:id" element={<TripDetail user={user} />} />
      </Routes>
    </>
  );
};

export default App;
