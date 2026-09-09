import {
  auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, serverTimestamp
} from "./firebase.js";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const defaults={
  brandName:"JPPC",brandSub:"JENGGALA PINGPONG PADEL CLUB",estYear:"2024",instagram:"@jppc.jenggala",
  statSessions:48,heroKicker:"PLAY · SPORT · SOCIAL · TOGETHER",heroLine1:"PLAY TOGETHER.",heroLine2:"STAY TOGETHER.",
  heroText:"JPPC adalah komunitas pingpong, padel, mahjong, dan persahabatan.",
  aboutIntro:"JPPC dimulai dari pertemanan di Jenggala, dari pingpong lalu berkembang ke padel dan mahjong.",
  aboutQuote:"Different games. Same people.",aboutBody:"Serius saat bermain, tetap teman setelahnya.",
  contactTitle:"Jenggala Pingpong Padel Club",contactText:"Private Social Sports Club.",
  theme:{bg:"#06111f",panel:"#0d1b2a",red:"#ef1828",blue:"#0aa8ff",text:"#f7f9fc",muted:"#9fb0c6"}
};
let site=structuredClone(defaults), currentUser=null, isAdmin=false, editing=null;
let data={events:[],members:[],rankings:[],gallery:[],assets:{}};

function modal(id,on=true){$("#"+id).classList.toggle("open",on)}
$$("[data-close]").forEach(b=>b.onclick=()=>modal(b.dataset.close,false));
$("#adminBtn").onclick=()=> currentUser&&isAdmin ? modal("adminModal") : modal("loginModal");
$("#yearNow").textContent=new Date().getFullYear();

$("#loginSubmit").onclick=async()=>{
  $("#loginError").textContent="";
  try{await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPassword").value)}
  catch(e){$("#loginError").textContent="Login gagal: "+(e.code||e.message)}
};
$("#logoutBtn").onclick=async()=>{await signOut(auth);modal("adminModal",false)};

onAuthStateChanged(auth,async user=>{
  currentUser=user||null; isAdmin=false;
  if(user){
    const snap=await getDoc(doc(db,"admins",user.uid));
    isAdmin=snap.exists() && snap.data().enabled!==false;
    $("#adminEmail").textContent=user.email||"";
    if(isAdmin){modal("loginModal",false);$("#adminBtn").textContent="Admin ✓"}
    else{$("#adminBtn").textContent="Admin";$("#loginError").textContent="Akun login tetapi belum terdaftar sebagai admin."}
  } else $("#adminBtn").textContent="Admin";
});

function applyTheme(){
  const t=site.theme||defaults.theme;
  for(const [k,v] of Object.entries(t))document.documentElement.style.setProperty("--"+k,v);
}
function renderSite(){
  applyTheme();
  const ids=["brandName","brandSub","estYear","heroKicker","heroLine1","heroLine2","heroText","aboutIntro","aboutQuote","aboutBody","contactTitle","contactText"];
  ids.forEach(id=>{const el=$("#"+id);if(el)el.textContent=site[id]??""});
  $("#igText").textContent=site.instagram||"";
  $("#statSessions").textContent=site.statSessions||0;
  $("#statMembers").textContent=data.members.length;
  const logo=data.assets.logo?.data||"";
  if(logo)$("#siteLogo").src=logo;
  else $("#siteLogo").src=placeholderSvg("JPPC","#0aa8ff","#ef1828");
  const hero=data.assets.hero?.data||"";
  $("#heroBg").style.backgroundImage=hero?`linear-gradient(90deg,rgba(3,9,18,.94),rgba(3,9,18,.35),rgba(3,9,18,.68)),url("${hero}")`:"";
}
function placeholderSvg(text,c1="#0aa8ff",c2="#ef1828"){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><defs><linearGradient id="g"><stop stop-color="#081a30"/><stop offset="1" stop-color="#15101d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="220" cy="250" r="110" fill="none" stroke="${c1}" stroke-width="16" opacity=".6"/><path d="M0 620 L1000 350" stroke="${c2}" stroke-width="18" opacity=".55"/><text x="55" y="630" fill="white" font-family="Arial" font-size="80" font-weight="900">${text}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function renderEvents(){
  $("#eventsGrid").innerHTML=data.events.map(e=>`<article class="event-card reveal"><span class="event-date">${esc(e.day)} ${esc(e.month)}</span><h3>${esc(e.title)}</h3><p class="muted">${esc(e.desc)}</p><p>📍 ${esc(e.location)}<br>◷ ${esc(e.time)}</p></article>`).join("")||`<p class="muted">Belum ada event.</p>`;
  $("#adminEventsList").innerHTML=data.events.map(e=>listRow(e.id,e.title,"event")).join("")
}
function renderMembers(){
  $("#membersGrid").innerHTML=data.members.map(m=>`<article class="member-card reveal"><div class="member-photo">${m.photo?`<img src="${m.photo}">`:esc(m.avatar||m.name?.[0]||"?")}</div><div class="member-info"><h3>${esc(m.name)}</h3><span class="muted">${esc(m.role)}</span></div></article>`).join("")||`<p class="muted">Belum ada member.</p>`;
  $("#adminMembersList").innerHTML=data.members.map(m=>listRow(m.id,m.name,"member")).join("");
  $("#statMembers").textContent=data.members.length
}
function renderRankings(){
  $("#rankBody").innerHTML=data.rankings.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.name)}</b></td><td>${r.played||0}</td><td>${r.w||0}</td><td>${r.l||0}</td><td>${r.played?Math.round((r.w||0)/r.played*100):0}%</td></tr>`).join("");
  $("#adminRankingsList").innerHTML=data.rankings.map(r=>listRow(r.id,r.name,"ranking")).join("")
}
function renderGallery(){
  const items=data.gallery.map(g=>({src:g.data||placeholderSvg("JPPC"),...g}));
  const doubled=[...items,...items];
  $("#galleryTrack").innerHTML=doubled.map((g,i)=>`<div class="gallery-card" data-gallery="${g.id}"><img src="${g.src}"><span>${esc(g.label||"JPPC")}</span></div>`).join("");
  $$(".gallery-card").forEach(c=>c.onclick=()=>{const g=data.gallery.find(x=>x.id===c.dataset.gallery);if(g){$("#lightboxImg").src=g.data;modal("lightbox")}});
  $("#adminGalleryList").innerHTML=data.gallery.map(g=>listRow(g.id,g.label||"Photo","gallery")).join("")
}
function renderSports(){
  const sports=[["Pingpong","Where it all started."],["Padel","Competition, teamwork, energy."],["Mahjong","After-hours social tradition."]];
  $("#sportsGrid").innerHTML=sports.map((s,i)=>`<article class="sport-card reveal" style="background-image:linear-gradient(180deg,transparent,rgba(0,0,0,.8)),url('${placeholderSvg(s[0])}')"><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join("")
}
function listRow(id,title,type){return `<div class="list-row"><b>${esc(title||"Untitled")}</b><button class="btn ghost edit-item" data-id="${id}" data-type="${type}">Edit</button></div>`}
document.addEventListener("click",e=>{const b=e.target.closest(".edit-item");if(b)openEditor(b.dataset.type,b.dataset.id)});

