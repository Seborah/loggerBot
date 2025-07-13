const auth = require('../auth.json')
Error.stackTraceLimit = 30
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { SlashCommandBuilder } = require('@discordjs/builders')

const commands = [
    new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Sends Role Message')
        .addStringOption((option) =>
            option
                .setName('group')
                .setDescription('The role group.')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    new SlashCommandBuilder()
        .setName('admin')
        .setDefaultMemberPermissions(Permissions.FLAGS.ADMINISTRATOR)
        .setDescription('Administrative Commands')
        //$addrole
        .addSubcommand((subCommand) =>
            subCommand
                .setName('logger')
                .setDescription(
                    'send a message with buttons to self assign roles to a channel'
                )
                .addChannelOption((option) =>
                    option
                        .setName('forum')
                        .setDescription('The forum to send the logs to')
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option
                        .setName('enabled')
                        .setDescription('on or off')
                        .setRequired(true)
                )
        ),
].map((command) => command.toJSON())

// require('fs').writeFileSync(
//   './commands.json',
//   JSON.stringify(commands, null, 4)
// );

const rest = new REST({ version: '9' }).setToken(auth.token)

rest.put(Routes.applicationCommands(auth.clientID), {
    body: commands,
})
