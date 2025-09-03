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
        # In a real app, you would click a logout button.
        # For this test, we can just navigate to the login page.
        await page.goto("http://localhost:3000/auth/login")
        print("Logged out.")

        # --- Login ---
        print("\n--- Logging in ---")
        await page.goto("http://localhost:3000/auth/login")
        await expect(page.get_by_role("button", name="Sign In")).to_be_enabled(timeout=10000)
        await page.get_by_label("Email").fill(email)
        await page.locator("#password").fill(password)
        await page.get_by_role("button", name="Sign In").click()
        await expect(page).to_have_url("http://localhost:3000/dashboard", timeout=10000)
        print("Login successful.")

        # --- Resume Upload Test ---
        print("\n--- Testing Resume Upload ---")

        # Navigate to the resumes page
        await page.goto("http://localhost:3000/dashboard/resumes")

        # Wait for the file chooser to be ready
        async with page.expect_file_chooser() as fc_info:
            await page.get_by_role("button", name="Browse Files").click()
        file_chooser = await fc_info.value

        # Set the file to upload
        await file_chooser.set_files("jules-scratch/dummy_resume.txt")

        # Wait for the upload to complete.
        await expect(page.get_by_text("Resume uploaded successfully.")).to_be_visible(timeout=20000)
        print("Resume upload successful.")

        # Take a screenshot of the page after upload
        await page.screenshot(path="jules-scratch/verification/resume_upload_success.png")
        print("Screenshot taken: jules-scratch/verification/resume_upload_success.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
