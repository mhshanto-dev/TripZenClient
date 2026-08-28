const express = require("express");
const cors = require("cors");

const app = express();
require("dotenv").config();

const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// mongodb start from hare

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // api start from hare

    const db = client.db("tripzen");
    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("Bookings")
    // get api

    app.get("/destination", async (req, res) => {
  try {
    const { location, duration, budget, people } = req.query;

    const query = {};

    // Location search
    if (location) {
      query.$or = [
        {
          destinationName: {
            $regex: location,
            $options: "i",
          },
        },
        {
          country: {
            $regex: location,
            $options: "i",
          },
        },
      ];
    }

    // Duration filter
    if (duration) {
      query.duration = {
        $lte: Number(duration),
      };
    }

    // Budget filter
    if (budget) {
      query.price = {
        $lte: Number(budget),
      };
    }

    // People filter
    if (people) {
      query.maxPeople = {
        $gte: Number(people),
      };
    }

    const result = await destinationCollection
      .find(query)
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Destination search error:", error);

    res.status(500).send({
      message: "Failed to fetch destinations",
      error: error.message,
    });
  }
});

    app.get("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const result = await destinationCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });


    // get api
    app.get("/booking", async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData).then();
      res.send(result);
    });


    // patch api

    app.patch("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const updatedDestination = req.body;
      const result = await destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedDestination }
      );
      res.send(result);
    })


    // delete api

    app.delete("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const result = await destinationCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });


    // post api
    app.post("/destination", async (req, res) => {
      const newDestination = req.body;
      console.log(newDestination);
      const result = await destinationCollection.insertOne(newDestination);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
