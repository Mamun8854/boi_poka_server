const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const { query } = require("express");
require("dotenv").config();

// middle Ware

app.use(express.json());
app.use(cors());

const uri = "mongodb://localhost:27017";

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nuhoilk.mongodb.net/?retryWrites=true&w=majority`;
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
    // orders collection
    const ordersCollection = client.db("BoiPoka").collection("orders");
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
      res.send({ isAdmin: result?.role === "admin" });
    });

    app.get("/user/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      res.send({ isSeller: result?.role === "seller" });
    });

    // all seller info for admin dashboard

    app.get("/allSeller", async (req, res) => {
      const query = req.query;
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // all buyer info for admin dashboard

    app.get("/buyers", async (req, res) => {
      const query = req.query;
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // add new product to db

    app.post("/new-product", async (req, res) => {
      const query = req.body;
      const result = await booksCollection.insertOne(query);
      res.send(result);
    });

    // get uploaded product in my product page
    app.get("/my-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // Order info post
    app.post("/orders", async (req, res) => {
      const query = req.body;
      const result = await ordersCollection.insertOne(query);
      res.send(result);
    });

    // my product info
    app.get("/my-products", async (req, res) => {
      const email = req.query;
      const result = await booksCollection.find(email).toArray();
      // console.log(result);
      res.send(result);
    });

    // get order info by email
    app.get("/my-orders", async (req, res) => {
      const email = req.query;
      const result = await ordersCollection.find(email).toArray();
      res.send(result);
    });

    // delete seller from db
    app.delete("/allSellers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // delete buyer from db
    app.delete("/allBuyers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    // delete my products from db
    app.delete("/myProducts-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
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
