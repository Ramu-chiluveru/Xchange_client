import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Button from '@mui/material/Button';

const ChatApp = ({ user, setUser }) => {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentChat, setCurrentChat] = useState(null);

  const [currentId,setCurrentId]  = useState();

  const [conversationId,setConversationId] = useState();

  const socketRef = useRef();

  const socket = io('http://localhost:5000');

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => { 

    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/xchange/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users.filter((u) => u._id !== user.id)); // Exclude self
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    return () => {
      // socketRef.current.disconnect();
    };
  }, [user.id]);


  useEffect(() => {
    if (user._id) {
        socket.emit('register_user', user._id); // Register the user on the backend
    }

    // Listen for incoming messages
    socket.on('receive_message', (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup on component unmount
    return () => socket.disconnect();
}, [user._id]);



  const sendMessage = (e) => {
    // e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;


    const messageData = {
      userId1 : user.id,
      userId2: currentId,
      message: newMessage
    };

    console.log("userId1: " + user.id);
    console.log("userId2: " + currentId);

    socket.emit("send_message", messageData);

    if(messages && messages.length > 0)
      setMessages((prevMessages) => [...prevMessages, { senderId: user.id, message: newMessage }]);
    else
      setMessages([{ senderId: user.id, message: newMessage }]);
    
    setNewMessage(""); // Clear the input field


    // if (message.trim() && recipientId.trim()) {
    //     const data = { senderId: userId, recipientId, message };
    //     socket.emit('send_message', data); // Emit message to the backend
    //     setMessages((prevMessages) => [...prevMessages, { ...data, time: new Date().toLocaleTimeString() }]);
    //     setMessage(''); // Clear input
    // }
};

  // const sendMessage = (e) => {
  //   e.preventDefault();
  //   if (!newMessage.trim() || !currentChat) return;

  //   const messageData = {
  //     chatId: currentChat._id,
  //     message: newMessage,
  //     senderId: user.id,
  //   };

  //   socketRef.current.emit("send_message", messageData);

  //   if(messages && messages.length > 0)
  //     setMessages((prevMessages) => [...prevMessages, { senderId: user.id, message: newMessage }]);
  //   else
  //     setMessages([{ senderId: user.id, message: newMessage }]);
    
  //   setNewMessage(""); // Clear the input field
  // };

  // Start new chat
  const startChat = async (otherUser,key) => {
    setSelectedUser(otherUser);

    console.log("setting current id: " , key);
    setCurrentId(key);

    if (currentChat) return; // Prevent starting a new chat if one is active
    try {
      const response = await fetch("http://localhost:5000/xchange/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId1: user.id,
          userId2: otherUser._id,
        }),
      });

      const chatData = await response.json();
      setCurrentChat(chatData);
      setConversationId(chatData._id);
      setMessages(chatData.messages);

      // socketRef.current.emit("join_chat", chatData._id);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ width: "25%", background: "#f5f5f5", borderRight: "1px solid #ccc" }}>
        <div style={{ padding: "16px", backgroundColor: "#007bff", color: "white", fontWeight: "bold" }}>
          <h2 style={{ margin: 0 }}>Chats</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {users.map((u) => (
            <div
              key={u._id}
              conver = {conversationId}
              style={{
                padding: "12px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => startChat(u,u._id)}
            >
              <div
                style={{
                  height: "40px",
                  width: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#007bff",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  marginRight: "12px",
                }}
              >
                {u.email[0]}
              </div>
              <div>
                <div style={{ fontWeight: "500" }}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="btn-logout">
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {/* Main chat window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", backgroundColor: "#007bff", color: "white", fontWeight: "bold" }}>
          {selectedUser ? (
            <>
              <div
                style={{
                  height: "40px",
                  width: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#007bff",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  marginRight: "12px",
                }}
              >
                {selectedUser.email[0]}
              </div>
              <div style={{ marginLeft: "12px" }}>
                <p>{selectedUser._id}</p>
                <div style={{ fontWeight: "500" }}>{selectedUser.email}</div>
              </div>
            </>
          ) : (
            <div>Select a user to chat</div>
          )}
        </div>

        <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          {messages && messages.length > 0 && messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: message.senderId === user.id ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  backgroundColor: message.senderId === user.id ? "#007bff" : "#f1f1f1",
                  color: message.senderId === user.id ? "white" : "black",
                  padding: "10px",
                  borderRadius: "12px",
                  maxWidth: "60%",
                  wordWrap: "break-word",
                }}
              >
                {message.message}
              </div>
            </div>
          ))}
        </div>

        {currentChat && (
          <div
            style={{
              padding: "12px",
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid #ccc",
            }}
          >
            <input
              type="text"
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                outline: "none",
                marginRight: "8px",
              }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
            />
            <button
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
