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
  log: [
    {
      date: String,
      duration: Number,
      description: String
    }
  ]
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

app.post(
  "/api/exercise/add",
  bodyParser.urlencoded({ extended: false }),
  (request, response) => {
    let newSession = {
      description: request.body.description,
      duration: parseInt(request.body.duration),
      date: request.body.date
    };

    if (newSession.date === "") {
      newSession.date = new Date().toISOString().substring(0, 10);
    }

    USER.findByIdAndUpdate(
      request.body.userId,
      { $push: { log: newSession } },
      { new: true },
      (error, updatedUser) => {
        if (!error) {
          let responseObject = {};
          responseObject["_id"] = updatedUser.id;
          responseObject["username"] = updatedUser.username;
          responseObject["date"] = new Date(newSession.date).toDateString();
          responseObject["description"] = newSession.description;
          responseObject["duration"] = newSession.duration;
          response.json(responseObject);
        }
      }
    );
  }
);

app.get("/api/exercise/log", (req, res) => {
  USER.findById(req.query.userId, (err, user) => {
    if (!err) {
      let responseObj = user;
    
      if (req.query.from || req.query.to){
        
        var fromDate = new Date(0);
        var toDate = new Date();
      
        if (req.query.from){
          fromDate = new Date(req.query.from)
        }
        
        if(req.query.to){
          toDate = new Date(req.query.to)
        }
        
        fromDate = fromDate.getTime();
        toDate = toDate.getTime();
        
        responseObj.log = responseObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime();
          
          return sessionDate >= fromDate && sessionDate <= toDate;
        });
        
              
      }
      
      
      responseObj["count"] = user.log.length;
      res.json(responseObj);
    }
  });

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
