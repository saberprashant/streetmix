var async = require('async')

require('../../../lib/db.js')
var User = require('../../models/user.js')
var Street = require('../../models/street.js')
var logger = require('../../../lib/logger.js')()

exports.get = function (req, res) {
  // var handleFindUser = function (err, user) {
  //   if (err) {
  //     logger.error(err)
  //     res.status(500).send('Could not find user.')
  //     return
  //   }

  //   if (!user) {
  //     res.status(404).send('Could not find user.')
  //     return
  //   }

  //   var json = { streets: [] }

  //   var handleFindStreets = function (err, streets) {
  //     if (err) {
  //       logger.error(err)
  //       res.status(500).send('Could not find streets for user.')
  //       return
  //     }

  //     async.map(
  //       streets,
  //       function (street, callback) { street.asJson(callback) },
  //       function (err, results) {
  //         if (err) {
  //           logger.error(err)
  //           res.status(500).send('Could not append street.')
  //           return
  //         }

  //         json.streets = results
  //         res.status(200).send(json)
  //       }) // END - async.map
  //   } // END function - handleFindStreets

  //   Street.find({ creator_id: user._id, status: 'ACTIVE' })
  //     .sort({ updated_at: 'descending' })
  //     .exec(handleFindStreets)
  // } // END function - handleFindUser

  // Flag error if user ID is not provided
  if (!req.params.user_id) {
    res.status(400).send('Please provide user ID.')
    return
  }

	Street.findAll({
		include: [{
	    model: User,
      where: { twitter_name: req.params.user_id }
    }],
		order: [
			['updated_at', 'DESC'],
		]
	}).then(function (suc) {
	  // console.log(suc)
	  res.status(200).send({streets: suc})
	}).catch(function (err) {
		// handle error;
		logger.error(err)
	  res.status(500).send('Could not find streets for user.')
	  return
	});


	// User
 //  .findOne({
 //    "where": {
 //      "id": param.where
 //    },
 //    "include": [Location]
 //  })
 //  .then(function(user) {
 //    // should get this user
 //    console.log(user);

 //    // should get all locations of this user
 //    console.log(user.Locations);
 //  })
 //  .catch(function(error) {
 //    // error handling
 //  });
} // END function - exports.get
