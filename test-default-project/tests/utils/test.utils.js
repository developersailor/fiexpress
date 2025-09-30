import { Page, BrowserContext } from 'playwright';
import { e2eConfig } from '../../src/config/e2e.config';

export class TestUtils {
  private page: Page;
  private context: BrowserContext;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  // Navigation utilities
  async navigateTo(path: string): Promise<void> {
    const url = `${e2eConfig.environment.baseUrl}${path}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForUrl(url: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(url, { timeout });
  }

  // Element utilities
  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  // Form utilities
  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(formData)) {
      await this.fillInput(selector, value);
    }
  }

  async submitForm(formSelector: string): Promise<void> {
    await this.page.click(`${formSelector} button[type="submit"]`);
  }

  // Authentication utilities
  async loginAs(userType: 'admin' | 'user'): Promise<void> {
    const user = e2eConfig.testData.users[userType];
    await this.navigateTo('/login');
    await this.fillForm({
      'input[name="email"]': user.email,
      'input[name="password"]': user.password
    });
    await this.submitForm('form');
    await this.waitForUrl('/dashboard');
  }

  async logout(): Promise<void> {
    await this.clickElement('[data-testid="logout-button"]');
    await this.waitForUrl('/login');
  }

  // API utilities
  async makeApiRequest(endpoint: string, options: any = {}): Promise<any> {
    const response = await this.page.request.get(`${e2eConfig.testData.api.baseUrl}${endpoint}`, options);
    return await response.json();
  }

  async makeApiPost(endpoint: string, data: any): Promise<any> {
    const response = await this.page.request.post(`${e2eConfig.testData.api.baseUrl}${endpoint}`, {
      data
    });
    return await response.json();
  }

  // Screenshot utilities
  async takeScreenshot(name: string): Promise<void> {
    if (e2eConfig.screenshots.enabled) {
      await this.page.screenshot({ 
        path: `${e2eConfig.screenshots.path}/${name}.png`,
        fullPage: true
      });
    }
  }

  // Wait utilities
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForResponse(url: string): Promise<void> {
    await this.page.waitForResponse(response => response.url().includes(url));
  }

  // Assertion utilities
  async assertElementExists(selector: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
  }

  async assertElementText(selector: string, expectedText: string): Promise<void> {
    const actualText = await this.getText(selector);
    if (actualText !== expectedText) {
      throw new Error(`Expected text "${expectedText}" but got "${actualText}"`);
    }
  }

  async assertUrlContains(text: string): Promise<void> {
    const url = this.page.url();
    if (!url.includes(text)) {
      throw new Error(`Expected URL to contain "${text}" but got "${url}"`);
    }
  }

  // Cleanup utilities
  async cleanup(): Promise<void> {
    // Clear cookies and local storage
    await this.context.clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

export default TestUtils;