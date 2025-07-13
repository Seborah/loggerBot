const { Client, GatewayIntentBits, Partials } = require('discord.js')
const {
    loggerConfig,
    logMessages,
    updateMessageLog,
} = require('./messageLogger')
const auth = require('./auth.json')
const TOKEN = auth.token

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
mongoose
    .connect(auth.mongoURI, {})
    .then(() => {
        console.log('Connected to MongoDB')
        initializeServerLists()
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err)
        process.exit(1)
    })

const Server = require('./schema/Server')
const Channel = require('./schema/Channel')
const Message = require('./schema/Message')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

/** @type {Map<string>} - Set of enabled server IDs */
var serverCache = new Map()
/** @type {Map<string, Map<string,string>>} - Map of server IDs to maps of the channels to forum channels */
var channelCache = new Map()

function initializeServerLists() {
    Server.find({ enabled: true })
        .then((servers) => {
            servers.forEach((server) => {
                serverCache.set(server.id, server.forum)
                channelCache.set(server.id, new Map())

                Channel.find({ guildID: server.id }).then((channels) => {
                    channels.forEach((channel) => {
                        channelCache
                            .get(server.id)
                            .set(channel.id, channel.newID)
                    })
                })
            })
            console.log('Enabled servers initialized:', serverCache)
        })
        .catch((err) => {
            console.error('Error initializing enabled servers:', err)
        })
}

// Helper to download a file

client.on('messageCreate', async (message) => {
    console.log({ serverCache })
    console.log({ channelCache })
    if (message.author.bot) return
    if (!message.guild) return // Ignore DMs
    if (!serverCache.has(message.guild.id)) return // Ignore if server is not enabled
    // Log message content
    console.log(
        `[${message.guild?.name || 'DM'}][#${message.channel?.name}] ${
            message.author.tag
        }: ${message.content}`
    )
    logMessages(message, serverCache, channelCache)
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author.bot) return
    if (!newMessage.guild) return // Ignore DMs
    if (!serverCache.has(newMessage.guild.id)) return // Ignore if server is not enabled
    // Log updated message content
    console.log(
        `[${newMessage.guild?.name || 'DM'}][#${newMessage.channel?.name}] ${
            newMessage.author.tag
        }: ${oldMessage.content} -> ${newMessage.content}`
    )
    updateMessageLog(oldMessage, newMessage, serverCache, channelCache)
})
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    if (interaction.commandName === 'logging') {
        loggerConfig(interaction, serverCache, channelCache)
        return
    }
})

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.login(TOKEN)
