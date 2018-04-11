// Run this before other modules
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic')
}

process.title = 'streetmix'

const compression = require('compression')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const envify = require('envify/custom')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const browserify = require('browserify-middleware')
const babelify = require('babelify')
const config = require('config')
const path = require('path')
const uuid = require('node-uuid')
const controllers = require('./app/controllers')
const resources = require('./app/resources')
const requestHandlers = require('./lib/request_handlers')
const middleware = require('./lib/middleware')
const exec = require('child_process').exec

const app = module.exports = express()

app.locals.config = config

// Not all headers from `helmet` are on by default. These turns on specific
// off-by-default headers for better security as recommended by https://securityheaders.io/
const helmetConfig = {
  frameguard: false, // Allow Streetmix to be iframed in 3rd party sites
  hsts: {
    maxAge: 5184000, // 60 days
    includeSubDomains: false // we don't have a wildcard ssl cert
  },
  referrerPolicy: {
    policy: 'no-referrer-when-downgrade'
  }
}

// CSP directives are defined separately so we can generate nonces
const csp = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
    scriptSrc: [
      "'self'",
      'platform.twitter.com',
      'https://www.google-analytics.com',
      'cdn.mxpnl.com',
      '*.basemaps.cartocdn.com',
      'api.geocode.earth',
      (req, res) => "'nonce-" + res.locals.nonce.google_analytics + "'",
      (req, res) => "'nonce-" + res.locals.nonce.mixpanel + "'"
    ],
    childSrc: ['platform.twitter.com'],
    imgSrc: [
      "'self'",
      'data:',
      'pbs.twimg.com',
      'syndication.twitter.com',
      'https://www.google-analytics.com',
      '*.basemaps.cartocdn.com'
    ],
    fontSrc: ["'self'", 'fonts.gstatic.com'],
    connectSrc: ["'self'",
      'freegeoip.net',
      'api.mixpanel.com',
      'api.geocode.earth',
      'syndication.twitter.com',
      'https://www.google-analytics.com',
      'app.getsentry.com'
    ]
  }
}

// Allow arbitrary injected code (e.g. Redux dispatches from dev tools) in development
if (app.locals.config.env === 'development') {
  csp.directives.scriptSrc.push("'unsafe-eval'")
}

app.use(helmet(helmetConfig))
app.use(express.json())
app.use(compression())
app.use(cookieParser())
app.use(cookieSession({ secret: config.cookie_session_secret }))

app.use(requestHandlers.login_token_parser)
app.use(requestHandlers.request_log)
app.use(requestHandlers.request_id_echo)

// Permanently redirect http to https in production.
app.use(function (req, res, next) {
  if (app.locals.config.env === 'production') {
    // req.secure is Express's flag for a secure request, but this is not available
    // on Heroku, which uses a header instead.
    if (req.secure === true || req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect(301, 'https://' + req.hostname + req.originalUrl)
    } else {
      next()
    }
  } else {
    next()
  }
})

// Generate nonces for inline scripts
app.use(function (req, res, next) {
  res.locals.nonce = {
    google_analytics: uuid.v4(),
    mixpanel: uuid.v4()
  }
  next()
})

// Set CSP directives
app.use(helmet.contentSecurityPolicy(csp))

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '/app/views'))

// Redirect to environment-appropriate domain, if necessary
// In production, this redirects streetmix-v2.herokuapp.com to https://streetmix.net/
app.all('*', function (req, res, next) {
  if (config.header_host_port !== req.headers.host && app.locals.config.env === 'production') {
    const redirectUrl = 'https://' + config.header_host_port + req.url
    console.log('req.hostname = %s but config.header_host_port = %s; redirecting to %s...', req.hostname, config.header_host_port, redirectUrl)
    res.redirect(301, redirectUrl)
  } else {
    next('route')
  }
})

app.get('/help/about', function (req, res) {
  res.redirect('https://www.opencollective.com/streetmix/')
})

app.get('/map', function (req, res) {
  res.redirect('https://streetmix.github.io/map/')
})

app.get('/twitter-sign-in', controllers.twitter_sign_in.get)
app.get(config.twitter.oauth_callback_uri, controllers.twitter_sign_in_callback.get)

