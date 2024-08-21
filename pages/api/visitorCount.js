let visitorCount = 0; // 메모리에 저장된 방문자 수

export default function handler(req, res) {
    // 요청이 들어올 때마다 방문자 수 증가
    visitorCount += 1;

    // 현재 방문자 수를 JSON으로 응답
    res.status(200).json({ count: visitorCount });
}
