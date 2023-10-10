const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {
    RichEmbed
} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

const actions_types = ["Warning", "Kick", "Ban"];


class PingCommand extends Command {
    constructor(commandSystem, client) {
        super({
            memberName: "cleanrecords",
            description: "Clear a series of rows from a user's record",
            aliases: ["clns", "cleans"],
            args: [{
                name: "user",
                type: "user"
            }, {
                name: "number",
                type: "number"
            }],
            package: "moderation",
            silentFail: true
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES");
    }

    Run(msg, args) {
        global.MySQL.GetSession()
        .then((session) => {
            return session
                .getSchema("starie")
                .getTable("mod_record")
                .select()
                .where(`user = '${args.user.id}' AND guild = '${msg.guild.id}'`)
                .execute();
        }).then((rows) => {
            let results = rows.fetchAll();

            if (args.number > results.length)
                args.number = results.length;

            let embed = new RichEmbed();
            embed.setTitle("Record Deletion");
            embed.setFooter(msg.author.tag, msg.author.avatarURL);

            if (results.length == 0 || !results[args.number - 1]) {
                embed.setDescription(`Record #${args.number} doesn't exist for user ${args.user.tag}.`);
                return msg.channel.send({
                    embed
                });
            }

            let del = 0,
                users = [];

            results.forEach(record => {
                if (del >= args.number) return;
                
                global.MySQL.GetSession()
                .then((session) => {
                    return session
                        .getSchema("starie")
                        .getTable("mod_record")
                        .delete()
                        .where(`id = '${record[0]}'`)
                        .execute();
                });

                embed.addField(`${record[7] ? "❌" : ""} Record #${del+1}`, `${record[4].replace(/&quot;/g, "'") || "No notes added."}\n\nAction: ${actions_types[record[5]]}\nUser: <@${record[1]}>\nModerator: <@${record[2]}>\nTime: ${record[3]}`);

                if (!users.includes(this.client.users.get(record[1]).tag))
                    users.push(this.client.users.get(record[1]).tag);

                del++;
            });

            if (msg.member.roles.has("632319297141735424") || msg.member.hasPermission("ADMINISTRATOR"))
                embed.setDescription(`${args.number} Record${args.number > 1 ? "s" : ""} from ${users.map((usr) => { if (users.indexOf(usr) != users.length-1) return `${usr}, `; else { if (args.number > 1 && users.length > 1) return `and ${usr}`; else return usr; }})} ${args.number > 1 ? "have" : "has"} been successfully deleted.`);
            else
                embed.setDescription(`${args.number} Record${args.number > 1 ? "s" : ""} from ${users.map((usr) => { if (users.indexOf(usr) != users.length-1) return `${usr}, `; else { if (args.number > 1 && users.length > 1) return `and ${usr}`; else return usr; }})} ${args.number > 1 ? "have" : "has"} been queued for deletion.`);

            global.MySQL.GetSession().then((session) => {session.close()});

            msg.channel.send({embed});
        })
    }
}

module.exports = PingCommand;