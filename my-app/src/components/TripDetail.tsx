//TripDetail.tsx
import { useEffect, useRef, useState } from "react";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();
  const [editTrip, setEditTrip] = useState({
    tripName: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    startPoint: "",
    endPoint: "",
    category: "",
    difficulty: "",
  });

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

          setEditTrip({
            tripName: data.tripName || "",
            description: data.description || "",
            startDate: startDate,
            endDate: endDate,
            startPoint: data.startPoint || "",
            endPoint: data.endPoint || "",
            category: data.category || "",
            difficulty: data.difficulty || "",
          });
        } else {
          console.error("Trip not found");
        }
      }
    };

    fetchTrip();
  }, [id]);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleEditTrip = async () => {
    if (!trip || !trip.id) return;

    const tripRef = doc(db, "trips", trip.id);
    await updateDoc(tripRef, {
      tripName: editTrip.tripName,
      description: editTrip.description,
      startDate: Timestamp.fromDate(new Date(editTrip.startDate)),
      endDate: Timestamp.fromDate(new Date(editTrip.endDate)),
      startPoint: editTrip.startPoint,
      endPoint: editTrip.endPoint,
      category: editTrip.category,
      difficulty: editTrip.difficulty,
    });

    setTrip(
      (prevTrip) =>
        ({
          ...prevTrip,
          ...editTrip,
        } as Trip)
    );

    closeEditModal();
  };

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

  const chatEndRef = useRef<HTMLDivElement | null>(null); // Specify type of the ref

  useEffect(() => {
    // Scroll to the bottom whenever chatMessages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

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

  useEffect(() => {
    console.log("plm", trip?.startDate, trip?.endDate);
  });

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
              <button
                onClick={openEditModal}
                className="w-full md:w-auto bg-blue-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-blue-700 transition-all"
              >
                Edit Trip
              </button>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-white shadow rounded-lg">
        <div className="flex items-center text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 2.938a5.063 5.063 0 100 10.126A5.063 5.063 0 0012 4.938zM12 8a2 2 0 110 4 2 2 0 010-4z"
            />
          </svg>
          <span>
            <strong>Start:</strong> {trip.startPoint}
          </span>
        </div>

        <div className="flex items-center text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 19.75a9.75 9.75 0 100-19.5 9.75 9.75 0 000 19.5zm.75-6V7a3 3 0 016 0v6m0 0v2a2 2 0 11-4 0v-2m2 4a2 2 0 012-2h1a2 2 0 110 4h-1a2 2 0 01-2-2z"
            />
          </svg>
          <span>
            <strong>End:</strong> {trip.endPoint}
          </span>
        </div>

        {trip.startDate.getUTCDate === trip.endDate.getUTCDate ? (
          <>
            <div className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3h8v4m-4 0V3m0 0H8m4 0h4M5 21h14M3 8h18M3 16h18"
                />
              </svg>
              <span>
                <strong>Dayhike:</strong> {trip.startDate.toDateString()}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3h8v4m-4 0V3m0 0H8m4 0h4M5 21h14M3 8h18M3 16h18"
                />
              </svg>
              <span>
                <strong>Start Date:</strong> {trip.startDate.toDateString()}
              </span>
            </div>

            <div className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.5 12.5h15m-15 0v7.75h15V12.5m-10-5.5h5"
                />
              </svg>
              <span>
                <strong>End Date:</strong> {trip.endDate.toDateString()}
              </span>
            </div>
          </>
        )}

        <div className="flex items-center text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-purple-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v12m0-12C10.333 9 8 10.9 8 13.5S10.333 18 12 18s4-2.9 4-4.5S13.667 9 12 9z"
            />
          </svg>
          <span>
            <strong>Category:</strong> {trip.category}
          </span>
        </div>

        <div className="flex items-center text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v12m-4-6h8"
            />
          </svg>
          <span>
            <strong>Difficulty:</strong> {trip.difficulty}
          </span>
        </div>

        <div className="flex items-start col-span-2 text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-indigo-600 mr-2 mt-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 20l-5-5 5-5M15 20l5-5-5-5"
            />
          </svg>
          <span>
            <strong>Equipment: </strong>
            {trip.equipment.length
              ? trip.equipment.join(", ")
              : "Not specified"}
          </span>
        </div>
      </div>
      <div className="flex items-center mb-2 text-gray-700">
        <span>
          <strong>Description:</strong>{" "}
          {trip.description ? trip.description : "No Description"}
        </span>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="flex items-center justify-center fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Edit Trip</h2>
          <div className="flex flex-col space-y-4">
            <input
              type="text"
              value={editTrip.tripName}
              onChange={(e) =>
                setEditTrip({ ...editTrip, tripName: e.target.value })
              }
              placeholder="Trip Name"
              className="border p-2 rounded-lg"
            />
            <textarea
              value={editTrip.description}
              onChange={(e) =>
                setEditTrip({ ...editTrip, description: e.target.value })
              }
              placeholder="Description"
              className="border p-2 rounded-lg"
            />
            <input
              type="date"
              value={editTrip.startDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setEditTrip({
                  ...editTrip,
                  startDate: new Date(e.target.value),
                })
              }
              className="border p-2 rounded-lg"
            />
            <input
              type="date"
              value={editTrip.endDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setEditTrip({ ...editTrip, endDate: new Date(e.target.value) })
              }
              className="border p-2 rounded-lg"
            />
            <input
              type="text"
              value={editTrip.startPoint}
              onChange={(e) =>
                setEditTrip({ ...editTrip, startPoint: e.target.value })
              }
              placeholder="Start Point"
              className="border p-2 rounded-lg"
            />
            <input
              type="text"
              value={editTrip.endPoint}
              onChange={(e) =>
                setEditTrip({ ...editTrip, endPoint: e.target.value })
              }
              placeholder="End Point"
              className="border p-2 rounded-lg"
            />
            <input
              type="text"
              value={editTrip.category}
              onChange={(e) =>
                setEditTrip({ ...editTrip, category: e.target.value })
              }
              placeholder="Category"
              className="border p-2 rounded-lg"
            />
            <input
              type="text"
              value={editTrip.difficulty}
              onChange={(e) =>
                setEditTrip({ ...editTrip, difficulty: e.target.value })
              }
              placeholder="Difficulty"
              className="border p-2 rounded-lg"
            />
            <div className="flex justify-around mt-6">
              <button
                onClick={handleEditTrip}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={closeEditModal}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
                      className={`flex ${
                        isUserMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-4 rounded-lg shadow-sm max-w-xs break-words ${
                          isUserMessage
                            ? "bg-blue-600 text-white ml-auto"
                            : "bg-gray-100 text-gray-900 mr-auto"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <strong className="text-sm mr-2">{msg.sender}</strong>
                          <span
                            className={`text-xs text-gray-800 ${
                              isUserMessage
                                ? " text-gray-100"
                                : " text-gray-700"
                            }`}
                          >
                            {messageTime}
                          </span>
                        </div>
                        <div>{msg.text}</div>
                      </div>
                    </li>
                  );
                })}
              <div ref={chatEndRef} />
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
