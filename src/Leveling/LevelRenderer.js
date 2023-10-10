const Canvas = require('canvas')
const path = require('path')

const POSITIONS = {
    AvatarBG: {
        x: 10,
        y: 30,
    },
    Username: {
        x: 70,
        y: 20,
    }
}

async function MakeLevelImage(user) {    
    const canvas = Canvas.createCanvas(240, 100);
    const ctx = canvas.getContext('2d');

    const avatarBackground = await Canvas.loadImage(path.resolve("src/Leveling/assets/avatar_background.png"));
    const bg = await Canvas.loadImage(path.resolve("src/Leveling/assets/background.png"));
    const levelBar = await Canvas.loadImage(path.resolve("src/Leveling/assets/bar.png"));
    const levelBarBg = await Canvas.loadImage(path.resolve("src/Leveling/assets/bar_bg.png"));

    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png' }))
    const percentage = (150 / 100) * ((user.xp / (100 * user.level)) * 100);
    console.log(percentage)

    ctx.drawImage(bg, 0, 0, 240, 110);
    ctx.drawImage(avatarBackground, POSITIONS.AvatarBG.x, POSITIONS.AvatarBG.y, 64, 64);
    ctx.drawImage(avatar, POSITIONS.AvatarBG.x + 1, POSITIONS.AvatarBG.y + 1, 62, 62);
    ctx.drawImage(avatarBackground, POSITIONS.AvatarBG.x + 40, POSITIONS.AvatarBG.y + 40, 24, 24);
    ctx.drawImage(levelBarBg, 76, POSITIONS.AvatarBG.y + (60 - 11), 150, 13);
    ctx.drawImage(levelBar, 77, POSITIONS.AvatarBG.y + (60 - 10), percentage, 11);

    ctx.drawImage(avatarBackground, 76, POSITIONS.AvatarBG.y + (60 - 20), 30, 10);

    // 20 px Arial in white with black stroke
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    ctx.strokeText(user.level, POSITIONS.AvatarBG.x + 40, POSITIONS.AvatarBG.y + 60);
    ctx.fillText(user.level, POSITIONS.AvatarBG.x + 40, POSITIONS.AvatarBG.y + 60);
    ctx.strokeText(user.username, POSITIONS.Username.x, POSITIONS.Username.y);
    ctx.fillText(user.username, POSITIONS.Username.x, POSITIONS.Username.y);

    return canvas.toBuffer();
}

module.exports = {
    MakeLevelImage
}
