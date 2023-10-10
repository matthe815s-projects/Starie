const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class PingCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "warn",
            description: "Warn a user, adding to the moderation record",
            args: [{name: "user", type: "user"}, {name: "reason", type: "string"}],
            silentFail: true,
            package: "moderation"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES")
    }

    Run(msg, args)
    {
        if ((msg.guild.member(args.user).hasPermission("ADMINISTRATOR")&&msg.guild.owner!=msg.member)||(msg.guild.member(args.user).hasPermission("MANAGE_MESSAGES") && !msg.member.hasPermission("ADMINSTRATOR")))
            return msg.channel.send("You can't warn that user.");
        else if (msg.author.id == args.user.id)
            return msg.channel.send("You can't warn yourself.");
            
        global.MySQL.GetSession()
        .then((session) => {
            return session
                .getSchema("starie")
                .getTable("mod_record")
                .insert(["user", "moderator", "time", "notes", "action", "guild"])
                .values([args.user.id, msg.author.id, new Date().toDateString(), args.reason.replace(/'/g, "&quot;"), 0, msg.guild.id])
                .execute();
        })

        global.MySQL.GetSession().then((session) => {session.close()});
        
        let embed = new RichEmbed()
                        .setAuthor(args.user.username, args.user.avatarURL)
                        .setDescription(args.reason)
                        .setFooter(`New infraction added by ${msg.author.tag}`, msg.author.avatarURL)
                        .setTimestamp(new Date());

        msg.channel.send({embed});
    }
}

module.exports = PingCommand;