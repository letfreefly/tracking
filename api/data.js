// 通过 WPS 开放 API 实时查询多维表格数据

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
  tokenExpireTime = Date.now() + 7000000; // 提前续期
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    
    const data = await response.json();
    
    // 提取需要的字段
    const targetFields = [
      "Tracking Number", "KNM", "Shipping Code", "LSM",
      "Received Photo", "Receipt Date", "Tran.Mode",
      "Shipping Date", "Last Modifier"
    ];
    
    const records = (data.data?.records || []).map(record => {
      let parsedFields = {};
      try {
        parsedFields = JSON.parse(record.fields);
      } catch(e) {
        parsedFields = record.fields || {};
      }
      
      const result = {};
      targetFields.forEach(f => {
        result[f] = parsedFields[f] || "";
      });
      
      // 处理签收照片 - 提取图片URL
      if (result["Received Photo"] && Array.isArray(result["Received Photo"])) {
        result["Received Photo"] = result["Received Photo"][0]?.source || "";
      }
      
      // 处理 Last Modifier - 提取用户名
      if (result["Last Modifier"] && typeof result["Last Modifier"] === 'object') {
        result["Last Modifier"] = result["Last Modifier"].nickName || "";
      }
      
      return result;
    });

    return res.status(200).json(records);
    
  } catch (error) {
    console.error('API调用失败:', error);
    return res.status(500).json({ error: '查询失败', detail: error.message });
  }
}
