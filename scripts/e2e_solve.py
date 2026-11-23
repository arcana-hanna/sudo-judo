# Der Kernanspruch: Was die Lehrkraft im Editor VORMACHT, ist bei den Schülern genau die Lösung.
# Für Pixelbild, Felder, Graph, Lücken/Plätze und Folge – jeweils mit einer zweiten richtigen Lösung.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITOR = "file://" + os.path.join(ROOT, "dist/index.html")
TMP = tempfile.mkdtemp()
fails = 0
def ok(c, m):
    global fails
    print(("PASS " if c else "FAIL ") + m); fails += 0 if c else 1

SOLVE = ".steps button:has-text('Lösung vormachen')"
BUILD = ".steps button:has-text('Aufgabe aufbauen')"

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx = b.new_context(accept_downloads=True)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
    ui.new_project(pg)
    def new_block(label, question):
        ui.add_block(pg, label); a = pg.locator("article").last
        a.locator("textarea[aria-label='Aufgabenstellung']").fill(question); return a

    # ---------- Pixelbild: Startbild gestalten, Lösung vormachen, zweite Lösung ----------
    a = new_block("Pixelbild", "Färbe ein L.")
    cells = a.locator("button.cell")
    cells.nth(0).click()                                           # Startbild: Feld 0 ist blau
    a.locator(SOLVE).click()
    for i in (1, 5, 9, 10): a.locator("button.cell").nth(i).click()    # Lösung 1: L aus 1,5,9,10
    a.locator("button:has-text('+ weitere Lösung')").click(); a.locator("button.cell").nth(11).click()   # Lösung 2: zusätzlich 11
    ok(a.locator("[role=tab]").count() == 2, "pixel: two accepted solutions demonstrated")

    # ---------- Felder: Wand, Start, Ziel, zwei Lösungen ----------
    a = new_block("Felder wählen", "Welche Felder führen zum Ziel?")
    a.locator("svg rect.hit").first.click(force=True)
    a.locator("button:has-text('Start')").click(); a.locator("svg g.cell").nth(0).click()
    a.locator("button:has-text('Ziel')").click(); a.locator("svg g.cell").nth(5).click()
    a.locator(SOLVE).click()
    for i in (0, 1, 5): a.locator("svg g.cell").nth(i).click()
    a.locator("button:has-text('+ weitere Lösung')").click(); a.locator("svg g.cell").nth(2).click()   # Lösung 2: zusätzlich Feld 2
    ok(a.locator("[role=tab]").count() == 2, "cells: two accepted selections demonstrated")

    # ---------- Graph: Knoten setzen, verbinden, Lösung vormachen ----------
    a = new_block("Graph", "Markiere die Endpunkte A und C.")
    a.locator("button:has-text('Knoten setzen')").click(); svg = a.locator("svg[aria-label='Zeichnung']")
    for x in (100, 300, 500): svg.click(position={"x": x, "y": 150})
    a.locator("button:has-text('Kante ziehen')").click()
    a.locator("svg g.node").nth(0).click(); a.locator("svg g.node").nth(1).click(); a.locator("svg g.node").nth(1).click(); a.locator("svg g.node").nth(2).click()
    a.locator(SOLVE).click()
    a.locator("svg [aria-label^='Knoten A']").click(); a.locator("svg [aria-label^='Knoten C']").click()
    a.locator("button:has-text('+ weitere Lösung')").click(); a.locator("svg [aria-label^='Knoten B']").click()   # Lösung 2: A, B, C
    ok(a.locator("[role=tab]").count() == 2, "graph: two accepted solutions demonstrated")

    # ---------- Lücken/Plätze: Karten, Plätze, Lösung mit mehreren Karten pro Platz ----------
    a = new_block("Lücken und Beschriften", "Was passt wohin?")
    a.locator(".tokens .inl").nth(0).fill("rot"); a.locator(".tokens .inl").nth(1).fill("blau")
    a.locator(".tokens select[aria-label='Wie oft verfügbar?']").first.select_option("2")       # „rot“ darf zweimal benutzt werden
    a.locator("button:has-text('+ Platz')").click(); a.locator("button:has-text('+ Platz')").click()
    a.locator(".srow .inl").nth(0).fill("Himbeere"); a.locator(".srow .inl").nth(1).fill("Himmel")
    a.locator(SOLVE).click()
    a.locator(".pool .chip", has_text="rot").click(); a.locator(".sbox .addhere").nth(0).click(); a.locator(".sbox .addhere").nth(1).click()   # rot: Platz 1 und 2
    a.locator(".pool .chip", has_text="blau").click(); a.locator(".sbox .addhere").nth(1).click()                                              # blau: Platz 2
    ok(a.locator(".sbox").nth(1).locator(".acc").count() == 2 and a.locator(".sbox").nth(0).locator(".acc").count() == 1, "slots: accepted cards demonstrated (slot 2 accepts two cards)")

    # ---------- Folge: Bausteine, zwei richtige Folgen ----------
    a = new_block("Folge bauen", "Baue A B A oder B B.")
    a.locator(".tokens .inl").nth(0).fill("A"); a.locator(".tokens .inl").nth(1).fill("B")
    a.locator(SOLVE).click()
    for t in ("A", "B", "A"): a.locator(".pal .tk", has_text=t).click()
    a.locator("button:has-text('+ weitere Lösung')").click(); a.locator("button:has-text('Alles löschen')").click()
    for t in ("B", "B"): a.locator(".pal .tk", has_text=t).click()
    ok(a.locator("[role=tab]").count() == 2, "seq: two accepted sequences demonstrated")

    ok(ui.all_good(pg), "every demonstrated task passes the check ('Alles fertig')")
    with pg.expect_download() as d: ui.export(pg)
    site = os.path.join(TMP, "site.html"); d.value.save_as(site)

    # ================= Schüler: genau das Vorgemachte gilt =================
    q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.goto("file://" + site); q.wait_for_selector(".menu")
    q.click(".menu button:has-text('Start')"); q.wait_for_selector("h1:has-text('Start')")
    def fresh():
        q.evaluate("localStorage.clear()"); q.reload(); q.wait_for_selector("main h1")
        if q.locator(".menu").count(): q.click(".menu button:has-text('Start')")
        q.wait_for_selector("h1:has-text('Start')")
    fs = lambda i: q.locator("fieldset.ex").nth(i)
    check = lambda i: fs(i).locator("button:has-text('Prüfen')").click()
    verdict = lambda i: fs(i).locator(".msg").inner_text()

    # Pixelbild: Startbild hat Feld 0 blau (so wurde es aufgebaut), Lösung 1 = {1,5,9,10}
    ok(fs(0).locator("button.cell").nth(0).get_attribute("aria-label").endswith("blau"), "student pixel: start image is the one built in step 1")
    check(0); ok("Noch nicht" in verdict(0), "student pixel: untouched start image is wrong")
    fs(0).locator("button.cell").nth(0).click()                     # Feld 0 zurück auf weiß
    for i in (1, 5, 9, 10): fs(0).locator("button.cell").nth(i).click()
    check(0); ok("Richtig" in verdict(0), "student pixel: demonstrated solution 1 accepted")
    fresh()
    fs(0).locator("button.cell").nth(0).click()
    for i in (1, 5, 9, 10, 11): fs(0).locator("button.cell").nth(i).click()
    check(0); ok("Richtig" in verdict(0), "student pixel: demonstrated solution 2 accepted")

    # Felder
    cell = lambda i: fs(1).locator("g.cell").nth(i)
    cell(0).click(); cell(1).click(); check(1); ok("Noch nicht" in verdict(1), "student cells: incomplete path rejected")
    cell(5).click(); check(1); ok("Richtig" in verdict(1), "student cells: demonstrated selection 1 accepted")
    fresh()
    for i in (0, 1, 5, 2): cell(i).click()
    check(1); ok("Richtig" in verdict(1), "student cells: demonstrated selection 2 accepted")

    # Graph
    node = lambda n: fs(2).locator(f"svg [aria-label^='Knoten {n}']")
    node("A").click(); check(2); ok("Noch nicht" in verdict(2), "student graph: only A is wrong")
    node("C").click(); check(2); ok("Richtig" in verdict(2), "student graph: demonstrated solution 1 (A, C) accepted")
    fresh()
    for n in "ABC": node(n).click()
    check(2); ok("Richtig" in verdict(2), "student graph: demonstrated solution 2 (A, B, C) accepted")

    # Lücken/Plätze
    chip = lambda t: fs(3).locator(".pool .chip", has_text=t)
    slot = lambda i: fs(3).locator("button.slot").nth(i)
    ok(fs(3).locator(".pool .chip", has_text="rot").inner_text().replace("\n", "").endswith("×2"), "student slots: 'rot' is available twice (as set in step 1)")
    chip("blau").click(); slot(0).click(); chip("rot").click(); slot(1).click(); check(3)
    ok("Noch nicht" in verdict(3), "student slots: slot 1 does not accept 'blau'")
    slot(0).click(); chip("rot").click(); slot(0).click(); check(3)
    ok("Richtig" in verdict(3), "student slots: rot -> 1, rot -> 2 accepted (slot 2 accepts both cards)")
    fresh()
    chip("rot").click(); slot(0).click(); chip("blau").click(); slot(1).click(); check(3)
    ok("Richtig" in verdict(3), "student slots: rot -> 1, blau -> 2 accepted")

    # Folge
    tk = lambda t: fs(4).locator(".pal .tk", has_text=t)
    tk("A").click(); tk("B").click(); check(4); ok("Noch nicht" in verdict(4), "student seq: A B is wrong")
    tk("A").click(); check(4); ok("Richtig" in verdict(4), "student seq: A B A accepted")
    fresh()
    tk("B").click(); tk("B").click(); check(4); ok("Richtig" in verdict(4), "student seq: B B accepted (second demonstrated sequence)")

    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
