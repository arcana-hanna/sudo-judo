# Themes (klar / bunt), heller und dunkler Modus, optionale Gürtel (Fortschritt) und Schwierigkeitsstufen, Theme-Texte.
# Prüft u. a. mit einem Kontrast-Scanner, dass in allen vier Kombinationen jeder sichtbare Text lesbar ist.
import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ui
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITOR = "file://" + os.path.join(ROOT, "dist/index.html")
TMP = tempfile.mkdtemp()
fails = 0
def ok(c, m):
    global fails
    print(("PASS " if c else "FAIL ") + m); fails += 0 if c else 1

# Sichtbaren Text auf Lesbarkeit prüfen (WCAG AA: 4,5:1; große Schrift 3:1). Gibt Verstöße zurück.
SCAN = """(rootSel) => {
  const root = document.querySelector(rootSel); if (!root) return ['(Bereich nicht gefunden: ' + rootSel + ')'];
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const e of chain.reverse()) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) bg = over(c, bg); } return bg; };
  const out = [], seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || el.closest('svg, script, style, option')) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 2 || r.height < 2) continue;
    if (el.closest('[disabled], [aria-disabled=true]')) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity); if (op < 0.3) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el); const f = over({ ...fg, a: fg.a * op }, bg);
    const [L1, L2] = [lum(f), lum(bg)].sort((a, b) => b - a); const ratio = (L1 + 0.05) / (L2 + 0.05);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) { const key = el.tagName + '.' + el.className + t.slice(0, 20); if (seen.has(key)) continue; seen.add(key);
      out.push(ratio.toFixed(2) + ' < ' + need + '  ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + '  “' + t.slice(0, 40) + '”'); }
  }
  return out;
}"""

def mc_page(i):
    return {"id": f"p{i}", "title": f"Aufgabe {i}", "blocks": [{"id": f"b{i}", "type": "mc", "question": f"Frage {i}?", "hint": f"Hinweis {i}",
            "options": [{"id": f"o{i}a", "text": "richtig", "correct": True}, {"id": f"o{i}b", "text": "falsch", "correct": False}], **({"level": i % 7} if i else {})}]}
