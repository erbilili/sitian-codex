// This is a standalone simulated DOM. It never attaches to a Codex process.
let sequence=0;
document.querySelector('form').addEventListener('submit',event=>event.preventDefault());
async function install(){await import('/test-payload.mjs?run='+ ++sequence);return window.__bailiCodexSkin?.status();}
document.querySelector('#install').onclick=()=>{window.__bailiCodexSkin?.dispose();install();};
document.querySelector('#restore').onclick=()=>window.__bailiCodexSkin?.dispose();
window.__sitianTestHost={simulated:true,install,restore:()=>window.__bailiCodexSkin?.dispose(),status:()=>window.__bailiCodexSkin?.status()};
await install();
