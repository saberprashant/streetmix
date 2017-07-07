var config = require('config')
var uuid = require('uuid')
var Twitter = require('twitter')
var User = require('../../models/user.js')
var logger = require('../../../lib/logger.js')()

exports.post = function (req, res) {
  var loginToken = null

  var handleTwitterSignIn = function (twitterCredentials) {
    // TODO: Call Twitter API with OAuth access credentials to make sure they are valid

    var handleCreateUser = function (user) {
      var userJson = { id: user.twitter_id, loginToken: loginToken }
      logger.info({ user: userJson }, 'New user created.')
      res.header('Location', config.restapi.baseuri + '/v1/users/' + user.twitter_name)
      res.status(201).send(userJson)
    } // END function - handleCreateUser

    var handleUpdateUser = function (user) {
      var userJson = { id: user.twitter_id, loginToken: loginToken }
      logger.info({ user: userJson }, 'Existing user issued new login token.')

      res.header('Location', config.restapi.baseuri + '/v1/users/' + user.twitter_id)
      res.status(200).send(userJson)
    } // END function - handleUpdateUser

    var handleFindUser = function (user) {
      // if (err) {
      //   logger.error(err)
      //   res.status(500).send('Error finding user with Twitter ID.')
      //   return
      // }

      loginToken = uuid.v1()
      if (!user) {
        User.create({
          twitter_name: twitterCredentials.screenName,
          twitter_id: twitterCredentials.userId,
          twitter_credentials: {
            access_token_key: twitterCredentials.oauthAccessTokenKey,
            access_token_secret: twitterCredentials.oauthAccessTokenSecret
          },
          login_tokens: [ loginToken ]
        }).then(function(user){
          handleCreateUser(user)
        }).catch(function (err) {
          // handle error;
          logger.error(err)
          res.status(500).send('Error finding user with Twitter ID.')
          return
        });
        // u.save(handleCreateUser)
      } else {
        user.twitter_name = twitterCredentials.screenName
        user.twitter_credentials = {
          access_token_key: twitterCredentials.oauthAccessTokenKey,
          access_token_secret: twitterCredentials.oauthAccessTokenSecret
        }
        tokens = user.login_tokens
        tokens.push(loginToken)        
        user.login_tokens = tokens

        user.save().then(handleUpdateUser).catch(function (err) {
          // handle error;
          logger.error(err)
          res.status(500).send('Error finding user with Twitter ID.')
          return
        });
      }
    } // END function - handleFindUser

    // Try to find user with twitter ID
    User.findOne({ where: { twitter_id: twitterCredentials.userId } }).then(handleFindUser).catch(function (err) {
      // handle error;
      logger.error(err)
      res.status(500).send('Error finding user with Twitter ID.')
      return
    });
  } // END function - handleTwitterSignIn

  var body
  try {
    body = req.body
  } catch (e) {
    res.status(400).send('Could not parse body as JSON.')
    return
  }

  if (body.hasOwnProperty('twitter')) {
    // TODO: Validation

    handleTwitterSignIn(body.twitter)
  } else {
    res.status(400).send('Unknown sign-in method used.')
  }
} // END function - exports.post

