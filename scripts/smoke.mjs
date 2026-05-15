import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

await page.getByPlaceholder('请输入账号').fill('admin');
await page.getByPlaceholder('请输入密码').fill('vvcrm2026');
await page.getByRole('button', { name: '登录系统' }).click();
await page.getByText('全球商机透视看板').waitFor();
await page.getByText('市场洞察').waitFor();
await page.locator('aside').getByText('美元 / 人民币').waitFor();
await page.getByText('客户询价跟进').waitFor();
await page.getByRole('heading', { name: '商机记忆库' }).waitFor();
await page.getByRole('button', { name: 'AI 解析询盘' }).click();
await page.getByText('解析确认').waitFor();
await page.getByRole('button', { name: 'Close' }).click();
await page.getByRole('button', { name: '合同生成 Contract' }).click();
await page.getByText('销售合同信息').waitFor();
await page.getByRole('button', { name: '增加车辆行' }).click();
await page.getByText('车型 5').waitFor();
await page.getByRole('button', { name: '生成合同' }).click();
await page.getByText('下载 Excel 合同').waitFor({ timeout: 15000 });
await page.screenshot({ path: 'artifacts/vvcrm-dashboard.png', fullPage: true });

await browser.close();
