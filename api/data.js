const APP_ID = 'AK20260713BXNKNR';
const APP_SECRET = '09a33425a6720d5a7e536ae2b94ce80e';
const FILE_ID = 'couEiA3nLn7L';
const SHEET_ID = '48';

// 你提供的有效 token（临时使用）
let cachedToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjNiNTkyYWYwLTk5ODktNDRhOC1hMzQ3LTE4Yzc1MDQ4MTlmNCIsInR5cCI6IkpXVCJ9.eyJhaWQiOjE4NjkzMTE1NzcsImF0cCI6InVzZXIiLCJhdHMiOiJEWGp4TzhRIiwiYnVpIjpmYWxzZSwiY2lkIjo2MzA2MDk5MTAsImNsaSI6IkFLMjAyNjA3MTNCWE5LTlIiLCJjb2EiOjAsImV4cCI6MTc4MzkxMTk3OSwianN0IjpmYWxzZSwic3BpIjoxODY4NTc4MjkxfQ.XbUhcOPNq4ONLh0vac2n9_q-GBYZwaZ9pNIoBJ8G_bvQG9_Tx71KlQ-QcADtlJcHH6y7YKlOeDoa0lsMclEmzQ';
let tokenExpireTime = Date.now() + 7000000; // 约2小时后过期

async function getAccessToken() {
  if (Date.now() < tokenExpireTime) {
    return cachedToken;
  }
  
  // token过期时重新获取
  const response = await fetch('https://openapi.wps.cn/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: APP_ID,
      client_secret: APP_SECRET
    })
  });
  
  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpireTime = Date.now() + 7000000;
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = await getAccessToken();
    
    const response = await fetch(
      `https://openapi.wps.cn/v7/coop/dbsheet/${FILE_ID}/sheets/${SHEET_ID}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          max_records: 500,
          show_fields_info: true
        })
      }
    );
    
    const result = await response.json();
    
    if (result.code !== 0) {
      return res.status(200).json({ error: 'API错误', code: result.code, msg: result.msg });
    }
    
    const targetFields = [
      "Tracking Number", "KNM", "Shipping Code", "LSM",
      "Received Photo", "Receipt Date", "Tran.Mode",
      "Shipping Date", "Last Modifier"
    ];
    
    const records = (result.data?.records || []).map(record => {
      let parsedFields = {};
      try {
        parsedFields = JSON.parse(record.fields);
      } catch(e) {
        parsedFields = record.fields || {};
      }
      
      const item = {};
      targetFields.forEach(f => {
        item[f] = parsedFields[f] || "";
      });
      
      if (item["Received Photo"] && Array.isArray(item["Received Photo"])) {
        item["Received Photo"] = item["Received Photo"][0]?.source || "";
      }
      
      if (item["Last Modifier"] && typeof item["Last Modifier"] === 'object') {
        item["Last Modifier"] = item["Last Modifier"].nickName || "";
      }
      
      return item;
    });

    return res.status(200).json(records);
    
  } catch (error) {
    return res.status(200).json({ 
      error: error.message,
      stack: error.stack,
      message: '请检查API配置'
    });
  }
}
