const Database = require("./Database")

async function GetAllGuildSettings () {
    const client = Database.GetConnection();
    const { rows } = await client.query(`SELECT * FROM guild_settings`);
    
    client.end();
    return rows;
}

async function GetAllGuildModules () {
    const client = Database.GetConnection();
    const { rows } = await client.query(`SELECT * FROM enabled_modules`);

    client.end();
    return rows;
}

async function SetGuildSetting (guild_id, name, value) {
    const client = Database.GetConnection();
    await client.query(`INSERT INTO guild_settings (guild_id, setting_name, setting_value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, setting_name) DO UPDATE SET setting_value = $3`, [guild_id, name, value]);

    client.end();
    return;
}

function Validate (type, value) {
    switch (type) {
        case "string":
            return true;
        case "number":
            return parseInt(value) == value;
        case "boolean":
            return value == true || value == false;
        default:
            return false;
    }
}

module.exports = {
    GetAllGuildSettings,
    GetAllGuildModules,
    SetGuildSetting,
    Validate
}
