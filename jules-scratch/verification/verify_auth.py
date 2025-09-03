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
        email = f"testuser{random_string}@example.com"
        password = "Password123!"
        full_name = "Test User"

        # --- Registration Test ---
        print("--- Testing Registration ---")
        await page.goto("http://localhost:3000/auth/register")

        # Wait for the form to be ready
        await expect(page.get_by_role("button", name="Create Account")).to_be_enabled(timeout=10000)

        await page.get_by_label("Full Name").fill(full_name)
        await page.get_by_label("Email").fill(email)
        await page.locator("#password").fill(password)
        await page.locator("#confirmPassword").fill(password)

        await page.get_by_role("button", name="Create Account").click()

        # Wait for navigation to the dashboard
        try:
            await expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
            print("Registration successful, redirected to dashboard.")
        except Exception as e:
            print(f"Registration failed: {e}")


        # Take a screenshot of the dashboard after registration
        await page.screenshot(path="jules-scratch/verification/dashboard_after_register.png")
        print("Screenshot taken: jules-scratch/verification/dashboard_after_register.png")

        # --- Logout ---
        print("\n--- Logging out ---")
        await page.goto("http://localhost:3000/auth/login")
        print("Navigated to login page.")


        # --- Login Test ---
        print("\n--- Testing Login ---")
        await page.goto("http://localhost:3000/auth/login")

        # Wait for the form to be ready
        await expect(page.get_by_role("button", name="Sign In")).to_be_enabled(timeout=10000)

        await page.get_by_label("Email").fill(email)
        await page.locator("#password").fill(password)

        await page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to the dashboard
        try:
            await expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
            print("Login successful, redirected to dashboard.")
        except Exception as e:
            print(f"Login failed: {e}")


        # Take a screenshot of the dashboard after login
        await page.screenshot(path="jules-scratch/verification/dashboard_after_login.png")
        print("Screenshot taken: jules-scratch/verification/dashboard_after_login.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
