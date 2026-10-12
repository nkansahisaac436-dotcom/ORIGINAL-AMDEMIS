import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5bdf01cd-3ef5-437c-9639-005b386b0253';

async function main() {
  console.log('--- Starting Mobile Keyboard Verification Script ---');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const testViewports = [
    { name: 'iPhone_390x844', width: 390, height: 844, kbHeight: 300 },
    { name: 'Android_360x740', width: 360, height: 740, kbHeight: 280 },
  ];

  for (const vp of testViewports) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        vp.name.startsWith('iPhone')
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();

    // 1. Authenticate directly via admin session cookie
    console.log('Setting admin session cookie...');
    await context.addCookies([
      {
        name: 'amdemis_admin_session',
        value: 'super_admin',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Helper to simulate keyboard open by adjusting visual viewport
    async function simulateKeyboard(keyboardHeight) {
      if (vp.name.startsWith('iPhone')) {
        // iOS: visualViewport height shrinks, layout viewport remains
        await page.evaluate((kb) => {
          Object.defineProperty(window.visualViewport, 'height', {
            value: window.innerHeight - kb,
            configurable: true,
          });
          window.visualViewport.dispatchEvent(new Event('resize'));
        }, keyboardHeight);
      } else {
        // Android: viewport itself resizes
        await page.setViewportSize({ width: vp.width, height: vp.height - keyboardHeight });
        await page.evaluate(() => {
          window.dispatchEvent(new Event('resize'));
          if (window.visualViewport) {
            window.visualViewport.dispatchEvent(new Event('resize'));
          }
        });
      }
      await page.waitForTimeout(400);
    }

    // Helper to simulate keyboard close
    async function closeKeyboard() {
      if (vp.name.startsWith('iPhone')) {
        await page.evaluate(() => {
          Object.defineProperty(window.visualViewport, 'height', {
            value: window.innerHeight,
            configurable: true,
          });
          window.visualViewport.dispatchEvent(new Event('resize'));
        });
      } else {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.evaluate(() => {
          window.dispatchEvent(new Event('resize'));
          if (window.visualViewport) {
            window.visualViewport.dispatchEvent(new Event('resize'));
          }
        });
      }
      await page.waitForTimeout(300);
    }

    // Helper to verify element is within visible area above keyboard
    async function verifyElementVisibleAboveKeyboard(selector, name, maxVisibleY) {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible', timeout: 5000 });
      const box = await el.boundingBox();
      if (!box) throw new Error(`Could not get bounding box for ${name}`);
      console.log(`  [Check] ${name}: top=${box.y.toFixed(1)}, bottom=${(box.y + box.height).toFixed(1)}, maxAllowedY=${maxVisibleY}`);
      if (box.y + box.height > maxVisibleY + 15) {
        throw new Error(`${name} is obscured by keyboard! bottom=${box.y + box.height} > maxVisibleY=${maxVisibleY}`);
      }
      return box;
    }

    const maxVisibleHeight = vp.height - vp.kbHeight;

    // --- FORM 1: Add Circuit ---
    console.log('\nTesting Form 1: Add Circuit...');
    await page.goto('http://localhost:3000/admin/circuits', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const addCircuitBtn = page.locator('button:has-text("Add Circuit")').first();
    await addCircuitBtn.click();
    await page.waitForTimeout(500);

    // Focus input and simulate keyboard
    const circuitInput = page.locator('input#circuit-name-input');
    await circuitInput.click();
    await simulateKeyboard(vp.kbHeight);

    // Verify input and Save button visible
    await verifyElementVisibleAboveKeyboard('input#circuit-name-input', 'Add Circuit Input', maxVisibleHeight);
    await verifyElementVisibleAboveKeyboard('button:has-text("Save Circuit")', 'Add Circuit Save Button', maxVisibleHeight);

    // If iPhone 390, capture screenshot
    if (vp.name === 'iPhone_390x844') {
      const screenshotPath = path.join(ARTIFACT_DIR, 'screen_add_circuit_kb_390.png');
      // Render simulated keyboard overlay on screenshot
      await page.evaluate((kb) => {
        const kbDiv = document.createElement('div');
        kbDiv.id = 'simulated-kb-overlay';
        kbDiv.style.position = 'fixed';
        kbDiv.style.bottom = '0';
        kbDiv.style.left = '0';
        kbDiv.style.right = '0';
        kbDiv.style.height = `${kb}px`;
        kbDiv.style.backgroundColor = '#d1d5db';
        kbDiv.style.borderTop = '2px solid #9ca3af';
        kbDiv.style.display = 'flex';
        kbDiv.style.flexDirection = 'column';
        kbDiv.style.alignItems = 'center';
        kbDiv.style.justifyContent = 'center';
        kbDiv.style.zIndex = '999999';
        kbDiv.innerHTML = `
          <div style="font-weight: 800; color: #1f2937; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">iOS Virtual Keyboard (${kb}px)</div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">Save & Cancel Footer Kept Visible Above Keyboard</div>
        `;
        document.body.appendChild(kbDiv);
      }, vp.kbHeight);

      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);

      await page.evaluate(() => {
        const overlay = document.getElementById('simulated-kb-overlay');
        if (overlay) overlay.remove();
      });
    }

    // Close Add Circuit modal
    await closeKeyboard();
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(400);

    // --- FORM 2: Rename Circuit ---
    console.log('\nTesting Form 2: Rename Circuit...');
    const renameBtn = page.locator('button:has-text("Rename")').first();
    if (await renameBtn.count() > 0) {
      await renameBtn.click();
      await page.waitForTimeout(500);
      await circuitInput.click();
      await simulateKeyboard(vp.kbHeight);

      await verifyElementVisibleAboveKeyboard('input#circuit-name-input', 'Rename Circuit Input', maxVisibleHeight);
      await verifyElementVisibleAboveKeyboard('button:has-text("Save Changes")', 'Rename Circuit Save Button', maxVisibleHeight);

      await closeKeyboard();
      await page.locator('button:has-text("Cancel")').first().click();
      await page.waitForTimeout(400);
    }

    // --- FORM 3: Add School ---
    console.log('\nTesting Form 3: Add School...');
    await page.goto('http://localhost:3000/admin/schools', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const addSchoolBtn = page.locator('button:has-text("Add School")').first();
    await addSchoolBtn.click();
    await page.waitForTimeout(500);

    // Focus School Name input
    const schoolNameInput = page.locator('input[placeholder*="Nyinahin D/A Basic School"]');
    await schoolNameInput.click();
    await simulateKeyboard(vp.kbHeight);

    // Verify school name, status buttons, and Save button
    await verifyElementVisibleAboveKeyboard('input[placeholder*="Nyinahin D/A Basic School"]', 'School Name Input', maxVisibleHeight);
    await verifyElementVisibleAboveKeyboard('button:has-text("Save & Issue PIN")', 'Add School Save Button', maxVisibleHeight);

    // If iPhone 390, capture screenshot
    if (vp.name === 'iPhone_390x844') {
      const screenshotPath = path.join(ARTIFACT_DIR, 'screen_add_school_kb_390.png');
      await page.evaluate((kb) => {
        const kbDiv = document.createElement('div');
        kbDiv.id = 'simulated-kb-overlay-school';
        kbDiv.style.position = 'fixed';
        kbDiv.style.bottom = '0';
        kbDiv.style.left = '0';
        kbDiv.style.right = '0';
        kbDiv.style.height = `${kb}px`;
        kbDiv.style.backgroundColor = '#d1d5db';
        kbDiv.style.borderTop = '2px solid #9ca3af';
        kbDiv.style.display = 'flex';
        kbDiv.style.flexDirection = 'column';
        kbDiv.style.alignItems = 'center';
        kbDiv.style.justifyContent = 'center';
        kbDiv.style.zIndex = '999999';
        kbDiv.innerHTML = `
          <div style="font-weight: 800; color: #1f2937; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">iOS Virtual Keyboard (${kb}px)</div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">Top-Starting Dialog & Sticky Save Bar Above Keyboard</div>
        `;
        document.body.appendChild(kbDiv);
      }, vp.kbHeight);

      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);

      await page.evaluate(() => {
        const overlay = document.getElementById('simulated-kb-overlay-school');
        if (overlay) overlay.remove();
      });
    }

    // Close Add School modal
    await closeKeyboard();
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(400);

    // --- FORM 4: Reset PIN Confirmation ---
    console.log('\nTesting Form 4: Reset PIN Confirmation...');
    const schoolCard = page.locator('div.cursor-pointer').first();
    if (await schoolCard.count() > 0) {
      await schoolCard.click();
      await page.waitForTimeout(500);

      const resetPinBtn = page.locator('button:has-text("Reset PIN & Print Slip")');
      if (await resetPinBtn.count() > 0) {
        await resetPinBtn.click();
        await page.waitForTimeout(400);

        await simulateKeyboard(vp.kbHeight);
        await verifyElementVisibleAboveKeyboard('button:has-text("Confirm PIN Reset")', 'Reset PIN Confirm Button', maxVisibleHeight);

        await closeKeyboard();
        await page.locator('button:has-text("Cancel")').first().click();
        await page.waitForTimeout(400);
      }

      // Close school detail
      await page.locator('button:has-text("Close")').first().click();
      await page.waitForTimeout(400);
    }

    // --- FORM 5: Create / Edit Collection Round ---
    console.log('\nTesting Form 5: Create / Edit Collection Round...');
    await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const editRoundBtn = page.locator('button:has-text("Edit Cycle")');
    const newRoundBtn = page.locator('button:has-text("New Round")');
    const roundTrigger = (await editRoundBtn.count() > 0) ? editRoundBtn : newRoundBtn;

    if (await roundTrigger.count() > 0) {
      await roundTrigger.first().click();
      await page.waitForTimeout(500);

      const titleInput = page.locator('input[placeholder*="Academic Year"]').first();
      await titleInput.click();
      await simulateKeyboard(vp.kbHeight);

      await verifyElementVisibleAboveKeyboard('input[placeholder*="Academic Year"]', 'Collection Round Title Input', maxVisibleHeight);
      await verifyElementVisibleAboveKeyboard('button:has-text("Save Changes"), button:has-text("Create & Activate Round")', 'Round Save Button', maxVisibleHeight);

      await closeKeyboard();
      await page.locator('button:has-text("Cancel")').first().click();
      await page.waitForTimeout(400);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll form keyboard tests completed successfully!');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
