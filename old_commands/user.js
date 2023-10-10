const {createCanvas, loadImage} = require("canvas");
const Command = require("../../Starie Tech 2.0 Remake/src/CommandSystem/Command");
const {RichEmbed} = require("../../Starie Tech 2.0 Remake/node_modules/discord.js");


class UserCommand extends Command 
{
    constructor(commandSystem, client)
    {
        super({
            memberName: "user",
            description: "View a user's data",
            args: [{name: "user", type:"user", optional: true}],
            silentFail: true,
            package: "levels"
        }, client, commandSystem);
    }

    CheckPermission(msg)
    {
        super.CheckPermission(msg);
        return msg.member.hasPermission("MANAGE_MESSAGES");
    }


    async Run(msg, args)
    {
        if (!args.user)
            args.user = msg.author;

        let canvas = createCanvas(504, 192),
            ctx = canvas.getContext('2d');

        let bg = await loadImage("commands/assets/LevelSystem.png"),
            levelBar = await loadImage("commands/assets/LevelBar.png"),
            avatar = await loadImage(args.user.avatarURL||`https://discordapp.com/embed/avatars/${args.user.discriminator%5}.png`),
            levelCounter = await loadImage("commands/assets/LevelCounter.png"),
            staffIcon = await loadImage("commands/assets/dkestaff.png"),
            moderatorIcon = await loadImage("commands/assets/moderator.png");

        let user = await global.CommandSystem.GetUserData(msg.guild.member(args.user));

        if (this.GetLevel(user[2])-(30*this.GetRankOffset(user[2])) > 0) {
            var rank = await loadImage(`commands/assets/RankOverlays/${this.GetLevel(user[2])-(30*this.GetRankOffset(user[2]))}.png`);
            var levelBackground = await loadImage(`commands/assets/TierBackgrounds/Tier${this.GetRankOffset(user[2])+1}.png`);
        }

        ctx.drawImage(bg, 0, 0, 504, 192);
        ctx.drawImage(levelBar, 183, 165, (315 / 140) * (user[2]-((140*(this.GetLevel(user[2])+1))-140)), 21);
        ctx.font = '20px Arial';
        let len = ctx.measureText(user[2]||"0");
        ctx.fillText(user[2]||"0", 218, 143);
        ctx.fillText("0", 388, 143);
        ctx.fillText(args.user.username, msg.guild.member(args.user).hasPermission("MANAGE_MESSAGES") ? 222 : 188, 35);
        ctx.drawImage(avatar, 6, 6, 171, 180);
        //ctx.drawImage(levelCounter, 0, 125, 72, 64);
        if (this.GetLevel(user[2])-(30*this.GetRankOffset(user[2])) > 0) {ctx.drawImage(levelBackground, 0, 125, 72, 64);}
        if (this.GetLevel(user[2])-(30*this.GetRankOffset(user[2])) > 0) {ctx.drawImage(rank, 0, 125, 72, 64)}
        if (args.user.owner) ctx.drawImage(staffIcon, 460, 12, 32, 32);
        if (msg.guild.member(args.user).hasPermission("MANAGE_MESSAGES")) {ctx.drawImage(moderatorIcon, 188, 12, 32, 32)}

        //ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        //ctx.strokeText(this.GetLevel(user[2])+1||1, 17, 174);
        //ctx.fillText(this.GetLevel(user[2])+1||1, 17, 174);

        msg.channel.send({files:[canvas.toBuffer()]});
    }

    GetLevel(exp)
    {
        return Math.floor(exp/140);
    }

    GetRankOffset(exp)
    {
        return Math.floor((this.GetLevel(exp)/30));
    }
}

module.exports = UserCommand;