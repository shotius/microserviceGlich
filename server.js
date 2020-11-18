require("dotenv").config();
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

let User = mongoose.model('User', userSchema)

app.post('/api/exercise/new-user', bodyParser.urlencoded({ extended: false }), (request, response) => {
  let newUser = new User({username: request.body.username})
  newUser.save((error, savedUser) => {
    if(!error){
      let responseObject = {}
      responseObject['username'] = savedUser.username
      responseObject['_id'] = savedUser.id
      response.json(responseObject)
    }
  })
})

app.get('/api/exercise/users', (request, response) => {
  
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      response.json(arrayOfUsers)
    }
  })
  
})

app.post('/api/exercise/add', bodyParser.urlencoded({ extended: false }) , (request, response) => {
  
  let newSession = {
    description: request.body.description,
    duration: parseInt(request.body.duration),
    date: request.body.date
  }
  
  if(newSession.date === ''){
    newSession.date = new Date().toISOString().substring(0, 10)
  }
  
  User.findByIdAndUpdate(
    request.body.userId,
    {$push : {log: newSession}},
    {new: true},
    (error, updatedUser)=> {
      if(!error){
        let responseObject = {}
        responseObject['_id'] = updatedUser.id
        responseObject['username'] = updatedUser.username
        responseObject['date'] = new Date(newSession.date).toDateString()
        responseObject['description'] = newSession.description
        responseObject['duration'] = newSession.duration
        response.json(responseObject)
      }
    }
  )
})

app.get("/api/exercise/log", (req, res) => {
  User.findById(
    req.query.userId,
    (err, user, next) => {
      if(err) next(err);
      var responseObj = {};
      Object.assign(user, responseObj)
      res.json(responseObj)
    }
  )
})