const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const discord = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class ChannelCommand extends Command {
    constructor(commandSystem, client)
    {
        super({
            name: "channel",
            memberName: "channel",
            description: "Apply or remove the hanging status from a channel",
            category: "General Commands",
            throttling: {
                time: 10,
                usages: 1
            },
            args: [{name: "channel", type: "channel"}, {name: "action", type:"string", restraints:["hanging","message"]}, {name:"todo", type:"string"}],
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
            case "hanging":
                if (args.todo == "true"||args.todo=="1") {
                    global.MySQL.GetSession()
                    .then((session) => {
                        return session
                            .getSchema("starie")
                            .getTable("mod_record")
                            .insert(["channel_id", "guild_id"])
                            .values([args.channel.id, msg.guild.id])
                            .execute();
                    })

                    global.HangingMessage.SetHanging(args.channel.id, true);
                    msg.channel.send(`Okay, I will now display a hanging message in ${args.channel}.`);
                } else {
                    global.MySQL.GetSession()
                    .then((session) => {
                        return session
                            .getSchema("starie")
                            .getTable("mod_record")
                            .delete()
                            .where(`channel_id = '${args.channel.id}'`)
                            .execute();
                    })

                    global.HangingMessage.SetHanging(args.channel.id, false);
                    msg.channel.send(`I will no longer display a hanging message in ${args.channel}.`);
                }
                break;

            case "message":
                global.HangingMessage.SetHangingMessage(args.channel, args.todo);
                msg.channel.send(`${args.channel}'s hanging message has been set to \`${args.todo}\``);
                break;
        }

        global.MySQL.GetSession().then((session) => {session.close()});
    }
}

module.exports = ChannelCommand;