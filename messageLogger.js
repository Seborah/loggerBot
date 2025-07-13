var {
    ChatInputCommandInteraction,
    ChannelType,
    MessageFlagsBitField,
    Message: msg,
    ForumChannel,
    time,
    ThreadChannel,
} = require('discord.js')
const Server = require('./schema/Server')

const Channel = require('./schema/Channel')
const Message = require('./schema/Message')

/**
 * @param {ChatInputCommandInteraction} interaction
 */
async function loggerConfig(interaction, serverCache, channelCache) {
    if (!interaction.guild) {
        return interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true,
        })
    }
    await interaction.deferReply({
        flags: MessageFlagsBitField.Flags.Ephemeral,
    })
    var forum = interaction.options.getChannel('forum')

    var serverId = interaction.guild.id
    var enabled = interaction.options.getBoolean('enabled')
    var serverName = interaction.guild.name
    // Check if the server already exists
    var mongoServer = await Server.findOne({ id: serverId })

    if (!mongoServer) {
        if (!forum) {
            return interaction.editReply({
                content:
                    'Please specify a forum channel when enabling for the first time.',
            })
        }
        if (forum.type !== ChannelType.GuildForum) {
            return interaction.editReply({
                content: 'The specified channel must be a forum channel.',
            })
        }

        // Create a new server entry if it doesn't exist
        mongoServer = new Server({
            name: serverName,
            id: serverId,
            forum: forum.id,
            enabled: enabled,
        })
        mongoServer.save()
        return await interaction.editReply({
            content: `Message logging has been ${
                enabled ? 'enabled' : 'disabled'
            } for this server. Forum channel set to <#${forum.id}>.`,
        })
    } else {
        // update a server
        if (forum) {
            if (forum.type !== ChannelType.GuildForum) {
                return interaction.editReply({
                    content: 'The specified channel must be a forum channel.',
                })
            }
            if (!mongoServer.enabled) {
                mongoServer.forum = forum.id
                mongoServer.save()
                return await interaction.editReply({
                    content:
                        'The forum channel has been updated successfully. Enabling the logger will will break any past logging done. \n Setting the forum channel back will prevent this before enabling. logging is still disabled.',
                })
            }
            return interaction.editReply({
                content:
                    'You must disable the logger first to update the forum channel. This will prevent the bot from monitoring any past messages it has logged. \n Consider not changing the forum if possible.',
            })
        }

        if (enabled !== null && enabled !== undefined) {
            mongoServer.enabled = enabled
            await mongoServer.save()
            return interaction.editReply({
                content: `Message logging has been ${
                    enabled ? 'enabled' : 'disabled'
                } for this server.`,
            })
        }
        return interaction.editReply({
            content:
                'No changes made. Please specify a forum or enabled state.',
        })
    }
}

/**
 *
 * @param {msg} message
 * @param {Map<string>} serverCache - Set of enabled server IDs
 * @param {Map<string, Map<string,string>>} channelCache - Map of server IDs
 */
async function logMessages(message, serverCache, channelCache) {
    var guildID = message.guild.id
    var channelID = message.channel.id
    var thisChannel = channelCache.get(guildID)?.get(channelID)
    if (serverCache.get(guildID) == message.channel.parentId) {
        return
    }
    var forumChannelID = serverCache.get(guildID)
    if (!forumChannelID) {
        console.warn(
            `No forum channel set for server ${guildID}. Cannot log message.`
        )
        return
    }
    /**
     * @type {ForumChannel}
     */
    var forum = await message.guild.channels.fetch(forumChannelID)
    if (!thisChannel) {
        try {
            var threadChannel = await forum.threads.create({
                name: message.channel.name,
                message: {
                    content: `created from <#${channelID}>`,
                },
            })
        } catch (error) {
            console.error(error)
            return
        }
        var threadID = threadChannel.id
        channelCache.get(guildID).set(channelID, threadID)
        var mongoChannel = Channel.create({
            guildID: guildID,
            id: channelID,
            newID: threadID,
        })

        var tempMessage = await threadChannel.send({
            content: `**Author:** ${message.author.tag}\n**Message:** ${message.content}`,
        })
        var mongoMessage = new Message({
            channel: channelID,
            guildID: guildID,
            id: message.id,
            newID: tempMessage.id,
            content: [message.content],
            timestamps: [Date.now()],
            // Attachments: message.attachments.map((att) => att.url),
        })
        mongoMessage.save()
        console.log(
            `Created new thread for channel ${channelID} in server ${guildID}: ${threadID}`
        )
    } else {
        var threadChannel = await message.guild.channels.fetch(thisChannel)
        if (!threadChannel) {
            console.warn(
                `Thread channel ${thisChannel} not found in server ${guildID}.`
            )
            return
        }
        try {
            var tempMessage = await threadChannel.send({
                content: `**Author:** ${message.author.tag}\n**Message:** ${message.content}`,
            })
            var mongoMessage = new Message({
                channel: channelID,
                guildID: guildID,
                id: message.id,
                newID: tempMessage.id,
                content: [message.content],
                timestamps: [Date.now()],
                // Attachments: message.attachments.map((att) => att.url),
            })
            mongoMessage.save()
        } catch (error) {
            console.error(
                `Failed to send message in thread ${threadChannel.id} in server ${guildID}:`,
                error
            )
            return
        }
    }
}

/**
 *
 * @param {msg} oldMessage
 * @param {msg} newMessage
 * @param {Map} serverCache
 * @param {Map} channelCache
 * @returns
 */
async function updateMessageLog(
    oldMessage,
    newMessage,
    serverCache,
    channelCache
) {
    var guildID = newMessage.guild.id
    var channelID = newMessage.channel.id
    var thisChannel = channelCache.get(guildID)?.get(channelID)

    if (serverCache.get(guildID) == oldMessage.channel.parentId) {
        return
    }
    /**
     * @type {ThreadChannel}
     */
    var threadChannel = await newMessage.guild.channels.fetch(thisChannel)
    if (!threadChannel) {
        console.warn(
            `Thread channel ${thisChannel} not found in server ${guildID}. Cannot update message.`
        )
        return
    }
    try {
        var mongoMessage = await Message.findOne({
            channel: channelID,
            guildID: guildID,
            id: oldMessage.id,
        })
        if (!mongoMessage) {
            console.warn(
                `No message found in database for channel ${channelID} in server ${guildID}. Cannot update message.`
            )
            return
        }
        mongoMessage.content.push(newMessage.content)
        mongoMessage.timestamps.push(Date.now())
        await mongoMessage.save()
        /**@type {msg} */
        var updatedMessage = await threadChannel.messages.fetch(
            mongoMessage.newID
        )
        if (!updatedMessage) {
            console.warn(
                `Message with ID ${mongoMessage.newID} not found in thread ${threadChannel.id} in server ${guildID}. Cannot update message.`
            )
            return
        }

        var tempContent = updatedMessage.content
        await updatedMessage.edit({
            content:
                tempContent +
                `\n\n**Edited on:**${new Date(
                    Date.now()
                ).toUTCString()}\n**Author:** ${
                    newMessage.author.tag
                }\n**Message:** ${newMessage.content}`,
        })
    } catch (e) {
        console.error(
            `Failed to update message in thread ${threadChannel.id} in server ${guildID}:`,
            e
        )
        console.warn(e)
        return
    }
}
module.exports = { loggerConfig, logMessages, updateMessageLog }
