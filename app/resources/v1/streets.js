var async = require('async')
var config = require('config')
// var uuid = require('uuid')

require('../../../lib/db.js')
var Street = require('../../models/street.js')
var User = require('../../models/user.js')
var Sequence = require('../../models/sequence.js')
var logger = require('../../../lib/logger.js')()

exports.post = function (req, res) {
  var street = Street.build({status: 'ACTIVE'})
  var body

  var requestIp = function (req) {
    if (req.headers['x-forwarded-for'] !== undefined) {
      return req.headers['x-forwarded-for'].split(', ')[0]
    } else {
      return req.connection.remoteAddress
    }
  }

  if (req.body && (req.body.length > 0)) {
    try {
      body = req.body
    } catch (e) {
      res.status(400).send('Could not parse body as JSON.')
      return
    }

    // TODO: Validation

    street.name = body.name
    street.data = body.data
    street.creator_ip = requestIp(req)
  }

  var handleCreateStreet = function (s) {
      // logger.info({ street: s }, 'New street created.')
      res.header('Location', config.restapi.baseuri + '/v1/streets/' + s.id)
      res.status(201).send(s)
  } // END function - handleCreateStreet



  var saveStreet = function () {
    if (body && body.originalStreetId) {    	
      return Street.findOne( {
        where: { 
          id: body.originalStreetId, 
          status: {
            $ne: 'DELETED'
          }
        }
      }).then(function(orig_street){
      	if (orig_street){      	
      		street.original_street_id = orig_street.id;
      	}
      	return
      }).then(function(){
      	return street.save().then(function (){
	      	res.header('Location', config.restapi.baseuri + '/v1/streets/' + s.id)
	      	res.status(201).send(s)
	      	return 
	        // return handleCreateStreet(street)
	      }).catch(function (err) {
					// handle error;
					logger.error(err)
				  res.status(500).send('Could not find_street street: ' + body.originalStreetId)
				});
	    });
    } else {
      return street.save().then(function () {
      	handleCreateStreet(street)
        return
      }).catch(function (err) {
        // handle error;
        logger.error(err)
        res.status(500).send('Could not create street')
      });
    }
  } // END function - saveStreet

  if (req.loginToken) {
  	User.findOne(
    	{ login_tokens: { $contains: req.loginToken } }
    ).then(function(user){     
      street.user_id = user.id
      return saveStreet()
    }).catch(function (err) {
			// handle error;
			logger.error(err)
		  res.status(500).send('Could not find user @loginToken: ' + req.loginToken)
		});
  } else {    
    return saveStreet()
  }
} // END function - exports.post

exports.delete = function (req, res) {
	console.log("Street Delete entered")
  // var handleDeleteStreet = function (err, s) {
  //   if (err) {
  //     logger.error(err)
  //     res.status(500).send('Could not delete street.')
  //     return
  //   }

  //   res.status(204).end()
  // } // END function - handleDeleteStreet

  // var handleFindStreet = function (err, street) {
  //   if (err) {
  //     logger.error(err)
  //     res.status(500).send('Could not find street.')
  //     return
  //   }

  //   if (!street) {
  //     res.status(204).end()
  //     return
  //   }

  //   var handleFindUser = function (err, user) {
  //     if (err) {
  //       logger.error(err)
  //       res.status(500).send('Could not find signed-in user.')
  //       return
  //     }

  //     if (!user) {
  //       res.status(401).send('User is not signed-in.')
  //       return
  //     }

  //     if (!street.creator_id) {
  //       res.status(403).send('Signed-in user cannot delete this street.')
  //       return
  //     }

  //     if (street.creator_id.toString() !== user._id.toString()) {
  //       res.status(403).send('Signed-in user cannot delete this street.')
  //       return
  //     }

  //     street.status = 'DELETED'
  //     street.save(handleDeleteStreet)
  //   } // END function - handleFindUser

  //   User.findOne({ login_tokens: { $in: [ req.loginToken ] } }, handleFindUser)
  // } // END function - handleFindStreet

  // if (!req.loginToken) {
  //   res.status(401).end()
  //   return
  // }

  // if (!req.params.street_id) {
  //   res.status(400).send('Please provide street ID.')
  //   return
  // }
  console.log("looking for user with token: " + req.loginToken + "(" + typeof req.loginToken + ")")
  User.findOne({ 
  	where: {
  		login_tokens: { $contains: '1' } 
  	} 
  }).then(function(user){
  	if (!user){
  		res.status(500).send('Could not find signed-in user.')
  		return
  	}
  	console.log('user found: @' + user.twitter_id)
  	console.log("searching for street @id" + req.params.street_id )
	  Street.findOne({ 
	  	where: {
		  	id: req.params.street_id,
		  	user_id: user_id
		  }
		}).then(function (street) {
			if(!street){
				res.status(500).send('Could not find street to delete.')
				return
			}
		  console.log('deleting: ' + street.name)
		  street.update({status: 'DELETED'}).then(function(suc){
		  	res.status(204).end()
		  }).catch(function (err) {
				// handle error;
				logger.error(err)
			  res.status(500).send('Could not delete street: ' + street.name)
			});		  
		  // handleFindStreet(street)
		}).catch(function (err) {
			// handle error;
			logger.error(err)
		  res.status(500).send('Could not find street to delete.')
		}); 


  }).catch(function (err) {
		// handle error;
		logger.error(err)	
		res.status(500).send('Could not find signed-in user.')
	});


  
} // END function - exports.delete

