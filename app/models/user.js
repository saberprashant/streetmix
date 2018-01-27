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
var Street = require('./street.js')

var User = sequelize.define('user', 
  {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    twitter_id: {
      type: Sequelize.STRING,
      unique: true
    },
    twitter_name: {
      type: Sequelize.STRING,
      unique: true
    },
    twitter_credentials: {
      type: Sequelize.JSONB
    },
    login_tokens: {
      type: Sequelize.JSONB
    },
    //not used 
    // last_street_id: {
    //   type: Sequelize.INTEGER
    // },
    profileImageUrl: {
      type: Sequelize.VIRTUAL,
      validate: {
        isUrl: true,
      }
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['id', 'twitter_id', 'twitter_name', 'login_tokens']
      }
    ],
    underscored: true
  }
  // ,{
  //   classMethods: {
  //     associate: function(models) {
  //       User.hasMany(models.Street)
  //     }
  //   }
  // }
);

// User.hasMany(Street);
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
// User.sync({force: true})
// force: true will drop the table if it already exists
// User.sync().then(function () {
//   // Table created
//   // return User.create({    
//   //   twitter_id: 'TwitterUser1',
//   // login_tokens: JSON.stringify([])
//   // });
// });

  // User.sync().then(function () {
  //   User.findOne({where: {twitter_id: 'TwitterUser1'}}).then( function(user){
  //     user.login_tokens = JSON.stringify([]);
  //   user.save();
  //   })    
  // }).catch(function (err) {
  //   // handle error;
  //   console.log(err)
    
  //   return
  // });

// console.log("models:  " + sequelize.models.Street);
// User.hasMany(Street);
module.exports = User;