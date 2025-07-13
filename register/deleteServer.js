//deletes all global commands

const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const auth = require('../auth.json')

const token = auth.token
const clientId = auth.id
const guildId = auth.testID // Replace with your guild ID if needed

const rest = new REST({ version: '9' }).setToken(token)
;(async () => {
    try {
        console.log(
            `Started deleting all guild commands for guild ID: ${guildId}.`
        )

        // Use the applicationGuildCommands route and pass an empty array to delete all guild commands
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: [],
        })

        console.log('Successfully deleted all guild commands.')
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error)
    }
})()
