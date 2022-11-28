const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const { query } = require("express");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

// middle Ware

app.use(express.json());
app.use(cors());

// const uri = "mongodb://localhost:27017";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nuhoilk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

console.log(uri);
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
    // payments collection
    const paymentsCollection = client.db("BoiPoka").collection("payments");
    // category data get api
    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });

    // jwt api

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.TOKEN_JWT, {
          expiresIn: "1d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    const verifyJWT = (req, res, next) => {
      const authHeader = req.headers.authorization;
      // console.log("from jwt token", authHeader);
      if (!authHeader) {
        return res.status(401).send("Unauthorized access");
      }

      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.TOKEN_JWT, function (error, decoded) {
        if (error) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify admin function
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ message: "From verify Admin Forbidden access" });
      }

      next();
    };

    // payment
    app.post("/create-payment-intent", async (req, res) => {
      const orders = req.body;
      const price = orders.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // post payment info to db
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.orderId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await ordersCollection.updateOne(
        filter,
        updatedDoc
      );
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

    app.get("/allSeller", verifyJWT, async (req, res) => {
      const query = req.query;
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // all buyer info for admin dashboard

    app.get("/buyers", verifyJWT, async (req, res) => {
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
    app.get("/my-products/:id", verifyJWT, async (req, res) => {
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
    app.get("/my-products", verifyJWT, async (req, res) => {
      const email = req.query;
      const result = await booksCollection.find(email).toArray();
      // console.log(result);
      res.send(result);
    });

    // get order info by email
    app.get("/my-orders", verifyJWT, async (req, res) => {
      const email = req.query;
      const result = await ordersCollection.find(email).toArray();
      res.send(result);
    });

    // get order data by id
    app.get("/my-orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      res.send(result);
    });

    // delete seller from db
    app.delete("/allSellers/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // delete buyer from db
    app.delete("/allBuyers/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    // delete my products from db
    app.delete("/myProducts-delete/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    // verify seller api
    app.put("/user/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { email: id };
      const query1 = { sellerEmail: id };
      // console.log(query);
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          verify: "true",
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc, option);
      const result2 = await booksCollection.updateMany(
        query1,
        updatedDoc,
        option
      );

      res.send(result);
    });

    app.get("/user/:id", async (req, res) => {
      const id = req.params.id;
      const email = { email: id };

      const result = await usersCollection.findOne(email);

      res.send(result);
    });
    // get my buyer
    app.get("/my-buyer", async (req, res) => {
      const email = req.query;
      const result = await ordersCollection.find(email).toArray();
      res.send(result);
    });

    app.put("/books", async (req, res) => {
      const id = req.query;

      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          paid: "true",
        },
      };
      const result = await booksCollection.updateOne(id, updatedDoc, option);
      console.log(result);
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
