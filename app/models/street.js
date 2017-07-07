// var mongoose = require('mongoose')
// var async = require('async')
// var User = require('./user.js')

// var streetSchema = new mongoose.Schema({
//   id: { type: String, index: { unique: true } },
//   namespaced_id: { type: Number, index: true },
//   status: { type: String, enum: [ 'ACTIVE', 'DELETED' ], default: 'ACTIVE' },
//   name: String,
//   creator_id: {
//     type: mongoose.Schema.ObjectId,
//     ref: mongoose.model('User'),
//     index: true
//   },
//   data: mongoose.Schema.Types.Mixed,
//   created_at: { type: Date, index: true },
//   updated_at: { type: Date, index: true },
//   creator_ip: String
// })

// streetSchema.add({
//   original_street_id: {
//     type: mongoose.Schema.ObjectId,
//     ref: streetSchema
//   }
// })

// streetSchema.pre('save', function (next) {
//   var now = new Date()
//   this.updated_at = now
//   this.created_at = this.created_at || now
//   next()
// })

// streetSchema.methods.asJson = function (cb) {
//   var json = {
//     id: this.id,
//     namespacedId: this.namespaced_id,
//     name: this.name,
//     data: this.data,
//     createdAt: this.created_at,
//     updatedAt: this.updated_at
//   }

//   var creatorId = this.creator_id
//   var originalStreetId = this.original_street_id

//   var appendCreator = function (callback) {
//     if (creatorId) {
//       User.findById(creatorId, function (err, creator) {
//         if (err) {
//           callback(err)
//         } else {
//           creator.asJson(null, function (err, creatorJson) {
//             if (err) {
//               callback(err)
//             } else {
//               json.creator = creatorJson
//               callback()
//             } // END else
//           })
//         } // END else
//       })
//     } else {
//       callback()
//     }
//   } // END function - appendCreator

//   var appendOriginalStreetId = function (callback) {
//     if (originalStreetId) {
//       mongoose.model('Street').findById(originalStreetId, function (err, originalStreet) {
//         if (err) {
//           callback(err)
//         } else {
//           json.originalStreetId = originalStreet.id
//           callback()
//         } // END else
//       })
//     } else {
//       callback()
//     }
//   } // END function - appendOriginalStreetId

//   async.parallel([
//     appendCreator,
//     appendOriginalStreetId
//   ], function (err) {
//     cb(err, json)
//   })
// }

// module.exports = mongoose.model('Street', streetSchema)
var config = require('config')

var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db.pg_url);
var User = require('./user.js');
var Street = sequelize.define('street', {
	id: {
	      type: Sequelize.INTEGER,
	      autoIncrement: true,
	      primaryKey: true
	  },
	  name: {
	    type: Sequelize.STRING
	  },
	  status: {
	    type: Sequelize.STRING
	  },
	  data: {
	    type: Sequelize.JSONB
	  },
	  creator_ip: {
	    type: Sequelize.STRING
	  },
	  namespaced_id: {
	    type: Sequelize.INTEGER
	  },
	  user_id: {
	    type: Sequelize.INTEGER
	  },
	  original_street_id: {
	    type: Sequelize.INTEGER
	  }	  
	},
	{
	  indexes: [
	    {
	      unique: true,
	      fields: ['id','user_id']
	    }
	  ],
	  underscored: true
	}
	// ,{
 //    classMethods: {
 //      associate: function(models) {
 //        Street.belongsTo(models.User)
 //      }
 //    }
 //  }
);
Street.belongsTo(User);

// Street.sync().then(function () {
//   // Table created
//   // return Street.create({    
//   //   name: 'My St',
//   //   status: 'ACTIVE',
//   //   user_id: 1
//   // });

  // return Street.create({    
  //   name: 'My Anonymous St',
  //   status: 'ACTIVE',
  //   namespaced_id: 1
  // });
// });
// Street.sync({force: true})


module.exports = Street;