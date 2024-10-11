
const { getReceiverSocketId, io } = require("../socket/socket.js");
const Message = require('../modal/Message.js');
const Conversation = require('../modal/Conversation.js');
const sendMessage = async (req, res) => {
    try {
      const { message: messageContent, messageType = 'text' } = req.body; // Assuming you want to allow for message type
      const { id: receiverId } = req.params; // Extract receiver ID from request parameters
      const senderId = req.user.id; // Extract sender ID from the authenticated user
      // Find or create a conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });
  
      // If conversation doesn't exist, create a new one
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          messages: [], // Initialize with an empty messages array
        });
      }
  
      // Create new message
      const newMessage = new Message({
        conversationId: conversation._id, // Assign conversation ID
        sender: senderId, // Assign sender ID
        content: messageContent, // Assign message content
        messageType: messageType // Assign message type
      });
  
      // Push the message ID to the conversation's messages array
      conversation.messages.push(newMessage._id);
  
      // Save both the conversation and the new message in parallel
      await Promise.all([conversation.save(), newMessage.save()]);
  
      // Emit message to the receiver via socket if they are connected
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
  
      // Respond with the newly created message
      res.status(201).json(newMessage);
    } catch (error) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  
  const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; 
        const senderId = req.user.id; 

        // Validate userToChatId
        if (!userToChatId) {
            return res.status(400).json({ error: "User to chat ID is required." });
        }

        // Find conversation and populate messages
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages"); // Populate messages for this conversation

        // If no conversation found, return an empty array
        if (!conversation) return res.status(200).json([]);

        // Return messages from the conversation
        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error("Error in getMessages controller: ", error.message); 
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};
  module.exports ={sendMessage,getMessages}