# Tests der neuen Oberfläche: Bearbeiten im Schülerlayout, Lösung durch Vormachen, Hinweise am Ort,
# "+"-Einfügen, Ausprobieren im Block, Seiten umsortieren, Menüs, Tablet-Breite.
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

def goto_page(page, name):
    if name == "Menü":
        if page.locator(".menu").count() == 0: page.click("button:has-text('Menü')")
        page.wait_for_selector(".menu"); return
    if page.locator(".menu").count() == 0:
        page.click("button:has-text('Menü')"); page.wait_for_selector(".menu")
    page.click(f".menu button:has-text('{name}')"); page.wait_for_selector(f"h1:has-text('{name}')")

def arrange(q, target):
    for ti, text in enumerate(target):
        while True:
            texts = q.locator(".item .txt").all_inner_texts(); i = texts.index(text)
            if i <= ti: break
            q.locator(".item").nth(i).locator("button").first.click()

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx = b.new_context(accept_downloads=True)
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
    art = lambda: pg.locator("article").first
    hover = lambda: art().hover()

    # ---- Bearbeiten direkt im Blatt (Auswahlaufgabe) ----
    ui.select_page(pg, "Erste Aufgabe")
    q = art().locator("textarea[aria-label='Aufgabenstellung']")
    ok(q.input_value().startswith("Welche Zahl"), "inline: the question is a plain editable text in the sheet")
    q.fill("Was ist 2 + 2? " + "Das ist eine sehr lange Frage, damit der Text umbrechen muss. " * 3)
    ok(q.evaluate("e => e.scrollHeight <= e.clientHeight + 2"), "inline: long text grows the field (no inner scrollbar)")
    q.fill("Was ist 2 + 2?")
    texts = art().locator(".opt .inl")
    texts.nth(0).fill("3"); texts.nth(1).fill("4"); texts.nth(2).fill("22")
    long = "Der Roboter fährt zwei Felder nach vorne, dreht sich nach links und bleibt dann stehen, weil er das Ziel erreicht hat."
    texts.nth(2).fill(long)
    ok(texts.nth(2).evaluate("e => e.scrollHeight > 40 && e.scrollHeight <= e.clientHeight + 2"), "inline: a long answer wraps onto several lines instead of being cut off")
    texts.nth(2).press("Enter")
    ok("\n" not in texts.nth(2).input_value(), "inline: Enter does not insert a line break into an answer")
    texts.nth(2).fill("22")
    marks = art().locator(".mark")
    ok(marks.nth(1).get_attribute("aria-pressed") == "true", "inline: the sample's right answer shows as a green check")
    marks.nth(0).click()
    ok(marks.nth(0).get_attribute("aria-pressed") == "true" and marks.nth(1).get_attribute("aria-pressed") == "true", "inline: several answers can be right")
    marks.nth(0).click()
    ok(marks.nth(0).get_attribute("aria-pressed") == "false" and marks.nth(1).get_attribute("aria-pressed") == "true", "inline: clicking the circle again removes the mark")

    # ---- Ausprobieren direkt im Block ----
    hover(); art().locator("button.try").click()
    ok(art().locator("fieldset.mc").count() == 1 and pg.locator(".pages").is_visible(), "try: block turns into the student view in place (rest of the editor stays)")
    art().locator("label.opt", has_text="4").click(); art().locator("button:has-text('Prüfen')").click()
    ok("Richtig" in art().locator(".msg").inner_text(), "try: edited answer is accepted by the student view")
    hover(); art().locator("button.try").click()
    ok(art().locator("fieldset.mc").count() == 0 and art().locator(".mark").count() == 3, "try: back to editing restores the editor")

    # ---- Hinweise am Ort ----
    ui.add_block(pg, "Auswahlaufgabe")
    new = pg.locator("article").last
    ok(new.locator("ul.hints li").count() >= 2 and "Aufgabenstellung" in new.locator("ul.hints").inner_text(), "hints: problems appear right at the block")
    ok(pg.locator("header.top .chip .badge").count() == 1, "hints: status chip shows the count")
    new.locator("textarea[aria-label='Aufgabenstellung']").fill("Frage?")
    for i, t in enumerate(new.locator(".opt .inl").all()): t.fill(f"A{i}")
    ok(new.locator("ul.hints").count() == 0 and ui.all_good(pg), "hints: disappear once fixed; chip says 'Alles fertig'")

    # ---- Tipp: erst auf Wunsch ----
    ok(new.locator("button.addtip").count() == 1, "tip: shown as '+ Tipp hinzufügen' instead of an empty field")
    new.locator("button.addtip").click(); ok(new.locator(".tip input").count() == 1, "tip: field appears on demand")

    # ---- Tastatur: Antwort hinzufügen ----
    new.locator("button.addrow").focus(); pg.keyboard.press("Enter")
    ok(new.locator(".opt").count() == 3 and pg.evaluate("document.activeElement.classList.contains('inl')"), "keyboard: Enter adds an answer and focuses it")

    # ---- "+" zwischen Blöcken ----
    pg.locator(".bw").nth(0).locator(".ins").click()
    cards = pg.locator("dialog[open] .pick")
    ok(cards.count() == 11 and pg.locator("dialog[open] h3").count() == 6 and pg.locator("dialog[open] .pick svg").count() == 11, "picker: 11 block types in 6 groups, each with an icon")
    pg.locator("dialog[open] .pick:has(strong:text-is('Text'))").click()
    types = [a.get_attribute("data-type") for a in pg.locator("article").all()]
    ok(types[0] == "text" and types[1] == "mc", f"insert: '+' places the new block before the clicked one ({types})")
    ok(pg.evaluate("document.activeElement.tagName") == "TEXTAREA", "insert: new text block is focused, ready to type")
    pg.keyboard.type("Hallo Welt")

    # ---- Lösung durch Vormachen: Reihenfolge ----
    ui.select_page(pg, "Zweite Aufgabe")
    for k in (3, 2, 1): pg.locator(".item").nth(k).locator("button:has-text('↑')").click()
    ok(pg.locator(".item .inl").first.input_value() == "Drei Minuten warten", "demonstrate: moving a card changes the solution (order canvas)")
    # ---- Lösung durch Vormachen: Zuordnen (Ziehen + Tastatur) ----
    ui.select_page(pg, "Dritte Aufgabe")
    s = pg.locator("article").first
    s.locator(".chip").first.locator(".grip").drag_to(s.locator(".cat").nth(1))               # Maus -> Software
    ok(s.locator(".cat").nth(1).locator(".chip").count() == 3, "demonstrate: dragging a card into another group")
    s.locator(".cat").first.locator(".chip input.inl").first.focus(); pg.keyboard.press("Alt+ArrowRight")  # Bildschirm -> Software
    ok(s.locator(".cat").nth(1).locator(".chip").count() == 4 and s.locator(".cat").first.locator(".chip").count() == 0, "demonstrate: Alt+→ moves a card (keyboard)")
    s.locator(".cat").nth(1).locator(".chip").first.hover()
    s.locator(".cat").nth(1).locator(".chip").first.locator("button[aria-label$='in die vorherige Gruppe']").click()
    ok(s.locator(".cat").first.locator(".chip").count() == 1, "demonstrate: ◀ button moves a card to the previous group (touch alternative)")
    s.locator(".cat").first.locator(".chip").first.hover()
    s.locator(".cat").first.locator(".chip").first.locator("button[aria-label$='in die nächste Gruppe']").click()
    ok(s.locator(".cat").nth(1).locator(".chip").count() == 4, "demonstrate: ▶ button moves it back")

    # ---- Export, dann als Schüler prüfen, dass die vorgemachte Lösung gilt ----
    with pg.expect_download() as d: ui.export(pg)
    site = os.path.join(TMP, "site.html"); d.value.save_as(site)
    st = ctx.new_page(); st.on("pageerror", lambda e: errs.append(str(e))); st.goto("file://" + site); st.wait_for_selector(".menu")
    goto_page(st, "Zweite Aufgabe")
    arrange(st, ["Wasser erhitzen", "Teebeutel in die Tasse legen", "Heißes Wasser eingießen", "Drei Minuten warten"]); st.click("button:has-text('Prüfen')")
    ok("Noch nicht" in st.locator(".msg").inner_text(), "result: the old order is now wrong")
    arrange(st, ["Drei Minuten warten", "Wasser erhitzen", "Teebeutel in die Tasse legen", "Heißes Wasser eingießen"]); st.click("button:has-text('Prüfen')")
    ok("Richtig" in st.locator(".msg").inner_text(), "result: the order demonstrated in the editor is the solution")
    goto_page(st, "Dritte Aufgabe")
    for chip in ["Maus", "Webbrowser", "Bildschirm", "Textprogramm"]:
        st.locator(".pool .chip", has_text=chip).click(); st.locator(".cat", has=st.locator("h3", has_text="Software")).locator(".drop").click()
    st.click("button:has-text('Prüfen')")
    ok("Richtig" in st.locator(".msg").inner_text(), "result: the groups arranged in the editor are the solution")
    goto_page(st, "Erste Aufgabe")
    ok("Was ist 2 + 2?" in st.inner_text("main"), "result: the question typed in the sheet appears for students")

    # ---- Seiten umsortieren ----
    before = pg.locator(".pages .pt").all_inner_texts()
    pg.locator(".pages li").nth(2).locator(".grip").drag_to(pg.locator(".pages li").nth(0))
    after = pg.locator(".pages .pt").all_inner_texts()
    ok(after[0].endswith(before[2].split(". ", 1)[1]), f"pages: dragging a page to the top ({after[0]!r})")
    ui.select_page(pg, before[0].split(". ", 1)[1]); ui.page_menu(pg, "Nach unten")
    ok(pg.locator(".pages .pt").all_inner_texts() != after, "pages: 'Nach unten' in the page menu")

    # ---- Menüs ----
    pg.click(".filemenu .mbtn")
    ok(pg.locator(".filemenu [role=menuitem]").count() == 5, "menu: File menu offers New / Open / two looks / Help")
    pg.keyboard.press("Escape"); ok(pg.locator(".filemenu [role=menuitem]").count() == 0, "menu: closes with Escape")
    pg.click(".filemenu .mbtn"); pg.click(".work", position={"x": 5, "y": 5}, force=True)
    ok(pg.locator(".filemenu [role=menuitem]").count() == 0, "menu: closes on outside click")

    # ---- Tablet-Breite ----
    t = b.new_context(viewport={"width": 820, "height": 1180}, has_touch=True).new_page(); t.on("pageerror", lambda e: errs.append(str(e)))
    t.goto(EDITOR); ui.select_page(t, "Erste Aufgabe")
    ok(t.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "tablet: no horizontal scrolling at 820 px")
    ok(t.locator(".paper").is_visible() and t.locator(".pages").is_visible(), "tablet: page list and sheet both visible")
    t.locator(".mark").nth(0).tap(); ok(t.locator(".mark").nth(0).get_attribute("aria-pressed") == "true", "tablet: tapping the circle marks the answer")

    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
