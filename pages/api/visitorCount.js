let visitorCount = 0;

export default function handler(req, res) {
  visitorCount += 1;
  res.status(200).json({ count: visitorCount });
}
