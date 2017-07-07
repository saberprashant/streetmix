var config = require('config')

var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db.pg_url);

var Sequence = sequelize.define('sequence', {
  seq: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
  }
},
{
  indexes: [
    {
      unique: true,
      fields: ['seq']
    }
  ],
  underscored: true
});

// Sequence.sync({force: true})
module.exports = Sequence;