exports.get = function (req, res) {

  // var handleFindStreet = function (err, street) {
  //   if (err) {
  //     logger.error(err)
  //     res.status(500).send('Could not find street.')
  //     return
  //   }

  //   if (!street) {
  //     res.status(404).send('Could not find street.')
  //     return
  //   }

  //   if (street.status === 'DELETED') {
  //     res.status(410).send('Could not find street.')
  //     return
  //   }

  //   res.header('Last-Modified', street.updated_at)
  //   if (req.method === 'HEAD') {
  //     res.status(204).end()
  //     return
  //   }

  //   street.asJson(function (err, streetJson) {
  //     if (err) {
  //       logger.error(err)
  //       res.status(500).send('Could not render street JSON.')
  //       return
  //     }

  //     res.set('Access-Control-Allow-Origin', '*')
  //     res.set('Location', config.restapi.baseuri + '/v1/streets/' + street.id)
  //     res.status(200).send(streetJson)
  //   })
  // } // END function - handleFindStreet

  if (!req.params.street_id) {
    res.status(400).send('Please provide street ID.')
    return
  }
	Street.findOne({ id: req.params.street_id }).then(function (suc) {
	  // console.log(suc)
	  res.status(200).send(suc)
	}).catch(function (err) {
		// handle error;
		logger.error(err)
	  res.status(500).send('Could not find street.')
	  return
	});
} // END function - exports.get

exports.find = function (req, res) {
	
  var user_id = req.query.creatorId
  var namespacedId = req.query.namespacedId
  var start = (req.query.start && parseInt(req.query.start, 10)) || 0
  var count = (req.query.count && parseInt(req.query.count, 10)) || 20

  var handleFindStreet = function (err, street) {
    // if (err) {
    //   logger.error(err)
    //   res.status(500).send('Could not find street.')
    //   return
    // }

    if (!street) {
      res.status(404).send('Could not find street.')
      return
    }

    if (street.status === 'DELETED') {
      res.status(410).send('Could not find street.')
      return
    }

    res.set('Location', config.restapi.baseuri + '/v1/streets/' + street.id)
    res.set('Content-Length', 0)
    res.status(307).end()
  } // END function - handleFindStreet

  var handleFindUser = function (err, user) {
    if (err || !user) {
      res.status(404).send('Creator not found.')
      return
    }

    Street.findOne({ namespaced_id: namespacedId, user_id: user._id }, handleFindStreet)
  } // END function - handleFindUser

  var handleFindStreets = function (results){// (err, results) {
    // if (err) {
    //   logger.error(err)
    //   res.status(500).send('Could not find streets.')
    //   return
    // }
// console.log("executing handleFIndStreets")

    var totalNumStreets = results[0]
    var streets = results[1]

    var selfUri = config.restapi.baseuri + '/v1/streets?start=' + start + '&count=' + count

    var json = {
      meta: {
        links: {
          self: selfUri
        }
      },
      streets: []
    }

    if (start > 0) {
      var prevStart, prevCount
      if (start >= count) {
        prevStart = start - count
        prevCount = count
      } else {
        prevStart = 0
        prevCount = start
      }
      json.meta.links.prev = config.restapi.baseuri + '/v1/streets?start=' + prevStart + '&count=' + prevCount
    }

    if (start + streets.length < totalNumStreets) {
      var nextStart, nextCount
      nextStart = start + count
      nextCount = Math.min(count, totalNumStreets - start - streets.length)
      json.meta.links.next = config.restapi.baseuri + '/v1/streets?start=' + nextStart + '&count=' + nextCount
    }

    async.map(
      streets,
      function (street, callback) { street.asJson(callback) },
      function (err, results) {
        if (err) {
          logger.error(err)
          res.status(500).send('Could not append street.')
          return
        }

        json.streets = results
        res.status(200).send(json)
      }) // END - async.map
  } // END function - handleFindStreets

  if (user_id) {
  	User.findOne({
			where: { twitter_id: user_id },
			order: [
				['updated_at', 'DESC'],
			],
    	limit: count,
    	offset: start
		}).then(function (user) {
		  return Street.findAll({ 
      	where: {user_id: user.id, status: 'ACTIVE' },
      	order: [
      		['updated_at', 'DESC'],
      	],
      	limit: count,
      	offset: start
      })
		}).then(function (streets) {
	      res.status(200).send(streets)
        return
	  }).catch(function (err) {
			// handle error;
			logger.error(err)
		  res.status(500).send('Could not find steets for user user.' + user_id)
		  return
		});
  } else if (namespacedId && namespacedId !== 'null' && namespacedId !== 'undefined'){
  	console.log("streets find w/ namespacedId: " + namespacedId)  	
    Street.findOne({
    	where: { namespaced_id: namespacedId, user_id: null },
    	order: [
				['updated_at', 'DESC'],
			],
			offset: start,
			limit: count
    }).then(function (streets) {
		  // console.log(streets)
		  res.status(200).send(streets)
		}).catch(function (err) {
			// handle error;
			logger.error(err)
		  res.status(500).send('Could not find streets for anonymous user.')
		  return
		});
  } else {
  	console.log("get all active streets")
    // async.parallel([
    //   function (callback) { Street.count({ status: 'ACTIVE' }, callback) },
    //   function (callback) {
        Street.findAll({ 
        	where: {status: 'ACTIVE' },
        	order: [
        		['updated_at', 'DESC'],
        	],
        	limit: count,
        	offset: start	        	
        }).then(function (streets) {
		      // console.log(streets)
		      res.status(200).send(streets)
		    }).catch(function (err) {
	  			// handle error;
	  			logger.error(err)
		      res.status(500).send('Could not find street.')
		      return
				});
		  // }
    // ])
  }
} // END function - exports.find

