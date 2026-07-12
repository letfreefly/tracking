import handler from './webhook.js';

export default function handler2(req, res) {
  return handler(req, res);
}
