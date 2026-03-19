const router = require('express').Router();
const https  = require('https');
const { requireAuth } = require('../middleware/auth');

function mnotifyPost(apiKey, recipients, message, sender) {
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify({
      recipient: recipients,
      sender: sender || 'NMS',
      message: message,
      is_schedule: false,
      schedule_date: ''
    });
    var options = {
      hostname: 'api.mnotify.com',
      path: '/api/sms/quick?key=' + apiKey,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        console.log('BMS response:', data);
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ status: 'error', raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function formatNum(num) {
  num = String(num).replace(/[^0-9]/g, '');
  if (num.charAt(0) === '0') num = '233' + num.slice(1);
  if (num.slice(0, 3) !== '233') num = '233' + num;
  return num;
}

router.post('/send', requireAuth, function(req, res) {
  var to = req.body.to;
  var message = req.body.message;
  var apiKey = req.body.apiKey;
  var senderId = req.body.senderId;
  if (!to || !message || !apiKey) return res.status(400).json({ error: 'to, message and apiKey required' });
  mnotifyPost(apiKey, [formatNum(to)], message, senderId)
    .then(function(result) {
      var success = result.status === 'success' || result.code === '2000';
      res.json({ success: success, code: result.code, result: result });
    })
    .catch(function(e) { res.status(500).json({ error: e.message }); });
});

router.post('/bulk', requireAuth, function(req, res) {
  var recipients = req.body.recipients;
  var message = req.body.message;
  var apiKey = req.body.apiKey;
  var senderId = req.body.senderId;
  if (!recipients || !message || !apiKey) return res.status(400).json({ error: 'recipients, message and apiKey required' });
  var numbers = recipients.map(function(r) { return formatNum(r.to); });
  mnotifyPost(apiKey, numbers, message, senderId)
    .then(function(result) {
      var success = result.status === 'success' || result.code === '2000';
      var sent = success ? numbers.length : 0;
      var failed = success ? 0 : numbers.length;
      res.json({ sent: sent, failed: failed, result: result });
    })
    .catch(function(e) { res.status(500).json({ error: e.message }); });
});

module.exports = router;
