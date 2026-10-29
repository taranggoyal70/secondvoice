from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts" / "qa"
OUTPUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    page.set_default_timeout(10000)
    console_errors: list[str] = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)

    page.goto("http://127.0.0.1:4174", wait_until="domcontentloaded")
    page.locator("h1").wait_for()
    page.wait_for_timeout(1800)
    print(f"initial_console_errors={console_errors}")
    print(f"voice_canvas_count={page.locator('canvas').count()}")
    assert page.locator(".voice-terrain canvas").count() == 1
    assert page.locator(".phrase-key").count() == 5
    page.get_by_role("button", name="Toggle high contrast").click()
    assert "is-high-contrast" in (page.locator(".studio-shell").get_attribute("class") or "")
    page.get_by_role("button", name="Toggle high contrast").click()
    page.screenshot(path=str(OUTPUT / "secondvoice-desktop.png"), full_page=True)

    page.get_by_role("button", name="Play judge demo").click()
    page.wait_for_timeout(1200)
    page.locator(".live-dot--speaking").wait_for()
    assert page.get_by_text("First audio 164 ms", exact=True).is_visible()
    assert page.get_by_text("AUDIO", exact=True).is_visible()
    assert "I need" in page.locator(".listener-view blockquote").inner_text()
    page.screenshot(path=str(OUTPUT / "secondvoice-speaking.png"), full_page=True)

    page.wait_for_timeout(2100)
    page.locator(".live-dot--interrupted").wait_for()
    assert page.get_by_text("CUT", exact=True).is_visible()
    assert page.get_by_text("CANCEL", exact=True).is_visible()

    page.get_by_role("button", name="Please ask me directly").click()
    assert page.locator("textarea").input_value() == "Please ask me directly."

    page.get_by_role("button", name="English · switch to Spanish").click()
    assert "Quiero responder" in page.locator("textarea").input_value()
    page.keyboard.press("5")
    assert page.locator("textarea").input_value() == "I am ready to continue."

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile.set_default_timeout(10000)
    mobile.goto("http://127.0.0.1:4174", wait_until="domcontentloaded")
    mobile.locator("h1").wait_for()
    mobile.wait_for_timeout(900)
    mobile.screenshot(path=str(OUTPUT / "secondvoice-mobile.png"), full_page=True)

    print(f"desktop={OUTPUT / 'secondvoice-desktop.png'}")
    print(f"speaking={OUTPUT / 'secondvoice-speaking.png'}")
    print(f"mobile={OUTPUT / 'secondvoice-mobile.png'}")
    print(f"console_errors={console_errors}")

    mobile.close()
    browser.close()
