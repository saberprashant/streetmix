// dependencies
const express = require('express')
const router = express.Router()

// post function to handle our post on api/v1/admin
router.post('/', function (req, res) {
  var body

  // some bool values for the validation of user's name, email and DOB.
  var nameSuccess = false
  var emailSuccess = false
  var dobSuccess = false

  // check that req.body is empty or not
  try {
    body = req.body
    // console.log(req.body);
  } catch (e) {
    res.status(400).send('req.body is empty')
    return
  }

  // if userData exists then validate it first and then take actions
  if (body.userData) {
    console.log('userData -> ', body.userData)

    // server-side validation for user's name
    if (body.userData.name) {
      const nameLen = body.userData.name.length
      if (nameLen > 2) { nameSuccess = true } else { nameSuccess = false }
    }

    // server-side validation for user's email
    if (body.userData.email) {
      const email = body.userData.email
      const emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
      const check = emailRegex.test(email)
      if (check) { emailSuccess = true } else { emailSuccess = false }
    }

    // server-side validation for user's dob
    if (body.userData.dob) {
      const dob = body.userData.dob
      if (dob) { dobSuccess = true } else { dobSuccess = false }
    }

    // if all validation go right then send success
    if (nameSuccess && emailSuccess && dobSuccess) {
      res.status(200).send(body.userData)
      // this place can be used to save the user's data in 'users collection' of Database by using models
    } else { res.status(400).send('Entered data is not valid') } // Send error response if user's data is not valid
  } else {
    res.status(400).send('Data does not exist.') // If user's data doesn't exists in request then show error.
  }
})

// if any user tries to access the route 'api/v1/admin' directly then error 400 will be shown to them
router.get('/', function (req, res) {
  res.status(400).send('Error 400! - Oh man! You might have tried to access a wrong route.')
})

module.exports = router
