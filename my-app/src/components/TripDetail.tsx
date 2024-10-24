import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Trip } from "../types/Trip";
import { Timestamp } from "firebase/firestore";
import Modal from "react-modal";

Modal.setAppElement("#root");

const TripDetail: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrip = async () => {
      if (id) {
        const tripDoc = await getDoc(doc(db, "trips", id));
        if (tripDoc.exists()) {
          const data = tripDoc.data();
          const startDate = (data.startDate as Timestamp).toDate();
          const endDate = (data.endDate as Timestamp).toDate();
          const participants = data.participants || [];

          setTrip({
            id: tripDoc.id,
            ...data,
            startDate,
            endDate,
            participants,
            chatId: data.chatId || null,
          } as Trip);
        } else {
          console.error("Trip not found");
        }
      }
    };

    fetchTrip();
  }, [id]);

  // Real-time listeners for participants and chat
  useEffect(() => {
    if (id) {
      const tripRef = doc(db, "trips", id);
      const unsubscribe = onSnapshot(tripRef, (docSnap) => {
        const updatedTrip = docSnap.data();
        if (updatedTrip) {
          setTrip((prevTrip) => {
            if (!prevTrip) return null;
            return {
              ...prevTrip,
              participants: updatedTrip.participants || [],
              chatId: updatedTrip.chatId || null,
            };
          });
        }
      });
      return () => unsubscribe();
    }
  }, [id]);

  // Listener for chat messages
  useEffect(() => {
    if (trip?.chatId) {
      const chatRef = collection(db, "chats", trip.chatId, "messages");
      const unsubscribe = onSnapshot(chatRef, (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data());
        setChatMessages(messages);
      });
      return () => unsubscribe();
    }
  }, [trip?.chatId]);

  const handleDeleteTrip = async () => {
    if (!trip || !trip.id) return;

    try {
      await deleteDoc(doc(db, "trips", trip.id));
      navigate("/"); // Redirect to home or another page after deletion
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCreateChat = async () => {
    if (!trip || !trip.id) return;

    if (!trip.chatId) {
      try {
        const chatRef = await addDoc(collection(db, "chats"), {
          createdAt: Timestamp.now(),
          participants: trip.participants.map((p) => p.name),
        });

        const tripRef = doc(db, "trips", trip.id);
        await updateDoc(tripRef, {
          chatId: chatRef.id,
        });

        setTrip((prevTrip) => {
          if (!prevTrip) return null;
          return {
            ...prevTrip,
            chatId: chatRef.id,
          };
        });
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    }
  };

  const handleJoinTrip = async () => {
    if (!user || !trip) return;

    const tripRef = doc(db, "trips", trip.id);

    const isAlreadyParticipant = trip.participants.some(
      (participant) => participant.name === user.displayName
    );

    if (!isAlreadyParticipant) {
      await updateDoc(tripRef, {
        participants: [
          ...trip.participants,
          { name: user.displayName, photo: user.photoURL },
        ],
      });
    }
  };

  const handleUnjoinTrip = async () => {
    if (!user || !trip) return;

    const tripRef = doc(db, "trips", trip.id);

    const updatedParticipants = trip.participants.filter(
      (participant) => participant.name !== user.displayName
    );

    await updateDoc(tripRef, {
      participants: updatedParticipants,
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !trip?.chatId) return;

    const chatRef = collection(db, "chats", trip.chatId, "messages");

    try {
      await addDoc(chatRef, {
        text: newMessage,
        sender: user.displayName,
        createdAt: Timestamp.now(),
      });

      setNewMessage(""); // Clear input field after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!trip) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 my-4 bg-white shadow-xl rounded-2xl lg:max-w-4xl">
      <div className="flex justify-between">
        <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-8">
          {trip.tripName}
        </h2>

        {/* Author-only Actions */}
        {user?.displayName === trip.authorName && (
          <div className="mt-2">
            <div className="flex gap-2">
              {!trip.chatId && (
                <button
                  onClick={handleCreateChat}
                  className="w-full md:w-auto bg-green-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-green-700 transition-all"
                >
                  Create Chat
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={openModal}
                className="w-full md:w-auto bg-red-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition-all"
              >
                Delete Trip
              </button>
            </div>

            {/* Modal for Confirmation */}
            <Modal
              isOpen={isModalOpen}
              onRequestClose={closeModal}
              className="flex items-center justify-center fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50"
              overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">
                  Are you sure you want to delete this trip?
                </h2>
                <div className="flex justify-around mt-6">
                  <button
                    onClick={handleDeleteTrip}
                    className="bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>

      <div className="flex items-center mb-6">
        <img
          src={trip.authorPhoto || "https://via.placeholder.com/40"}
          alt={trip.authorName}
          className="rounded-full w-12 h-12 mr-4 border-2 border-gray-300"
        />
        <span className="text-xl font-semibold text-gray-800">
          {trip.authorName}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <p className="text-gray-700">
          <strong>Start Point:</strong> {trip.startPoint}
        </p>
        <p className="text-gray-700">
          <strong>End Point:</strong> {trip.endPoint}
        </p>
        <p className="text-gray-700">
          <strong>Start Date:</strong> {trip.startDate.toDateString()}
        </p>
        <p className="text-gray-700">
          <strong>End Date:</strong> {trip.endDate.toDateString()}
        </p>
        <p className="text-gray-700">
          <strong>Category:</strong> {trip.category}
        </p>
        <p className="text-gray-700">
          <strong>Difficulty:</strong> {trip.difficulty}
        </p>
        <p className="text-gray-700 col-span-2">
          <strong>Equipment:</strong> {trip.equipment.join(", ")}
        </p>
      </div>

      {/* Chat Section */}
      {/* Chat Section */}
      {trip.chatId &&
        (trip.participants.some(
          (participant) => participant.name === user?.displayName
        ) ||
          user?.displayName === trip.authorName) && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-800">
              Chat Messages:
            </h3>
            <ul className="space-y-3 mt-4 max-h-64 overflow-y-auto">
              {" "}
              {/* Add max height and overflow */}
              {chatMessages
                .sort(
                  (a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis()
                )
                .map((msg, idx) => {
                  const messageTime = msg.createdAt
                    ?.toDate()
                    .toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                  const isUserMessage = msg.sender === user?.displayName;
                  return (
                    <li
                      key={idx}
                      className={`p-4 rounded-lg shadow-sm ${
                        isUserMessage
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex justify-between">
                        <strong className="text-sm">{msg.sender}:</strong>
                        <span className="text-xs text-gray-500">
                          {messageTime}
                        </span>
                      </div>
                      <div>{msg.text}</div>
                    </li>
                  );
                })}
            </ul>

            <div className="flex mt-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="border border-gray-300 rounded-lg flex-grow px-4 py-2"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        )}

      {user?.displayName && (
        <div>
          {trip.participants.some(
            (participant) => participant.name === user.displayName
          ) ? (
            <button
              onClick={handleUnjoinTrip}
              className="w-full md:w-auto mt-2 bg-red-800 text-white py-3 px-6 rounded-xl shadow-md hover:bg-red-700 transition-all"
            >
              Leave Trip
            </button>
          ) : (
            <button
              onClick={handleJoinTrip}
              className="w-full md:w-auto mt-2 bg-blue-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-blue-700 transition-all"
            >
              Join Trip
            </button>
          )}
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-800">Participants:</h3>
        <ul className="space-y-4 mt-4">
          {trip.participants.map((participant) => (
            <li key={participant.name} className="flex items-center">
              <img
                src={participant.photo}
                alt={participant.name}
                className="w-12 h-12 rounded-full mr-4 border-2 border-gray-300"
              />
              <span className="text-lg text-gray-800">{participant.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TripDetail;
