const router = require('express').Router();
const https = require('https');
const { requireAuth } = require('../middleware/auth');

function mnotifyRequest(apiKey, to, msg, senderId) {
  return new Promise(function(resolve, reject) {
    var num = String(to).replace(/[^0-9]/g, '');
    if (num.charAt(0) === '0') num = '233' + num.slice(1);
    if (num.slice(0, 3) !== '233') num = '233' + num;
    var path = '/smsapi?key=' + apiKey + '&to=' + num + '&msg=' + encodeURIComponent(msg) + '&sender_id=' + (senderId || 'BMS');
    var options = { hostname: 'apps.mnotify.net', path: path, method: 'GET' };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve(data.trim()); });
    });
    req.on('error', reject);
    req.end();
  });
}

router.post('/send', requireAuth, function(req, res) {
  var to = req.body.to;
  var message = req.body.message;
  var apiKey = req.body.apiKey;
  var senderId = req.body.senderId;
  if (!to || !message || !apiKey) return res.status(400).json({ error: 'to, message and apiKey required' });
  mnotifyRequest(apiKey, to, message, senderId)
    .then(function(code) { res.json({ success: code === '1000', code: code }); })
    .catch(function(e) { res.status(500).json({ error: e.message }); });
});

router.post('/bulk', requireAuth, function(req, res) {
  var recipients = req.body.recipients;
  var message = req.body.message;
  var apiKey = req.body.apiKey;
  var senderId = req.body.senderId;
  if (!recipients || !message || !apiKey) return res.status(400).json({ error: 'recipients, message and apiKey required' });
  var sent = 0;
  var failed = 0;
  var chain = Promise.resolve();
  recipients.forEach(function(r) {
    chain = chain.then(function() {
      return mnotifyRequest(apiKey, r.to, r.message || message, senderId)
        .then(function(code) { if (code === '1000') sent++; else failed++; })
        .catch(function() { failed++; });
    });
  });
  chain.then(function() { res.json({ sent: sent, failed: failed }); })
    .catch(function(e) { res.status(500).json({ error: e.message }); });
});

module.exports = router;
