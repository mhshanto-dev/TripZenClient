# TripZen Server — Travel Booking Platform API

This is the backend REST API powering [TripZen](https://tripzen-umber.vercel.app/), a full-stack travel booking platform. Built with Node.js and Express.js, backed by MongoDB, it handles destination data, bookings, and authentication for the TripZen client application.

**Frontend Repository:** https://github.com/mhshanto-dev/TripZen
**Live Frontend:** https://tripzen-umber.vercel.app/

---

## Features

- RESTful API for managing travel destinations and bookings
- Secure authentication and session handling (Better Auth, JWT, Google OAuth)
- MongoDB-backed data layer for destinations, bookings, and user data
- CORS-enabled API designed to be consumed by a decoupled Next.js frontend
- Deployed independently on Vercel for scalable, serverless operation

## Tech Stack

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) (via MongoDB Atlas)
- Better Auth / JWT for authentication
- Deployed on [Vercel](https://vercel.com/)

## API Overview

| Method | Endpoint          | Description                          | Auth Required |
|--------|-------------------|---------------------------------------|:--------------:|
| GET    | `/destination`    | Get all available destinations        | No             |
| GET    | `/destination/:id`| Get details for a single destination  | No             |
| POST   | `/booking`        | Create a new booking                  | Yes            |
| GET    | `/booking`        | Get bookings for the logged-in user   | Yes            |

> Update this table to match your actual routes as the API evolves.

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### Installation

```bash
git clone https://github.com/mhshanto-dev/TripZenServer.git
cd TripZenServer
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_auth_secret
GOOGLE_CLIENTID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:3000
```

> Never commit your `.env` file. Make sure it is listed in `.gitignore`.

### Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

## Deployment

This API is deployed on [Vercel](https://vercel.com/) as a serverless Node.js function. Environment variables must be configured in the Vercel dashboard under **Settings → Environment Variables**, and MongoDB Atlas Network Access must allow connections from `0.0.0.0/0` (or Vercel's IP ranges) since serverless functions do not have a fixed IP.

## Related Repository

The Next.js frontend that consumes this API is maintained separately:
👉 [TripZen (Client)](https://github.com/mhshanto-dev/TripZen)

## Author

**MD. Mehedi Hasan Shanto**
Full Stack Developer (MERN Stack)

- Portfolio: https://mhshanto-dev.vercel.app/
- GitHub: https://github.com/mhshanto-dev
- LinkedIn: https://www.linkedin.com/in/mh-shanto/

## License

This project is open source and available for learning purposes.
