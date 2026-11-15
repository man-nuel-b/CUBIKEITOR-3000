'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('ISO preview inline Javascript parses and loads all required browser modules',()=>{
 const html=fs.readFileSync('cubikeitor-iso.html','utf8');
 const matches=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert(matches.length>=1,'No inline app script found');
 for(const match of matches)assert.doesNotThrow(()=>new vm.Script(match[1],{filename:'cubikeitor-iso.html'}));
 for(const path of ['iso-presets.js','iso-structure.js','floor-plan-core.js','wall-cutouts.js','cpq-parser.js']){
  assert(html.includes('src="'+ 'src/'+path+'"'),path+' missing from HTML');
 }
 for(const control of ['iso-model','iso-apply','ai-process','add-opening','total','model-label']){
  assert(html.includes('id="'+control+'"'),control+' missing from UI');
 }
});
