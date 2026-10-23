#!/usr/bin/env python3
"""Parse the LTA Car Cost Update PDF into data/cars.json (Cat A/B only).

Usage: parse_pdf.py data/Car_Cost_Aug2026.pdf data/cars.json "Aug 2026"
Every row is validated: components must sum to the PDF's own totals.
"""
import json, re, subprocess, sys

pdf, out, month = sys.argv[1], sys.argv[2], sys.argv[3]
text = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout

ROW = re.compile(r"^\s*(\d+)\s+(.+?)\s{2,}(.+?)\s{2,}([ABCDE])\s+(.*\S)\s*$")
num = lambda s: None if s == "-" else int(s.replace(",", ""))

cars, problems, skipped = [], [], 0
for line in text.splitlines():
    m = ROW.match(line)
    if not m:
        continue
    sn, make, model, cat, rest = m.groups()
    t = rest.split()
    cc = None
    if re.fullmatch(r"[\d,]{5,}", t[0]) and not re.fullmatch(r"[A-Z]", t[2]):
        pass
    # engine cc is blank for EVs: then t = kW fuel co2 band ...; else cc kW fuel co2 band ...
    if re.fullmatch(r"[A-Z]", t[1]):          # kW, fuel
        kw, fuel, co2, band, vals = num(t[0]), t[1], num(t[2]), t[3], t[4:]
    else:
        cc, kw, fuel, co2, band, vals = num(t[0]), num(t[1]), t[2], num(t[3]), t[4], t[5:]
    if len(vals) != 13:
        problems.append((sn, "bad column count", line)); continue
    v = [num(x) for x in vals]
    omv, duty, arf, ves, eeai, regn, coe, t0, t1, p0, p1, d0, d1 = v
    if sum([omv, duty, arf, ves, eeai, regn]) != t0 or t0 + coe != t1:
        problems.append((sn, "totals mismatch", line)); continue
    if cat not in "AB":
        skipped += 1; continue
    cars.append(dict(sn=int(sn), make=make, model=model, cat=cat, cc=cc, kw=kw, fuel=fuel,
                     co2=co2, ves_band=band, omv=omv, duty=duty, arf=arf, ves=ves, eeai=eeai,
                     regn=regn, coe_pdf=coe, base=t0, total_pdf=t1, dist_price=p1))

json.dump(dict(month=month, cars=cars), open(out, "w"), indent=1)
print(f"parsed {len(cars)} Cat A/B cars, skipped {skipped} other cats, {len(problems)} problems")
for p in problems: print(p)