function listen(){
  onSnapshot(doc(db,"site","main"),s=>{site=s.exists()?{...defaults,...s.data(),theme:{...defaults.theme,...(s.data().theme||{})}}:structuredClone(defaults);renderSite();fillSiteAdmin()});
  onSnapshot(collection(db,"assets"),s=>{data.assets={};s.forEach(d=>data.assets[d.id]={id:d.id,...d.data()});renderSite()});
  onSnapshot(query(collection(db,"events"),orderBy("order","asc")),s=>{data.events=s.docs.map(d=>({id:d.id,...d.data()}));renderEvents();reveal()});
  onSnapshot(query(collection(db,"members"),orderBy("order","asc")),s=>{data.members=s.docs.map(d=>({id:d.id,...d.data()}));renderMembers();reveal()});
  onSnapshot(query(collection(db,"rankings"),orderBy("order","asc")),s=>{data.rankings=s.docs.map(d=>({id:d.id,...d.data()}));renderRankings()});
  onSnapshot(query(collection(db,"gallery"),orderBy("order","asc")),s=>{data.gallery=s.docs.map(d=>({id:d.id,...d.data()}));renderGallery()},e=>console.error("Gallery listener:",e));
}
listen();renderSports();

function fillSiteAdmin(){
  const map={fBrandName:"brandName",fBrandSub:"brandSub",fEstYear:"estYear",fInstagram:"instagram",fStatSessions:"statSessions",fHeroKicker:"heroKicker",fHeroLine1:"heroLine1",fHeroLine2:"heroLine2",fHeroText:"heroText",fAboutIntro:"aboutIntro",fAboutQuote:"aboutQuote",fAboutBody:"aboutBody",fContactTitle:"contactTitle",fContactText:"contactText"};
  Object.entries(map).forEach(([id,k])=>{if($("#"+id))$("#"+id).value=site[k]??""});
  const t=site.theme||defaults.theme;$("#cBg").value=t.bg;$("#cPanel").value=t.panel;$("#cRed").value=t.red;$("#cBlue").value=t.blue;$("#cText").value=t.text;$("#cMuted").value=t.muted
}
$("#saveSiteBtn").onclick=async()=>{
  if(!guard())return;
  const map={brandName:"fBrandName",brandSub:"fBrandSub",estYear:"fEstYear",instagram:"fInstagram",statSessions:"fStatSessions",heroKicker:"fHeroKicker",heroLine1:"fHeroLine1",heroLine2:"fHeroLine2",heroText:"fHeroText",aboutIntro:"fAboutIntro",aboutQuote:"fAboutQuote",aboutBody:"fAboutBody",contactTitle:"fContactTitle",contactText:"fContactText"};
  const out={};Object.entries(map).forEach(([k,id])=>out[k]=$("#"+id).value);out.statSessions=Number(out.statSessions||0);
  await setDoc(doc(db,"site","main"),out,{merge:true});alert("Site saved")
};
$("#saveThemeBtn").onclick=async()=>{
  if(!guard())return;
  await setDoc(doc(db,"site","main"),{theme:{bg:$("#cBg").value,panel:$("#cPanel").value,red:$("#cRed").value,blue:$("#cBlue").value,text:$("#cText").value,muted:$("#cMuted").value}},{merge:true});alert("Theme saved")
};
function guard(){if(!currentUser||!isAdmin){alert("Admin access required.");return false}return true}

