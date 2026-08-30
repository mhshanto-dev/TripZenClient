const express = require("express");
const cors = require("cors");
const { jwtVerify } = require("jose-cjs");

const app = express();
require("dotenv").config();

const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// mongodb start from here

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet } = require("jose-cjs");

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// JWT start from here

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  try {
    await jwtVerify(token, JWKS);

    next();
  } catch (error) {
    console.error("JWT verification error:", error);

    return res.status(401).send({
      message: "Unauthorized",
    });
  }
};

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    // api start from here

    const db = client.db("tripzen");

    const destinationCollection = db.collection("destinations");
    const bookingCollection = db.collection("Bookings");

    // ================= DESTINATION GET API =================

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

        const result = await destinationCollection.find(query).toArray();

        res.send(result);
      } catch (error) {
        console.error("Destination search error:", error);

        res.status(500).send({
          message: "Failed to fetch destinations",
          error: error.message,
        });
      }
    });

    // ================= SINGLE DESTINATION GET API =================

    app.get("/destination/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await destinationCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({
            message: "Destination not found",
          });
        }

        res.send(result);
      } catch (error) {
        console.error("Destination details error:", error);

        res.status(500).send({
          message: "Failed to fetch destination details",
          error: error.message,
        });
      }
    });

    // ================= BOOKING POST API =================

    app.post("/booking", verifyToken, async (req, res) => {
      try {
        const bookingData = req.body;

        const result = await bookingCollection.insertOne(bookingData);

        res.send(result);
      } catch (error) {
        console.error("Booking creation error:", error);

        res.status(500).send({
          message: "Failed to create booking",
          error: error.message,
        });
      }
    });

    // ================= USER BOOKING GET API =================

    app.get("/booking/user/:userId", async (req, res) => {
      try {
        const { userId } = req.params;

        const result = await bookingCollection.find({ userId }).toArray();

        res.send(result);
      } catch (error) {
        console.error("User bookings error:", error);

        res.status(500).send({
          message: "Failed to fetch bookings",
          error: error.message,
        });
      }
    });

    // ================= SINGLE BOOKING GET API =================

    app.get("/booking/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await bookingCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({
            message: "Booking not found",
          });
        }

        res.send(result);
      } catch (error) {
        console.error("Booking details error:", error);

        res.status(500).send({
          message: "Failed to fetch booking",
          error: error.message,
        });
      }
    });

    //============= Booking CAncel API ==================

    app.delete("/booking/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.json(result);
    });

    /// =============== featured destination api ================
    app.get("/featured", async (req, res) => {
      const result = await destinationCollection.find().limit(4).toArray();
      res.send(result);
    });

    // ================= DESTINATION PATCH API =================

    app.patch("/destination/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const updatedDestination = req.body;

        const result = await destinationCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedDestination },
        );

        res.send(result);
      } catch (error) {
        console.error("Destination update error:", error);

        res.status(500).send({
          message: "Failed to update destination",
          error: error.message,
        });
      }
    });

    // ================= DESTINATION DELETE API =================

    app.delete("/destination/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await destinationCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        console.error("Destination delete error:", error);

        res.status(500).send({
          message: "Failed to delete destination",
          error: error.message,
        });
      }
    });

    // ================= DESTINATION POST API =================

    app.post("/destination", async (req, res) => {
      try {
        const newDestination = req.body;

        console.log(newDestination);

        const result = await destinationCollection.insertOne(newDestination);

        res.send(result);
      } catch (error) {
        console.error("Destination creation error:", error);

        res.status(500).send({
          message: "Failed to create destination",
          error: error.message,
        });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// ================= SERVER =================

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
