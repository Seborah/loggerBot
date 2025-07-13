//write a simple mongoose schema for a server with a string name, a string id, and a boolean enabled
const mongoose = require('mongoose')
const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    },
    forum: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: false,
    },
})
const Server = mongoose.model('Server', serverSchema)
module.exports = Server
