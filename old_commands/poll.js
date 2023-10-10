const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");

class PollCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "poll",
            description: "Creat a reaction-based poll",
            silentFail: true,
            args: [{name: "title", type: "string"}, {name:"question", type: "string"}],
        }, client, commandSystem);

        client.on("messageReactionAdd", (reaction, user) => {
            if (user.bot)
                return;

            UpdatePollEmbed(reaction.message, reaction.emoji.name);
        });

        client.on("messageReactionRemove", (reaction, user) => {
            if (user.bot)
            return;

            SubtractPollEmbed(reaction.message, reaction.emoji.name);
        });
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES");
    }

    async Run(msg, args)
    {
        let msgr = await msg.channel.send({embed:CreatePollEmbed(msg, args.title, args.question, ["Yes", "No"])});
        await msgr.react("👍");
        await msgr.react("👎");

        global.MySQL.GetSession()
        .then((session) => {
            return session
                .getSchema("starie")
                .getTable("mod_record")
                .insert(["message_id", "channel_id"])
                .values([msgr.id, msg.channel.id])
                .execute();
        })
    }
}

function CreatePollEmbed(msg, title, question, answers)
{
    let embed = new RichEmbed();
    embed.setTitle(title);
    embed.setDescription(question);

    for (let answer of answers)
        embed.addField(answer, "0");

    embed.setFooter(`Posted by ${msg.author.tag}`, msg.author.avatarURL);
    embed.setTimestamp(new Date().getTime());

    return embed;
}

function CreateUpdatedPollEmbed(msg, title, question, answers, values)
{
    let embed = new RichEmbed();
    embed.setTitle(title);
    embed.setDescription(question);

    let percents = Object.values(DeterminePercentage(values[0], values[1]));

    for (let i=0;i<answers.length;i++)
        embed.addField(answers[i], `${CreatePercentageDisplay(percents[i]/2)} -- ${values[i]}`);

    embed.setFooter(`Posted by ${msg.author.tag}`, msg.author.avatarURL);
    embed.setTimestamp(new Date().getTime());

    return embed;
}

function UpdatePollEmbed(msg, value)
{
    let msgEmbed = msg.embeds[0];
    let embed = null;

    if (value == "👍")
        embed = CreateUpdatedPollEmbed(msg, msgEmbed.title, msgEmbed.description, ["Yes", "No"], [parseInt(msgEmbed.fields[0].value.replace(/\D/g, ""))+1, parseInt(msgEmbed.fields[1].value.replace(/\D/g, ""))]);
    else if (value == "👎")
        embed = CreateUpdatedPollEmbed(msg, msgEmbed.title, msgEmbed.description, ["Yes", "No"], [parseInt(msgEmbed.fields[0].value.replace(/\D/g, "")), parseInt(msgEmbed.fields[1].value.replace(/\D/g, ""))+1]);

    msg.edit({embed});
}

function SubtractPollEmbed(msg, value)
{
    let msgEmbed = msg.embeds[0];
    let embed = null;

    if (value == "👍")
        embed = CreateUpdatedPollEmbed(msg, msgEmbed.title, msgEmbed.description, ["Yes", "No"], [parseInt(msgEmbed.fields[0].value.replace(/\D/g, ""))-1, parseInt(msgEmbed.fields[1].value.replace(/\D/g, ""))]);
    else if (value == "👎")
        embed = CreateUpdatedPollEmbed(msg, msgEmbed.title, msgEmbed.description, ["Yes", "No"], [parseInt(msgEmbed.fields[0].value.replace(/\D/g, "")), parseInt(msgEmbed.fields[1].value.replace(/\D/g, ""))-1]);

    msg.edit({embed});
}

function CreatePercentageDisplay(value)
{
    let displayString = "";

    for (let i=0;i<value;i++)
        displayString+="/";

    return displayString;
}

function DeterminePercentage(value1, value2)
{
    if (value1 == value2)
        return {yes: 50, no: 50}

    let values = {yes: (value1 - value2)/((value1 + value2)/2)*100, no: (value2 - value1)/((value2 + value1)/2)*100};

    if (values.yes < 0)
        values.yes = (-values.yes)/2

    if (values.no < 0)
        values.no = (-values.no)/2

    return values;
}

module.exports = PollCommand;