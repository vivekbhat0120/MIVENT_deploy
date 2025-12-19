const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

function col() {
  return mongoose.connection.db.collection("projects");
}

router.get("/", async (req, res) => {
  try {
    const docs = await col().find({}).sort({ createdAt: -1 }).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    body.createdAt = new Date();
    const result = await col().insertOne(body);
    res.status(201).json({ _id: result.insertedId, ...body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Types } = mongoose;
    let query;
    try {
      query = { _id: Types.ObjectId(id) };
    } catch (e) {
      query = { id };
    }
    await col().deleteOne(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