exports.get = function (req, res) {
  var handleFindUserById = function (user) {
    if (!user) {
      res.status(404).send('User not found.')
      return Promise.resolve()
    }
    var twitterApiClient
    try {
      twitterApiClient = new Twitter({
        consumer_key: config.twitter.oauth_consumer_key,
        consumer_secret: config.twitter.oauth_consumer_secret,
        access_token_key: user.twitter_credentials.access_token_key,
        access_token_secret: user.twitter_credentials.access_token_secret
      })
    } catch (e) {
      logger.error('Could not initialize Twitter API client. Error:')
      logger.error(e)
    }
    
    var sendUserJson = function (twitterData) {
      var auth = (user.login_tokens.indexOf(req.loginToken) > 0)

      if (auth){
        user.profile_image_url_https = twitterData.profile_image_url_https
      }

      res.status(200).send(user)

    } // END function - sendUserJson

    var responseAlreadySent = false
    var handleFetchUserProfileFromTwitter = function (err, res) {
      if (err) {
        logger.error('Twitter API call users/show returned error.')
        logger.error(err)
      }

      if (responseAlreadySent) {
        logger.debug({ profile_image_url: res.profile_image_url }, 'Twitter API users/show call returned but response already sent!')
      } else {
        logger.debug({ profile_image_url: res.profile_image_url }, 'Twitter API users/show call returned. Sending response with Twitter data.')
        responseAlreadySent = true

        if (!res) {
          logger.error('Twitter API call users/show did not return any data.')
        }

        sendUserJson(res)
      }
    } // END function - handleFetchUserProfileFromTwitter

    if (twitterApiClient) {
      logger.debug('About to call Twitter API: /users/show.json?user_id=' + user.twitter_id)
      twitterApiClient.get('/users/show.json', { user_id: user.twitter_id }, handleFetchUserProfileFromTwitter)
      setTimeout(
        function () {
          if (!responseAlreadySent) {
            logger.debug('Timing out Twitter API call after %d milliseconds and sending partial response.', config.twitter.timeout_ms)
            responseAlreadySent = true
            sendUserJson()
          }
        },
        config.twitter.timeout_ms)
    } else {
      sendUserJson()
    }
    return
  } // END function - handleFindUserById

  // Flag error if user ID is not provided
  if (!req.params.user_id) {
    res.status(400).send('Please provide user ID.')
    return
  }

  var userId = req.params.user_id

  var handleFindUserByLoginToken = function (user) {
    // console.log("\n\nhandleFindUserByLoginToken\n\n")
    // if (err) {
    //   logger.error(err)
    //   res.status(500).send('Error finding user.')
    //   return
    // }

    if (!user) {
      res.status(401).send('User with that login token not found.')
      return Promise.resolve()
    }

    return User.findOne({ 
      where: { twitter_id: user.twitter_id } 
    }).then(function(user){
      return handleFindUserById(user)
    }).catch(function(err){
      logger.error(err)
      res.status(500).send('Error finding user ' + user.twitter_id)
      return
    })
  } // END function - handleFindUserByLoginToken

  if (req.loginToken) {
    console.log("look for user")
    User.findOne({ 
      where: { 
        login_tokens: { $contains:  req.loginToken  } 
      } 
    }).then(function(user) {
      return handleFindUserByLoginToken(user)
    }).catch(function(err){
      logger.error(err)
      res.status(500).send('Error finding user.')
      return
    })

  } else {
    User.findOne({where: { twitter_id: userId }}).then(function (user) {
     return handleFindUserById(user)
    }).catch(function (err) {
      logger.error(err)
      res.status(500).send('Could not find street.')
      return
    });
  }
} // END function - exports.get

exports.delete = function (req, res) {
  var handleSaveUser = function (err, user) {
    if (err) {
      logger.error(err)
      res.status(500).send('Could not sign-out user.')
      return
    }
    res.status(204).end()
  } // END function - handleSaveUser

  var handleFindUser = function (err, user) {
    if (err) {
      logger.error(err)
      res.status(500).send('Error finding user.')
      return
    }

    if (!user) {
      res.status(404).send('User not found.')
      return
    }

    var idx = user.login_tokens.indexOf(req.loginToken)
    if (idx === -1) {
      res.status(401).end()
      return
    }

    user.login_tokens.splice(idx, 1)
    user.save(handleSaveUser)
  } // END function - handleFindUser

  // Flag error if user ID is not provided
  if (!req.params.user_id) {
    res.status(400).send('Please provide user ID.')
    return
  }

  var userId = req.params.user_id
  User.findOne({ where: { id: userId } }, handleFindUser)
} // END function - exports.delete

exports.put = function (req, res) {

  var body
  try {
    body = req.body
  } catch (e) {
    res.status(400).send('Could not parse body as JSON.')
    return
  }

  var handleFindUser = function (user) {
    if (!user) {
      res.status(404).send('User not found.')
      return Promise.resolve()
    }

    if (user.login_tokens.indexOf(req.loginToken) === -1) {
      res.status(401).end()
      return Promise.resolve()
    }

    user.data = body.data || user.data
    return user.save().then(function() {
      res.status(204).end()
      return
    }).catch(function (err) {
      logger.error(err)
      res.status(500).send('Could not save update user data.')
      return
    });
  } // END function - handleFindUser

  // Flag error if user ID is not provided
  if (!req.params.user_id) {
    res.status(400).send('Please provide user ID.')
    return
  }

  var userId = req.params.user_id
  User.findOne(
    { 
      where: { twitter_id: userId } 
    }
  ).then(function(user){
    return handleFindUser(user)
  }).catch(function (err) {
      logger.error(err)
      res.status(500).send('Could not find user @user_id: ' + userId)
      return
    });
} // END function - exports.put
