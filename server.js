//Passport Authentication

var appName = "Green Boilerplate App";
var port    = 9999;

var express = require('express');
var session = require('express-session');

var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser'); //for POST requests
var path = require('path');
var favicon = require('serve-favicon');


// Create the server.
var app = express();

// Handle POST requests and cookies.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// favicon /public.
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Make /public directory accessible.
app.use(express.static(path.join(__dirname, 'public')));

// User sessions via cookies.
app.use(session({
  // express-session uses uid-safe to generate a UID for the session
    secret: '2sDk-3Lsj-JP389s',
    name: 'gbp_sess_cookie',
//    store: sessionStore, // connect-mongo session store
//	cookie: {secure:true} // only for https server
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

// Passport initialization.
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  // placeholder for custom user serialization
  // null is for errors
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // placeholder for custom user deserialization.
  // maybe you are going to get the user from mongoDB by id?
  // null is for errors
  done(null, user);
});


// GitHub oAuth strategy (addon to passport).
var GithubStrategy = require('passport-github').Strategy;
passport.use(new GithubStrategy({
    clientID: "bd6f6cf8ba4bf8da0ee5",
    clientSecret: "cb0678d5e2bb60d040c7a46b0c76e33fb1056bb5",
    callbackURL: "http://localhost:" + port + "/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  })

);

// Ensure authentication middleware.
function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()) {
		console.log('User is authenticated');
		return next(); //note that 'next' is EXECUTED 
	} else {
		console.log('User NOT authenticated, redirecting');
		res.redirect('/'); //Redirect to home, insecure
	}
};

// Routing (no separate router table)

// Home page, and page we return to after login.
app.get('/', function(req, res) {
	var output = {};
	if(req.isAuthenticated()) {
		output.authMessage = "<p>Authenticated as user (JSON printout below)</p>\n<pre>" + JSON.stringify(req.user, null, 4) + "</pre>";
	} else {
		output.authMessage = "<p>Not authenticated, please log in...</p>";
	}

  var html = "<!doctype html><html><head><title>oAuth Simple</title></head><body><main><ul>\
    <li><a href='/auth/github'>GitHub</a></li>\
    <li><a href='/logout'>logout</a></li>\
    <li><a href='/protected'>Protected</a></li>\
  </ul>";
  // Dump the user for debugging
  if (req.isAuthenticated()) {
    html += "<p>authenticated as user (JSON printout below:)</p>"
    html += "<pre>" + JSON.stringify(req.user, null, 4) + "</pre>";
  }
  html += "</main></body></html>";
  res.send(html);
});

// Log out of the app.
app.get('/logout', function(req, res){
  console.log('User ' + req.user.username + ' logging out');
  req.logout();
  res.redirect('/'); // Redirect to home page
});


// Login link for GitHub.
app.get('/auth/github', 
  passport.authenticate('github')
);

// Callback called by GitHub.
app.get('/auth/github/callback', 
  passport.authenticate('github', {failureRedirect: '/'}), 
  function (req, res) {
    console.log('callback function executed');
    res.redirect('/'); // Redirect back to home page
});

// A protected route which can only be reached by login.
// It runs ensureAuthenticated middleware.
app.get('/protected', ensureAuthenticated, function(req, res) {
  console.log('entering protected route');
  res.send("access granted. secure stuff happens here");
});

// Error messages
// NOTE: these are evaluated in sequence - put AFTER you define other routes!
// Catch 404 and forward to error handler
app.get('*', function(req, res, next) {
  var err = new Error();
  err.status = 404;
  next(err);
});

// handling 404 errors
app.use(function(err, req, res, next) {
  if(err.status !== 404) {
    return next();
  }
  res.send(err.message || '** no unicorns here **');
});


// Start up the server.
var ip = require('ip');
var server = app.listen(port, function () {
  console.log(appName +' listening at http://' + ip.address() + ':' + port);
});