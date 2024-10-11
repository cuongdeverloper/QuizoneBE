const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Add any additional fields, such as message type (text, image, etc.)
    messageType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
