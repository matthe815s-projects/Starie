const { Client: PGClient } = require('pg')
const pgClient = new PGClient({ host: process.env.database, user: 'postgres', port: 5433, password: 'admin', database: 'starie' })
pgClient.connect()

async function MakeMigrations() {
    console.log("Make migrations")
    // enabled modules table by guild
    await pgClient.query(`CREATE TABLE IF NOT EXISTS enabled_modules (
        guild_id BIGINT NOT NULL,
        module_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (guild_id, module_name)
    )`);

    // leveling table by guild
    await pgClient.query(`CREATE TABLE IF NOT EXISTS leveling (
        guild_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        xp BIGINT NOT NULL,
        level BIGINT NOT NULL,
        PRIMARY KEY (guild_id, user_id)
    )`);

    // guild settings table
    await pgClient.query(`CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id BIGINT NOT NULL,
        setting_name VARCHAR(255) NOT NULL,
        setting_value VARCHAR(255) NOT NULL,
        PRIMARY KEY (guild_id, setting_name)
    )`);

    // tracked apis table
    await pgClient.query(`CREATE TABLE IF NOT EXISTS tracked_apis (
        id SERIAL NOT NULL,
        name VARCHAR(255) NOT NULL,
        guild_id BIGINT NOT NULL,
        channel_id BIGINT NOT NULL,
        message_id BIGINT NOT NULL,
        api_link VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
    )`);

    pgClient.end();
}

module.exports = MakeMigrations;