app.post('/api/v1/users', resources.v1.users.post)
app.get('/api/v1/users/:user_id', resources.v1.users.get)
app.put('/api/v1/users/:user_id', resources.v1.users.put)
app.delete('/api/v1/users/:user_id/login-token', resources.v1.users.delete)
app.get('/api/v1/users/:user_id/streets', resources.v1.users_streets.get)

app.post('/api/v1/streets', resources.v1.streets.post)
app.get('/api/v1/streets', resources.v1.streets.find)
app.head('/api/v1/streets', resources.v1.streets.find)

app.delete('/api/v1/streets/:street_id', resources.v1.streets.delete)
app.head('/api/v1/streets/:street_id', resources.v1.streets.get)
app.get('/api/v1/streets/:street_id', resources.v1.streets.get)
app.put('/api/v1/streets/:street_id', resources.v1.streets.put)

app.get('/api/v1/geo', cors(), resources.v1.geo.get)

app.post('/api/v1/feedback', resources.v1.feedback.post)

app.get('/api/v1/translate/:locale_code/:resource_name', resources.v1.translate.get)

app.get('/.well-known/status', resources.well_known_status.get)

// Process stylesheets via Sass and PostCSS / Autoprefixer
app.use('/assets/css/styles.css', middleware.styles.get)

app.get('/assets/scripts/main.js', browserify(path.join(__dirname, '/assets/scripts/main.js'), {
  cache: true,
  precompile: true,
  extensions: [ '.jsx' ],
  transform: [babelify, envify({
    APP_HOST_PORT: config.get('app_host_port'),
    FACEBOOK_APP_ID: config.get('facebook_app_id'),
    API_URL: config.get('restapi_proxy_baseuri_rel'),
    TWITTER_CALLBACK_URI: config.get('twitter').oauth_callback_uri,
    ENV: config.get('env'),
    NO_INTERNET_MODE: config.get('no_internet_mode')
  })]
}))

// SVG bundled images served directly from packages
app.get('/assets/images/icons.svg', function (req, res) {
  res.sendFile(path.join(__dirname, '/node_modules/@streetmix/icons/dist/icons.svg'))
})

app.get('/assets/images/images.svg', function (req, res) {
  res.sendFile(path.join(__dirname, '/node_modules/@streetmix/illustrations/dist/images.svg'))
})

// Post-deploy hook handler
app.post(
  '/services/post-deploy',
  express.urlencoded({ extended: false }),
  resources.services.post_deploy.post
)

app.use(express.static(path.join(__dirname, '/public')))

/*
Well I strugggled a lot to find the way to setup a route '/admin' in this code and I spent 2 days to understand the
architecture, and I get to know a bit like how the "menu bar is holding different components", "how all those different options
come while making a new street" and "how the user street data is getting saved in DB and shows in console.". I did all this to
find out the place in code, where the '/new' route to create a new street is assigned but sadly, I didn't find it out. I was thinking
to use the same methods that you used to setup routes in your app. Then, I realized that I have only some time left for assignment
and I thought to make a different app as per your specifications by following the code style of yours. That's why I created a new
folder named 'prashant-server', and I've done my whole assignment there. So, please take a look at it.
Please find all other details on your mail.
*/

// This is where I was trying to setup the route
// app.get('/admin', function (req, res) {
//   res.send('HI there, I am prashant jain')
// })

// Catch-all
app.use(function (req, res) {
  res.render('main', {})
})

// Set up file watcher in development
if (config.env === 'development') {
  const chokidar = require('chokidar')
  const compileStyles = require('./lib/middleware/styles').compile

  // Watch SCSS files
  const cssWatcher = chokidar.watch('assets/css/*.scss')

  cssWatcher.on('change', path => {
    console.log(`File ${path} has been changed`)
    compileStyles()
  })
}

// Provide a message after a Ctrl-C
// Note: various sources tell us that this does not work on Windows
process.on('SIGINT', function () {
  if (app.locals.config.env === 'development') {
    console.log('Stopping Streetmix!')
    exec('npm stop')
  }
  process.exit()
})
