var mongoose = require('mongoose')
var Sequelize = require('sequelize');
var config = require('config')

mongoose.connect(config.db.mongodb_url)

var sequelize = new Sequelize(config.db.pg_url);

// sequelize
//   .authenticate()
//   .then(function(err) {
//     console.log('Posgres Connection has been established successfully.');
//   })
//   .catch(function (err) {
//     console.log('Unable to connect to the postgres database:', err);
//   });