$$(".admin-tabs button").forEach(b=>b.onclick=()=>{$$(".admin-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".tab").forEach(x=>x.classList.remove("active"));$("#tab-"+b.dataset.tab).classList.add("active")});

async function compressImage(file,max=1500,quality=.78,targetKB=360){
  if(!file) throw new Error("Tidak ada file yang dipilih.");
  if(!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");

  // Decode with createImageBitmap when possible, fallback to HTMLImageElement.
  let source, sw, sh;
  try{
    source=await createImageBitmap(file);
    sw=source.width; sh=source.height;
  }catch(_){
    const url=URL.createObjectURL(file);
    try{
      source=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error("Format gambar tidak bisa dibaca browser. Coba JPG/PNG/WebP."));
        img.src=url;
      });
      sw=source.naturalWidth; sh=source.naturalHeight;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  let scale=Math.min(1,max/Math.max(sw,sh));
  let w=Math.max(1,Math.round(sw*scale)), h=Math.max(1,Math.round(sh*scale));
  let q=quality, lastBlob=null;

  for(let attempt=0;attempt<9;attempt++){
    const c=document.createElement("canvas");
    c.width=w; c.height=h;
    const ctx=c.getContext("2d",{alpha:false});
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,w,h);
    ctx.drawImage(source,0,0,w,h);

    const blob=await new Promise((resolve,reject)=>
      c.toBlob(b=>b?resolve(b):reject(new Error("Gagal mengompres gambar.")),"image/jpeg",q)
    );
    lastBlob=blob;
    if(blob.size/1024<=targetKB) break;

    w=Math.max(320,Math.round(w*.82));
    h=Math.max(240,Math.round(h*.82));
    q=Math.max(.48,q-.06);
  }

  if(!lastBlob) throw new Error("Gagal membuat gambar.");
  // Firestore document hard limit is ~1 MiB. Base64 adds ~33%, so keep payload conservative.
  if(lastBlob.size/1024>520) throw new Error("Gambar masih terlalu besar. Coba foto yang lebih kecil.");

  return await new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onload=()=>resolve(fr.result);
    fr.onerror=()=>reject(new Error("Gagal membaca hasil gambar."));
    fr.readAsDataURL(lastBlob);
  });
}
$$("[data-upload-asset]").forEach(b=>b.onclick=async()=>{
  if(!guard())return;
  const kind=b.dataset.uploadAsset;
  const input=kind==="logo"?$("#logoFile"):$("#heroFile");
  const f=input.files?.[0];
  if(!f)return alert("Pilih file dulu.");
  const old=b.textContent;
  try{
    b.disabled=true; b.textContent="Uploading...";
    const dataUrl=await compressImage(f,kind==="logo"?1000:1800,kind==="logo"?.84:.76,kind==="logo"?260:390);
    await setDoc(doc(db,"assets",kind),{data:dataUrl,updatedAt:serverTimestamp()});
    alert(kind==="logo"?"Logo berhasil disimpan.":"Hero berhasil disimpan.");
    input.value="";
  }catch(e){
    console.error(e);
    alert("Upload gagal: "+(e?.message||e));
  }finally{
    b.disabled=false; b.textContent=old;
  }
});
$("#addGalleryBtn").onclick=async()=>{if(!guard())return;openEditor("gallery","new")};
$("#addEventBtn").onclick=()=>guard()&&openEditor("event","new");
$("#addMemberBtn").onclick=()=>guard()&&openEditor("member","new");
$("#addRankingBtn").onclick=()=>guard()&&openEditor("ranking","new");

