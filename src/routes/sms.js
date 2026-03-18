const router = require('express').Router();
const https  = require('https');
const { requireAuth } = require('../middleware/auth');

function mnotifyRequest(params){
  return new Promise((resolve, reject) => {
    const qs = Object.entries(params).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
    https.get('https://apps.mnotify.net/smsapi?'+qs, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

function formatNum(num){
  num = String(num).replace(/\D/g,'');
  if(num.startsWith('0')) num = '233' + num.slice(1);
  if(!num.startsWith('233')) num = '233' + num;
  return num;
}

router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, message, apiKey, senderId } = req.body;
    if(!to||!message||!apiKey) return res.status(400).json({error:'to, message and apiKey required'});
    const code = await mnotifyRequest({ key:apiKey, to:formatNum(to), msg:message, sender_id:senderId||'BMS' });
    res.json({ success: code==='1000', code });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { recipients, message, apiKey, senderId } = req.body;
    if(!recipients||!message||!apiKey) return res.status(400).json({error:'recipients, message and apiKey required'});
    let sent=0, failed=0;
    for(const r of recipients){
      try {
        const code = await mnotifyRequest({ key:apiKey, to:formatNum(r.to), msg:r.message||message, sender_id:senderId||'BMS' });
        if(code==='1000') sent++; else failed++;
      } catch(e){ failed++; }
    }
    res.json({ sent, failed });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
```

---

**Change 2 — Fix `package.json`** — find and remove this line:
```
"node-fetch": "3.3.2",
