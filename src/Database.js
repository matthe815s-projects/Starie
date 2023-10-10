const { Client } = require('pg');

const DATABASE_CREDENTIALS = { host: '192.168.1.195', user: 'postgres', port: 5433, password: 'admin', database: 'starie' };

function GetConnection () {
    const client = new Client(DATABASE_CREDENTIALS)
    client.connect()
    
    return client;
}

module.exports = {
    GetConnection
}
