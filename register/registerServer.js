// const Permissions = require('discord.js').PermissionFlagsBits
const auth = require('../auth.json')
Error.stackTraceLimit = 30
const { REST } = require('@discordjs/rest')
const {
    Routes,
    PermissionFlagsBits: Permissions,
} = require('discord-api-types/v9')
const { SlashCommandBuilder } = require('@discordjs/builders')
const commands = [
    new SlashCommandBuilder()
        .setName('logging')
        .setDefaultMemberPermissions(Permissions.Administrator)
        .setDescription('Administrative Commands')
        .addChannelOption((option) =>
            option
                .setName('forum')
                .setDescription('The forum to send the logs to')
                .setRequired(false)
        )
        .addBooleanOption((option) =>
            option
                .setName('enabled')
                .setDescription('true or false')
                .setRequired(false)
        ),
].map((command) => command.toJSON())

// require('fs').writeFileSync(
//   './commands.json',
//   JSON.stringify(commands, null, 4)
// );

const rest = new REST({ version: '9' }).setToken(auth.token)
rest.put(Routes.applicationGuildCommands(auth.id, auth.testID), {
    body: commands,
})
