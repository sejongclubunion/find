const { Client } = require('@notionhq/client');

// 노션 API 키와 데이터베이스 ID를 설정
const NOTION_API_KEY = 'secret_tJNk9yiO1tinhEa5lOpgMx4ZFdwByKSnN99GBxKs47A';
const DATABASE_ID = '4e2211ed9d774236822192d9313c7c51';

// 노션 API 클라이언트 초기화
const notion = new Client({ auth: NOTION_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { browser, timestamp, userToken } = req.body;

    try {
      // 노션 데이터베이스에 새 페이지(방문자 정보) 추가
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

      // 노션 데이터베이스의 전체 레코드 수 가져오기
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
      });

      // 레코드 수 반환
      res.status(200).json({ count: response.results.length });
    } catch (error) {
      console.error('Error interacting with Notion API:', error);
      res.status(500).json({ error: 'Failed to interact with Notion API' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
