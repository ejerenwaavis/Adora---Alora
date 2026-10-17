const express = require('express');
const router = express.Router();
const { generateFormToken } = require('../middleware/antiBot');

// GET a fresh signed form token for client-side forms
router.get('/form-token', (req, res) => {
  const token = generateFormToken();
  res.json({ token, issuedAt: Date.now() });
});

module.exports = router;