def project(theme, n=6, progress="belts", levels=True, with_levels=True):
    pages = [mc_page(i) for i in range(1, n + 1)]
    if not with_levels:
        for pg in pages: [b.pop("level", None) for b in pg["blocks"]]
    return {"schemaVersion": 1, "id": "belttest-" + theme + progress, "title": "Gürteltest", "theme": theme, "progress": progress, "levels": levels, "pages": pages}

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    def new_ctx(scheme="light", **kw): return b.new_context(color_scheme=scheme, accept_downloads=True, **kw)
    def export_json(ctx, data, tag=""):
        path = os.path.join(TMP, f"{data['id']}{tag}.json"); json.dump(data, open(path, "w"))
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
        pg.set_input_files("input[type=file][accept*='.html']", path); pg.wait_for_timeout(300)
        with pg.expect_download() as d: ui.export(pg)
        out = os.path.join(TMP, f"site-{data['id']}{tag}-{id(ctx)}.html"); d.value.save_as(out); pg.close(); return out
    def student(ctx, site):
        q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.on("dialog", lambda d: d.accept())
        q.goto("file://" + site); q.wait_for_selector(".menu"); return q
    def goto_page(q, name):
        if q.locator(".menu").count() == 0: q.click(".bar .home"); q.wait_for_selector(".menu")
        q.click(f".menu button:has-text('{name}')"); q.wait_for_selector(f"h1:has-text('{name}')")
    def solve(q, name):
        goto_page(q, name); q.locator("label.opt", has_text="richtig").click(); q.click("button:has-text('Prüfen')")
    def to_menu(q): q.click(".pager button:last-of-type") if False else q.click(".bar .home"); q.wait_for_selector(".menu")

    # ---------- Editor: Einstellungen ----------
    c = new_ctx(); ed = c.new_page(); ed.on("pageerror", lambda e: errs.append(str(e))); ed.on("dialog", lambda d: d.accept()); ed.goto(EDITOR)
    ok(ed.locator(".paper[data-theme=klar]").count() == 1, "editor: a new project uses the clean look")
    ui.settings_open(ed)
    ok(ed.locator("dialog[open] [aria-label='Aussehen'] button.on").inner_text() == "Klar" and ed.locator("dialog[open] [aria-label='Fortschritt'] button.on").inner_text() == "Einfach"
       and not ed.locator("dialog[open] input[type=checkbox]").is_checked(), "editor: defaults are clean look, simple progress, no difficulty levels")
    txt = ed.locator("dialog[open]").inner_text()
    ok(all(w not in txt for w in ("Dojo", "Ippon", "Sensei")), "editor: no Japanese terms in the settings")
    ui.settings_close(ed)
    ui.set_look(ed, "Bunt")
    ok(ed.locator(".paper[data-theme=bunt]").count() == 1, "editor: choosing 'Bunt' restyles the sheet immediately")
    ui.undo(ed); ok(ed.locator(".paper[data-theme=klar]").count() == 1, "editor: look change can be undone")
    ui.redo(ed)

    # ---------- Editor: Schwierigkeit ist freiwillig ----------
    ui.select_page(ed, "Erste Aufgabe"); a = ed.locator("article").first; a.hover()
    ok(a.locator("button.addlvl").count() == 0, "editor: no difficulty UI until the option is switched on")
    ui.set_levels(ed, True); a.hover()
    a.locator("button.addlvl").click()
    ok(a.locator(".lvl .b").count() == 7, "editor: seven belt levels offered once enabled")
    a.locator(".lvl .b", has_text="Orange").click()
    ok(a.locator(".lvl .b.on").inner_text().strip() == "Orange", "editor: difficulty set to orange")
    ui.try_all(ed); ed.locator(".stage .lvl").first.wait_for()
    ok("Oranger Gürtel" in ed.locator(".stage .lvl").first.inner_text(), "editor: preview shows the belt pill (bunt wording)")
    ui.edit_all(ed)
    ui.set_levels(ed, False); a.hover()
    ok(a.locator(".lvl").count() == 0 and a.locator("button.addlvl").count() == 0, "editor: switching levels off hides the difficulty UI again")
    ui.try_all(ed); ed.wait_for_selector(".stage .player"); ok(ed.locator(".stage .lvl").count() == 0, "editor: ... and the pills in the preview (stored levels are kept)")
    ui.edit_all(ed); ui.set_levels(ed, True); a.hover()
    ok(a.locator(".lvl .b.on").inner_text().strip() == "Orange", "editor: re-enabling brings the stored level back")

    # ---------- Fortschritt mit Gürteln (Theme bunt) ----------
    c2 = new_ctx(); q = student(c2, export_json(c2, project("bunt")))
    ok(q.locator("html[data-theme=bunt]").count() == 1, "student bunt: theme applied to the page")
    txt = q.inner_text(".sum")
    ok("Du trägst den weißen Gürtel." in txt and "0 von 6 Aufgaben gelöst" in txt and "Noch 1 Aufgabe bis zum gelben Gürtel." in txt, "student bunt+belts: starts with the white belt")
    ok(q.locator(".sum svg[aria-label='Weißer Gürtel']").count() == 1, "student bunt+belts: belt illustration with accessible name")
    goto_page(q, "Aufgabe 1")
    ok(q.locator(".lvl .pill").count() == 1 and "Gürtel" in q.locator(".lvl .pill").inner_text(), "student bunt+levels: task shows its difficulty as a belt")
    q.locator("label.opt", has_text="falsch").click(); q.click("button:has-text('Prüfen')")
    m = q.locator(".msg").inner_text()
    ok("Noch nicht ganz – versuch es noch einmal!" in m and "Tipp vom Trainer: Hinweis 1" in m, "student bunt: encouraging wording and 'Tipp vom Trainer'")
    q.locator("label.opt", has_text="richtig").click(); q.click("button:has-text('Prüfen')")
    ok("Super, richtig!" in q.locator(".msg").inner_text(), "student bunt: success message")
    ok(q.locator(".pager button", has_text="Zur Übersicht").count() == 1, "student bunt: menu button says 'Zur Übersicht'")
    allText = q.locator("body").inner_text(); ok(all(w not in allText for w in ("Dojo", "Ippon", "Sensei")), "student bunt: no Japanese terms anywhere on the page")
    q.click(".pager button:has-text('Zur Übersicht')"); q.wait_for_selector(".menu"); txt = q.inner_text(".sum")
    ok("Du trägst den gelben Gürtel." in txt and "1 von 6 Aufgaben gelöst" in txt and "Noch 1 Aufgabe bis zum orangen Gürtel." in txt, "student belts: first task -> yellow belt")
    for i in range(2, 7): solve(q, f"Aufgabe {i}")
    to_menu(q); txt = q.inner_text(".sum")
    ok("schwarzen Gürtel – alle Aufgaben geschafft!" in txt and "6 von 6 Aufgaben gelöst" in txt and "Noch" not in txt, "student belts: all tasks -> black belt")

    # ---------- Fortschritt: einfach (kein Gürtel) ----------
    c3 = new_ctx(); k = student(c3, export_json(c3, project("klar", progress="plain", levels=True)))
    ok(k.locator("html[data-theme=klar]").count() == 1 and k.locator(".sum svg").count() == 0 and "Gürtel" not in k.inner_text(".sum"), "student plain: bar and text only, no belt illustration")
    ok("0 von 6 Aufgaben gelöst" in k.inner_text(".sum") and k.locator(".menu .status").count() == 6, "student plain: progress text and per-page status shown")
    goto_page(k, "Aufgabe 1"); ok("Stufe" in k.locator(".lvl .pill").inner_text() and k.locator(".lvl .pill svg").count() == 0, "student klar: difficulty as 'Stufe …' with a colour dot")
    k.locator("label.opt", has_text="falsch").click(); k.click("button:has-text('Prüfen')")
    ok("Noch nicht ganz." in k.locator(".msg").inner_text() and "Tipp: Hinweis 1" in k.locator(".msg").inner_text(), "student klar: standard wording")
    k.locator("label.opt", has_text="richtig").click(); k.click("button:has-text('Prüfen')")
    ok("Richtig!" in k.locator(".msg").inner_text() and "Super" not in k.locator(".msg").inner_text(), "student klar: success wording")
    # Gürtel gehen auch im klaren Theme (Fortschritt und Aussehen sind unabhängig)
    c3b = new_ctx(); kb = student(c3b, export_json(c3b, project("klar", progress="belts", levels=False), "b"))
    ok(kb.locator(".sum svg[aria-label='Weißer Gürtel']").count() == 1, "student klar+belts: belts also work in the clean look")
    goto_page(kb, "Aufgabe 1"); ok(kb.locator(".lvl").count() == 0, "student: levels switched off -> no difficulty pill although the task has a stored level")

    # ---------- Fortschritt: ohne – nichts anzeigen, nichts speichern ----------
    c4 = new_ctx(); site_off = export_json(c4, project("klar", progress="off", levels=False)); o = student(c4, site_off)
    ok(o.locator(".sum").count() == 0 and o.locator(".menu .status").count() == 0 and o.locator("progress").count() == 0, "student off: no progress bar, no per-page status")
    goto_page(o, "Aufgabe 1"); o.locator("label.opt", has_text="richtig").click(); o.click("button:has-text('Prüfen')")
    ok("Richtig" in o.locator(".msg").inner_text(), "student off: tasks still give feedback")
    o.click(".pager button:has-text('Menü')"); o.wait_for_selector(".menu")
    ok(o.locator(".menu .card.done").count() == 0 and o.locator(".reset").count() == 0 and o.locator(".sum").count() == 0, "student off: no 'solved' marks, no reset link")
    stored = o.evaluate("Object.keys(localStorage).filter(k => k.includes('progress'))")
    ok(stored == [], f"student off: nothing is stored on the device ({stored})")
    o.reload(); o.wait_for_selector("main h1")
    if o.locator(".menu").count() == 0: o.click(".bar .home"); o.wait_for_selector(".menu")
    goto_page(o, "Aufgabe 1"); ok(o.locator("button:has-text('Prüfen')").is_enabled() is False or o.locator("label.opt input:checked").count() == 0, "student off: after reloading the task is fresh again")
    ok(o.locator("fieldset.solved").count() == 0, "student off: ... not marked as solved")
    # zum Vergleich: bei "einfach" wird gemerkt
    c5 = new_ctx(); pl = student(c5, export_json(c5, project("klar", progress="plain", levels=False), "p"))
    solve(pl, "Aufgabe 1"); pl.reload(); pl.wait_for_selector("main h1")
    ok(pl.evaluate("Object.keys(localStorage).some(k => k.startsWith('sudo-judo:progress:'))"), "student plain: progress is stored under the new 'sudo-judo:' key")

    # ---------- Ältere Dateien ----------
    legacy = {"schemaVersion": 1, "id": "alt", "title": "Alt", "theme": "dojo", "pages": [mc_page(1)]}
    lp = os.path.join(TMP, "legacy.json"); json.dump(legacy, open(lp, "w"))
    le = new_ctx().new_page(); le.on("dialog", lambda d: d.accept()); le.goto(EDITOR); le.set_input_files("input[type=file][accept*='.html']", lp); le.wait_for_timeout(300)
    ui.settings_open(le)
    ok(le.locator("dialog[open] [aria-label='Aussehen'] button.on").inner_text() == "Bunt" and le.locator("dialog[open] [aria-label='Fortschritt'] button.on").inner_text() == "Mit Gürteln"
       and le.locator("dialog[open] input[type=checkbox]").is_checked(), "legacy: a file from the earlier 'dojo' look opens as bunt + belts + levels")

    # ---------- Dunkler und heller Modus: alle sichtbaren Texte lesbar ----------
    full = {}
    for theme, look in (("klar", "Klar"), ("bunt", "Bunt")):
        c0 = new_ctx(); pg = c0.new_page(); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
        ui.set_look(pg, look); ui.set_progress(pg, "Mit Gürteln"); ui.set_levels(pg, True)
        ui.select_page(pg, "Erste Aufgabe"); a0 = pg.locator("article").first; a0.hover(); a0.locator("button.addlvl").click(); a0.locator(".lvl .b", has_text="Gelb").click()
        with pg.expect_download() as d: ui.export(pg)
        full[theme] = os.path.join(TMP, f"full-{theme}.html"); d.value.save_as(full[theme]); c0.close()
    for theme in ("klar", "bunt"):
        for scheme in ("light", "dark"):
            ctx = new_ctx(scheme); s = student(ctx, full[theme])
            bad = list(s.evaluate(SCAN, ".player"))
            names = s.locator(".menu button .name").all_inner_texts()
            for nm in names:
                goto_page(s, nm); bad += [f"[{nm}] {x}" for x in s.evaluate(SCAN, ".player main")]
                for btn in s.locator("main button:has-text('Prüfen'):not([disabled])").all()[:1]:
                    btn.click(); bad += [f"[{nm} nach Prüfen] {x}" for x in s.evaluate(SCAN, ".player main")]
                s.click(".bar .home"); s.wait_for_selector(".menu")
            ok(not bad, f"student {theme}/{scheme}: all visible text readable ({len(names)} pages){'' if not bad else ' -> ' + '; '.join(sorted(set(bad))[:6])}")
            ctx.close()
    for theme, look in (("klar", "Klar"), ("bunt", "Bunt")):
        for scheme in ("light", "dark"):
            ctx = new_ctx(scheme); pg = ctx.new_page(); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
            pg.add_style_tag(content="*{transition:none!important;animation:none!important}")
            ui.set_look(pg, look); ui.set_progress(pg, "Mit Gürteln"); ui.set_levels(pg, True)
            bad = [f"[Kopf] {x}" for x in pg.evaluate(SCAN, ".top")] + [f"[Seiten] {x}" for x in pg.evaluate(SCAN, ".pages")]
            ui.settings_open(pg); bad += [f"[Einstellungen] {x}" for x in pg.evaluate(SCAN, "dialog[open]")]; ui.settings_close(pg)
            n = pg.locator(".pages li").count()
            for i in range(n):
                pg.locator(".pages .pg").nth(i).click(); pg.locator("article").first.hover()
                bad += [f"[S{i+1}] {x}" for x in pg.evaluate(SCAN, ".paper")]
                a1 = pg.locator("article").first
                if a1.locator(".steps").count():
                    a1.locator(".steps button").nth(1).click(); bad += [f"[S{i+1} Schritt 2] {x}" for x in pg.evaluate(SCAN, ".paper")]
            ok(not bad, f"editor {theme}/{scheme}: all visible text readable ({n} pages + settings){'' if not bad else ' -> ' + '; '.join(sorted(set(bad))[:6])}")
            ctx.close()
    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
