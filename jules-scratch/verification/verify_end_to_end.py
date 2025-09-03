import asyncio
from playwright.async_api import async_playwright, expect
import random
import string

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # Generate random user credentials
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        email = f"testuser_{random_string}@example.com"
        password = "Password123!"
        full_name = "Test User"

        # --- Registration ---
        print("--- Registering a new user ---")
        await page.goto("http://localhost:3000/auth/register")
        await expect(page.get_by_role("button", name="Create Account")).to_be_enabled(timeout=10000)
        await page.get_by_label("Full Name").fill(full_name)
        await page.get_by_label("Email").fill(email)
        await page.locator("#password").fill(password)
        await page.locator("#confirmPassword").fill(password)
        await page.get_by_role("button", name="Create Account").click()
        await expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
        print("Registration successful.")

        # --- Logout ---
        print("\n--- Logging out ---")
        await page.get_by_role("button", name="Sign Out").click()
        await expect(page).to_have_url("http://localhost:3000/auth/login", timeout=10000)
        print("Logged out successfully.")


        # --- Login ---
        print("\n--- Logging in ---")
        await page.goto("http://localhost:3000/auth/login")
        await expect(page.get_by_role("button", name="Sign In")).to_be_enabled(timeout=10000)
        await page.get_by_label("Email").fill(email)
        await page.locator("#password").fill(password)
        await page.get_by_role("button", name="Sign In").click()
        await expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
        print("Login successful.")

        # --- Navigate to Job Applications page ---
        print("\n--- Navigating to Job Applications page ---")
        await page.goto("http://localhost:3000/dashboard/jobs")

        # Check if the page loads without a 404 error
        await expect(page.get_by_text("Job Applications")).to_be_visible(timeout=10000)
        print("Job Applications page loaded successfully.")

        # Take a screenshot of the page
        await page.screenshot(path="jules-scratch/verification/job_applications_page.png")
        print("Screenshot taken: jules-scratch/verification/job_applications_page.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
