const pg = require('pg')

const dbName = 'vinyl'
const connectionString = process.env.DATABASE_URL || `postgres://localhost:5432/${dbName}`
const client = new pg.Client(connectionString)

client.connect()

// Query helper function
const query = function(sql, variables, callback){
  console.log('QUERY ->', sql.replace(/[\n\s]+/g, ' '), variables)

  client.query(sql, variables, function(error, result){
    if (error){
      console.log('QUERY <- !!ERROR!!')
      console.error(error)
      callback(error)
    }else{
      console.log('QUERY <-', JSON.stringify(result.rows))
      callback(error, result.rows)
    }
  })
}

const getAlbums = function(callback) {
  query("SELECT * FROM albums", [], callback)
}

const getAlbumsByID = function(albumID, callback) {
  query("SELECT * FROM albums WHERE id = $1", [albumID], callback)
}

const getUsersByEmail = function(userEmail, callback) {
  query("SELECT * from users WHERE email = $1", [userEmail], callback)
}

const getUserByID = function(userID, callback) {
  query("SELECT * from users WHERE id = $1", [userID], callback)
}

const addUser = function(name, email, password, callback) {
  query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *", [name, email, password], callback)
}

module.exports = {
  getAlbums,
  getAlbumsByID,
  getUsersByEmail,
  getUserByID,
  addUser
}
