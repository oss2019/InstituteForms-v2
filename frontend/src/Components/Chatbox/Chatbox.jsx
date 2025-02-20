import React, { useState, useEffect, useRef } from "react";
import "./Chatbox.css";
import close from "../../assets/cb.png";
import sb from "../../assets/sb.png";
import ub from "../../assets/ub.png";

const Chatbox = ({ isOpen, onClose, chatboxId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [previewImage, setPreviewImage] = useState(null); // New state for image preview
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleSend = () => {
    if (input.trim() !== "") {
      const newMessage = { text: input, sender: "user", date: new Date() };
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const isNewDay = !lastMessage || formatDate(new Date(lastMessage.date)) !== formatDate(newMessage.date);
        return isNewDay ? [...prevMessages, { dateLabel: formatDate(newMessage.date) }, newMessage] : [...prevMessages, newMessage];
      });
      setTimeout(() => {
        setMessages((prev) => [...prev, { text: "Hello!", sender: "bot", date: new Date() }]);
      }, 1000);
      setInput("");
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMessages((prevMessages) => {
          const newMessage = { image: reader.result, sender: "user", date: new Date() };
          const lastMessage = prevMessages[prevMessages.length - 1];
          const isNewDay = !lastMessage || formatDate(new Date(lastMessage.date)) !== formatDate(newMessage.date);
          return isNewDay ? [...prevMessages, { dateLabel: formatDate(newMessage.date) }, newMessage] : [...prevMessages, newMessage];
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleImageClick = (imageSrc) => {
    setPreviewImage(imageSrc);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-container">
      <div className="chat-box chat-box-responsive">
        <div className="chat-header">
          <span>Chat {chatboxId}</span>
          <button className="chat-close-button" onClick={() => onClose(chatboxId)}>
            <img src={close} alt="close" className="close" />
          </button>
        </div>
        <div className="chat-messages no-scrollbar">
          {messages.map((msg, index) =>
            msg.dateLabel ? (
              <div key={index} className="chat-date-label">{msg.dateLabel}</div>
            ) : (
              <div key={index} className={`chat-message ${msg.sender}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="sent" 
                    className="chat-image" 
                    onClick={() => handleImageClick(msg.image)} // Click to enlarge image
                    style={{ cursor: "pointer" }} // Indicate image is clickable
                  />
                )}
              </div>
            )
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex">
          <div className="flexitem1">
            <div className="chat-input">
              <input
                className="message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
              />
            </div>
          </div>
          <div className="flexitem2">
            <label className="upload-button">
              <img src={ub} className="uploadbutton" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="image-upload" hidden />
            </label>
            <button className="send-button" onClick={handleSend}>
              <img src={sb} className="sendbutton" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-overlay" onClick={closePreview}>
          <div className="image-preview-content">
            <img src={previewImage} alt="preview" className="image-preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
