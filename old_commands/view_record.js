const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

const actions_types = ["Warning", "Kick", "Ban"];

class PingCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "viewrecord",
            aliases: ["vr","record"],
            description: "View a user's moderation record",
            args: [{name: "user", type: "user"}],
            silentFail: true,
            package: "moderation"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES");
    }

    Run(msg, args)
    {
        global.MySQL.GetSession()
        .then((session) => {
            return session
                .getSchema("starie")
                .getTable("mod_record")
                .select()
                .where(`user = '${args.user.id}' AND guild = '${msg.guild.id}'`)
                .limit(5)
                .execute();
        }).then(result => {
            let records = result.fetchAll();

            let embed = new RichEmbed();
            embed.setAuthor(args.user.username, args.user.avatarURL);
            
            if (records.length > 0) {
                let i = 0;

                embed.setColor(`#${44+(records.length*10)}0000`);

                records.forEach((record) => {
                    i++;

                    embed.addField(`${record[7] ? "❌" : ""} Record #${i}`, `${record[4].replace(/&quot;/g, "'") || "No notes added."}\n\nAction: ${actions_types[record[5]]}\nModerator: <@${record[2]}>\nTime: ${record[3]}`);
                });
            
                embed.setFooter("Maximum of 5 records");
            } else {
                embed.setColor("#11FF11");
                embed.setDescription("This user has a clean record!");
            }

            global.MySQL.GetSession().then((session) => {session.close()});


            embed.setTimestamp(new Date());

            msg.channel.send({embed})
        });
    }
}

module.exports = PingCommand;