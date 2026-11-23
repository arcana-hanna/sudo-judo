# Tests für Kontrolle, Vorlagen, Duplizieren, Hilfe, Speicherfehler, Fortschritt, Fokus, Tastatur.
# Voraussetzung: npm run build, pip install playwright pillow, playwright install chromium
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui
import tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITOR = "file://" + os.path.join(ROOT, "dist/index.html")
TMP = tempfile.mkdtemp()
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

with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    ctx = b.new_context(accept_downloads=True)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    dlg = {"accept": True, "msgs": []}
    pg.on("dialog", lambda d: (dlg["msgs"].append(d.message), d.accept() if dlg["accept"] else d.dismiss()))
    pg.goto(EDITOR)
    badge_ok = lambda: ui.all_good(pg)

    # --- Kontrolle ---
    ok(badge_ok(), "check: sample project has no open points")
    ui.add_block(pg, "Auswahlaufgabe")
    ok(pg.locator("header.top .chip .badge").inner_text() == "2", "check: new empty task shows 2 open points")
    ui.toggle_issues(pg)
    items = pg.locator(".issues li button").all_inner_texts()
    ok(any("Die Aufgabenstellung fehlt." in t for t in items) and any("Antwort ist leer" in t for t in items), "check: panel lists the problems in German")
    dlg["accept"] = False; dlg["msgs"].clear()
    ui.export(pg)
    ok(len(dlg["msgs"]) == 1 and "2 Hinweise" in dlg["msgs"][0], "check: export warns about open points")
    dlg["accept"] = True
    pg.locator(".issues li button").first.click()
    art = pg.locator("article").last
    art.locator("textarea[aria-label='Aufgabenstellung']").fill("Testfrage?")
    for i, inp in enumerate(art.locator(".opt .inl").all()): inp.fill(f"Antwort {i}")
    ok(badge_ok(), "check: badge clears after fixing the task")

    # --- Vorlagen-Galerie ---
    n0 = pg.locator(".pages li").count()
    ui.add_page(pg)
    ok(pg.locator("dialog[open] .card").count() == 14, "gallery: 14 templates offered")
    pg.locator("dialog[open] .card", has_text="Zuordnen").click()
    ok(pg.locator(".pages li").count() == n0 + 1 and pg.input_value(".pagetitle") == "Zuordnen" and pg.locator("article[data-type=sort]").count() == 1, "gallery: template page inserted and selected")
    ok(badge_ok(), "gallery: template pages are valid out of the box")
    ui.add_page(pg); pg.locator("dialog[open] .blank").click()
    ok(pg.input_value(".pagetitle") == "Neue Seite" and pg.locator(".pages li").count() == n0 + 2, "gallery: blank page")

    # --- Duplizieren ---
    ui.select_page(pg, "Fünfte Aufgabe")
    pg.locator("article").first.hover()                      # die Leiste erscheint erst beim Darüberfahren
    pg.locator("article button[aria-label='Block duplizieren']").click()
    ok(pg.locator("article").count() == 2, "duplicate: block copied")
    copy = pg.locator("article").nth(1)
    copy.locator("button:has-text('Löschen')").click()
    copy.locator("svg g.node").first.click()
    ok(copy.locator("svg g.node").count() == 4 and pg.locator("article").nth(0).locator("svg g.node").count() == 5
       and pg.locator("article").nth(0).locator("svg g.edge").count() == 6, "duplicate: copy is independent of the original")
    ui.page_menu(pg, "Seite duplizieren")
    ok(pg.input_value(".pagetitle").endswith("(Kopie)") and pg.locator(".pages li").count() == n0 + 3, "duplicate: page copied")
    ok(badge_ok() or pg.locator("header.top .chip .badge").count() == 1, "duplicate: no crash, check still works")

    # --- Hilfe ---
    ui.help_open(pg)
    ok(pg.locator("dialog[open]").count() == 1 and "einzelne HTML-Datei" in pg.locator("dialog[open]").inner_text(), "help: dialog opens")
    pg.keyboard.press("Escape")
    ok(pg.locator("dialog[open]").count() == 0, "help: closes with Escape")

    # --- Strg+S, Export, Neu ---
    with pg.expect_download() as d: pg.keyboard.press("Control+s")
    path = os.path.join(TMP, "site.html"); d.value.save_as(path)
    ok(os.path.getsize(path) > 50000, "export via Ctrl+S")
    ui.new_project(pg)
    ok(pg.locator(".pages li").count() == 1 and pg.input_value(".title") == "Neue Aufgaben", "new project: starts clean")

    # --- Speicherfehler im Editor ---
    c2 = b.new_context(); c2.add_init_script("Storage.prototype.setItem = function(){ throw new Error('blocked'); }")
    e2 = c2.new_page(); e2.on("pageerror", lambda e: errs.append(str(e))); e2.goto(EDITOR)
    e2.fill(".title", "x"); e2.wait_for_selector(".banner[role=alert]", timeout=3000)
    ok("automatisches Speichern" in e2.inner_text(".banner"), "storage: editor warns when autosave is impossible")

    # --- Schüleransicht ---
    q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.goto("file://" + path)
    q.wait_for_selector(".menu")
    ok(q.locator("h1").inner_text() == "Meine Aufgaben" and q.locator(".menu button").count() == n0 + 3, "player: Ctrl+S export opens with all pages (incl. gallery and copied pages)")
    # Beispielprojekt exportieren für Fortschrittstests
    pg.goto(EDITOR); pg.evaluate("localStorage.clear()"); pg.reload()
    with pg.expect_download() as d: ui.export(pg)
    sample = os.path.join(TMP, "sample.html"); d.value.save_as(sample)

    q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.on("dialog", lambda d: d.accept())
    q.goto("file://" + sample); q.wait_for_selector(".menu")
    ok("0 von 7 Aufgaben gelöst" in q.inner_text(".sum"), "player: progress summary starts at 0 of 7")
    goto_page(q, "Erste Aufgabe")
    ok(q.evaluate("document.activeElement.tagName") == "H1", "player: focus moves to the heading on page change")
    ok(q.title().startswith("Erste Aufgabe –"), "player: browser tab title follows the page")
    q.click("text=5"); q.click("button:has-text('Prüfen')")
    goto_page(q, "Menü")
    ok("1 von 7 Aufgaben gelöst" in q.inner_text(".sum"), "player: summary counts solved tasks")
    q.click("button:has-text('Fortschritt auf diesem Gerät zurücksetzen')")
    ok("0 von 7 Aufgaben gelöst" in q.inner_text(".sum") and q.locator(".reset").count() == 0, "player: progress can be reset")

    # --- Tastaturbedienung ---
    goto_page(q, "Fünfte Aufgabe")
    node = q.locator("svg [aria-label^='Knoten A']"); node.focus(); q.keyboard.press("Enter")
    ok("blau" in node.get_attribute("aria-label"), "keyboard: graph node activated with Enter")
    goto_page(q, "Zweite Aufgabe")
    q.locator(".item .mv").first.focus(); first_before = q.locator(".item .txt").first.inner_text()
    q.keyboard.press("Tab"); q.keyboard.press("Enter")   # ↓ beim ersten Element
    ok(q.locator(".item .txt").first.inner_text() != first_before, "keyboard: order task movable with buttons")
    goto_page(q, "Dritte Aufgabe")
    q.locator(".pool .chip").first.focus(); q.keyboard.press("Enter")
    q.locator(".cat .drop").first.focus(); q.keyboard.press("Enter")
    ok(q.locator(".cat .chip").count() == 1, "keyboard: sort task solvable without a mouse")

    # --- Player ohne Speicher (z. B. gesperrter Browser) ---
    c3 = b.new_context(); c3.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}});")
    s3 = c3.new_page(); s3.on("pageerror", lambda e: errs.append(str(e))); s3.goto("file://" + sample); s3.wait_for_selector(".menu")
    goto_page(s3, "Erste Aufgabe"); s3.click("text=5"); s3.click("button:has-text('Prüfen')")
    ok("Richtig" in s3.inner_text(".msg"), "player: works even when localStorage is blocked")
    goto_page(s3, "Menü")
    ok("1 von 7 Aufgaben gelöst" in s3.inner_text(".sum"), "player: progress kept in memory without storage")
    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
