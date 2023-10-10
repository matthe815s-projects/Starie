const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js/typings/index.js");

const actions_types = ["Warning", "Kick", "Ban"];


class CleanRecordCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "cleanrecord",
            description: "Clear a defined row from a user's record",
            aliases: ["cln", "clean"],
            args: [{name: "user", type:"user"}, {name: "number", type: "number"}],
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
                .execute();
        }).then(result => {
            let results = result.fetchAll();
            
            let embed = new RichEmbed();
            embed.setTitle("Record Deletion");
            embed.setFooter(msg.author.tag, msg.author.avatarURL);
            
            if (results.length == 0 || !results[args.number-1]) {
                embed.setDescription(`Record #${args.number} doesn't exist for user ${args.user.tag}.`);
                return msg.channel.send({embed});
            }

            global.MySQL.GetSession()
            .then((session) => {
                return session
                    .getSchema("starie")
                    .getTable("mod_record")
                    .delete()
                    .where(`id = '${results[args.number-1][0]}'`)
                    .execute();
            });

            global.MySQL.GetSession().then((session) => {session.close()});

            embed.addField(`${results[args.number-1][7] ? "❌" : ""} Record #${args.number}`, `${results[args.number-1][4].replace(/&quot;/g, "'") || "No notes added."}\n\nAction: ${actions_types[results[args.number-1][5]]}\nUser: <@${results[args.number-1][1]}>\nModerator: <@${results[args.number-1][2]}>\nTime: ${results[args.number-1][3]}`);
            embed.setDescription(`Record #${args.number} successfully deleted from ${this.client.users.get(results[args.number-1][1]).tag}.`);

            msg.channel.send({embed});
        });
    }
}

module.exports = CleanRecordCommand;