const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

const actions_types = ["Warning", "Kick", "Ban"];


class CleanRecordCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "level-edit",
            description: "Edit levels",
            aliases: ["le", "lv-edit"],
            args: [{name: "user", type:"user"},{name: "number", type: "number"}, {name: "action", type:"string", optional: true, restraints: ["add", "remove", "multiply", "divide"]}],
            silentFail: true,
            package: "levels"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("ADMINISTRATOR");
    }


    async Run(msg, args)
    {
        let embed = new RichEmbed();
        embed.setTitle("Level Edit");
        embed.setFooter(msg.author.tag, msg.author.avatarURL);

        let user = await global.CommandSystem.GetUserData(msg.guild.member(args.user));
        let exp = args.number;

        switch (args.action) {
            case "add":
                exp=user[2]+args.number;
            break;

            case "remove":
                exp=user[2]-args.number;
            break;

            case "multiply":
                exp=user[2]*args.number;
            break;

            case "divide":
                exp=user[2]/args.number;
            break;
        }

        global.MySQL.GetSession()
        .then((session) => {
            return session
                .getSchema("starie")
                .getTable("user_data")
                .update()
                .set("exp", exp)
                .where(`user_id = '${args.user.id}' && guild_id = '${msg.guild.id}'`)
                .execute();
        });

        msg.guild.member(args.user).data.exp = exp;

        global.MySQL.GetSession().then((session) => {session.close()});
        embed.setDescription(`User \`${args.user.tag}\`'s EXP was set to \`${exp}\`.`);
        msg.channel.send({embed});
    }
}

module.exports = CleanRecordCommand;