const { ApplicationCommandOptionType } = require("discord.js");
const Module = require("../src/Module");
const { default: axios } = require("axios");
const VersionStorage = require("../src/VersionStorage");

class VersionModule extends Module {
    constructor(discord) {
        super(discord, { member_name: "Version" });

        this.trackedAPIs = [];

        this.commands = [
            {
                name: "api",
                description: "Manage API connections for auto posting",
                permission: "ADMINISTRATOR",
                options: [
                    {
                        name: "add",
                        description: "Adds a new API link to track",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "url",
                                description: "The URL of the API",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            },
                            {
                                name: "key",
                                description: "The key of the API",
                                type: ApplicationCommandOptionType.String,
                                required: true
                            }
                        ]
                    },
                    {
                        name: "remove",
                        description: "Removes an API link from tracking",
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: "project",
                                description: "The project to remove",
                                type: ApplicationCommandOptionType.String,
                                required: true,
                                autocomplete: true,
                            }
                        ]
                    }
                ],
                onRun: async (interaction) => {
                    let url, key;

                    switch (interaction.options.getSubcommand()) {
                        case "add":
                            url = interaction.options.getString("url");
                            key = interaction.options.getString("key");

                            if (!url.match(/(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)) {
                                interaction.reply("Invalid URL!");
                                return;
                            }

                            if ((await this.testApi(url, key)) == false) {
                                interaction.reply("API Link or API key invalid!");
                                return;
                            }

                            // Add to tracked APIs on the cache
                            this.trackedAPIs.push({
                                guild_id: interaction.guild.id,
                                channel_id: this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length > 0 ? this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id)[this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length - 1].channel_id : interaction.channel.id,
                                message_id: this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length > 0 ? this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id)[this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length - 1].message_id : null,
                                api_link: url,
                                api_key: key
                            });

                            // Store the tracked API in the database
                            VersionStorage.StoreTrackedApi(interaction.guild.id, this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length > 0 ? this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id)[this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length - 1].channel_id : interaction.channel.id, this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length > 0 ? this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id)[this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length - 1].message_id : null, url, key);
                            interaction.reply({ content: "Added API link successfully.", ephemeral: true });

                            await this.updateServerApis(interaction.guild);
                            this.updateServerModal(interaction.guild);
                            break;
                        case "remove":
                            url = interaction.options.getString("project");

                            if (!url.match(/(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)) {
                                interaction.reply("Invalid URL!");
                                return;
                            }
                            
                            this.trackedAPIs = this.trackedAPIs.filter((api) => api.guild_id != interaction.guild.id || api.api_link != url);
                            
                            // remove the tracked API from the database
                            VersionStorage.RemoveTrackedApi(interaction.guild.id, this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length > 0 ? this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id)[this.trackedAPIs.filter((api) => api.guild_id == interaction.guild.id).length - 1].channel_id : interaction.channel.id, url);
                            interaction.reply({ content: "Removed API link successfully.", ephemeral: true });
                            break;
                    }
                }
            }
        ]

        this.configCommands = [
            { name: "Inline Fields", value: "inline_fields", type: "boolean" },
        ]
    }

    async onEnable() {
        console.log("Version module has been enabled!");

        this.loadServerApis().then(() => {
            // Update project apis every 5 minutes
            setInterval(() => {
                this.discord.guilds.cache.forEach(async (guild) => {
                    // If the guild doesn't have the module enabled, skip it
                    if (!guild.modules || !guild.modules.find((module) => module.member_name == this.member_name)) return;

                    await this.updateServerApis(guild);
                    this.updateServerModal(guild);
                })
            }, 1000 * 60 * 5);

            this.discord.guilds.cache.forEach(async (guild) => {
                if (!guild.modules || !guild.modules.find((module) => module.module_name == this.member_name)) return;

                await this.updateServerApis(guild);
                this.updateServerModal(guild);
            })
        })
    }

    onDisable() {
        console.log("Version module has been disabled!");
    }

    /**
     * Test the API link and key to see if it's valid
     * @param {String} url 
     * @param {String} key 
     * @returns 
     */
    async testApi(url, key) {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": key
                }
            });

            if (response.status == 200) {
                // if response is not json
                if (response.headers.get("content-type").indexOf("application/json") == -1) {
                    resolve(false);
                    return;
                }
                
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    async updateServerApis(guild) {
        return new Promise(async (resolve, reject) => {
            const guildProjects = this.trackedAPIs.filter((project) => project.guild_id === guild.id);

            if (guildProjects.length === 0) return;

            guild.apis = [];

            // Convert projects into their data
            guildProjects.forEach(async (data) => {
                const project = await this.getProjectData(data);
                project.channel_id = data.channel_id;
                project.message_id = data.message_id;

                if (guild.apis == null) guild.apis = [];
                guild.apis.push(project)

                if (guild.apis.length == guildProjects.length) resolve(guild.apis);
            });
        });
    }

    async updateServerModal(guild) {
        const embed = {
            title: "Project Versions",
            description: "The current versions of all the projects being tracked",
            color: 0x00ff00,
            fields: []
        }

        guild.apis.forEach((api) => [
            embed.fields.push({
                name: api.name,
                value: `**Version:** ${api.version}
                **Downloads:** ${api.downloads}
                **Link:** [Click Here](${api.link})`,
                inline: guild.settings["inline_fields"] == "true" ? true : false
            })
        ])

        const channel = await this.discord.channels.fetch(guild.apis[0].channel_id);

        // Create an embed if there's no message, otherwise edit the embed
        if (guild.apis[0].message_id != null) {
            const message = await channel.messages.fetch(guild.apis[0].message_id);
            message.edit({ embeds: [embed] });
        } else {
            const newMessage = await channel.send({ embeds: [embed] });
            api.message_id = newMessage.id;
        }
    }

    async loadServerApis() {
        this.trackedAPIs = [];
        return new Promise(async (resolve, reject) => {
            const apis = await VersionStorage.GetAllTrackedApis();
            console.log(apis)

            // If there's no APIs there's no APIs.
            if (apis.length === 0) return;

            apis.forEach((api) => {
                this.trackedAPIs.push(api);
            })

            resolve(this.trackedAPIs)
        });
    }

    async getProjectData(api) {
        let { data } = (await axios.get(api.api_link, { headers: { "Accept": "application/json", "x-api-key": api.api_key, "X-GitHub-Api-version": "2022-11-28", "Authorization": `Bearer ${api.api_key}` } }));

        if (Array.isArray(data) || data.data) data = Array.isArray(data) ? data[0] : data.data;

        const project = {
            name: api.name || "Unknown",
            downloads: data.downloadCount || "N/A",
            version: data.tag_name || data.latestFiles[0].displayName || "Unavaliable",
            link: data.url || data.links.websiteUrl || "N/A"
        }

        return project;
    }

    getCommands(guild) {
        return this.commands;
    }

    getConfigOptions(guild) {
        return this.configCommands;
    }

    onAutocomplete(interaction) {
        switch (interaction.options.getSubcommand()) {
            case "remove": // Show all the projects that are being tracked
                const projects = this.trackedAPIs.filter((project) => project.guild_id == interaction.guild.id);
                interaction.respond(projects.map((project) => ({ name: project.name, value: project.api_link })));
                break;
        }
    }
}

module.exports = VersionModule
