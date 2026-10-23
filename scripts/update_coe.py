#!/usr/bin/env python3
"""Fetch the latest COE results (Cat A/B) from OneMotoring into data/coe.json."""
import json, re, subprocess, sys, datetime

URL = "https://onemotoring.lta.gov.sg/content/onemotoring/home/buying/coe-open-bidding.html"
out = sys.argv[1] if len(sys.argv) > 1 else "data/coe.json"
html = subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", URL], capture_output=True, text=True, check=True).stdout

head = re.search(r"<p>\s*([A-Z]+ \d{4} \w+ Open Bidding Exercise has (?:ended|closed)[^<]*)</p>", html)
title = re.search(r"<h2>\s*Results for ([^<]+)</h2>", html)
cells = lambda row: re.findall(r"<td[^>]*>\s*([^<]*?)\s*</td>", row)
prem = {}
for row in re.findall(r"<tr>(.*?)</tr>", html, re.S):
    c = cells(row)
    if len(c) == 5 and c[0] in ("A", "B") and c[3].isdigit():
        prem[c[0]] = dict(qp=int(c[3]), pqp=int(c[4]), quota=int(c[2]))
if set(prem) != {"A", "B"} or not title:
    sys.exit("could not parse COE page - layout may have changed")

json.dump(dict(exercise=title.group(1).strip(), note=head.group(1).strip() if head else "",
               fetched=datetime.date.today().isoformat(), source=URL, A=prem["A"], B=prem["B"]),
          open(out, "w"), indent=1)
print(title.group(1).strip(), prem)
