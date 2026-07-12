const fs = require('fs');
const path = require('path');

const DATA_FILE = '/tmp/data.json';

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('读取数据文件失败:', e);
  }
  return [];
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error('写入数据文件失败:', e);
  }
}

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

    const records = readData();
    records.push(record);
    writeData(records);

    console.log("收到新记录，当前共", records.length, "条");

    return res.status(200).json({ success: true, total: records.length });
  }

  if (req.method === 'GET') {
    const records = readData();
    return res.status(200).json(records);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
