const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to your XAMPP MySQL Database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Default XAMPP password is empty
  database: "amarcure_db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to XAMPP MySQL Database successfully.");
});

// Registration API Endpoint
app.post("/api/register", (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    heightUnit,
    heightValue,
    weight,
    address,
    bloodGroup,
    chronicDisease,
    otherDisease,
    password,
  } = req.body;

  const sql = `INSERT INTO users 
    (first_name, last_name, email, phone, height_unit, height_value, weight, address, blood_group, chronic_disease, other_disease, password) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    firstName,
    lastName,
    email,
    phone,
    heightUnit,
    heightValue,
    weight,
    address,
    bloodGroup,
    chronicDisease,
    otherDisease,
    password,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Email address is already registered." });
      }
      return res.status(500).json({ error: "Database saving error." });
    }
    res
      .status(201)
      .json({
        message: "User registered successfully!",
        userId: result.insertId,
      });
  });
});

// Authentication & Login Endpoint
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body; // identifier can be email OR phone number

  // Query to match either email or phone number with matching password text
  const sql = `SELECT * FROM users WHERE (email = ? OR phone = ?) AND password = ?`;

  db.query(sql, [identifier, identifier, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database authentication error." });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "Invalid email/phone or password." });
    }

    const user = results[0];

    // Create a Session Row Tracking Entry inside database
    const logSql = `INSERT INTO session_logs (user_id, email_or_phone, event_type) VALUES (?, ?, 'LOGIN')`;
    db.query(logSql, [user.id, identifier], (logErr) => {
      if (logErr) console.error("Failed to log login session event:", logErr);

      // Return validation data confirmation back to mobile phone frontend screen
      res.status(200).json({
        message: "Login successful!",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        },
      });
    });
  });
});

// Logout Event Endpoint
app.post("/api/logout", (req, res) => {
  const { userId, identifier } = req.body;

  if (!userId || !identifier) {
    return res.status(400).json({ error: "Missing session identifiers." });
  }

  const logSql = `INSERT INTO session_logs (user_id, email_or_phone, event_type) VALUES (?, ?, 'LOGOUT')`;
  db.query(logSql, [userId, identifier], (logErr) => {
    if (logErr) {
      console.error("Failed to log logout session event:", logErr);
      return res.status(500).json({ error: "Failed to record logout log." });
    }
    res.status(200).json({ message: "Logout successfully tracked." });
  });
});

// Start backend server on port 5000
app.listen(5000, () => {
  console.log("Backend server running on http://localhost:5000");
});
