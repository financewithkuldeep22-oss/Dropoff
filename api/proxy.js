export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let gasUrl = 'https://script.google.com/macros/s/AKfycbw91MSWxgTmiSGZTxlgDkniCbPFEZMUpQFiCwu6AnDd13bTfCquZJVDP6sut3JF9Eri/exec';
    if (req.query && req.query.url) {
      gasUrl = req.query.url;
    }

    const payloadStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: payloadStr,
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!gasResponse.ok) {
      return res.status(gasResponse.status).json({ 
        status: 'error', 
        message: 'Google Apps Script returned ' + gasResponse.status 
      });
    }

    const responseText = await gasResponse.text();

    try {
      const jsonResponse = JSON.parse(responseText);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      return res.status(200).json(jsonResponse);
    } catch (parseError) {
      return res.status(502).json({ 
        status: 'error', 
        message: 'Invalid JSON response from Google Apps Script',
        raw: responseText.substring(0, 200)
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal Server Proxy Error' 
    });
  }
}