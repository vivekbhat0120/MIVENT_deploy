const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

function col() {
  return mongoose.connection.db.collection("settings");
}

// GET /api/settings - Get settings document
// Return a single settings document (first) to match frontend expectations
router.get("/", async (req, res) => {
  try {
    const doc = await col().findOne({});
    // If there is no settings doc, return an empty object
    res.json(doc || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/:id - Get a single settings document
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Types } = mongoose;
    let query;
    try {
      query = { _id: Types.ObjectId(id) };
    } catch (e) {
      query = { id };
    }
    const doc = await col().findOne(query);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/:id - Update or create
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { Types } = mongoose;
    let query;
    try {
      query = { _id: Types.ObjectId(id) };
    } catch (e) {
      query = { id };
    }
    const result = await col().findOneAndUpdate(
      query,
      { $set: body },
      { upsert: true, returnDocument: "after" }
    );
    res.json(result.value || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
