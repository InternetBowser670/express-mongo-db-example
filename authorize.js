const { MongoClient, ServerApiVersion } = require("mongodb")
const fs = require("fs")

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

const blocked = fs.readFileSync("pages/blocked.html", "utf8")

exports.auth = async function(req, res, callback) {
    try {
        var authData = await sessions.findOne({uuid: req.cookies.sessionId})
        if (authData.role == "user") {
            console.log("Authorized")
            res.writeHead("200")
            callback(authData)
        } else {
          throw "Not authorizrd"
        }
      } catch(e){
        res.writeHead(403);
        res.end(blocked);
      }
}