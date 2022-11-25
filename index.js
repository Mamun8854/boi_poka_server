const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

    // jwt api

    // app.get("/jwt", async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);
    //   if (user) {
    //     const token = jwt.sign({ email }, process.env.TOKEN_JWT, {
    //       expiresIn: "1d",
    //     });
    //     return res.send({ accessToken: token });
    //   }
    //   res.status(403).send({ accessToken: "" });
    // });

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
      console.log(user);
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

    // get all users

    app.get("/allUsers", async (req, res) => {
      const users = {};
      const result = await usersCollection.find(users).toArray();
      res.send(result);
    });

    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.send({ isAdmin: result.role === "admin" });
    });

    app.get("/user/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.send({ isSeller: result.role === "seller" });
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
