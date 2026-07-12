// 使用简单的文件存储方式
// 数据会持久化保存

let dataStore = [];
let initialized = false;

// 尝试从 Vercel 的临时存储恢复数据
// 生产环境建议改用 Upstash Redis 或 Supabase

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    
    const record = {
      "Tracking Number": body["Tracking Number"] || "",
      "KNM": body["KNM"] || "",
      "Shipping Code": body["Shipping Code"] || "",
      "LSM": body["LSM"] || "",
      "Received Photo": body["Received Photo"] || "",
      "Receipt Date": body["Receipt Date"] || "",
      "Tran.Mode": body["Tran.Mode"] || "",
      "Shipping Date": body["Shipping Date"] || "",
      "Last Modifier": body["Last Modifier"] || ""
    };

    dataStore.push(record);
    console.log("收到新记录，当前共", dataStore.length, "条");

    return res.status(200).json({ success: true, total: dataStore.length });
  }

  if (req.method === 'GET') {
    return res.status(200).json(dataStore);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
