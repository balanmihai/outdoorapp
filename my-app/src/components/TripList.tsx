import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Participant, Trip } from "../types/Trip";
import { Link } from "react-router-dom";
import { Timestamp } from "firebase/firestore";

const TripList: React.FC<{ user: any }> = ({ user }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchTrips = async () => {
      const querySnapshot = await getDocs(collection(db, "trips"));
      const tripsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        // Convert Firestore Timestamps to Date objects
        const startDate = (data.startDate as Timestamp).toDate();
        const endDate = (data.endDate as Timestamp).toDate();

        // Add document ID to the trip object
        return {
          id: doc.id,
          ...data,
          startDate,
          endDate,
        } as Trip;
      });
      setTrips(tripsData);
    };
    fetchTrips();
  }, []);

  const handleJoinTrip = async (tripId: string) => {
    if (!user) return;

    const tripRef = doc(db, "trips", tripId);
    const chatRef = doc(db, "chats", tripId);
    const tripToUpdate = trips.find((trip) => trip.id === tripId);

    if (tripToUpdate) {
      const isAlreadyParticipant = tripToUpdate.participants.some(
        (participant) => participant.name === user.displayName
      );

      if (!isAlreadyParticipant) {
        const newParticipant = {
          name: user.displayName,
          photo: user.photoURL,
        };

        await updateDoc(tripRef, {
          participants: [...tripToUpdate.participants, newParticipant],
        });

        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
          await setDoc(chatRef, {
            participants: [newParticipant],
            messages: [],
          });
        } else {
          await updateDoc(chatRef, {
            participants: [...chatDoc.data()?.participants, newParticipant],
          });
        }

        setTrips((prevTrips) =>
          prevTrips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: [...trip.participants, newParticipant],
                }
              : trip
          )
        );
      }
    }
  };

  const handleUnjoinTrip = async (tripId: string) => {
    if (!user) return;

    const tripRef = doc(db, "trips", tripId);
    const chatRef = doc(db, "chats", tripId);
    const tripToUpdate = trips.find((trip) => trip.id === tripId);

    if (tripToUpdate) {
      const updatedParticipants = tripToUpdate.participants.filter(
        (participant) => participant.name !== user.displayName
      );

      await updateDoc(tripRef, {
        participants: updatedParticipants,
      });

      await updateDoc(chatRef, {
        participants: updatedParticipants,
      });

      setTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === tripId
            ? { ...trip, participants: updatedParticipants }
            : trip
        )
      );
    }
  };

  // Filter trips based on search query
  const filteredTrips = trips.filter((trip) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      trip.tripName.toLowerCase().includes(searchTerm) ||
      trip.startPoint.toLowerCase().includes(searchTerm) ||
      trip.endPoint.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 text-center">
        Aventurierii Pizdi
      </h2>

      {/* Search Bar */}
      <div className="mb-10">
        <input
          type="text"
          className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search for trips by name, start or end point"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {filteredTrips.length > 0 ? (
          filteredTrips.map((trip) => (
            <li
              key={trip.id}
              className="bg-white shadow-xl rounded-lg p-6 flex flex-col"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {trip.tripName}
              </h3>
              <div className="flex items-center mb-5">
                <img
                  src={trip.authorPhoto || "https://via.placeholder.com/40"}
                  alt={trip.authorName}
                  className="rounded-full w-12 h-12 mr-4 border-2 border-gray-300"
                />
                <span className="text-lg font-medium text-gray-700">
                  {trip.authorName}
                </span>
              </div>

              <div className="space-y-2 flex-grow">
                <p className="text-gray-600">
                  <strong className="text-gray-800">Start Point:</strong>{" "}
                  {trip.startPoint}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-800">End Point:</strong>{" "}
                  {trip.endPoint}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-800">Start Date:</strong>{" "}
                  {trip.startDate.toDateString()}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-800">End Date:</strong>{" "}
                  {trip.endDate.toDateString()}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-800">Category:</strong>{" "}
                  {trip.category}
                </p>
                <p className="text-gray-600">
                  <strong className="text-gray-800">Difficulty:</strong>{" "}
                  {trip.difficulty}
                </p>
                <p className="text-gray-600 mb-5">
                  <strong className="text-gray-800">Equipment:</strong>{" "}
                  {trip.equipment.join(", ")}
                </p>
              </div>

              {/* Participants */}
              <div className="mt-6">
                {trip.participants && trip.participants.length > 0 ? (
                  <>
                    <h3 className="font-semibold mb-3">Participants</h3>
                    <ul className="flex -space-x-3 overflow-hidden">
                      {trip.participants.map((participant) => (
                        <li key={participant.name}>
                          <img
                            src={participant.photo}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-gray-600">No Participants</p>
                )}
              </div>

              {/* Join/Unjoin Button */}
              <div className="flex items-center justify-between mt-6">
                {user && (
                  <>
                    {trip.participants.some(
                      (participant) => participant.name === user.displayName
                    ) ? (
                      <button
                        onClick={() => handleUnjoinTrip(trip.id)}
                        className="bg-red-500 text-white py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors"
                      >
                        Unjoin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinTrip(trip.id)}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors"
                      >
                        Join
                      </button>
                    )}
                  </>
                )}

                <Link
                  to={`/trip/${trip.id}`}
                  className="text-blue-500 hover:underline font-semibold text-center"
                >
                  View Details
                </Link>
              </div>
            </li>
          ))
        ) : (
          <p className="text-center text-gray-600">No trips found.</p>
        )}
      </ul>
    </div>
  );
};

export default TripList;
