// Encrypt data/cars.json + data/coe.json with a passcode -> site/data.enc.js
// AES-256-GCM, key from PBKDF2-SHA256 (600k iterations). Passcode comes from $PASSCODE, never stored.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const pass = process.env.PASSCODE;
if (!pass) { console.error("PASSCODE not set"); process.exit(1); }
const ITER = 600000;
const plain = JSON.stringify({ cars: JSON.parse(readFileSync("data/cars.json")), coe: JSON.parse(readFileSync("data/coe.json")) });
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
const b64 = (u) => Buffer.from(u).toString("base64");
writeFileSync("site/data.enc.js", `window.ENC_DATA=${JSON.stringify({ iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) })};\n`);
console.log("wrote site/data.enc.js");
