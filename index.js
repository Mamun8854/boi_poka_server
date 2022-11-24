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
    // books collection
    const booksCollection = client.db("BoiPoka").collection("books");
    // users collection
    const usersCollection = client.db("BoiPoka").collection("users");
    // category data get api
    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });

    // books data get and get category wise books api by id

    app.get("/category/:id", async (req, res) => {
      const query = req.params.id;
      const filter = { category: query };
      const result = await booksCollection.find(filter).toArray();
      res.send(result);
    });

    // new user

    app.post("/users", async (req, res) => {
      const user = req.body;
      const userEmail = user.email;
      const query = { email: userEmail };
      const newUser = await usersCollection.find(query).toArray();

      if (newUser.length > 0) {
        return res.send("User Already Have");
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
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
