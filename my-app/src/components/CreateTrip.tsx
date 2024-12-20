import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

const categories = ["Marked Trail", "Unmarked Trail", "Trail Run", "Alpinism"];
const difficulties = ["Easy", "Moderate", "Hard", "Extreme"];
const routes = ["Return", "Circuit"];

interface CreateTripProps {
  user: any;
}

const CreateTrip = ({ user }: CreateTripProps) => {
  const [tripName, setTripName] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState(difficulties[0]);
  const [routeType, setRouteType] = useState(routes[0]);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [backgroundPhoto, setBackgroundPhoto] = useState<File | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState("");
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/"); // Redirect to homepage after login
    } catch (error) {
      console.error("Error logging in: ", error);
    }
  };

  const handleAddEquipment = () => {
    if (equipmentInput) {
      setEquipment([...equipment, equipmentInput]);
      setEquipmentInput(""); // Clear the input field
    }
  };

  const handleRemoveEquipment = (item: string) => {
    setEquipment(equipment.filter((eq) => eq !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure that startDate and endDate are valid dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Please enter valid start and end dates.");
      return;
    }

    // Create a new trip object
    const newTrip = {
      tripName,
      startPoint,
      endPoint,
      startDate: start,
      endDate: end,
      category,
      difficulty,
      routeType,
      description,
      equipment,
      author: {
        uid: user.uid,
        displayName: user.displayName,
      },
      authorName: user.displayName,
      authorPhoto: user.photoURL,
      participants: [], // Initialize participants as an empty array
      createdAt: new Date(),
      // Upload photos and backgroundPhoto to storage and save URLs in Firestore
    };

    try {
      // Add the new trip to the 'trips' collection in Firestore
      await addDoc(collection(db, "trips"), newTrip);

      alert("Trip created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return user ? (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Create a New Trip
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Trip Name */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Trip Name
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="Enter trip name"
            required
          />
        </div>

        {/* Start and End Points */}
        <div className="flex gap-2">
          <div className="mb-6 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Start Point
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              placeholder="Enter start point"
              required
            />
          </div>

          <div className="mb-6 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              End Point
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={endPoint}
              onChange={(e) => setEndPoint(e.target.value)}
              placeholder="Enter end point"
              required
            />
          </div>
        </div>

        {/* Start and End Dates */}
        <div className="flex gap-2">
          <div className="mb-6 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-6 w-full">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter trip description (optional)"
          />
        </div>

        {/* Photos */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Photos (optional)
          </label>
          <input
            type="file"
            multiple
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={(e) => setPhotos(e.target.files)}
          />
        </div>

        {/* Background Photo */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Background Photo (optional)
          </label>
          <input
            type="file"
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={(e) => setBackgroundPhoto(e.target.files?.[0] || null)}
          />
        </div>

        {/* Route Type */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Route Type
          </label>
          <div className="flex space-x-4">
            {routes.map((route) => (
              <label key={route} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="route"
                  value={route}
                  checked={routeType === route}
                  onChange={(e) => setRouteType(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-blue-400"
                />
                <span>{route}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="flex space-x-4">
            {difficulties.map((level) => (
              <label key={level} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={(e) => setDifficulty(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-blue-400"
                />
                <span>{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            Equipment (optional)
          </label>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              placeholder="Add equipment"
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              onClick={handleAddEquipment}
            >
              Add
            </button>
          </div>

          {equipment.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {equipment.map((item, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{item}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:underline"
                    onClick={() => handleRemoveEquipment(item)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
        >
          Create Trip
        </button>
      </form>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg font-semibold mb-4">
        You must be logged in to create a trip.
      </p>
      <button
        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 transition"
        onClick={signInWithGoogle}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default CreateTrip;
