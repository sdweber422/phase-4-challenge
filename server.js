const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const authenticate = passport.authenticate( 'local', { failureRedirect: '/signin' } )
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

app.get('/', (request, response) => {
  database.getAlbums((error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      database.getAllUsers((error, users) => {
        if (error) {
          response.status(500).render('error', { error: error })
        }
        else {
          database.getLastThreeReviews((error, reviews) => {
            if (error) {
              response.status(500).render('error', { error: error })
            }
            else {
              reviews.forEach( review => {
                review.album = albums.filter( album => album.id === review.album_id )[0]
                review.user = users.filter( user => user.id === review.user_id )[0]
              })
              response.render('index', {
                albums: albums,
                users: users,
                reviews: reviews,
                title: 'Vinyl',
                firstLink: 'signup',
                secondLink: 'signin',
                firstLinkText: 'Sign Up',
                secondLinkText: 'Sign In',
              })
            }
          })
        }
      })
    }
  })
})

app.get('/profile/:id', checkForAuthorization, (request, response) => {
  const { id, name, email, created_at } = request.user[0]
  database.getAlbums((error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      database.getReviewsByUserID(id, (error, reviews) => {
        if (error) {
          response.status(500).render('error', { error: error })
        }
        else {
          reviews.forEach( review => {
            review.album = albums.filter( album => album.id === review.album_id)[0]
          })
          response.render('profile', {
            albums: albums,
            reviews: reviews,
            joinDate: created_at,
            name: name,
            email: email,
            title: 'Profile Page',
            firstLink: `profile/${id}`,
            secondLink: 'signout',
            firstLinkText: 'Profile',
            secondLinkText: 'Sign Out',
          })
        }
      })
    }
  })
})

app.get('/albums/:albumID', checkForAuthorization, (request, response) => {
  const albumID = request.params.albumID
  const id = request.user[0].id
  database.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      database.getReviewsByAlbumID(albumID, (error, reviews) => {
        if (error) {
          response.status(500).render('error', { error: error })
        }
        else {
          database.getAllUsers((error, users) => {
            if (error) {
              response.status(500).render('error', { error: error })
            }
            else {
              const album = albums[0]
              reviews.forEach( review => {
                review.user = users.filter( user => user.id === review.user_id )[0]
                review.album = album
              })
              response.render('album', {
                album: album,
                reviews: reviews,
                title: `Vinyl: ${album.title}`,
                firstLink: `profile/${id}`,
                secondLink: 'signout',
                firstLinkText: 'Profile',
                secondLinkText: 'Sign Out',
              })
            }
          })
        }
      })
    }
  })
})

app.get( '/signin', ( request, response ) => {
  response.render( 'signin', { title: 'Sign In' } )
})

app.get( '/signup', ( request, response ) => {
  response.render( 'signup', { title: 'Sign Up' } )
})

app.get( '/signout', ( request, response ) => {
  request.logout()
  response.redirect( '/' )
})

app.post( '/verifyUser', authenticate, ( request, response ) => {
    const id = request.user[0].id
    response.redirect( `/profile/${id}` )
})

app.post( '/createUser', ( request, response, next ) => {
  const { name, email, password } = request.body
  if( !name || !email || !password ) {
    response.redirect( '/signup' )
  }
  database.addUser( name, email, password, ( error, user ) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      const id = user[0].id
      request.login(user, function(err) {
        if (err) { return next(err); }
        return response.redirect( `/profile/${id}` );
      })
    }
  })
})

app.post( '/addReview/:album_id', checkForAuthorization, ( request, response, next ) => {
  const { review } = request.body
  const albumID = request.params.album_id
  const userID = request.user[0].id
  if( !review.length ) {
    response.status(500).render('error', { error: new Error('No empty reviews')})
  }
  database.addReview( review, ( error, newReview ) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      const reviewID = newReview[0].id
      database.connectReviewToUserAndAlbum( reviewID, userID, albumID, ( error, results ) => {
        if (error) {
          response.status(500).render('error', { error: error })
        }
        else {
          response.redirect( `/profile/${userID}` )
        }
      })
    }
  })
 })

app.get( '/newReview/:album_id', checkForAuthorization, ( request, response ) => {
  const { album_id } = request.params
  database.getAlbumsByID(album_id, (error, albums) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      const album = albums[0]
      response.render('newReview', {
        album: album,
        title: 'New Review',
      })
    }
  })
})

app.post( '/delete/:review_id', checkForAuthorization, ( request, response ) => {
  const { review_id } = request.params
  const id = request.user[0].id
  database.deleteReviewByID(review_id, (error, deletedReview) => {
    if (error) {
      response.status(500).render('error', { error: error })
    }
    else {
      response.redirect( `/profile/${id}`)
    }
  })
})
// Error handler

app.use((request, response) => {
  response.status(404).render('not_found')
})

// Passport functions

passport.serializeUser(function(user, done) {
  done(null, user[0].id)
})

passport.deserializeUser(function(id, done) {
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
