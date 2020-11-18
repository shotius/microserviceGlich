require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/* --- mycode --- */

// --database--
const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  log: {
    date: String,
    duration: Number,
    description: String
  }
});
const USER = mongoose.model("USER", userSchema);

// add user
app.post("/api/exercise/new-user", async (req, res) => {
  var userName = req.body.username;
  // search user in database
  var user = await USER.findOne({ username: userName }, (err, user) => {
    if (err) console.error(err);
  });

  // found user in database
  if (user) {
    res.json(user);
  } else {
    // not found user in database
    // add user to database
    var newUser = new USER({
      username: userName
    });
    newUser.save();
    // response
    res.json({ username: newUser.username, _id: newUser._id });
  }
});

// get all user info
app.get("/api/exercise/users", async (req, res) => {
  var allUsers = await USER.find({});
  res.send(allUsers);
});

// add exercise to specific user
app.post("/api/exercise/add", async (req, res, next) => {
  // required fields check
  if (req.body.userId == "") {
    res.send("'userId' is required");
  }
  if (req.body.duration == "") {
    res.send("'duration' is required");
  }
  if (req.body.description == "") {
    res.send("'description' is required");
  }
  // handle optional date field
  if (req.body.date == "") {
    var date = new Date().toDateString();
  } else {
    var d = Date.parse(req.body.date);
    var date = new Date(d).toDateString();
  }

  // options to add to the user
  var newSession = {
    duration: req.body.duration,
    description: req.body.description,
    date: date
  };
  /*
  // search user in order to add options to it
  await USER.findByIdAndUpdate(
    req.body.userId,
    { $push: { log: update } },
    { new: true },
    (err, user) => {
      if (err) {
        next(err.message);
      } else {
        let showUser = {};
        showUser["_id"] = user._id;
        showUser["username"] = user.username;
        showUser["description"] = update.description;
        showUser["duration"] = update.duration;
        showUser["date"] = update.date;
        res.json(showUser);
      }
    }
  );

*/
  await USER.findByIdAndUpdate(
    req.body.userId,
    { $push: { log: newSession } },
    { new: true },
    (err, updatedUser) => {
      if (err) next(err.message);  
       let responseObject = {}
        responseObject['_id'] = updatedUser.id
        responseObject['username'] = updatedUser.username
        responseObject['date'] = new Date(newSession.date).toDateString()
        responseObject['description'] = newSession.description
        responseObject['duration'] = newSession.duration
        res.json(responseObject)
      
    }
  );
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
