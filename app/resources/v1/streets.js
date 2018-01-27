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

  promises = []

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
  
  if (street){
    if (req.loginToken) {
      var p1 = User.findOne({
        where:
        { 
          login_tokens: { $contains: req.loginToken }            
        }
      }).then(function(user){
        if (user) {
          street.user_id = user.id
        }
        return
      }).catch(function (err) {
        // handle error;
        logger.error(err)
        res.status(500).send('Could not find user @loginToken: ' + req.loginToken)
        return
      });
      promises.push(p1)
    }

    if (body && body.originalStreetId) {
      p2 = Street.findOne( {
        where: { 
          id: body.originalStreetId, 
          status: {
            $ne: 'DELETED'
          }
        }
      }).then(function(orig_street){
        if (orig_street){       
          street.original_street_id = orig_street.id
        }
        return
      }).catch(function (err) {
        // handle error;
        logger.error(err)
        res.status(500).send('Could not find original street')
        return
      });
      promises.push(p2)
    }
  }

  Promise.all(promises).then(function() {
    street.save().then(function (savedStreet) {
      res.header('Location', config.restapi.baseuri + '/v1/streets/' + savedStreet.id)
      res.status(201).send(savedStreet)
      return
    }).catch(function (err) {
      logger.error(err)
      res.status(500).send('Could not create street')
      return
    });
  })
} // END function - exports.post

exports.delete = function (req, res) {
  User.findOne({ 
  	where: {
  		login_tokens: { $contains: req.loginToken } 
  	} 
  }).then(function(user){
  	if (!user){
  		res.status(500).send('Could not find signed-in user.')
  		return
  	}

	  Street.findOne({ 
	  	where: {
		  	id: req.params.street_id,
		  	user_id: user_id,
        status: {
          $ne: 'DELETED'
        }
		  }
		}).then(function (street) {
			if(!street){
				res.status(500).send('Could not find street to delete.')
				return
			}

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

  if (!req.params.street_id) {
    res.status(400).send('Please provide street ID.')
    return
  }
	Street.findOne({ id: req.params.street_id }).then(function (street) {
	  res.status(200).send(street)
    return
	}).catch(function (err) {
		// handle error;
		logger.error(err)
	  res.status(500).send('Could not find street.')
	  return
	});
} // END function - exports.get

exports.find = function (req, res) {
	
  var twitter_name = req.query.creatorId
  var namespacedId = req.query.namespacedId
  var offset = (req.query.start && parseInt(req.query.start, 10)) || 0
  var limit = (req.query.count && parseInt(req.query.count, 10)) || 20

  var AsJson = function(streets){
    var json = {
        meta: {
          links: {
            self: config.restapi.baseuri + '/v1/streets?start=' + offset + '&count=' + limit
          }
        },
        streets: streets
      }

    var prevStart, nextStart
    if (offset > limit){
      prevStart = offset - limit
      json.meta.links.prev = config.restapi.baseuri + '/v1/streets?start=' + prevStart + '&count=' + limit
    // } else {
    //   prevStart = 0
    }
    if (streets.length >= limit){
      nextStart = offset + limit
      json.meta.links.next = config.restapi.baseuri + '/v1/streets?start=' + nextStart + '&count=' + limit
    }        
    return json
  }

  var handleFindStreet = function (street) {
    
    if (!street) {
      res.status(404).send('Could not find street.')      
    } else {
      res.set('Access-Control-Allow-Origin', '*')
      res.set('Location', config.restapi.baseuri + '/v1/streets/' + street.id)
      res.set('Content-Length', 0)
      res.status(307).end()
    }    
  } // END function - handleFindStreet

  if (twitter_name) {
  	User.findOne({
			where: { twitter_name: twitter_name }
		}).then(function (user) {
      if (!user){
        res.status(404).send('Could not find user user @twitter_id: ' + twitter_name)
        return
      } else{
        Street.findOne({ 
          where: {
            user_id: user.id,
            status: {$ne: 'DELETED'}
          }
        }).then(function (street) {
          handleFindStreet(street)
          return
        }).catch(function (err) {
          // handle error;
          logger.error(err)
          res.status(500).send('Could not find streets for user user @twitter_id: ' + twitter_name)
          return
        });
      }		  
		}).catch(function (err) {
      // handle error;
      logger.error(err)
      res.status(500).send('Could not find user user @twitter_id: ' + twitter_name)
      return
    });
  } else if (namespacedId && namespacedId !== 'null' && namespacedId !== 'undefined'){
  	Street.findOne({
    	where: { 
        namespaced_id: namespacedId,
        user_id: null,
        status: {$ne: 'DELETED'}
      }
    }).then(function (street) {
		  handleFindStreet(street)
      return
		}).catch(function (err) {
			// handle error;
			logger.error(err)
		  res.status(500).send('Could not find streets for anonymous user.')
		  return
		});
  } else {
  	Street.findAll({ 
    	where: {status: 'ACTIVE' },
    	order: [
    		['updated_at', 'DESC'],
    	],
    	limit: limit,
    	offset: offset
    }).then(function (streets) {
      res.status(200).send(AsJson(streets))
      return
    }).catch(function (err) {
			// handle error;
			logger.error(err)
      res.status(500).send('Could not find street.')
      return
		});
  }
} // END function - exports.find

exports.put = function (req, res) {

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
    } else {
      return street.save().then(function(){
        // handleUpdateStreet(street)
        res.status(204).end('street @id:' + street.id + ' updated.')
        return
      }).catch(function (err) {
        logger.error(err)
        res.status(500).send('Could not find update street @id: ' + street.id)
        return
      });
    }
  } // END function - updateStreetData

  if (!req.params.street_id) {
    res.status(400).send('Please provide street ID.')
    return
  }

  Street.findOne({
    where: { 
      id: req.params.street_id,
      status: {
        $ne: 'DELETED'
      }
    }   
  }).then(function(street){
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
        } else if (street.user_id && (street.user_id !== user.id)) {
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
} // END function - exports.put
