const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const { EmbedBuilder } = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

const actions_types = ["Warning", "Kick", "Ban"];


class CleanRecordCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "audit",
            description: "",
            args: [{name: "type", description: "test", type:3, choices: [{ name: "Warnings", value: "warnings" }], required: true}, {name: "limit", description: "test", type:4 }],
        }, client, commandSystem);
    }

    async Run(msg)
    {
        let args = { limit: 0 }

        if (!msg.options.getInteger('limit'))
            args.limit = 10;

        let embed = new EmbedBuilder();
        embed.setTitle("Audits");

        switch (msg.options.getString('type')) {
            case "warnings":         
            let query = global.Postgres.Prepare();
            query
                .ForAll("mod_record")
                .RowIs("guild", msg.guild.id)
                .Limit(args.limit)
            global.Postgres.Execute(query)
            .then(result => {
                let records = result.fetchAll();
    
                let embed = new Embed();
                embed.setAuthor(msg.guild.name, msg.guild.iconURL);
                
                if (records.length > 0) {
                    let i = 0;
    
                    records.forEach((record) => {
                        i++;
    
                        embed.addField(`${record[7] ? "❌" : ""} Record #${i}`, `${record[4].replace(/&quot;/g, "'") || "No notes added."}\n\nAction: ${actions_types[record[5]]}\nUser: <@${record[1]}>\nModerator: <@${record[2]}>\nTime: ${record[3]}`);
                    });
                
                    embed.setFooter(`Maximum of ${args.limit} records`);
                } else {
                    embed.setColor("#11FF11");
                    embed.setDescription("This user server has a clean record!");
                }
    
                embed.setTimestamp(new Date());
                msg.channel.send({embed})
            });
            break;
        }
    }
}

module.exports = CleanRecordCommand;