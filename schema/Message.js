//write a simple mongoose schema for a server with a string name, a string id, and a boolean enabled
const { Attachment } = require('discord.js')
const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    channel: {
        //the original channel ID where the message was sent
        type: String,
        required: true,
    },
    guildID: {
        type: String,
        required: true,
    },
    id: {
        // the original message ID
        type: String,
        required: true,
    },
    newID: {
        // the new message ID in the forum
        type: String,
        required: true,
    },
    content: {
        type: [String],
        required: true,
    },
    timestamps: {
        type: [Number],
        required: true,
    },
    Attachments: {
        type: [String],
        required: false,
    },
})
const Message = mongoose.model('Message', messageSchema)
module.exports = Message
