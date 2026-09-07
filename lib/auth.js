// Edge 런타임에서 동작하도록 Web Crypto만 사용한다 (Node API 금지)
const enc = new TextEncoder();

export const COOKIE_NAME = "ena_auth";
export const MAX_AGE_SEC = 60 * 60 * 12; // 12시간

function b64url(buf) {
  const arr = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

// 길이가 달라도 조기 반환하지 않도록 상수 시간 비교
function safeEqual(a, b) {
  const x = String(a);
  const y = String(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    diff |= x.charCodeAt(i % (x.length || 1)) ^ y.charCodeAt(i % (y.length || 1));
  }
  return diff === 0;
}

export function getSecret() {
  // AUTH_SECRET이 없으면 비밀번호를 서명 키로 대체한다
  return process.env.AUTH_SECRET || process.env.SITE_PASSWORD || "";
}

export async function createToken() {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const sig = await hmac(getSecret(), String(exp));
  return `${exp}.${sig}`;
}

export async function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  const idx = token.indexOf(".");
  if (idx < 1) return false;
  const exp = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!/^\d+$/.test(exp)) return false;
  if (Date.now() > Number(exp)) return false;
  const expected = await hmac(getSecret(), exp);
  return safeEqual(sig, expected);
}

export function checkPassword(input) {
  const expected = process.env.SITE_PASSWORD || "";
  if (!expected) return false;
  return safeEqual(input || "", expected);
}
