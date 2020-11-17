require("dotenv").config();
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


/* --- mycode --- */

// --database--
const userSchema = mongoose.Schema({
  username: {type: String, required: true},
  date: Date,
  duration: Number,
  description: String
})
const USER = mongoose.model("USER", userSchema);

app.get("/api", (req, res) => {
  res.json({data: "user submit"});
});

app.post("/api/exercise/add", (req, res) => {
  res.send("exercises");
});

