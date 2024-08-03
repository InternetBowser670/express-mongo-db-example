
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect()

const db = client.db("dev");

(async function() {
  if (process.argv[2] == "find"){
    console.log(process.argv[2])
    console.log(process.argv[3])
    var collection = db.collection(process.argv[3]);
    var records = collection.find({})
    for await (var record of records) {
      console.log(record);
    }
  } else if (process.argv[2] == "delete") {
    var collection = db.collection(process.argv[3])
    await collection.deleteMany({})
    console.log("Deleted " + process.argv[3])
  }

  client.close();
})()