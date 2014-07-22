if (!global.hasOwnProperty('db')) {
    var Sequelize = require('sequelize');
    var sq = null;
    var fs = require('fs');
    global.db = {
        Sequelize: Sequelize,
        sequelize: sq,
        // Order: sq.import(__dirname + '/order')
    };
}
module.exports = global.db;
