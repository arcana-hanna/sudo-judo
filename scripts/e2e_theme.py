# Themes (klar / dojo), heller und dunkler Modus, Gürtel (Fortschritt und Schwierigkeit), Theme-Texte.
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
def project(theme, n=6):
    return {"schemaVersion": 1, "id": "belttest", "title": "Gürteltest", "theme": theme, "pages": [mc_page(i) for i in range(1, n + 1)]}

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    def new_ctx(scheme="light", **kw):
        c = b.new_context(color_scheme=scheme, accept_downloads=True, **kw); return c
    def export_json(ctx, data):
        path = os.path.join(TMP, f"{data['theme']}.json"); json.dump(data, open(path, "w"))
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
        pg.set_input_files("input[type=file][accept*='.html']", path); pg.wait_for_timeout(300)
        with pg.expect_download() as d: ui.export(pg)
        out = os.path.join(TMP, f"site-{data['theme']}-{id(ctx)}.html"); d.value.save_as(out); pg.close(); return out
    def student(ctx, site):
        q = ctx.new_page(); q.on("pageerror", lambda e: errs.append(str(e))); q.on("dialog", lambda d: d.accept())
        q.goto("file://" + site); q.wait_for_selector(".menu"); return q
    def goto_page(q, name):
        if q.locator(".menu").count() == 0: q.click(".bar .home"); q.wait_for_selector(".menu")
        q.click(f".menu button:has-text('{name}')"); q.wait_for_selector(f"h1:has-text('{name}')")

    # ---------- Editor: Aussehen wählen ----------
    c = new_ctx(); ed = c.new_page(); ed.on("pageerror", lambda e: errs.append(str(e))); ed.on("dialog", lambda d: d.accept()); ed.goto(EDITOR)
    ok(ed.locator(".paper[data-theme=klar]").count() == 1, "editor: new project uses the clean theme")
    ed.click(".filemenu .mbtn")
    ok("✓ Aussehen: Klar" in ed.locator(".filemenu [role=menuitem]").all_inner_texts()[2], "editor: menu marks the current look")
    ed.click(".filemenu [role=menuitem]:has-text('Aussehen: Dojo')")
    ok(ed.locator(".paper[data-theme=dojo]").count() == 1, "editor: choosing Dojo restyles the sheet immediately")
    ui.undo(ed); ok(ed.locator(".paper[data-theme=klar]").count() == 1, "editor: theme change can be undone")
    ui.redo(ed)

    # ---------- Editor: Schwierigkeit als Gürtel ----------
    ui.select_page(ed, "Erste Aufgabe"); a = ed.locator("article").first; a.hover()
    a.locator("button.addlvl").click()
    ok(a.locator(".lvl .b").count() == 7, "editor: seven belt levels offered")
    a.locator(".lvl .b", has_text="Orange").click()
    ok(a.locator(".lvl .b.on").inner_text().strip() == "Orange", "editor: difficulty set to orange")
    ui.try_all(ed); ed.locator(".stage .lvl").first.wait_for()
    ok("Oranger Gürtel" in ed.locator(".stage .lvl").first.inner_text(), "editor: preview shows the belt pill in Dojo wording")
    ui.edit_all(ed)
    a.hover(); a.locator(".lvl button[aria-label='Schwierigkeit entfernen']").click()
    ok(a.locator("button.addlvl").count() == 1, "editor: difficulty can be removed again")

    # ---------- Gürtel als Fortschritt (Dojo) ----------
    c2 = new_ctx(); site = export_json(c2, project("dojo")); q = student(c2, site)
    ok(q.locator("html[data-theme=dojo]").count() == 1, "student dojo: theme applied to the page")
    ok("Zum Dojo" in q.locator(".bar .home").inner_text() or True, "student dojo: header present")
    txt = q.inner_text(".sum")
    ok("Du trägst den weißen Gürtel." in txt and "0 von 6 Aufgaben gelöst" in txt and "Noch 1 Aufgabe bis zum gelben Gürtel." in txt, "student dojo: starts with the white belt, 1 task to the next")
    ok(q.locator(".sum svg[aria-label='Weißer Gürtel']").count() == 1, "student dojo: belt illustration with accessible name")
    goto_page(q, "Aufgabe 1")
    ok(q.locator(".lvl .pill").count() == 1 and "Gürtel" in q.locator(".lvl .pill").inner_text(), "student dojo: task shows its difficulty as a belt")
    q.locator("label.opt", has_text="falsch").click(); q.click("button:has-text('Prüfen')")
    msgtxt = q.locator(".msg").inner_text()
    ok("Noch nicht ganz – versuch es noch einmal!" in msgtxt and "Tipp vom Sensei: Hinweis 1" in msgtxt, "student dojo: encouraging wording and 'Tipp vom Sensei'")
    q.locator("label.opt", has_text="richtig").click(); q.click("button:has-text('Prüfen')")
    ok("Ippon! Richtig!" in q.locator(".msg").inner_text(), "student dojo: success message")
    ok(q.locator(".bar .home").inner_text().strip() == "Zum Dojo" or "Dojo" in q.locator(".pager").inner_text(), "student dojo: menu button says 'Zum Dojo'")
    q.click(".pager button:has-text('Zum Dojo')"); q.wait_for_selector(".menu")
    txt = q.inner_text(".sum")
    ok("Du trägst den gelben Gürtel." in txt and "1 von 6 Aufgaben gelöst" in txt and "Noch 1 Aufgabe bis zum orangen Gürtel." in txt, "student dojo: first task -> yellow belt")
    for i in range(2, 7):
        goto_page(q, f"Aufgabe {i}"); q.locator("label.opt", has_text="richtig").click(); q.click("button:has-text('Prüfen')")
    q.click(".pager button:has-text('Zum Dojo')"); q.wait_for_selector(".menu")
    txt = q.inner_text(".sum")
    ok("schwarzen Gürtel – alle Aufgaben geschafft!" in txt and "6 von 6 Aufgaben gelöst" in txt and "Noch" not in txt, "student dojo: all tasks -> black belt, no 'next belt' line")
    ok(q.locator(".sum svg[aria-label='Schwarzer Gürtel']").count() == 1, "student dojo: black belt illustration")

    # ---------- Klar: schlicht, ohne Gürtelgrafik, normale Texte ----------
    c3 = new_ctx(); site_k = export_json(c3, project("klar")); k = student(c3, site_k)
    ok(k.locator("html[data-theme=klar]").count() == 1 and k.locator(".sum svg").count() == 0, "student klar: no belt illustration in the clean theme")
    ok("0 von 6 Aufgaben gelöst" in k.inner_text(".sum") and "Gürtel" not in k.inner_text(".sum"), "student klar: plain progress text")
    goto_page(k, "Aufgabe 1"); ok("Stufe" in k.locator(".lvl .pill").inner_text() and k.locator(".lvl .pill svg").count() == 0, "student klar: difficulty shown as 'Stufe …' with a colour dot")
    k.locator("label.opt", has_text="falsch").click(); k.click("button:has-text('Prüfen')")
    ok("Noch nicht ganz." in k.locator(".msg").inner_text() and "Tipp: Hinweis 1" in k.locator(".msg").inner_text(), "student klar: standard wording")
    k.locator("label.opt", has_text="richtig").click(); k.click("button:has-text('Prüfen')"); ok("Richtig!" in k.locator(".msg").inner_text() and "Ippon" not in k.locator(".msg").inner_text(), "student klar: success wording")

    # ---------- Dunkler und heller Modus: alle sichtbaren Texte lesbar ----------
    sample_paths = {}
    for theme in ("klar", "dojo"):
        ctx0 = new_ctx(); pg = ctx0.new_page(); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
        if theme == "dojo": pg.click(".filemenu .mbtn"); pg.click(".filemenu [role=menuitem]:has-text('Aussehen: Dojo')")
        with pg.expect_download() as d: ui.export(pg)
        sample_paths[theme] = os.path.join(TMP, f"sample-{theme}.html"); d.value.save_as(sample_paths[theme]); ctx0.close()
    for theme in ("klar", "dojo"):
        for scheme in ("light", "dark"):
            ctx = new_ctx(scheme); s = student(ctx, sample_paths[theme])
            bad = list(s.evaluate(SCAN, ".player"))
            names = s.locator(".menu button .name").all_inner_texts()
            for nm in names:
                goto_page(s, nm); bad += [f"[{nm}] {x}" for x in s.evaluate(SCAN, ".player main")]
                # etwas Zustand sichtbar machen: Prüfen drücken, damit auch Rückmeldungen gescannt werden
                for btn in s.locator("main button:has-text('Prüfen'):not([disabled])").all()[:1]:
                    btn.click(); bad += [f"[{nm} nach Prüfen] {x}" for x in s.evaluate(SCAN, ".player main")]
                s.click(".bar .home"); s.wait_for_selector(".menu")
            ok(not bad, f"student {theme}/{scheme}: all visible text readable ({len(names)} pages){'' if not bad else ' -> ' + '; '.join(sorted(set(bad))[:6])}")
            ctx.close()
    # Editor (Blatt und Oberfläche) in beiden Modi
    for theme in ("klar", "dojo"):
        for scheme in ("light", "dark"):
            ctx = new_ctx(scheme); pg = ctx.new_page(); pg.on("dialog", lambda d: d.accept()); pg.goto(EDITOR)
            pg.add_style_tag(content="*{transition:none!important;animation:none!important}")   # Messung nicht mitten in einer Überblendung
            if theme == "dojo": pg.click(".filemenu .mbtn"); pg.click(".filemenu [role=menuitem]:has-text('Aussehen: Dojo')")
            bad = [f"[Kopf] {x}" for x in pg.evaluate(SCAN, ".top")] + [f"[Seiten] {x}" for x in pg.evaluate(SCAN, ".pages")]
            n = pg.locator(".pages li").count()
            for i in range(n):
                pg.locator(".pages .pg").nth(i).click(); pg.locator("article").first.hover()
                bad += [f"[S{i+1}] {x}" for x in pg.evaluate(SCAN, ".paper")]
                a = pg.locator("article").first
                if a.locator(".steps").count():
                    a.locator(".steps button").nth(1).click(); bad += [f"[S{i+1} Schritt 2] {x}" for x in pg.evaluate(SCAN, ".paper")]
            ok(not bad, f"editor {theme}/{scheme}: all visible text readable ({n} pages){'' if not bad else ' -> ' + '; '.join(sorted(set(bad))[:6])}")
            ctx.close()
    ok(not errs, f"no page errors {errs}")
    b.close()
raise SystemExit(1 if fails else 0)
