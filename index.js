const { Client, REST, Routes, Events, IntentsBitField, ApplicationCommandOptionType } = require("discord.js");
const client = new Client({ intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMessages });
const config = require("./config/config.json");
const ModuleLoader = require("./src/ModuleLoader");

const { Client: PGClient } = require('pg');
const SettingsStorage = require("./src/SettingsStorage");
const pgClient = new PGClient({ host: '192.168.1.195', port: 5433, user: 'postgres', password: 'admin', database: 'starie' })

pgClient.connect();

const rest = new REST({ version: '10' }).setToken(config.token);

const GLOBAL_COMMANDS = [
    {
        name: "ping",
        description: "Pong!",
        permission: "SEND_MESSAGES",
        onRun: (interaction) => {
            console.log(interaction)
            interaction.reply("Pong!");
        }
    },
    {
        name: "enable",
        description: "Enables a module",
        permission: "ADMINISTRATOR",
        options: [
            {
                name: "module_name",
                description: "The name of the module",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "Leveling",
                        value: "Leveling"
                    },
                    {
                        name: "Version",
                        value: "Version"
                    }
                ]
            }
        ],
        onRun: async (interaction) => {
            const module_name = interaction.options.getString("module_name");

            // insert module into enabled_modules table if it doesn't exist
            await pgClient.query(`INSERT INTO enabled_modules (guild_id, module_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [interaction.guild.id, module_name]);

            // get the enabled modules
            const { rows } = await pgClient.query(`SELECT module_name FROM enabled_modules WHERE guild_id = $1`, [interaction.guild.id]);

            // make an array of commands from the enabled modules
            const commands = [];

            for (const module of rows) {
                for (const command of MODULE_HANDLER.load(module.module_name)) {
                    commands.push(command);
                }
            }
            
            rest.put(Routes.applicationGuildCommands(client.user.id, interaction.guild.id), { body: commands })
            interaction.reply({ content: "Module has been enabled!", ephemeral: true });
        }
    },
    {
        name: "disable",
        description: "Disables a module",
        permission: "ADMINISTRATOR",
        options: [
            {
                name: "module_name",
                description: "The name of the module",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "Leveling",
                        value: "Leveling"
                    },
                    {
                        name: "Version",
                        value: "Version"
                    }
                ]
            }
        ],
        onRun: async (interaction) => {
            const module_name = interaction.options.getString("module_name");

            // delete module from enabled_modules table if it exists
            await pgClient.query(`DELETE FROM enabled_modules WHERE guild_id = $1 AND module_name = $2`, [interaction.guild.id, module_name]);

            // get the enabled modules
            const { rows } = await pgClient.query(`SELECT module_name FROM enabled_modules WHERE guild_id = $1`, [interaction.guild.id]);

            // make an array of commands from the enabled modules
            const commands = [];

            for (const module of rows) {
                for (const command of MODULE_HANDLER.load(module.module_name)) {
                    commands.push(command);
                }
            }
            
            await rest.put(Routes.applicationGuildCommands(client.user.id, interaction.guild.id), { body: commands })
            interaction.reply({ content: "Module has been disabled!", ephemeral: true });
        }
    }
]

const COMMANDS = []

const MODULE_HANDLER = new ModuleLoader(client);

client.on(Events.ClientReady, async () => {
    console.log("Client is ready!")

    MODULE_HANDLER.loadAll();

    const configSubCommands = [];

    for (const module of Object.values(MODULE_HANDLER.modules)) {
        // make sub commands from all loaded modules
        configSubCommands.push({
            name: module.member_name.toLowerCase(),
            description: "Stub",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "setting_name",
                    description: "The name of the setting",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: module.getConfigOptions()
                },
                {
                    name: "setting_value",
                    description: "The value of the setting",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        })
    }

    GLOBAL_COMMANDS.push({
        name: "config",
        description: "Configure the bot",
        permission: "ADMINISTRATOR",
        options: configSubCommands,
        onRun: async (interaction) => {
            const setting = MODULE_HANDLER.get(interaction.options.getSubcommand()).getConfigOptions().find((option) => option.value === interaction.options.getString("setting_name"));
            const value = interaction.options.getString("setting_value");

            const type = setting.type;

            // check if the value is valid
            if (SettingsStorage.Validate(type, value) === false) return interaction.reply({ content: "Invalid value!", ephemeral: true });

            // insert setting into settings table if it doesn't exist
            SettingsStorage.SetGuildSetting(interaction.guild.id, setting.value, value);

            if (!interaction.guild.settings) interaction.guild.settings = {};
            interaction.guild.settings[setting.value] = value;

            interaction.reply({ content: `${interaction.options.getString("setting_name")} has been set to ${interaction.options.getString("setting_value")}!`, ephemeral: true });
        }
    })

    // Merge the avaliable commands into a single arrays
    for (const module of Object.values(MODULE_HANDLER.modules)) {
        for (const command of module.getCommands()) {
            COMMANDS.push(command);
        }
    }

    console.log("Commands loaded!")

    // Add the global commands
    for (const command of GLOBAL_COMMANDS) {
        COMMANDS.push(command);
    }

    // Fetch all settings and register them to the guild.
    for (const setting of (await SettingsStorage.GetAllGuildSettings())) {
        client.guilds.fetch(setting.guild_id).then((guild) => {
            if (!guild.settings) guild.settings = {}; 
            guild.settings[setting.setting_name] = setting.setting_value;
        });
    }

    console.log("Settings loaded!")

    // Fetch loaded modules and register them to the guild.
    for (const module of (await SettingsStorage.GetAllGuildModules())) {
        client.guilds.fetch(module.guild_id).then((guild) => {
            if (!guild.modules) guild.modules = []; 
            guild.modules.push(module);
        });
    }

    console.log("Modules loaded!")

    // Enable all modules
    for (const module of Object.values(MODULE_HANDLER.modules)) {
        module.onEnable();
    }

    rest.put(Routes.applicationCommands(client.user.id), { body: GLOBAL_COMMANDS });
})

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    for (const module of message.guild.modules) {
        const module_instance = MODULE_HANDLER.get(module.module_name);
        if (module_instance) {
            module_instance.onMessage(message);
        }
    }
})

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand()) {
        const command = COMMANDS.find((cmd) => cmd.name === interaction.commandName);
        if (!command) return;
        command.onRun(interaction);
    }

    if (interaction.isAutocomplete()) {
        for (const module of Object.values(MODULE_HANDLER.modules)) {
            module.onAutocomplete(interaction);
        }
    }
});

client.login(config.token);