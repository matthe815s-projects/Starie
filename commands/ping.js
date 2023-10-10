const { Events } = require("discord.js");
const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");


class CleanRecordCommand extends Command 
{
    pinned = new Map();

    constructor(commandSystem, client)
    {
        super({
            memberName: "ping",
            description: "",
        }, client, commandSystem);
    }

    async Run(msg)
    {
        console.log(msg)
        msg.reply("Pong!")
    }
}

module.exports = CleanRecordCommand;