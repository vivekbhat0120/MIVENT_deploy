const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

function col(name) {
  return mongoose.connection.db.collection(name);
}

// GET /api/dashboard - generic dashboard object
router.get("/", async (req, res) => {
  try {
    const stats = await computeStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/stats - return aggregated counters and revenue
router.get("/stats", async (req, res) => {
  try {
    const stats = await computeStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function computeStats() {
  const eventsCol = col("events");
  const quotationsCol = col("quotations");
  const billingCol = col("billing");

  // Count documents (safe: if collection doesn't exist, collection methods still work)
  const totalEvents = await eventsCol.countDocuments({}).catch(() => 0);
  const totalQuotations = await quotationsCol.countDocuments({}).catch(() => 0);
  const totalBills = await billingCol.countDocuments({}).catch(() => 0);

  // Sum revenue (try common fields: paid, amountPaid, amount)
  const revenueAgg = await billingCol
    .aggregate([
      {
        $group: {
          _id: null,
          totalPaid: {
            $sum: {
              $toDouble: { $ifNull: ["$paid", "$amountPaid", "$amount", 0] },
            },
          },
        },
      },
    ])
    .toArray()
    .catch(() => []);

  const revenue = (revenueAgg && revenueAgg[0] && revenueAgg[0].totalPaid) || 0;

  return {
    totalEvents,
    totalQuotations,
    totalBills,
    revenue,
  };
}

module.exports = router;
