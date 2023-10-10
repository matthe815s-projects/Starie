const { ApplicationCommandOptionType, Attachment, AttachmentBuilder, MessagePayload } = require("discord.js");
const LevelStorage = require("../src/LevelStorage");
const Module = require("../src/Module");
const { MakeLevelImage } = require("../src/Leveling/LevelRenderer")

class LevelingModule extends Module {
    constructor(discord) {
        super(discord, { member_name: "Leveling" });

        this.leveling = [];

        this.commands = [
            {
                name: "level",
                description: "Shows your level",
                permission: "SEND_MESSAGES",
                options: [
                    {
                        name: "user",
                        description: "The user to display the level of (defaults to you)",
                        type: ApplicationCommandOptionType.User,
                        required: false
                    }
                ],
                onRun: async (interaction) => {
                    const user = interaction.options.getUser("user") ?? interaction.user;
                    const { level, xp } = this.leveling[interaction.guild.id]?.find((level) => level.guild_id === interaction.guild.id && level.user_id === user.id) ?? { level: 0, xp: 0 };

                    const userCard = await MakeLevelImage(Object.assign(user, { level, xp }))
                    interaction.reply({ files: [userCard] });
                }
            }
        ]

        this.configCommands = [
            { name: "Level Up Message", value: "level_up_message", type: "string" },
            { name: "Level Up Broadcast", value: "broadcast_levels", type: "boolean" },
            { name: "EXP Per Message", value: "exp_per_message", type: "number" },
        ]
    }

    async onEnable() {
        console.log("Leveling module has been enabled!");
    
        const leveling = await LevelStorage.GetServerLevels();

        // parse levels
        for (const level of leveling) {
            level.guild_id = level.guild_id.toString();
            level.user_id = level.user_id.toString();
        
            // Set the EXP data and create an empty array if it doesn't exist
            if (!this.leveling[level.guild_id]) {
                this.leveling[level.guild_id] = [];
            }

            this.leveling[level.guild_id].push(level);
        }
    }

    onDisable() {
        console.log("Leveling module has been disabled!");
        this.leveling = [];
    }

    onMessage(message) {
        // set message author xp or push to array if not found
        const index = this.leveling[message.guild.id]?.findIndex((level) => level.guild_id === message.guild.id && level.user_id === message.author.id)

        if (index !== -1) {
            this.leveling[message.guild.id][index].xp += parseInt(message.guild.settings["exp_per_message"]) ?? 1;
        } else {
            // if the guild doesn't exist
            if (!this.leveling[message.guild.id]) {
                this.leveling[message.guild.id] = [];
            }

            this.leveling[message.guild.id].push({
                guild_id: message.guild.id,
                user_id: message.author.id,
                xp: parseInt(message.guild.settings["exp_per_message"]) ?? 1,
                level: 1
            });
        }

        const playerData = this.handlePlayerEXP(message, index == -1 ? this.leveling[message.guild.id].length - 1 : index );

        // save the leveling data
        LevelStorage.SaveUserLevel(playerData);
    }

    handlePlayerEXP(message, index) {
        if (this.leveling[message.guild.id][index].xp >= 100) {
            this.leveling[message.guild.id][index].xp -= 100;
            this.leveling[message.guild.id][index].level += 1;

            // send level up message if enabled
            if (message.guild.settings["broadcast_levels"] == "true") {
                message.channel.send(`Congrats ${message.author}! You leveled up to level ${this.leveling[message.guild.id][index].level}!`);
            }
        }

        return this.leveling[message.guild.id][index];
    }
    
    getCommands(guild) {
        return this.commands;
    }

    getConfigOptions(guild) {
        return this.configCommands;
    }
}

module.exports = LevelingModule