function openEditor(type,id){
  if(!guard())return;editing={type,id};$("#deleteItemBtn").style.display=id==="new"?"none":"inline-block";
  const found=id==="new"?{}:data[type==="ranking"?"rankings":type==="member"?"members":type==="event"?"events":"gallery"].find(x=>x.id===id)||{};
  $("#editTitle").textContent=(id==="new"?"Add ":"Edit ")+type;
  let h="";
  if(type==="event")h=`<label>Day<input id="eDay" value="${esc(found.day||"01")}"></label><label>Month<input id="eMonth" value="${esc(found.month||"JAN")}"></label><label>Title<input id="eTitle" value="${esc(found.title||"New Event")}"></label><label>Description<textarea id="eDesc">${esc(found.desc||"")}</textarea></label><label>Location<input id="eLocation" value="${esc(found.location||"Jenggala")}"></label><label>Time<input id="eTime" value="${esc(found.time||"18:00")}"></label>`;
  if(type==="member")h=`<label>Name<input id="mName" value="${esc(found.name||"New Member")}"></label><label>Role<input id="mRole" value="${esc(found.role||"Member")}"></label><label>Avatar<input id="mAvatar" value="${esc(found.avatar||"M")}"></label><label>Photo<input id="mPhoto" type="file" accept="image/*"></label>`;
  if(type==="ranking")h=`<label>Name<input id="rName" value="${esc(found.name||"Player")}"></label><label>Played<input id="rPlayed" type="number" value="${found.played||0}"></label><label>Wins<input id="rW" type="number" value="${found.w||0}"></label><label>Losses<input id="rL" type="number" value="${found.l||0}"></label>`;
  if(type==="gallery")h=`<label>Label<input id="gLabel" value="${esc(found.label||"JPPC")}"></label><label>Photo<input id="gPhoto" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="galleryUploadStatus" class="muted" style="margin:-4px 0 12px">JPG/PNG/WebP. Foto akan dikompres otomatis agar aman untuk Firestore.</div>${found.data?`<img src="${found.data}" style="width:100%;max-height:210px;object-fit:cover;border-radius:12px">`:""}`;
  $("#editFields").innerHTML=h;modal("editModal")
}
$("#saveItemBtn").onclick=async()=>{
  if(!guard()||!editing)return;
  const btn=$("#saveItemBtn"), old=btn.textContent;
  try{
    btn.disabled=true; btn.textContent="Saving...";
    const {type,id}=editing;
    let obj={updatedAt:serverTimestamp()};
    const list=type==="ranking"?"rankings":type+"s";

    if(type==="event")obj={...obj,day:$("#eDay").value,month:$("#eMonth").value.toUpperCase(),title:$("#eTitle").value,desc:$("#eDesc").value,location:$("#eLocation").value,time:$("#eTime").value};

    if(type==="member"){
      obj={...obj,name:$("#mName").value,role:$("#mRole").value,avatar:$("#mAvatar").value};
      const f=$("#mPhoto").files?.[0];
      if(f)obj.photo=await compressImage(f,1000,.76,300);
    }

    if(type==="ranking")obj={...obj,name:$("#rName").value,played:+$("#rPlayed").value,w:+$("#rW").value,l:+$("#rL").value};

    if(type==="gallery"){
      obj={...obj,label:$("#gLabel").value};
      const f=$("#gPhoto").files?.[0];
      if(f){
        $("#galleryUploadStatus").textContent="Mengompres dan mengupload foto...";
        obj.data=await compressImage(f,1500,.76,360);
      } else if(id==="new"){
        throw new Error("Pilih foto terlebih dahulu.");
      }
    }

    if(id==="new"){
      obj.order=Date.now();
      await addDoc(collection(db,list),obj);
    }else{
      await updateDoc(doc(db,list,id),obj);
    }

    modal("editModal",false);
    alert(type==="gallery"?"Foto gallery berhasil disimpan.":"Data berhasil disimpan.");
  }catch(e){
    console.error("Save failed:",e);
    const msg=(e?.code?e.code+": ":"")+(e?.message||String(e));
    alert("Save gagal: "+msg);
    const st=$("#galleryUploadStatus"); if(st)st.textContent="Gagal: "+msg;
  }finally{
    btn.disabled=false; btn.textContent=old;
  }
};
$("#deleteItemBtn").onclick=async()=>{
  if(!guard()||!editing||editing.id==="new")return;if(!confirm("Delete item?"))return;
  const list=editing.type==="ranking"?"rankings":editing.type+"s";await deleteDoc(doc(db,list,editing.id));modal("editModal",false)
};

function reveal(){const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("on")),{threshold:.06});$$(".reveal:not(.on)").forEach(x=>io.observe(x))}
reveal();
