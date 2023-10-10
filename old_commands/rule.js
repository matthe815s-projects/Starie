const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class RuleCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "rule",
            args: [{name:"number", type:"string"}, {name: "user", type:"user"}],
            silentFail: true,
            package: "rules"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES");
    }

    
    async Run(msg, args)
    {
        global.MySQL.GetSession()
        .then((session) => {
            return session.getSchema("starie").getTable("rules").select().where(`number = ${args.number} AND guild_id = '${msg.guild.id}'`).execute();
        })
        .then(result => {
            let rule = result.fetchAll()[0];

            if (!rule)
                return msg.channel.send("Invalid rule number.");

            let embed = new RichEmbed()
                .setAuthor(this.client.user.tag, this.client.user.avatarURL)
                .setDescription(`${rule[1]}. ${rule[2]}`)
                .setFooter(`Last Amended: ${rule[3]}`);

            msg.channel.send(args.user, {embed});
        });
    }
}

module.exports = RuleCommand;
