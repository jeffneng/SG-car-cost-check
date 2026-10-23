"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const KEY = "sgcarcost.pass";
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function decrypt(pass) {
    const d = window.ENC_DATA;
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(d.salt), iterations: d.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(d.iv) }, key, b64(d.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  async function tryUnlock(pass, remembered) {
    $("gateMsg").textContent = remembered ? "" : "Checking…";
    try {
      const data = await decrypt(pass);
      try { localStorage.setItem(KEY, pass); } catch (e) {}
      $("gate").hidden = true; $("app").hidden = false;
      start(data);
    } catch (e) {
      try { if (remembered) localStorage.removeItem(KEY); } catch (e2) {}
      $("gateMsg").textContent = remembered || !window.crypto?.subtle ? (window.crypto?.subtle ? "" : "This page must be opened over https.") : "Wrong passcode.";
    }
  }

  $("gate").addEventListener("submit", (e) => { e.preventDefault(); tryUnlock($("pass").value.trim(), false); });
  let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved) tryUnlock(saved, true);
})();
