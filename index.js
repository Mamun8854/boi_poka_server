const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const { query } = require("express");
require("dotenv").config();

// middle Ware

app.use(express.json());
app.use(cors());

const uri = "mongodb://localhost:27017";

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nuhoilk.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    // categories collection
    const categoriesCollection = client.db("BoiPoka").collection("categories");

    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.error(error));

app.get("/", async (req, res) => {
  res.send("BoiPoka Is Running");
});

app.listen(port, () => {
  console.log(`BoiPoka is Running on port ${port}`);
});
