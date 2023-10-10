const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class RulesCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "rules",
            args: [{name:"action", type:"string", restraints: ["add", "remove", "modify"]}],
            silentFail: true,
            package: "rules"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("ADMINISTRATOR");
    }


    Run(msg, args)
    {
        let collector;

        switch (args.action) {
            case "add":
                msg.reply("Please reply with the new rule number.");
                collector = msg.channel.createMessageCollector((m) => m.author.id==msg.author.id, {time: 15000});
                collector.on('collect', m => {
                    let number = m.content.replace(/\D/g, "");

                    if (number=="")
                        msg.reply("Invalid rule number.");

                    msg.reply(`Please enter the text associated with rule #${number}.`);
                    collector.stop();

                    collector = msg.channel.createMessageCollector((mes) => mes.author.id==msg.author.id, {time: 15000});

                    collector.on('collect', m => {
                        global.MySQL.GetSession()
                        .then((session) => {
                            return session
                                .getSchema("starie")
                                .getTable("mod_record")
                                .insert(["number", "description", "lastUpdated", "guild_id"])
                                .values([number, m.content.replace(/'/g, "&quot;"), new Date().getTime(), msg.guild.id])
                                .execute();
                        })

                        msg.reply(`Rule #${number} has been created.`);
                        collector.stop();
                    });
                });
                break;

            case "remove":
                msg.reply("Please reply with the rule number to delete.");

                collector = msg.channel.createMessageCollector((m) => m.author.id==msg.author.id, {time: 15000});
                collector.on('collect', m => {
                    let number = m.content.replace(/\D/g, "");

                    if (number=="")
                        msg.reply("Invalid rule number.");

                    msg.reply(`Rule #${number} successfully removed.`);
                    collector.stop();

                    global.MySQL.GetSession()
                    .then((session) => {
                        return session
                            .getSchema("starie")
                            .getTable("mod_record")
                            .delete()
                            .where(`number = '${number}' AND guild_id='${m.guild.id}'`)
                            .execute();
                    })
                });
                break;

            case "modify":
                msg.reply("Please reply with the rule number to modify.");
                collector = msg.channel.createMessageCollector((m) => m.author.id==msg.author.id, {time: 15000});
                collector.on('collect', m => {
                    let number = m.content.replace(/\D/g, "");

                    if (number=="")
                        msg.reply("Invalid rule number.");

                    msg.reply(`Please enter the text associated with rule #${number}.`);
                    collector.stop();

                    collector = msg.channel.createMessageCollector((mes) => mes.author.id==msg.author.id, {time: 15000});

                    collector.on('collect', m => {
                        global.MySQL.GetSession()
                        .then((session) => {
                            return session
                                .getSchema("starie")
                                .getTable("mod_record")
                                .update()
                                .set('description', m.content.replace(/'/g, "&quot;"))
                                .set('lastUpdated', new Date().getTime())
                                .execute();
                        })
                        msg.reply(`Rule #${number} has been updated.`);
                        collector.stop();
                    });
                });
                break;

            default:
                break;
        }

        global.MySQL.GetSession().then((session) => {session.close()});
    }
}

module.exports = RulesCommand;