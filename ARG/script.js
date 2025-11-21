/* -------------------------
   FILE CONTENTS & DEFAULT FILES
-------------------------- */
const defaultFiles = {
  "important.txt": { locked:false, content:fileContents["important.txt"] },
  "notes.txt": { locked:false, content:fileContents["notes.txt"] },
  "photo.jpg": { locked:false, path:"assets/photo.png" },
  "terminal": { locked:false, content:"" }
};

// Only pdf1 and pdf8 functional for now
for(let i=1;i<=8;i++){
  defaultFiles[`pdf${i}`] = {
    locked:true,
    password:fileContents[`pdf${i}-password`] || `pdf${i}`,
    path:`pdf/pdf${i}.pdf`,
    enabled: (i===1 || i===8) 
  };
}

let files = JSON.parse(JSON.stringify(defaultFiles));

/* -------------------------
   ICON MAP FOR TASKBAR
-------------------------- */
const iconMap = {
  "text": "assets/note.png",
  "image": "assets/photo.png",
  "pdf": "assets/pdf.png",
  "terminal": "assets/cmd.png"
};

/* -------------------------
   SOUNDS
-------------------------- */
const sndStartup = document.getElementById('snd-startup');
const sndClick = document.getElementById('snd-click');
const sndError = document.getElementById('snd-error');
function play(snd){ try { snd.currentTime = 0; snd.play(); } catch(e) {} }

