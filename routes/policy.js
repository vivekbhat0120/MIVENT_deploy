const express = require("express");
const Policy = require("../models/Policy");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const docs = await Policy.find({}).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const policy = new Policy(body);
    const saved = await policy.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let doc = await Policy.findById(id);
    if (!doc) {
      doc = await Policy.findOne({ id: parseInt(id) });
    }
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
    let updated = await Policy.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      // Try updating by local id
      updated = await Policy.findOneAndUpdate({ id: parseInt(id) }, body, {
        new: true,
        upsert: true,
      });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Policy.findByIdAndDelete(id);
    if (!deleted) {
      // Try deleting by local id
      deleted = await Policy.findOneAndDelete({ id: parseInt(id) });
    }
    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
