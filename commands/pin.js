const { Events } = require("discord.js");
const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");


class CleanRecordCommand extends Command 
{
    pinned = new Map();

    constructor(commandSystem, client)
    {
        super({
            memberName: "pin",
            description: "",
            args: [{name: "message", description: "The message to pin.", type:3, required: true}],
        }, client, commandSystem);
        
        let query = global.Postgres.Prepare();
        query.query = "SELECT * FROM pins *";

        global.Postgres.Execute(query).then((result) => {
            result.rows.forEach((row) => {
                console.debug(row);
                this.pinned.set(row.channel_id, row);
            });
        });

        // Resend pinned stuff
        client.on(Events.MessageCreate, async msg => {
            console.debug(msg)
            if (this.pinned.has(msg.channel.id) && this.pinned.get(msg.channel.id) == msg.message_id) {
                msg.channel.messages.fetch(msg.id).then((message) => {
                    message.delete();
                    msg.channel.send(message.content);
                    this.pinned.set(msg.channel.id, { message_id: msg.id, channel_id: msg.channel.id });
                });
            }
        });
    }

    async Run(msg)
    {
        let args = { message: msg.options.getString('message') }

        let message = await msg.channel.messages.fetch(args.message);

        let query = global.Postgres.Prepare();
        query.query = "INSERT INTO pins (message_id, channel_id, guild_id) VALUES ($1, $2, $3) RETURNING *";
        global.Postgres.Execute(query, [message.id, message.channel.id, message.guild.id])

        message.channel.send(message.content);
        this.pinned.set(message.channel.id, message.id);
    }
}

module.exports = CleanRecordCommand;