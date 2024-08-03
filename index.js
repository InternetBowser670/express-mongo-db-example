const express = require("express")
const bodyParser = require("body-parser")
const multer = require("multer")
const fs = require("fs")
const bcrypt = require("bcrypt")
const { MongoClient, ServerApiVersion } = require("mongodb")
const cookieParser = require("cookie-parser")
const pug = require("pug")
const {auth} = require("./authorize")

const uri = "";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect();
const db = client.db("dev").collection("users")
const sessions = client.db("dev").collection("sessions")


const app = express();

app.use(cookieParser());

app.use("/static", express.static("static"));
const upload = multer();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.array());

const login = fs.readFileSync("pages/login.html", "utf8")
const signup = fs.readFileSync("pages/signup.html", "utf8")
const blocked = fs.readFileSync("pages/blocked.html", "utf8")
const changeBday = fs.readFileSync("pages/changeBday.html", "utf8")

//Compile pug template(s)
const dashboard = pug.compileFile("./templates/dashboard.pug")

app.get("/", (req, res) => {
  res.end(signup)
})

app.get("/login", (req, res) => {

  if (req.cookies.sessionId) {
    res.writeHead(200)
    res.write("<p>You are already signed in</p>")
    res.end();
    return
  }
  res.end(login)
})

app.post("/login", async (req, res) => {
  var userQuery = db.findOne({username: req.body.username})
  userQuery.then((user) => {
    if (!user) {
      res.writeHead(400)
      res.end()
      return
    }
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (result) {
        var session = generateSessionId(req.body.username)
        res.cookie("sessionId", session)
        res.writeHead(200)
      } else {
        res.writeHead(400)
      }
      res.end()
      })
  })
})
  
  

app.post("/signup", (req, res) => {
  
 bcrypt.hash(req.body.password, 10, async (err, data) => {
  var user = {
    username: req.body.username,
    password: data,
    birthday: {
      month: req.body.bday_month,
      day: req.body.bday_day,
      year: req.body.bday_year
    }
  }

   await db.insertOne(user)
   var session = generateSessionId(req.body.username)
   res.cookie("sessionId", session)
   res.writeHead(200)
   res.end()
 })
})

app.get("/updateBirthday", (req, res) => {
  auth(req, res, (authData) => {
    res.end(changeBday)
  })
})

app.get("/dashboard", async (req, res) => {
  auth(req, res, async (authData) => {
      var userData = await db.findOne({username: authData.user})
      
      var html = dashboard({
        name: userData.username,
        birthday: userData.birthday
      }) 
      res.end(html);
    }) 
})

app.get("/logout", (req, res) => {
  sessions.deleteOne({uuid:req.cookies.sessionId})
  res.clearCookie("sessionId")
  res.writeHead(200)
  res.end("<p>You have logged out</p>")
})

app.post("/updateUser", (req, res) => {
  auth(req, res, (authData) => {
    console.log("Updating Birthday", req.body)
    db.updateOne({username: authData.user}, { $set: {birthday: {
      month: req.body.month,
      day: req.body.day,
      year: req.body.year
    }}})
    res.end()
  })
})

function generateSessionId(username) {
  var uuid = crypto.randomUUID()
  sessions.insertOne({
    uuid: uuid,
    user: username,
    role: "user"
  })
  return uuid;
}

app.listen(3000)
console.log("Ctrl + C to stop server")