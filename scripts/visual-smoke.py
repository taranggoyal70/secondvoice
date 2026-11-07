from pathlib import Path
from playwright.sync_api import sync_playwright, expect

# Run against the production server on port 4174. Never calls a live provider.
OUTPUT = Path(__file__).resolve().parents[1] / "artifacts" / "qa"
OUTPUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://localhost:4174", wait_until="networkidle")
    expect(page.get_by_role("heading", name="A pause. Still your turn.")).to_be_visible()
    page.get_by_role("button", name="03 Change your mind").click()
    expect(page.get_by_role("heading", name="You can change your mind.")).to_be_visible()
    page.get_by_role("button", name="04 Keep your turn").click()
    expect(page.get_by_text("CONVERSATION RECORD", exact=True)).to_be_visible()
    page.route("**/api/tts/token", lambda route: route.fulfill(status=503, json={"error":"Test: live voice is not configured."}))
    page.get_by_role("button", name="Live voice", exact=True).click()
    page.get_by_role("button", name="Speak message").click()
    expect(page.get_by_role("status")).to_contain_text("Test: live voice is not configured.")
    page.get_by_role("button", name="Walkthrough", exact=True).click()
    expect(page.get_by_role("heading", name="Every word belongs to you.")).to_be_visible()
    page.get_by_role("button", name="Toggle high contrast").click()
    expect(page.locator(".sheet")).to_have_class("sheet high-contrast")
    page.get_by_role("button", name="Toggle high contrast").click()
    page.screenshot(path=str(OUTPUT / "secondvoice-desktop.png"), full_page=True)
    page.set_viewport_size({"width":390,"height":844})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path=str(OUTPUT / "secondvoice-mobile.png"), full_page=True)
    assert not errors, errors
    browser.close()
