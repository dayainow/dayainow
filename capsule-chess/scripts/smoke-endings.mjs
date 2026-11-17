import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { findBrowser } from './lib/browser.mjs';
const base=process.argv[2]??'http://localhost:8766/dayainow';
const browser=await puppeteer.launch({executablePath:findBrowser(),headless:true,args:['--hide-scrollbars']});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
mkdirSync('release/candidate/screenshots',{recursive:true});
try {
 for(const lang of ['ko','en']) {
  const context=await browser.createBrowserContext();
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(language=>{
   localStorage.setItem('settings:v1',JSON.stringify({language}));
   localStorage.setItem('progress:v1',JSON.stringify({onboarded:true}));
  },lang);
  await page.goto(base+'/play',{waitUntil:'networkidle0'});
  await page.evaluate(()=>{
   const el=[...document.querySelectorAll('div')].reverse().find(e=>e.textContent==='Pass & Play'||e.textContent==='2인 대전(기기공유)');
   if(!el) throw Error('Missing two-player control'); el.click();
  });
  const tap=async(r,c)=>{
   const point=await page.evaluate((r,c)=>{
    const board=[...document.querySelectorAll('div')].find(e=>getComputedStyle(e).borderTopWidth==='4px'&&e.querySelectorAll('div[tabindex="0"]').length===25);
    if(!board) throw Error('Missing board');
    const box=board.querySelectorAll('div[tabindex="0"]')[r*5+c].getBoundingClientRect();
    return {x:box.x+box.width/2,y:box.y+box.height/2};
   },r,c);
   await page.mouse.click(point.x,point.y); await wait(180);
  };
  const cycle=[[4,1,2,2],[0,1,2,0],[2,2,4,1],[2,0,0,1]];
  for(let i=0;i<8;i++) {const [a,b,c,d]=cycle[i%4];await tap(a,b);await tap(c,d);await wait(250);}
  await wait(1600);
  const reason=lang==='ko'?'같은 배치와 차례가 3번 나와 무승부예요.':'The same position and turn occurred three times. A draw.';
  assert.ok((await page.evaluate(()=>document.body.innerText)).includes(reason));
  await page.screenshot({path:`release/candidate/screenshots/draw-${lang}.png`});
  const restart=lang==='ko'?'다시 하기':'Play again';
  await page.evaluate(label=>{
   const el=[...document.querySelectorAll('[role="button"]')].find(e=>e.textContent===label);
   if(!el) throw Error('Missing play again button');el.click();
  },restart);
  await wait(500);
  assert.ok(!(await page.evaluate(()=>document.body.innerText)).includes(reason));
  assert.deepEqual(errors,[]);
  console.log(`PASS ${lang}: legal repeated moves → draw reason → new match`);
  await context.close();
 }
} finally {await browser.close();}
