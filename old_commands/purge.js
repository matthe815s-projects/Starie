const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class PingCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "purge",
            description: "Purge the current channel's messages",
            args: [{name: "amount", type:"number"}, {name: "filter", type:"string", restraints:["user", "contains", "not-contain", "type"], optional: true}, {name: "condition", type:["user", "string", "string", "string"], optional: "filter"}],
            package: "moderation",
            silentFail: true
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES") || msg.member.hasPermission("ADMINISTRATOR");
    }

    async Run(msg, args)
    {
        let msgs = await msg.channel.fetchMessages(args.amount);

        switch (args.filter) {
            case "user":
                msgs = msgs.filter((m) => m.author==args.condition);
            break;

            case "not-contain":
                msgs = msgs.filter((m) => !m.content.includes(args.condition));
            break;

            case "contains":
                msgs = msgs.filter((m) => m.content.includes(args.condition));
            break;

            case "type":
                switch (args.condition) {
                    default:
                    case "text":
                        msgs = msgs.filter((m) => m.attachments.size == 0);
                    break;
                    case "image":
                    case "attachment":
                        msgs = msgs.filter((m) => m.attachments.size != 0);
                    break;

                }
            break;
        }

        msg.channel.bulkDelete(msgs);
    }
}

module.exports = PingCommand;