// dependencies
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

// uncomment this if you want to use admin for post and get functions
// const admin = require('./resources/v1/adminRes')

const adminRoute = require('./routes/adminRoute')
const app = express()

// used for parsing the data
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Well I tried to do the routes in two ways, for a good practice and to follow the methods what streetmix follows
// Please take a look at both :)

/*
Uncomment the following two lines and the one in import for 'admin' if you want to use two routes for '/api/v1/admin'.
I made them after observing the streetmix's app.js file where all routes(get, post, delete) for same route are listed.
I thought that it would be good to follow the practices what streetmix follows
*/
// app.post('/api/v1/admin', admin.post);
// app.get('/api/v1/admin', admin.get)

/*
I did this to follow another good practice to keep a single route for '/api/v1/admin'
and let the 'adminRoute' file to manage the get and post request.
Please comment the following line, if you have uncommented the above two rotes for '/api/v1/admin'
*/
app.use('/api/v1/admin', adminRoute)

// Express will serve up our assets like our main.js file or main.css file!
app.use(express.static('client/build'))

// Express will serve up the index.html file if it doesn't recognizes the route, then our client side routes will be used
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
})

// Listen on production port no. or 8000
const PORT = process.env.PORT || 8000
app.listen(PORT, function () {
  console.log('Listening on port...', PORT)
})
