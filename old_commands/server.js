const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const discord = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class ServerCommand extends Command {
    constructor(commandSystem, client)
    {
        super({
            name: "server",
            memberName: "server",
            description: "Modify local server settings",
            category: "General Commands",
            throttling: {
                time: 10,
                usages: 1
            },
            args: [{name: "action", type:"string", restraints:["prefix"]}, {name:"todo", type:"string"}],
            silentFail: true
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("ADMINISTRATOR");
    }


    async Run(msg, args)
    {
        switch (args.action) {
            case "prefix":
                if (args.todo.length != 1)
                    return msg.channel.send(`\`${args.todo}\` is an invalid prefix. Expected a single-character.`);

                global.ServerSettings.UpdateSetting(msg.guild, "prefix", args.todo);
                msg.guild.settings.prefix = args.todo;

                msg.channel.send(`Okay, I have changed \`${msg.guild.name}\`'s command prefix to \`${args.todo}\``);
                break;
        }
    }
}

module.exports = ServerCommand;