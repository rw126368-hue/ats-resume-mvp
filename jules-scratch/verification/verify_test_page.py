import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # --- Bypass Login ---
        print("--- Bypassing login ---")
        await page.goto("http://localhost:3000/dashboard")

        access_token = "eyJhbGciOiJIUzI1NiIsImtpZCI6InVpSXA5QmRXbWVBbTA1K1giLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3R6cGJmcHNrcm5ocXpleGRva3J0LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmY2M1MTQ2ZC0yMGU0LTQ2MzUtYjAyZC0yYTQ2ZjI0ZmZiYzgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2OTAzNjQwLCJpYXQiOjE3NTY5MDAwNDAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmNjNTE0NmQtMjBlNC00NjM1LWIwMmQtMmE0NmYyNGZmYmM4In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTY5MDAwNDB9XSwic2Vzc2lvbl9pZCI6ImZiM2FkZDBhLTliMzAtNGQ3Ni1iNTYxLTY3N2ExNjdlNjFiYiIsImlzX2Fub255bW91cyI6ZmFsc2V9.yUZwIsf3-nCiBgAxSUqyD_U4ieKUvrDLDbKy8CDKXAs"

        await page.evaluate(f"""
            const session = {{
                'access_token': '{access_token}',
                'token_type': 'bearer',
                'expires_in': 3600,
                'expires_at': Math.floor(Date.now() / 1000) + 3600,
                'refresh_token': 'dummy_refresh_token',
                'user': {{
                    'id': 'fcc5146d-20e4-4635-b02d-2a46f24ffbc8',
                    'aud': 'authenticated',
                    'role': 'authenticated',
                    'email': 'test@example.com'
                }}
            }};
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        """)

        print("Bypassed login.")

        # --- Navigate to Test page ---
        print("\n--- Navigating to Test page ---")
        await page.goto("http://localhost:3000/dashboard/test")

        # Take a screenshot of the page
        await page.screenshot(path="jules-scratch/verification/test_page.png")
        print("Screenshot taken: jules-scratch/verification/test_page.png")

        # Check if the page loads without a 404 error
        await expect(page.get_by_text("Hello from the test page")).to_be_visible(timeout=10000)
        print("Test page loaded successfully.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
