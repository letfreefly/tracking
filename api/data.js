const APP_ID = 'AK20260713BXNKNR';
const APP_SECRET = '09a33425a6720d5a7e536ae2b94ce80e';
const FILE_ID = 'couEiA3nLn7L';
const SHEET_ID = '48';

let cachedToken = null;
let tokenExpireTime = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }
  
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
    
    // 如果API返回错误
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
