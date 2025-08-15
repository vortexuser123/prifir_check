require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const crypto = require('crypto');
const app = express();
app.use(express.json(), helmet());

const ephemeral = new Map(); // replace with Redis in prod

const partialHash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

app.post('/api/checkout', (req, res) => {
  const { items, email, address } = req.body;
  const orderRef = 'ORD-' + crypto.randomBytes(5).toString('hex');
  // store minimal for 24h only
  ephemeral.set(orderRef, { items, email, address, createdAt: Date.now() });
  res.json({
    orderRef,
    contactHash: partialHash(email),
    addressHint: address?.slice(0, 5) + '***'
  });
});

// Cron-like cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ephemeral) if (now - v.createdAt > 24 * 3600_000) ephemeral.delete(k);
}, 3600_000);

app.listen(3003, () => console.log('Privacy Checkout :3003'));
