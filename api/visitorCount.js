const { Client } = require('@notionhq/client');

// 노션 API 키와 데이터베이스 ID를 설정합니다.
const NOTION_API_KEY = 'secret_tJNk9yiO1tinhEa5lOpgMx4ZFdwByKSnN99GBxKs47A';
const DATABASE_ID = '4e2211ed9d774236822192d9313c7c51';

// 노션 클라이언트를 초기화합니다.
const notion = new Client({ auth: NOTION_API_KEY });

module.exports = async function handler(req, res) {
  // CORS 설정을 추가합니다.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 메소드에 대한 프리플라이트 요청을 처리합니다.
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청으로부터 데이터를 추출합니다.
  const { browser, timestamp, userToken } = req.body;

  try {
    // 노션 데이터베이스에 새 페이지(방문자 정보)를 추가합니다.
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        '브라우저': {
          title: [{ type: 'text', text: { content: browser } }]
        },
        'timestamp': {
          rich_text: [{ type: 'text', text: { content: timestamp } }]
        },
        'user token': {
          rich_text: [{ type: 'text', text: { content: userToken } }]
        }
      }
    });

    // 노션 데이터베이스에서 전체 레코드 수를 가져옵니다.
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    // 전체 레코드 수를 클라이언트에게 반환합니다.
    res.status(200).json({ count: response.results.length });
  } catch (error) {
    console.error('Error interacting with Notion API:', error);
    res.status(500).json({ error: 'Failed to interact with Notion API' });
  }
}
