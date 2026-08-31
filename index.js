const express = require("express");
const cors = require("cors");
const { jwtVerify } = require("jose-cjs");

const app = express();
require("dotenv").config();

const port = process.env.PORT || 5000;

// 1. Enable JSON parsing and CORS for all cross-origin client requests
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// mongodb start from here

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet } = require("jose-cjs");

const uri = process.env.MONGODB_URI;

// 2. Configure MongoDB client with Strict API for forward compatibility
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// JWT start from here

// 3. Cache the JWKS from the client's auth server to verify JWT signatures locally
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 4. Reject requests missing the Authorization header entirely
  if (!authHeader) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  // 5. Reject requests where the Bearer token is malformed or missing
  if (!token) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  try {
    // 6. Validate the token against the remote JWKS public keys
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
        const { location, search, duration, budget, people, page = 1, limit = 6 } = req.query;

        // 7. Dynamically build the MongoDB query object based on provided filters
        const query = {};
        
        const searchTerm = search || location;

        // Location/Name search
        if (searchTerm) {
          query.$or = [
            {
              destinationName: {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              country: {
                $regex: searchTerm,
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

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // 8. Execute the query with skip and limit for pagination, and calculate total count
        const total = await destinationCollection.countDocuments(query);
        const result = await destinationCollection
          .find(query)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .toArray();

        // Support both old and new response formats for backward compatibility
        res.send({ data: result, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
      } catch (error) {
        // 9. Catch and log any database or parsing errors during search
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

        // 10. Fetch a single destination by its unique MongoDB ObjectId
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

        // 11. Insert the validated booking payload into the Bookings collection
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

        // 12. Retrieve all bookings associated with the provided user ID string
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

    //============= Booking PATCH API ==================

    app.patch("/booking/:bookingId", verifyToken, async (req, res) => {
      try {
        const { bookingId } = req.params;
        const updatedData = req.body;

        // 13. Update specific fields (e.g., guests) of an existing booking without overwriting the whole document
        const result = await bookingCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: updatedData }
        );

        res.send(result);
      } catch (error) {
        console.error("Booking update error:", error);
        res.status(500).send({
          message: "Failed to update booking",
          error: error.message,
        });
      }
    });

    //============= Booking Cancel API ==================

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

        // 14. Permanently remove the destination document from the database
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

// 15. Start the Express server and listen for incoming HTTP requests on the configured port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