exports.put = function (req, res) {
  console.log("\nstreets - PUT begin\n")
  var body

  if (req.body) {
    try {
      body = req.body
    } catch (e) {
      res.status(400).send('Could not parse body as JSON.')
      return
    }
  } else {
    res.status(400).send('Street information not specified.')
    return
  }

  var updateStreetData = function (street) {
    street.name = body.name || street.name
    street.data = body.data || street.data

    if (body.originalStreetId) {
      Street.findOne({ id: body.originalStreetId }).then(function(orig_street){
        if (!orig_street) {
          res.status(404).send('Original street not found.')
          return// Promise.resolve()
        }
        street.original_street_id = orig_street.id
        // return handleFindOriginalStreet(orig_street)
      }).catch(function (err) {
        logger.error(err)
        res.status(500).send('Could not find street @id: ' + body.originalStreetId)
        return
      });
    } 
    // else {
      return street.save().then(function(){
        // handleUpdateStreet(street)
        res.status(204).end('street @id:' + street.id + ' updated.')
        return
      }).catch(function (err) {
        logger.error(err)
        res.status(500).send('Could not find update street @id: ' + street.id)
        return
      });
    // }
  } // END function - updateStreetData

  if (!req.params.street_id) {
    res.status(400).send('Please provide street ID.')
    return
  }

  Street.findOne(
    {
      where: 
        { 
          id: req.params.street_id,
          status: {
              $ne: 'DELETED'
            }
        }
    }
  ).then(function(street){
    if (!street) {
      res.status(404).send('Could not find street.')      
    } else if (!street.user_id){
      return updateStreetData(street)
    } else if (!req.loginToken) {
      res.status(401).end()      
    } else {
      return User.findOne(
        { 
          where: {
            login_tokens: { $contains: req.loginToken },
            id: {$ne: null}
          }
        }
      ).then(function(user){
        if (!user) {
          res.status(401).send('User is not signed-in.')
        } else if (street.creator_id !== user.id) {
          res.status(403).send('Signed-in user cannot update this street.')          
        } else{
          return updateStreetData(street)
        }
        return Promise.resolve()
      }).catch(function (err) {
        logger.error(err)
        res.status(500).send('Could not find user @loginToken: ' + req.loginToken)
        return
      });
    }
    return
  }).catch(function (err) {
    logger.error(err)
    res.status(500).send('Could not find street @id: ' + req.params.street_id)
    return
  });
  console.log("\nstreets - PUT end\n")
} // END function - exports.put
