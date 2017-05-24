// var mongoose = require('mongoose')

// var userSchema = new mongoose.Schema({
//   id: { type: String, index: { unique: true } },
//   twitter_id: String,
//   twitter_credentials: mongoose.Schema.Types.Mixed,
//   login_tokens: [ String ],
//   data: mongoose.Schema.Types.Mixed,
//   created_at: Date,
//   updated_at: Date,
//   last_street_id: Number
// })

// userSchema.pre('save', function (next) {
//   var now = new Date()
//   this.updated_at = now
//   this.created_at = this.created_at || now
//   next()
// })

// userSchema.methods.asJson = function (options, cb) {
//   options = options || {}

//   var json = {
//     id: this.id
//   }

//   if (options.auth) {
//     json.data = this.data
//     json.createdAt = this.created_at
//     json.updatedAt = this.updated_at
//   }

//   cb(null, json)
// }

// module.exports = mongoose.model('User', userSchema)


//***********************
var config = require('config')

var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db.pg_url);

var User = sequelize.define('user', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  twitter_id: {
    type: Sequelize.STRING
  },
  twitter_credentials: {
    type: Sequelize.JSONB
  },
  login_tokens: {
    type: Sequelize.JSONB
  },
  login_tokens: {
    type: Sequelize.JSONB
  },
  last_street_id: {
    type: Sequelize.INTEGER
  }
},
{
  indexes: [
    {
      unique: true,
      fields: ['id']
    }
  ],
  underscored: true
});

// User.methods.asJson = function (options, cb) {
//   options = options || {}

//   var json = {
//     id: this.id
//   }

//   if (options.auth) {
//     json.data = this.data
//     json.createdAt = this.created_at
//     json.updatedAt = this.updated_at
//   }

//   cb(null, json)
// }

// force: true will drop the table if it already exists
User.sync({force: true}).then(function () {
  // Table created
  return User.create({
    id: 'jhan',
    twitter_handle: 'John',
    twitter_id: 'Hancock'
  });
});

module.exports = User;