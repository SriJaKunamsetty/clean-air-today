import time
import os
import glob
import subprocess
from playwright.sync_api import sync_playwright

def record():
    rec_dir = os.path.abspath("recordings")
    raw_dir = os.path.join(rec_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="C:/Program Files/Google/Chrome/Application/chrome.exe",
            headless=True
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=raw_dir,
            record_video_size={"width": 1280, "height": 720}
        )
        page = context.new_page()

        print("Navigating to https://clean-air-today.vercel.app/ ...")
        page.goto("https://clean-air-today.vercel.app/", wait_until="networkidle")
        time.sleep(2)

        # 1. Type City
        print("Typing City: Delhi...")
        page.click("#city")
        page.type("#city", "Delhi", delay=140)
        time.sleep(0.8)

        # 2. Check vulnerable groups
        print("Selecting household groups...")
        page.click("input[name='groups'][value='children']")
        time.sleep(0.5)
        page.click("input[name='groups'][value='older-adults']")
        time.sleep(0.5)

        # 3. Select Commute
        print("Selecting commute: two-wheeler...")
        page.select_option("#commute", "two-wheeler")
        time.sleep(0.6)

        # 4. Select Cooking
        print("Selecting cooking: gas...")
        page.select_option("#cooking", "gas")
        time.sleep(0.6)

        # 5. Select Heating
        print("Selecting heating: none...")
        page.select_option("#heating", "none")
        time.sleep(0.6)

        # 6. Radio Purifier
        print("Selecting purifier: no...")
        page.click("input[name='hasPurifier'][value='no']")
        time.sleep(1)

        # 7. Submit form
        print("Submitting plan...")
        page.click("button[type='submit']")

        # 8. Wait for results
        page.wait_for_selector("article h2", timeout=15000)
        time.sleep(2.5)

        # 9. Smoothly scroll down through advice sections
        print("Scrolling through results...")
        for y in range(0, 750, 25):
            page.evaluate(f"window.scrollTo(0, {y})")
            time.sleep(0.05)

        time.sleep(4)

        # 10. Smoothly scroll back to top
        for y in range(750, -25, -35):
            page.evaluate(f"window.scrollTo(0, {y})")
            time.sleep(0.05)

        time.sleep(2.5)

        context.close()
        browser.close()
        print("Browser recording closed.")

    # Find recorded webm
    webms = glob.glob(os.path.join(raw_dir, "*.webm"))
    if not webms:
        print("No webm found!")
        return

    latest_webm = max(webms, key=os.path.getmtime)
    output_mp4 = os.path.join(rec_dir, "clean_air_today_demo.mp4")

    print(f"Converting {latest_webm} to {output_mp4} using ffmpeg...")
    cmd = [
        "ffmpeg", "-y", "-i", latest_webm,
        "-c:v", "libx264", "-profile:v", "high", "-level:v", "4.0",
        "-pix_fmt", "yuv420p", "-r", "30",
        "-movflags", "+faststart",
        output_mp4
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"SUCCESS: Video saved at {output_mp4}")
        size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
        print(f"File size: {size_mb:.2f} MB")
    else:
        print("FFmpeg error:", res.stderr)

if __name__ == "__main__":
    record()
