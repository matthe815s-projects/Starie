const Database = require("./Database")

// store a new tracked_api
async function StoreTrackedApi(guild_id, channel_id, message_id, api_link, api_key) {
    const client = Database.GetConnection();
    await client.query(`INSERT INTO tracked_apis (guild_id, channel_id, message_id, api_link, api_key) VALUES ($1, $2, $3, $4, $5)`, [guild_id, channel_id, message_id, api_link, api_key]);
    client.end();
    return;
}

// get all tracked apis
async function GetAllTrackedApis() {
    const client = Database.GetConnection();
    const { rows } = await client.query(`SELECT * FROM tracked_apis`);
    client.end();
    return rows;
}

// remove tracked api
async function RemoveTrackedApi(guild_id, channel_id, message_id) {
    const client = Database.GetConnection();
    await client.query(`DELETE FROM tracked_apis WHERE guild_id = $1 AND channel_id = $2 AND message_id = $3`, [guild_id, channel_id, message_id]);
    client.end();
    return;
}

module.exports = {
    StoreTrackedApi,
    GetAllTrackedApis,
    RemoveTrackedApi
}
