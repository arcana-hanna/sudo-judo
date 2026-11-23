# Hilfsfunktionen für die Editor-Oberfläche (damit Tests nicht an einzelnen Beschriftungen hängen).
TOP = "header.top"

def file_menu(pg, item):
    pg.click(".filemenu .mbtn"); pg.click(f".filemenu [role=menuitem]:has-text('{item}')")
def new_project(pg): file_menu(pg, "Neues Projekt")
def help_open(pg): file_menu(pg, "Hilfe")
def try_all(pg): pg.locator(f"{TOP} button:has-text('Ausprobieren')").click()
def edit_all(pg): pg.locator(f"{TOP} button:has-text('Weiter bearbeiten')").click()
def export(pg): pg.locator(f"{TOP} button.primary").click()
def undo(pg): pg.click(f"{TOP} button[aria-label='Rückgängig']")
def redo(pg): pg.click(f"{TOP} button[aria-label='Wiederholen']")
def chip(pg): return pg.locator(f"{TOP} .chip")
def toggle_issues(pg): chip(pg).click()
def all_good(pg): return pg.locator(f"{TOP} .chip:has-text('Alles fertig')").count() == 1
def add_page(pg): pg.locator(".addpage").click()
def select_page(pg, name): pg.locator(".pages .pg", has_text=name).first.click()
def page_menu(pg, item):
    li = pg.locator(".pages li.sel"); li.locator(".mbtn").click(); li.locator(f"[role=menuitem]:has-text('{item}')").click()
def add_block(pg, label):
    pg.locator("button.addend").click()
    pg.locator(f"dialog[open] .pick:has(strong:text-is('{label}'))").click()
