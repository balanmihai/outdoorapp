import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface Message {
  sender: string;
  text: string;
}

const Chat: React.FC<{ chatId: string; user: any }> = ({ chatId, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchChatMessages = async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        setMessages(chatDoc.data()?.messages || []);
      } else {
        console.error("Chat not found");
      }
    };

    fetchChatMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage) return;

    // Create a new message object
    const messageToSend = { sender: user.displayName, text: newMessage };

    // Update the messages array in Firestore
    await updateDoc(doc(db, "chats", chatId), {
      messages: [...messages, messageToSend],
    });

    // Update the local messages state
    setMessages((prevMessages) => [...prevMessages, messageToSend]);
    setNewMessage("");
  };

  return (
    <div>
      <p>sugi pulake</p>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}: </strong>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default Chat;
