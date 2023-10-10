const { Client } = require("discord.js");

class Module {
    /**
     * @typedef {Object} ModuleData
     * @property {Client} discord - The client to use
     * @property {string} member_name - The name of the module
     */

    /**
     * @param {ModuleData} data - The data to construct the module with
     */
    constructor(client, data) {
        this.discord = client;

        this.member_name = data.member_name;
    }

    onEnable() {}

    onDisable() {}

    getCommands(guild) {}

    getConfigOptions() {}

    onMessage(message) {}

    onAutocomplete(interaction) {}
}

module.exports = Module;
