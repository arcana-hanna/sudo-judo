import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui
# Ende-zu-Ende-Test: Editor -> Export -> Schüleransicht offline -> Re-Import.
# Voraussetzung: npm run build, pip install playwright pillow, playwright install chromium
# Aufruf: python scripts/e2e.py
import os, tempfile
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = tempfile.mkdtemp()
png = os.path.join(TMP, "big.png")
Image.effect_noise((2400, 1200), 40).convert("RGB").save(png)
TARGET = ["Wasser erhitzen", "Teebeutel in die Tasse legen", "Heißes Wasser eingießen", "Drei Minuten warten"]
def goto_page(page, name):
    # Navigation läuft über das (asynchrone) hashchange-Ereignis -> auf die Überschrift warten.
    if page.locator(".menu").count() == 0 and name != "Menü":
        page.click("button:has-text('Menü')"); page.wait_for_selector(".menu")
    if name == "Menü": 
        if page.locator(".menu").count() == 0: page.click("button:has-text('Menü')")
        page.wait_for_selector(".menu"); return
    page.click(f".menu button:has-text('{name}')"); page.wait_for_selector(f"h1:has-text('{name}')")

ok = lambda c, m: print(("PASS " if c else "FAIL ") + m) or c

with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    pg = b.new_page(accept_downloads=True)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept())
    pg.goto("file://" + os.path.join(ROOT, "dist/index.html"))

    # Undo/Redo
    ui.select_page(pg, "Willkommen")
    pg.fill(".pagetitle", "Neuer Titel"); pg.wait_for_timeout(700)
    ui.undo(pg)
    ok(pg.input_value(".pagetitle") == "Willkommen", "undo restores page title")
    ui.redo(pg)
    ok(pg.input_value(".pagetitle") == "Neuer Titel", "redo reapplies page title")
    pg.fill(".pagetitle", "Willkommen"); pg.wait_for_timeout(700)

    # Bild hochladen (wird verkleinert)
    ui.add_block(pg, "Bild")
    pg.locator("article").last.locator("input[type=file]").set_input_files(png)
    pg.wait_for_selector(".thumb")
    kb = int(pg.locator("article").last.locator("small").first.inner_text().split()[0])
    ok(kb < 1500, f"image downscaled ({os.path.getsize(png)//1024} KB -> {kb} KB)")

    # Export
    path = os.path.join(TMP, "export.html")
    with pg.expect_download() as d: ui.export(pg)
    d.value.save_as(path)

    # Schüleransicht (file://, offline)
    q = b.new_page(); q.on("pageerror", lambda e: errs.append(str(e)))
    q.goto("file://" + path)
    goto_page(q, "Willkommen")
    q.wait_for_selector("figure img", timeout=3000)
    ok(q.locator("figure img").count() == 1, "image shown in student view")
    goto_page(q, "Zweite Aufgabe")
    # per Knopf sortieren (Bubble-Sort über die ↑-Schaltflächen)
    for target_idx, text in enumerate(TARGET):
        while True:
            texts = q.locator(".item .txt").all_inner_texts()
            i = texts.index(text)
            if i <= target_idx: break
            q.locator(".item").nth(i).locator("button").first.click()
    q.click("button:has-text('Prüfen')")
    ok("Richtig" in q.inner_text(".msg"), "ordering solved with buttons")
    # Drag & Drop auf frischer Seite: falsche Reihenfolge erkennen
    q.evaluate("localStorage.clear()"); q.reload(); q.wait_for_selector("main h1"); goto_page(q, "Zweite Aufgabe")
    first, last = q.locator(".item").nth(0), q.locator(".item").nth(3)
    before = q.locator(".item .txt").all_inner_texts()
    first.drag_to(last)
    after = q.locator(".item .txt").all_inner_texts()
    ok(before != after and after[3] == before[0], "drag & drop moves an item")

    # Zuordnung: Karte wählen, Gruppe wählen (Hardware: Maus, Bildschirm; Software: Webbrowser, Textprogramm)
    goto_page(q, "Dritte Aufgabe")
    ok(q.locator("button:has-text('Prüfen')").is_disabled(), "sort: check disabled until all placed")
    groups = {"Hardware": ["Maus", "Bildschirm"], "Software": ["Webbrowser", "Textprogramm"]}
    for g, names in groups.items():
        for n in names:
            q.locator(".pool .chip", has_text=n).click()
            q.locator(".cat", has=q.locator("h3", has_text=g)).locator(".drop").click()
    q.click("button:has-text('Prüfen')")
    ok("Richtig" in q.inner_text(".msg"), "sort solved by click-select")
    # Zuordnung per Drag & Drop (frisch)
    q.evaluate("localStorage.clear()"); q.reload(); q.wait_for_selector("main h1"); goto_page(q, "Dritte Aufgabe")
    q.locator(".pool .chip", has_text="Maus").drag_to(q.locator(".cat", has=q.locator("h3", has_text="Hardware")))
    ok(q.locator(".cat", has=q.locator("h3", has_text="Hardware")).locator(".chip", has_text="Maus").count() == 1, "sort: drag into group")

    # Gitter lösen: X-Muster
    goto_page(q, "Vierte Aufgabe")
    q.click("button:has-text('Prüfen')")
    ok("Noch nicht" in q.inner_text(".msg") and "Diagonalen" in q.inner_text(".msg"), "grid: wrong shows hint")
    for r in range(5):
        for c in {r, 4 - r}:
            q.locator(f"button[aria-label^='Zeile {r+1}, Spalte {c+1}:']").click()
    q.click("button:has-text('Prüfen')")
    ok("Richtig" in q.inner_text(".msg"), "grid solved")

    # Gitter-Editor: Größe ändern behält Inhalt
    ui.select_page(pg, "Vierte Aufgabe")
    for _ in range(2): pg.locator("button[aria-label='Spalten erhöhen']").click()
    pg.locator(".steps button:has-text('Lösung vormachen')").click()
    ok(pg.locator("[aria-label='Lösung 1'] .cell").count() == 35, "grid editor: resize to 5x7")
    ok(pg.locator("[aria-label='Lösung 1'] button[aria-label^='Zeile 1, Spalte 1:']").get_attribute("aria-label").endswith("blau"), "grid editor: content kept on resize")

    # Graph färben (Schüleransicht): erst alles blau = ungültig, dann gültig
    goto_page(q, "Menü"); goto_page(q, "Fünfte Aufgabe")
    node = lambda name: q.locator(f"svg [aria-label^='Knoten {name}']")
    for n in "ABCDE": node(n).click()
    q.click("button:has-text('Prüfen')")
    ok("Noch nicht" in q.inner_text(".msg") and "drei verschiedene" in q.inner_text(".msg"), "graph colour: conflicting colouring rejected with hint")
    node("B").click(); node("C").click(); node("C").click(); node("E").click()   # B gelb, C rot, E gelb
    q.click("button:has-text('Prüfen')")
    ok("Richtig" in q.inner_text(".msg"), "graph colour: valid colouring accepted")

    # Graph-Editor: Knoten setzen, verbinden, verschieben, löschen, Lösung markieren
    ui.add_block(pg, "Graph")
    art = pg.locator("article").last
    art.locator("button:has-text('Knoten setzen')").click()
    svg = art.locator("svg[aria-label='Zeichnung']")
    for pos in [(100, 100), (300, 100), (300, 250)]: svg.click(position={"x": pos[0], "y": pos[1]})
    ok(art.locator("svg g.node").count() == 3, "graph editor: 3 nodes placed")
    art.locator("button:has-text('Kante ziehen')").click()
    art.locator("svg g.node").nth(0).click(); art.locator("svg g.node").nth(1).click()
    ok(art.locator("svg g.edge").count() == 1, "graph editor: edge created")
    art.locator("svg g.node").nth(0).click(); art.locator("svg g.node").nth(1).click()
    ok(art.locator("svg g.edge").count() == 1, "graph editor: duplicate edge ignored")
    art.locator("button:has-text('Verschieben')").click()
    nd = art.locator("svg g.node").nth(2); before = nd.get_attribute("transform"); box = nd.bounding_box()
    pg.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2); pg.mouse.down()
    pg.mouse.move(box["x"] + box["width"]/2 + 60, box["y"] + box["height"]/2 - 30, steps=5); pg.mouse.up()
    ok(nd.get_attribute("transform") != before, "graph editor: node dragged")
    ok(art.locator("svg g.node").count() == 3, "graph editor: drag does not trigger a click action")
    ok(art.locator("ul.hints", has_text="nicht markiert").count() == 1, "graph editor: hint at the block that no solution is marked")
    art.locator(".steps button:has-text('Lösung vormachen')").click()
    art.locator("svg g.node").nth(0).click()                                  # Lösung vormachen: Knoten A anklicken
    ok(art.locator("ul.hints", has_text="nicht markiert").count() == 0, "graph editor: solution demonstrated by clicking")
    # Export + Schüleransicht für den Knoten-Modus
    path2 = os.path.join(TMP, "export2.html")
    with pg.expect_download() as d2: ui.export(pg)
    d2.value.save_as(path2)
    q2 = b.new_page(); q2.goto("file://" + path2); q2.wait_for_selector(".menu")
    goto_page(q2, "Vierte Aufgabe")
    q2.locator("svg [aria-label^='Knoten B']").click()
    q2.locator("button:has-text('Prüfen')").last.click()
    ok("Noch nicht" in q2.locator(".msg").last.inner_text(), "graph nodes: wrong selection rejected")
    q2.locator("svg [aria-label^='Knoten B']").click(); q2.locator("svg [aria-label^='Knoten A']").click()
    q2.locator("button:has-text('Prüfen')").last.click()
    ok("Richtig" in q2.locator(".msg").last.inner_text(), "graph nodes: correct selection accepted")
    # Löschen (zurück zum Aufbau)
    art.locator(".steps button:has-text('Aufgabe aufbauen')").click()
    art.locator("button:has-text('Löschen')").click()
    art.locator("svg g.edge").first.click(force=True)
    art.locator("svg g.node").nth(0).click()
    ok(art.locator("svg g.edge").count() == 0 and art.locator("svg g.node").count() == 2, "graph editor: delete edge and node")

    # ---- Roboter: Programm bauen (Schüleransicht) ----
    goto_page(q, "Menü"); goto_page(q, "Sechste Aufgabe")
    fs = q.locator("fieldset.ex")
    result = lambda: q.wait_for_selector(".msg .no, .msg .ok", timeout=20000) and fs.locator(".msg").inner_text()
    fs.locator(".pal", has_text="wiederhole …mal").click()
    fs.locator(".script").first.locator(".slot").first.click()
    fs.locator(".pal", has_text="vorwärts").click()
    fs.locator(".inner .slot").first.click()
    ok(fs.locator(".blk.repeat .blk.move").count() == 1, "robot: blocks inserted via select-then-click")
    ok("Blöcke: 2 / 2" in fs.inner_text(), "robot: block counter")
    fs.locator("button:has-text('Ausführen')").click()
    msg = result()
    ok("nicht am Ziel" in msg and "Ein Block wiederholt" in msg, "robot: too few repeats -> not at goal + hint")
    # zu viele Blöcke
    fs.locator(".blk.repeat input.num").fill("3"); fs.locator(".blk.repeat input.num").blur()
    fs.locator(".pal", has_text="vorwärts").click(); fs.locator(".inner .slot").last.click()
    fs.locator("button:has-text('Ausführen')").click()
    ok("brauchst 3 Blöcke" in result(), "robot: block limit enforced (goal reached with 3 blocks)")
    fs.locator(".blk.move .x").last.click()
    fs.locator(".blk.repeat input.num").fill("6"); fs.locator(".blk.repeat input.num").blur()
    # Python-Ansicht
    fs.locator("summary").click()
    py = fs.locator("pre").inner_text()
    ok("for _ in range(6):" in py and "move()" in py, "robot: python view shows the program")
    fs.locator("button:has-text('Ausführen')").click()
    ok("Richtig" in result(), "robot: solution accepted")
    ok(fs.locator(".pal").count() == 0 or fs.locator("button:has-text('Ausführen')").is_disabled(), "robot: locked after solving")

    # ---- Roboter: Drag & Drop (neu + verschieben) ----
    q.evaluate("localStorage.clear()"); q.reload(); q.wait_for_selector("main h1"); goto_page(q, "Sechste Aufgabe")
    fs = q.locator("fieldset.ex")
    fs.locator(".pal", has_text="wiederhole …mal").drag_to(fs.locator(".script").first.locator(".slot").first)
    ok(fs.locator(".blk.repeat").count() == 1, "robot: drag new block from palette")
    fs.locator(".pal", has_text="vorwärts").drag_to(fs.locator(".script").first.locator(".slot").last)
    ok(fs.locator(".script").first.locator(".list > .blk").count() == 2, "robot: second top-level block")
    fs.locator(".blk.move .grip").first.drag_to(fs.locator(".inner .slot").first)
    ok(fs.locator(".blk.repeat .blk.move").count() == 1 and fs.locator(".blk").count() == 2, "robot: drag existing block into loop (moved, not copied)")
    fs.locator(".blk.repeat").locator(".grip").first.drag_to(fs.locator(".blk.repeat .inner .slot").first)
    ok(fs.locator(".blk.repeat").count() == 1, "robot: block cannot be dropped into itself")
    fs.locator(".blk.move .grip").first.drag_to(fs.locator(".palette"))
    ok(fs.locator(".blk.move").count() == 0, "robot: drag block back to palette deletes it")

    # ---- Roboter: Vorhersage ----
    goto_page(q, "Menü"); goto_page(q, "Siebte Aufgabe")
    fs = q.locator("fieldset.ex")
    ok(fs.locator(".pal").count() == 0 and "for _ in range(2):" in (fs.locator("summary").click() or fs.locator("pre").inner_text()), "robot predict: program readonly + python shown")
    fs.locator("[aria-label^='Zeile 1, Spalte 1']").click(); fs.locator("button:has-text('Prüfen')").click()
    ok("Noch nicht" in fs.locator(".msg").inner_text(), "robot predict: wrong cell rejected")
    fs.locator("[aria-label^='Zeile 3, Spalte 3']").click(); fs.locator("button:has-text('Prüfen')").click()
    ok("Richtig" in fs.locator(".msg").inner_text(), "robot predict: right cell accepted")

    # ---- Roboter-Editor: zwei Schritte, Musterlösung wird auf Lösbarkeit geprüft ----
    ui.add_block(pg, "Roboter programmieren")
    art = pg.locator("article").last
    STEP2 = ".steps button:has-text('Lösung vormachen')"; STEP1 = ".steps button:has-text('Aufgabe aufbauen')"
    art.locator(STEP2).click()
    art.locator(".pal", has_text="wiederhole …mal").click(); art.locator(".script .slot").first.click()
    art.locator(".pal", has_text="vorwärts").click(); art.locator(".inner .slot").first.click()
    art.locator(".blk.repeat input.num").fill("5"); art.locator(".blk.repeat input.num").blur()
    ok("Musterlösung erreicht das Ziel" in art.inner_text(), "robot editor: solution validated as solvable")
    art.locator(STEP1).click()
    art.locator("button:has-text('Wand')").first.click()
    art.locator("[aria-label='Spielfeld bearbeiten'] g.cell").nth(2 * 6 + 2).click()
    art.locator(STEP2).click()
    ok("erreicht das Ziel nicht" in art.inner_text(), "robot editor: wall on path makes solution fail (detected)")
    art.locator(STEP1).click()
    art.locator("button:has-text('Radieren')").click()
    art.locator("[aria-label='Spielfeld bearbeiten'] g.cell").nth(2 * 6 + 2).click()
    art.locator(STEP2).click()
    ok("Musterlösung erreicht das Ziel" in art.inner_text(), "robot editor: erasing wall fixes it")

    # Erlaubte Blöcke, Variablen, Vorhersage-Aufgabe
    art.locator(STEP1).click()
    chip = art.locator(".allowed .al", has_text="solange"); chip.click()
    ok(chip.get_attribute("aria-pressed") == "true", "robot editor: allowed-block chip toggles on")
    art.locator("input[aria-label^='Variablen']").fill("x, y"); art.locator("input[aria-label^='Variablen']").blur()
    ok(art.locator("input[aria-label^='Variablen']").input_value() == "x, y", "robot editor: variables accepted")
    art.locator(".seg button:has-text('Ergebnis vorhersagen')").click()
    ok(art.locator("summary").first.inner_text().startswith("Programm, das die Schüler lesen"), "robot editor: predict mode asks for the program to read")
    art.locator(".pal", has_text="wiederhole …mal").click(); art.locator(".script .slot").first.click()
    art.locator(".pal", has_text="vorwärts").click(); art.locator(".inner .slot").first.click()
    art.locator(".steps button:has-text('Antwort ansehen')").click()
    ok("Antwort: Zeile 3, Spalte 4" in art.inner_text(), "robot editor: predict mode shows the computed answer (repeat 3 x move -> column 4)")

    # Re-Import in den Editor
    pg.fill(".title", "ANDERS")
    pg.set_input_files("input[type=file][accept*='.html']", path)
    pg.wait_for_timeout(500)
    ok(pg.input_value(".title") == "Meine Aufgaben" and pg.locator(".pages li").count() == 8, "re-import restores project")
    ok(not errs, f"no page errors {errs}")
    b.close()
