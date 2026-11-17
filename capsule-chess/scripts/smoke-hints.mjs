import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { findBrowser } from './lib/browser.mjs';
const base = process.argv[2] ?? 'http://localhost:8766/dayainow';
const browser = await puppeteer.launch({executablePath:findBrowser(),headless:true,args:['--hide-scrollbars']});
mkdirSync('release/candidate/screenshots',{recursive:true});
try {
 for (const language of ['ko','en']) for (const [width,height] of [[390,844],[320,568]]) {
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(lang=>{
   localStorage.setItem('settings:v1',JSON.stringify({language:lang}));
   localStorage.setItem('progress:v1',JSON.stringify({onboarded:true,guideDone:true,campaign:{1:3}}));
  },language);
  await page.goto(base+'/campaign/1?firstBattle=1',{waitUntil:'networkidle0'});
  const label=language==='ko'?'힌트 ≤★★':'Hint ≤★★';
  await page.waitForFunction(label=>[...document.querySelectorAll('[role="button"]')].some(e=>e.textContent===label),{},label);
  await page.evaluate(label=>[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent===label).click(),label);

  const instruction=language==='ko'?'손가락이 가리키는 기물을 골라 봐요.':'Choose the piece under the pointer.';
  await page.waitForSelector(`[aria-label="${instruction}"]`);
  assert.equal(await page.evaluate(label=>[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent===label).getAttribute('aria-disabled'),label),'true');
  // Identify by visible label to avoid depending on icon encoding.
  const bottom=await page.evaluate(()=>Math.max(...[...document.querySelectorAll('[role="button"]')].filter(e=>e.textContent.includes('Restart')||e.textContent.includes('처음부터')).map(e=>e.getBoundingClientRect().bottom)));
  assert.ok(bottom<=height,`Controls outside viewport: ${bottom}/${height}`);
  await new Promise(resolve=>setTimeout(resolve,1500));
  await page.screenshot({path:`release/candidate/screenshots/hint-${language}-${width}.png`});
  await page.evaluate(()=>[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent.includes('Restart')||e.textContent.includes('처음부터')).click());
  await page.waitForFunction(label=>[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent===label)?.getAttribute('aria-disabled')!=='true',{},label);
  assert.deepEqual(errors,[]);
  console.log(`PASS hint and restart: ${language} ${width}x${height}`);
  await context.close();
 }
} finally { await browser.close(); }
