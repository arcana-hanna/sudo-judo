# Tests für: Bilder in Antworten, Reihenfolge mit Regeln, Folgen, Plätze/Lücken, Felder mit Wänden, gerichtete Graphen.
# Voraussetzung: npm run build, pip install playwright pillow, playwright install chromium
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui
import tempfile
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITOR = "file://" + os.path.join(ROOT, "dist/index.html")
TMP = tempfile.mkdtemp()
PNG = os.path.join(TMP, "pic.png"); Image.effect_noise((900, 500), 60).convert("RGB").save(PNG)
fails = 0
def ok(c, m):
    global fails
    print(("PASS " if c else "FAIL ") + m); fails += 0 if c else 1

def goto_page(page, name):
    if name == "Menü":
        if page.locator(".menu").count() == 0: page.click("button:has-text('Menü')")
        page.wait_for_selector(".menu"); return
    if page.locator(".menu").count() == 0:
        page.click("button:has-text('Menü')"); page.wait_for_selector(".menu")
    page.click(f".menu button:has-text('{name}')"); page.wait_for_selector(f"h1:has-text('{name}')")

def fresh(q, name):                       # Fortschritt löschen, Seite neu laden, zur Aufgabe gehen
    q.evaluate("localStorage.clear()"); q.reload(); q.wait_for_selector("main h1"); goto_page(q, name)

def arrange(q, target):                   # Reihenfolge-Aufgabe über die ↑-Knöpfe herstellen
    for ti, text in enumerate(target):
        while True:
            texts = q.locator(".item .txt").all_inner_texts(); i = texts.index(text)
            if i <= ti: break
            q.locator(".item").nth(i).locator("button").first.click()

msg = lambda q: q.locator(".msg").last.inner_text()
check = lambda q: q.locator("button:has-text('Prüfen')").last.click()

