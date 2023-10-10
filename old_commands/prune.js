const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class PingCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "prune",
            description: "Clear inactive users from your server based on provided day count",
            args: [{name: "days", type:"number"}, {name: "reason", type:"string"}],
            package: "moderation",
            silentFail: true
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES") || msg.member.hasPermission("ADMINISTRATOR");
    }

    Run(msg, args)
    {
        msg.guild.pruneMembers(args.days, false, args.reason);
        msg.reply(`I have successfully pruned users who haven't been on Discord for ${args.days} for ${args.reason}`);
    }
}

module.exports = PingCommand;