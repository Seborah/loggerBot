//write a simple mongoose schema for a server with a string name, a string id, and a boolean enabled
const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    guildID: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
    newID: {
        type: String,
        required: true,
    },
})
const Message = mongoose.model('Channel', messageSchema)
module.exports = Message