NAMES = ["Bild-Auswahl", "Reihenfolge mit Regeln", "Folge bauen", "Lückentext", "Bild beschriften", "Felder wählen", "Gerichteter Graph"]

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx = b.new_context(accept_downloads=True)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept())
    pg.goto(EDITOR)

    # ================= Teil A: Vorlagen bauen, exportieren, als Schüler lösen =================
    ui.new_project(pg)
    for n in NAMES:
        ui.add_page(pg); pg.locator("dialog[open] .card", has_text=n).click()
    ok(pg.locator(".pages li").count() == 1 + len(NAMES), "gallery: all 7 new templates added")
    ui.toggle_issues(pg)
    ok(not any(n in t for t in pg.locator(".issues li button").all_inner_texts() for n in NAMES), "check: new templates raise no open points")
    with pg.expect_download() as d: ui.export(pg)
    site = os.path.join(TMP, "site.html"); d.value.save_as(site)

    q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.goto("file://" + site); q.wait_for_selector(".menu")

    # 1) Bilder in Antworten
    goto_page(q, "Bild-Auswahl")
    ok(q.locator("img.oimg").count() == 3 and q.locator("img.oimg").first.evaluate("e => e.naturalWidth") > 0, "images: 3 image options rendered")
    q.locator("label.opt", has_text="Bild A").click(); check(q)
    ok("Noch nicht" in msg(q) and "Dreieck" in msg(q), "images: wrong image answer rejected with hint")
    q.locator("label.opt", has_text="Bild C").click(); check(q)
    ok("Richtig" in msg(q), "images: right image answer accepted")

    # 2) Reihenfolge mit Regeln: mehrere Reihenfolgen richtig
    goto_page(q, "Reihenfolge mit Regeln")
    arrange(q, ["Schuhe", "Unterhose", "Hose", "Socken", "Jacke"]); check(q)
    ok("Noch nicht" in msg(q), "rules: invalid order (shoes first) rejected")
    arrange(q, ["Socken", "Unterhose", "Hose", "Schuhe", "Jacke"]); check(q)
    ok("Richtig" in msg(q), "rules: valid order #1 accepted")
    fresh(q, "Reihenfolge mit Regeln")
    arrange(q, ["Unterhose", "Hose", "Jacke", "Socken", "Schuhe"]); check(q)
    ok("Richtig" in msg(q), "rules: a different valid order #2 accepted too")
    fresh(q, "Reihenfolge mit Regeln")
    ok(q.locator(".item .txt").all_inner_texts() not in (["Unterhose", "Hose", "Socken", "Schuhe", "Jacke"],), "rules: initial shuffle is not already solved")

    # 3) Folge bauen: zwei richtige Folgen
    goto_page(q, "Folge bauen")
    ok(q.locator("button:has-text('Prüfen')").is_disabled(), "seq: check disabled while empty")
    q.locator(".pal .tk", has_text="+2").click(); q.locator(".pal .tk", has_text="+3").click(); check(q)
    ok("Noch nicht" in msg(q), "seq: wrong sequence rejected")
    q.click("button:has-text('Alles löschen')"); ok(q.locator(".line .tk").count() == 0, "seq: clear works")
    for _ in range(3): q.locator(".pal .tk", has_text="+2").click()
    check(q); ok("Richtig" in msg(q), "seq: answer +2 +2 +2 accepted")
    fresh(q, "Folge bauen")
    t3 = q.locator(".pal .tk", has_text="+3"); t3.focus(); q.keyboard.press("Enter"); q.keyboard.press("Enter")   # per Tastatur
    check(q); ok("Richtig" in msg(q), "seq: answer +3 +3 accepted (built by keyboard)")

    # 4) Lückentext mit Auswahllisten
    goto_page(q, "Lückentext")
    ok(q.locator("button:has-text('Prüfen')").is_disabled(), "cloze: check disabled until all gaps filled")
    q.locator("select[aria-label='Maus']").select_option(label="Ausgabe"); q.locator("select[aria-label='Bildschirm']").select_option(label="Ausgabe"); check(q)
    ok("Noch nicht" in msg(q) and "Maus" in msg(q), "cloze: wrong gap rejected with hint")
    q.locator("select[aria-label='Maus']").select_option(label="Eingabe"); check(q)
    ok("Richtig" in msg(q), "cloze: correct answers accepted (same word usable twice)")

    # 5) Bild beschriften: Karten auf Plätze
    goto_page(q, "Bild beschriften")
    slot = lambda start: q.locator(f"button.slot[aria-label^='{start}']")
    chip = lambda t: q.locator(".pool .chip", has_text=t)
    chip("Maus").click(); slot("oben").click(); chip("Bildschirm").click(); slot("unten").click(); chip("Tastatur").click(); slot("rechts").click()
    ok(q.locator(".pool .chip").count() == 0 and "Alle Karten sind verteilt" in q.inner_text(".pool"), "slots: pool empties as cards are placed")
    check(q); ok("Noch nicht" in msg(q), "slots: wrong placement rejected")
    for s in ["oben", "unten", "rechts"]: slot(s).click()                     # alle wieder zurücklegen
    ok(q.locator(".pool .chip").count() == 3, "slots: clicking a filled slot returns the card")
    chip("Bildschirm").click(); slot("oben").click()
    tk = chip("Tastatur"); tk.focus(); q.keyboard.press("Enter"); slot("unten").focus(); q.keyboard.press("Enter")   # Tastatur
    chip("Maus").drag_to(slot("rechts"))                                      # Ziehen
    check(q); ok("Richtig" in msg(q), "slots: solved via click, keyboard and drag")

    # 6) Felder mit Wänden
    goto_page(q, "Felder wählen")
    ok(q.locator("[aria-label='Zeile 1, Spalte 1, Start, Wand rechts']").count() == 1, "cells: walls and start announced to screen readers")
    cell = lambda r, c: q.locator(f"[aria-label^='Zeile {r}, Spalte {c}']")
    cell(1, 1).focus(); q.keyboard.press("Enter"); cell(1, 2).click(); check(q)
    ok("Noch nicht" in msg(q), "cells: wrong selection rejected (keyboard + click)")
    cell(1, 2).click()                                                          # abwählen
    for rc in [(2, 1), (3, 1), (3, 2), (3, 3)]: cell(*rc).click()
    check(q); ok("Richtig" in msg(q), "cells: shortest path accepted")

    # 7) Gerichteter, gewichteter Graph
    goto_page(q, "Gerichteter Graph")
    ok(q.locator("line.vis[marker-end]").count() == 5, "graph: 5 arrows drawn")
    ok(q.locator("[aria-label='Kante A nach B, 2']").count() == 1, "graph: weights announced ('Kante A nach B, 2')")
    edge = lambda a, b_: q.locator(f"[aria-label^='Kante {a} nach {b_}']")
    edge("A", "C").click(force=True); edge("C", "D").click(force=True); check(q)
    ok("Noch nicht" in msg(q), "graph: 7 km route rejected")
    edge("A", "C").click(force=True); edge("A", "B").click(force=True); edge("B", "C").click(force=True); check(q)
    ok("Richtig" in msg(q), "graph: shortest route (5 km) accepted")

    # ================= Teil B: Editor =================
    ed = ctx.new_page(); ed.on("pageerror", lambda e: errs.append(str(e))); ed.on("dialog", lambda d: d.accept()); ed.goto(EDITOR)
    ed.evaluate("localStorage.clear()"); ed.reload()
    last = lambda: ed.locator("article").last

    # B1 Bild in Antwort
    ui.add_block(ed, "Auswahlaufgabe")
    last().locator(".opt input[type=file]").first.set_input_files(PNG)
    ed.wait_for_selector("article >> .opt img.oimg")
    ok(last().locator(".opt img.oimg").count() == 1, "editor: image attached to an answer option")
    ui.toggle_issues(ed)
    ok(any("Bild-Antworten" in t for t in ed.locator(".issues li button").all_inner_texts()), "editor: check asks for a text on image-only answers")
    last().locator("button[aria-label='Bild entfernen']").click()
    ok(last().locator(".opt img.oimg").count() == 0, "editor: image can be removed")
    ui.toggle_issues(ed)

    # B2 Reihenfolge-Regeln
    ui.add_block(ed, "Reihenfolge"); art = last()
    art.locator("label.sw input[type=checkbox]").check()
    for i, t in enumerate(art.locator(".item .inl").all()[:3]): t.fill("abc"[i])
    art.locator("button:has-text('+ Regel')").click()
    ok("3 Reihenfolgen sind richtig" in art.inner_text(), "order rules editor: a before b -> 3 of 6 orders valid")
    art.locator("button:has-text('+ Regel')").click()
    sels = art.locator("select[aria-label='Zuerst']"), art.locator("select[aria-label='Danach']")
    sels[0].nth(1).select_option(index=1); sels[1].nth(1).select_option(index=2)       # b vor c
    ok("1 Reihenfolge ist richtig" in art.inner_text(), "order rules editor: a<b<c -> exactly 1 order")
    art.locator("button:has-text('+ Regel')").click()
    sels[0].nth(2).select_option(index=2); sels[1].nth(2).select_option(index=0)       # c vor a
    ok("widersprechen" in art.inner_text(), "order rules editor: contradiction flagged")

    # B3 Platz-Aufgabe auf Bild
    ui.add_block(ed, "Lücken und Beschriften"); art = last()
    art.locator(".seg button:has-text('Auf einem Bild')").click()
    art.locator("input[aria-label='Hintergrundbild wählen']").set_input_files(PNG)
    ed.wait_for_selector("article >> .stage img")
    art.locator("button:has-text('Platz auf dem Bild setzen')").click()
    art.locator(".stage").click(position={"x": 120, "y": 60})
    ok(art.locator(".mk").count() == 1, "slots editor: slot placed by clicking the image")
    mk = art.locator(".mk").first; before = mk.get_attribute("style"); box = mk.bounding_box()
    ed.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2); ed.mouse.down()
    ed.mouse.move(box["x"] + 150, box["y"] + 60, steps=6); ed.mouse.up()
    ok(mk.get_attribute("style") != before, "slots editor: slot marker dragged to a new position")
    art.locator(".tokens .inl").first.fill("Apfel"); art.locator(".tokens .inl").nth(1).fill("Birne")
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    art.locator(".pool .chip", has_text="Apfel").click(); art.locator(".sbox .addhere").first.click()
    art.locator(".pool .chip", has_text="Birne").click(); art.locator(".sbox .addhere").first.click()
    ok(art.locator(".sbox .acc").count() == 2, "slots editor: demonstrating the solution puts two accepted cards into the slot")
    art.locator(".sbox .acc").first.click()
    ok(art.locator(".sbox .acc").count() == 1, "slots editor: clicking a placed card removes it again")
    ui.toggle_issues(ed)
    ok(any("Beschreibung des Hintergrundbilds" in t for t in ed.locator(".issues li button").all_inner_texts()), "slots editor: check asks for background alt text")
    ui.toggle_issues(ed)

    # B3b Lückentext: Plätze entstehen automatisch aus ___
    ui.add_block(ed, "Lücken und Beschriften"); art = last()
    art.locator(".seg button:has-text('Lückentext')").click()
    art.locator("textarea[aria-label='Text mit Lücken']").fill("Ein ___ und ein ___ und ein ___.")
    ok("3 Lücken" in art.inner_text(), "cloze editor: three blanks recognised")
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    ok(art.locator(".cloze .sbox").count() == 3, "cloze editor: slots were created automatically")
    art.locator(".steps button:has-text('Aufgabe aufbauen')").click()
    art.locator("textarea[aria-label='Text mit Lücken']").fill("Nur ein ___.")
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    ok(art.locator(".cloze .sbox").count() == 1, "cloze editor: slots shrink with the blanks")

    # B4 Felder-Aufgabe
    ui.add_block(ed, "Felder wählen"); art = last()
    art.locator("svg rect.hit").first.click(force=True)
    ok(art.locator("svg line.wall").count() == 1, "cells editor: wall placed between two cells")
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    cells = art.locator("svg g.cell"); cells.nth(0).click()
    art.locator("button:has-text('+ weitere Lösung')").click(); cells.nth(5).click()
    ok(art.locator("[role=tab]").count() == 2, "cells editor: second accepted solution tab")
    art.locator("[role=tab]").first.click()
    ok(cells.nth(0).get_attribute("aria-pressed") == "true" and cells.nth(5).get_attribute("aria-pressed") == "false", "cells editor: solutions are independent")
    art.locator(".steps button:has-text('Aufgabe aufbauen')").click()
    art.locator("button[aria-label='Spalten erhöhen']").click()
    ok(art.locator("svg g.cell").count() == 20 and art.locator("svg line.wall").count() == 1, "cells editor: resize keeps walls and adds cells")
    ok(art.locator("svg g.cell[aria-pressed=true]").count() == 0, "cells editor: build step shows the board like the students' start (no solution marked)")

    # B5 Graph: beschriften, Gewichte, Pfeile, Form, weitere Lösung
    ui.add_block(ed, "Graph"); art = last()
    art.locator("button:has-text('Knoten setzen')").click(); svg = art.locator("svg[aria-label='Zeichnung']")
    svg.click(position={"x": 90, "y": 120}); svg.click(position={"x": 400, "y": 200})
    art.locator("button:has-text('Kante ziehen')").click(); art.locator("svg g.node").nth(0).click(); art.locator("svg g.node").nth(1).click()
    art.locator("button:has-text('Beschriften')").click(); art.locator("svg g.node").nth(0).click()
    art.locator("input[aria-label='Name des Knotens']").fill("Z")
    ok(art.locator("[aria-label^='Knoten Z']").count() == 1, "graph editor: node renamed")
    art.locator(".panel label:has-text('Form') select").select_option("square")
    ok(art.locator("svg g.node rect.shape").count() == 1, "graph editor: node shape changed to square")
    art.locator("svg g.edge").first.click(force=True)
    art.locator("input[aria-label='Beschriftung oder Gewicht']").fill("9")
    ok(art.locator("svg g.edge text.w").text_content() == "9", "graph editor: edge weight shown")
    art.locator("label:has-text('Kanten mit Pfeil') input").check()
    ok(art.locator("svg line.vis[marker-end]").count() == 1 and art.locator("button:has-text('Richtung umkehren')").count() == 1, "graph editor: arrows + reverse direction")
    art.locator("button:has-text('Richtung umkehren')").click()
    ok("nach" in art.locator("svg g.edge").first.get_attribute("aria-label"), "graph editor: direction reversed")
    art.locator(".seg button:has-text('Kanten markieren')").click()
    art.locator(".steps button:has-text('Lösung vormachen')").click(); art.locator("svg g.edge").first.click(force=True)
    ok(art.locator("svg g.edge.sel").count() == 1, "graph editor: solution demonstrated by clicking the edge")
    art.locator("button:has-text('+ weitere Lösung')").click()
    ok(art.locator("[role=tab]").count() == 2, "graph editor: alternative solutions")
    art.locator(".seg button:has-text('Knoten färben')").click()
    ok("prüft der Computer jede gültige Färbung" in art.inner_text(), "graph editor: colouring needs no demonstrated solution")

    # B6 Gitter: Schritte und weitere Lösung
    ui.add_block(ed, "Pixelbild"); art = last()
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    art.locator("button:has-text('+ weitere Lösung')").click()
    ok(art.locator("[role=tab]").count() == 2, "grid editor: alternative solutions")

    # B7 Folgen-Aufgabe ohne Lösung wird gemeldet
    ui.add_block(ed, "Folge bauen")
    ui.toggle_issues(ed)
    ok(any("keine richtige Folge" in t for t in ed.locator(".issues li button").all_inner_texts()), "check: empty sequence task reported")

    # B8 Rückwärtskompatibilität: Projekt ohne die neuen optionalen Felder öffnen und alle Seiten anzeigen
    old = os.path.join(ROOT, "scripts/fixtures/project-v1-sample.json")
    ed.set_input_files("input[type=file][accept*='.html']", old); ed.wait_for_timeout(400)
    n_pages = ed.locator(".pages li").count()
    ok(n_pages == 8 and ed.input_value(".title") == "Meine Rätselbox", "compat: older project file opens (8 pages)")
    ui.try_all(ed)
    rendered = 0
    for i in range(n_pages):
        ui.edit_all(ed); ed.locator(".pages li .pg").nth(i).click(); ui.try_all(ed)
        ed.wait_for_selector(".player main h1"); rendered += ed.locator(".player main fieldset, .player main .text").count() > 0
    ok(rendered == n_pages, f"compat: all {n_pages} pages of the older project render in the student view")
    ui.edit_all(ed)
    if ed.locator(".issues").count() == 0: ui.toggle_issues(ed)
    ok(ed.locator(".issues .allgood").count() == 1, "compat: older project passes the check")

    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
