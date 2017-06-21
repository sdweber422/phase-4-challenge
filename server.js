const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const authenticate = passport.authenticate( 'local', { successRedirect: '/', failureRedirect: '/signin' } )
const database = require('./database')
const app = express()

const checkForAuthorization = ( request, response, next ) => {
  if ( request.isAuthenticated() ) {
    next()
  }
  else {
    response.redirect( '/' )
  }
}

require('ejs')
app.set('view engine', 'ejs');

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use( cookieParser() )
app.use( session({
  secret: 'special_session',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', checkForAuthorization, (request, response) => {
  database.getAlbums((error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    } else {
      response.render('index', {
        albums: albums,
        title: 'Vinyl',
        firstLink: 'signup',
        secondLink: 'signin',
        firstLinkText: 'Sign Up',
        secondLinkText: 'Sign In',
      })
    }
  })
})

app.get('/albums/:albumID', checkForAuthorization, (request, response) => {
  const albumID = request.params.albumID

  database.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    } else {
      const album = albums[0]
      response.render('album', { album: album })
    }
  })
})

app.get( '/signin', ( request, response ) => {
  response.render( 'signin', { title: 'Sign In' } )
})

app.get( '/signup', ( request, response ) => {
  response.render( 'signup', { title: 'Sign Up' } )
})

app.post( '/verifyUser', authenticate )

app.use((request, response) => {
  response.status(404).render('not_found')
})

passport.serializeUser(function(user, done) {
  console.log( 'SERIALIZE' )
  done(null, user[0].id)
})

passport.deserializeUser(function(id, done) {
  console.log( 'DESERIALIZE' )
  database.getUserByID(id, function(err, user) {
    done(err, user)
  })
})

passport.use(new LocalStrategy(
  function(username, password, done) {
    database.getUsersByEmail(username, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user.length) {
        return done(null, false, { message: 'Incorrect username.' })
      }
      if (user[0].password !== password) {
        return done(null, false, { message: 'Incorrect password.' })
      }
      return done(null, user)
    })
  }
))

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
