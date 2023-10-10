const Database = require("./Database")

async function GetServerLevels() {
    const client = Database.GetConnection();
    const { rows } = await client.query(`SELECT * FROM leveling`)

    client.end()
    return rows
}

async function SaveUserLevel(level) {
    const client = Database.GetConnection();
    await client.query(`INSERT INTO leveling (guild_id, user_id, xp, level) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = $3::int, level = $4::int`, [level.guild_id, level.user_id, level.xp, level.level])

    client.end()
    return
}

const LevelStorage = {
    GetServerLevels,
    SaveUserLevel
}

module.exports = LevelStorage
