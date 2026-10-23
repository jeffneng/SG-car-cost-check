# SG Car Cost Check

Static site (no backend). Open `site/index.html`, or serve `site/` with any static host.

## Refresh data (you run this locally, then push)
```sh
scripts/update.sh coe                              # after each COE bidding round
scripts/update.sh car ~/Downloads/M032-Car_Cost_Update.pdf "Sep 2026"   # new monthly PDF (needs: brew install poppler)
git add -A && git commit -m "Update data" && git push   # GitHub Pages redeploys automatically
```
`parse_pdf.py` checks every row's components sum to the PDF's own totals and reports any row that fails; do not publish if it reports problems.
The whole `data/` folder (PDF and plain JSON) is git-ignored: only the **encrypted** `site/data.enc.js` is published, so keep `data/` backed up yourself.

## Publish (one-time)
1. Create a GitHub repo and push this folder to `main`.
2. Repo Settings > Pages > Source: **GitHub Actions**.
3. The site appears at `https://<you>.github.io/<repo>/`. Every push to `main` redeploys.

## Passcode
`site/data.enc.js` is AES-GCM encrypted; the page decrypts it in the browser after the passcode is entered. `scripts/build.sh` (run by `update.sh`) asks for the passcode and never stores it. A longer passphrase is safer, since someone could guess offline against the file.

## Notes
- Margin = dealer quote − (basic cost + COE). It is an upper bound on gross margin, not profit (the PDF excludes dealer overheads and uses average OMV).
- Selections and quotes are saved in the browser's localStorage, so they stay on one device.
- Data is from LTA/OneMotoring; their terms bar commercial exploitation. Keep this to personal / friends use.
