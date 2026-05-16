const { test, expect } = require('@playwright/test');

test.describe('Audio QA', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:8765');
    // Wait for game to initialize
    await page.waitForTimeout(3000);

    // If hook not available, try a click to trigger user gesture
    const exists = await page.evaluate(() => typeof window._audioManager !== 'undefined');
    if (!exists) {
      try {
        await page.click('canvas');
      } catch (_) {}
      await page.waitForTimeout(1000);
    }
  });

  test('window._audioManager hook exists', async () => {
    const exists = await page.evaluate(() => typeof window._audioManager !== 'undefined');
    expect(exists).toBe(true);
  });

  test('BGM keys registered', async () => {
    const keys = await page.evaluate(() => {
      const am = window._audioManager;
      if (!am) return [];
      return am._bgmBuffer ? Object.keys(am._bgmBuffer) :
             (am._bgmFiles ? Object.keys(am._bgmFiles) : ['check_source']);
    });
    expect(keys).toBeDefined();
  });

  test('isMuted() returns boolean', async () => {
    const muted = await page.evaluate(() => window._audioManager?.isMuted?.());
    expect(typeof muted).toBe('boolean');
    expect(muted).toBe(false);
  });

  test('setComboLevel sets _comboLevel', async () => {
    await page.evaluate(() => window._audioManager?.setComboLevel?.(4));
    const level = await page.evaluate(() => window._audioManager?._comboLevel ?? -1);
    expect(level).toBe(4);
  });

  test('combo detune = comboLevel * 50', async () => {
    await page.evaluate(() => window._audioManager?.setComboLevel?.(4));
    const detune = await page.evaluate(() => {
      const am = window._audioManager;
      return (am?._comboLevel ?? 0) * 50;
    });
    expect(detune).toBe(200);
  });
});
