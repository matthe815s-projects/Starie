const fs = require("fs");
const path = require("path");

class ModuleLoader {
    constructor(client) {
        this.client = client;
        this.modules = {};
    }

    loadAll() {
        const files = fs.readdirSync(path.join(__dirname, "../", "modules"));

        // Load all modules
        for (const file of files) {
            const module = new (require(path.join(__dirname, "../", "modules", file)))(this.client);
            this.modules[module.member_name.toLowerCase()] = module;
            
            module.onEnable();
        }
    }

    // Load the commands from a module
    load(name) {
        return this.modules[name.toLowerCase()].getCommands();
    }

    get(name) {
        return this.modules[name.toLowerCase()];
    }
} 

module.exports = ModuleLoader;