/* -------------------------
   CLOCK
-------------------------- */
window.addEventListener('load', ()=>{ 
  play(sndStartup);
  updateClock();
  setInterval(updateClock,1000);
});
function updateClock(){
  const c = document.getElementById('clock');
  if(c) c.innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

/* -------------------------
   WINDOW MANAGEMENT
-------------------------- */
let zIndexCounter = 20;
const taskbarWindows = document.getElementById('taskbar-windows');

function bringToFront(win){
  zIndexCounter++;
  win.style.zIndex = zIndexCounter;
  document.querySelectorAll('.window').forEach(w=>w.classList.remove('focused'));
  win.classList.add('focused');
}

function createWindow(title, type, data){
  play(sndClick);

  const w = document.createElement('div');
  w.className = "window";
  w.style.left = (120 + Math.random()*150) + "px";
  w.style.top  = (80 + Math.random()*100) + "px";
  w.style.display = "flex"; 
  w.style.flexDirection = "column";
  w.style.minHeight = "160px";
  w.style.width = (type === 'image' ? '640px' : '520px');

  const tb = document.createElement('div');
  tb.className = "titlebar";
  tb.innerHTML = `
    <div class="title-left"><span>${title}</span></div>
    <div class="title-right">
      <button class="min">–</button>
      <button class="max">☐</button>
      <button class="close">✕</button>
    </div>`;
  w.appendChild(tb);

  const content = document.createElement('div');
  content.className = "content";
  w.appendChild(content);

  // ------------------------- ONLY CHANGE IS HERE FOR PDF -------------------------
  if(type === "pdf"){
    // Make popup larger by default
    w.style.width = "800px";
    w.style.height = "600px";
    w.style.minWidth = "600px";
    w.style.minHeight = "400px";

    const iframe = document.createElement("embed");
    iframe.src = data;
    iframe.type = "application/pdf";
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    content.style.flex = "1";
    content.style.overflow = "auto";
    content.appendChild(iframe);
  }
  // ------------------------------------------------------------------------------

  else if(type === "text"){
    const pre = document.createElement('pre');
    pre.style.whiteSpace = "pre-wrap";
    pre.innerText = data;
    content.appendChild(pre);
  } else if(type === "image"){
    const iv = document.createElement('div');
    iv.className = "img-viewer";
    const img = document.createElement('img');
    img.src = data;
    iv.appendChild(img);
    content.appendChild(iv);
  } else if(type === "terminal"){
    const term = document.createElement('div');
    term.className = "terminal";
    term.innerHTML = `<div id="term-output"></div>`;
    const input = document.createElement('input');
    input.style.width="100%";
    input.style.padding="6px";
    content.appendChild(term);
    content.appendChild(input);

    const out = term.querySelector('#term-output');
    function writeln(s){
      out.innerHTML += `<div>${s}</div>`;
      term.scrollTop = term.scrollHeight;
    }
    writeln("Welcome to the terminal==========.");
    input.addEventListener('keydown', e=>{
      if(e.key==="Enter"){
        const cmd = input.value.trim();
        writeln("> " + cmd);
        handleCmd(cmd, writeln);
        input.value="";
      }
    });
  }

  // ---------- TASKBAR ICON (STRICTLY INSIDE TASKBAR) ----------
  const taskIcon = iconMap[type] || "assets/note.png";
  const entry = document.createElement('div');
  entry.className = "task-entry";
  entry.style.display = "flex";
  entry.style.alignItems = "center";
  entry.style.justifyContent = "center";
  entry.style.marginRight = "2px";
  entry.style.cursor = "pointer";
  entry.innerHTML = `<img src="${taskIcon}" style="width:20px;height:20px;">`;
  taskbarWindows.appendChild(entry);

  entry.addEventListener('click', ()=>{
    if(w.style.display==="none") w.style.display="flex";
    bringToFront(w);
    play(sndClick);
  });

  tb.querySelector('.min').onclick = e=>{ e.stopPropagation(); w.style.display="none"; play(sndClick); };
  tb.querySelector('.max').onclick = e=>{ e.stopPropagation(); bringToFront(w); play(sndClick); };
  tb.querySelector('.close').onclick = e=>{
    e.stopPropagation();
    if(title==="Command Prompt") terminalUnlocked=false;
    w.remove();
    entry.remove();
    play(sndClick);
  };

  dragElement(w, tb, entry);
  document.body.appendChild(w);
  bringToFront(w);
  return {w, entry};
}

/* -------------------------
   DRAG + AUTOCLOSE
-------------------------- */
function dragElement(el, bar, taskEntry){
  let sx=0, sy=0, ox=0, oy=0, drag=false;

  bar.onmousedown = e=>{
    if(e.target.tagName==="BUTTON") return;
    drag=true;
    sx=e.clientX; sy=e.clientY;
    ox=el.offsetLeft; oy=el.offsetTop;
    document.onmousemove=move;
    document.onmouseup=stop;
  };

  function move(e){
    if(!drag) return;
    el.style.left=(ox + (e.clientX-sx)) + "px";
    el.style.top=(oy + (e.clientY-sy)) + "px";

    if(e.clientY < 0){
      el.remove();
      if(taskEntry) taskEntry.remove();
      drag=false;
      document.onmousemove=null;
      document.onmouseup=null;
    }
  }

  function stop(){
    drag=false;
    document.onmousemove=null;
    document.onmouseup=null;
  }
}

/* -------------------------
   TERMINAL COMMANDS
-------------------------- */
let terminalUnlocked=false;

const pdfPasswords={
  "pdf1":"SeaXShanty",
  "pdf2":"TheAirAndSkies",
  "pdf3":"PanzersAndTigers",
  "pdf4":"NeedlesxMeds",
  "pdf5":"MarinesEatCrayons",
  "pdf6":"ExperimentLogsXXXXwwwXXXX",
  "pdf7":"ProjectRookiexIntent",
  "pdf8":"Ritual"
};

function base32Encode(str){
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits="", out="";
  for(let i=0;i<str.length;i++) bits+=str.charCodeAt(i).toString(2).padStart(8,"0");
  while(bits.length%5!==0) bits+="0";
  for(let i=0;i<bits.length;i+=5) out+=alphabet[parseInt(bits.substr(i,5),2)];
  while(out.length%8!==0) out+="=";
  return out;
}

function handleCmd(cmd,writeln){
  const input=cmd.trim();
  if(input==="10245"){ terminalUnlocked=true; writeln("Access code recognized. Terminal unlocked."); return; }

  if(terminalUnlocked && /^(pdf1|pdf8)$/i.test(input)){ 
    writeln(": "+base32Encode(pdfPasswords[input.toLowerCase()])); 
    return; 
  }

  for(let key of ["pdf1","pdf8"]){
    if(input===pdfPasswords[key]){
      files[key].locked=false; 
      openFile(key); 
      return; 
    }
  }

  if(input==="help") writeln("Commands: help, ls, pdf1, pdf8");
  else if(input==="ls") Object.keys(files).forEach(k=>writeln(k));
  else if(input==="clear") document.querySelector('#term-output').innerHTML="";
  else writeln("Unknown command");
}

/* -------------------------
   FILE OPENING
-------------------------- */
function openFile(name){
  const f=files[name];
  if(!f || (f.hasOwnProperty("enabled") && !f.enabled)){ 
    play(sndError); 
    alert("This file is not yet available."); 
    return; 
  }
  if(f.locked){
    const p=prompt("Enter password:");
    if(p!==f.password){ play(sndError); return; }
    f.locked=false; delete f.password;
  }

  let type="text";
  if(name==="terminal") type="terminal";
  else if(name.startsWith("pdf")) type="pdf";
  else if(name.endsWith(".jpg") || name.endsWith(".png")) type="image";

  let data=null;
  if(type==="text") data=f.content;
  else if(type==="image" || type==="pdf") data=f.path;

  createWindow(name, type, data);
}

/* -------------------------
   DESKTOP ICON CLICK
-------------------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll(".icon").forEach(icon=>{
    icon.addEventListener("click", e=>{
      e.stopPropagation();
      document.querySelectorAll(".icon").forEach(i=>i.classList.remove("selected"));
      icon.classList.add("selected");
      if(icon.dataset.file==="folder1") return;
      openFile(icon.dataset.file);
    });
  });
});

/* -------------------------
   UNAUTHORIZED ACCESS POPUP
-------------------------- */
const unauthOverlay = document.getElementById("unauth-overlay");
const unauthClose = document.getElementById("unauth-close");

unauthClose.addEventListener("click", () => {
  unauthOverlay.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const expFolder = document.querySelector('[data-file="folder1"]');
  if(expFolder){
    expFolder.addEventListener("click", (e) => {
      e.stopPropagation();
      play(sndError);
      unauthOverlay.style.display = "flex";
    });
  }
});
