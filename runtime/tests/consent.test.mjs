import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,copyFile,appendFile,rm} from 'node:fs/promises';
import {join,resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {binding,hasConsent,remember} from '../consent.mjs';

test('changing the serialized host reveal invalidates consent without launching any app',async()=>{
  const temporary=await mkdtemp(join(tmpdir(),'sitian-consent-test-')),source=fileURLToPath(new URL('..',import.meta.url));
  // Synthetic identity and isolated consent fixture; no runtime authorization is written.
  const app={userSid:'test-only-account',version:'fixture1',signature:'Valid OpenAI',family:'fixture',exe:'C:/fixture/Codex.exe'};
  try{
    const files=(await readdir(source,{withFileTypes:true})).filter(f=>f.isFile()&&/\.(mjs|ps1|json)$/.test(f.name));
    await Promise.all(files.map(f=>copyFile(join(source,f.name),join(temporary,f.name))));
    assert.equal(await hasConsent(temporary,app),false);const before=await binding(temporary,app);
    await remember(temporary,app);assert.equal(await hasConsent(temporary,app),true);
    await appendFile(join(temporary,'host-reveal.mjs'),'\n// changed test fixture\n');
    const after=await binding(temporary,app);assert.notEqual(after.codeHash,before.codeHash);
    assert.equal(await hasConsent(temporary,app),false);
  }finally{
    assert.equal(resolve(dirname(temporary)),resolve(tmpdir()));assert.ok(basename(temporary).startsWith('sitian-consent-test-'));
    await rm(temporary,{recursive:true});
  }
});

test('changing the serialized orbit renderer invalidates prior consent',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'sitian-consent-test-')),source=fileURLToPath(new URL('..',import.meta.url));
 const app={userSid:'test-only-account',version:'fixture2',signature:'Valid OpenAI',family:'fixture',exe:'C:/fixture/Codex.exe'};
 try{
  const files=(await readdir(source,{withFileTypes:true})).filter(f=>f.isFile()&&/\.(mjs|ps1|json)$/.test(f.name));
  await Promise.all(files.map(f=>copyFile(join(source,f.name),join(temporary,f.name))));
  await remember(temporary,app);assert.equal(await hasConsent(temporary,app),true);
  await appendFile(join(temporary,'orbits.mjs'),'\n// changed test fixture\n');
  assert.equal(await hasConsent(temporary,app),false);
 }finally{assert.equal(resolve(dirname(temporary)),resolve(tmpdir()));assert.ok(basename(temporary).startsWith('sitian-consent-test-'));await rm(temporary,{recursive:true});}
});
