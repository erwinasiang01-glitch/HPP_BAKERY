(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const STORAGE_KEY = "rotirapi-bakery-data-v1";
  const today = () => new Date().toISOString().slice(0,10);
  const money = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:2}).format(Number.isFinite(Number(n)) ? Number(n) : 0);
  const number = (n) => new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(Number(n)||0);
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  let data = {ingredients:[], recipes:[], priceHistory:[]};
  let toastTimer;

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        data = {ingredients:Array.isArray(parsed.ingredients)?parsed.ingredients:[],recipes:Array.isArray(parsed.recipes)?parsed.recipes:[],priceHistory:Array.isArray(parsed.priceHistory)?parsed.priceHistory:[]};
      }
    } catch (e) { showToast("Data lokal tidak bisa dibaca. Coba impor cadangan."); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderAll(); }
    catch (e) { showToast("Penyimpanan gagal. Ekspor data sebagai cadangan."); }
  }
  function showToast(msg) {
    const el=$("#toast"); el.textContent=msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2800);
  }
  function esc(s) { return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function ingredientById(id) { return data.ingredients.find(x=>x.id===id); }
  function unitCost(i) { return i && Number(i.quantity)>0 ? Number(i.price)/Number(i.quantity) : 0; }
  function recipeCost(recipe) {
    if(!recipe) return {ingredients:0,extra:0,total:0,lines:[]};
    const lines=(recipe.lines||[]).map(line=>{
      const ing=ingredientById(line.ingredientId), qty=Number(line.quantity)||0;
      return {name:ing?.name||"Bahan dihapus",unit:ing?.unit||"",quantity:qty,cost:unitCost(ing)*qty,missing:!ing};
    });
    const ingredients=lines.reduce((s,l)=>s+l.cost,0),extra=Number(recipe.extra)||0;
    return {ingredients,extra,total:ingredients+extra,lines};
  }
  function renderAll(){renderIngredients();renderRecipes();renderSelectors();renderSummary();renderProfitIfReady();}
  function renderSummary(){$("#summaryIngredients").textContent=data.ingredients.length;$("#summaryRecipes").textContent=data.recipes.length;}
  function renderIngredients(){
    const list=$("#ingredientList"); list.innerHTML="";
    $("#ingredientCount").textContent=`${data.ingredients.length} item`;
    $("#ingredientEmpty").classList.toggle("hidden",data.ingredients.length>0);
    data.ingredients.forEach(i=>{
      const row=document.createElement("article");row.className="data-row";
      row.innerHTML=`<span class="item-symbol">✳</span><div class="item-main"><strong>${esc(i.name)}</strong><small>${esc(i.category)} · Harga diperbarui ${esc(i.date||"—")}</small></div><div class="item-price"><strong>${money(unitCost(i))}/${esc(i.unit)}</strong><small>${money(i.price)} / ${number(i.quantity)} ${esc(i.unit)}</small></div><div class="row-actions"><button class="small-button" data-edit-ing="${esc(i.id)}">Edit</button><button class="small-button" data-delete-ing="${esc(i.id)}">Hapus</button></div>`;
      list.append(row);
    });
  }
  function renderRecipes(){
    const list=$("#recipeList");list.innerHTML="";
    $("#recipeCount").textContent=`${data.recipes.length} resep`;
    $("#recipeEmpty").classList.toggle("hidden",data.recipes.length>0);
    data.recipes.forEach(r=>{
      const c=recipeCost(r),yieldCount=Math.max(1,Number(r.yield)||1),hpp=c.total/yieldCount;
      const row=document.createElement("article");row.className="data-row";
      row.innerHTML=`<span class="item-symbol">⌁</span><div class="item-main"><strong>${esc(r.name)}</strong><small>${(r.lines||[]).length} bahan · hasil ${number(yieldCount)} pcs</small></div><div class="item-price"><strong>${money(hpp)}/pcs</strong><small>${money(c.total)} / batch</small></div><div class="row-actions"><button class="small-button" data-edit-recipe="${esc(r.id)}">Edit</button><button class="small-button" data-delete-recipe="${esc(r.id)}">Hapus</button></div>`;
      list.append(row);
    });
  }
  function renderSelectors(){
    ["#simulationRecipe","#profitRecipe"].forEach(sel=>{
      const el=$(sel),current=el.value;el.innerHTML='<option value="">Pilih resep…</option>';
      data.recipes.forEach(r=>{const o=document.createElement("option");o.value=r.id;o.textContent=r.name;el.append(o);});
      if(data.recipes.some(r=>r.id===current))el.value=current;
    });
  }
  function setView(name){
    $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
    if(name==="profit")renderProfitIfReady();
  }
  function resetIngredientForm(){
    $("#ingredientForm").reset();$("#ingredientId").value="";$("#ingredientDate").value=today();$("#unitPreview").textContent="Harga satuan: —";
  }
  function editIngredient(id){
    const i=ingredientById(id);if(!i)return;
    $("#ingredientId").value=i.id;$("#ingredientName").value=i.name;$("#ingredientCategory").value=i.category;$("#ingredientPrice").value=i.price;$("#ingredientQty").value=i.quantity;$("#ingredientUnit").value=i.unit;$("#ingredientDate").value=i.date||today();
    updateUnitPreview();$("#ingredientForm").scrollIntoView({behavior:"smooth",block:"center"});
  }
  function updateUnitPreview(){
    const p=Number($("#ingredientPrice").value),q=Number($("#ingredientQty").value),u=$("#ingredientUnit").value;
    $("#unitPreview").textContent=q>0&&p>=0?`Harga satuan: ${money(p/q)} / ${u}`:"Harga satuan: —";
  }
  function recipeLineMarkup(line={ingredientId:"",quantity:""}){
    const wrap=document.createElement("div");wrap.className="recipe-line";
    const opts=data.ingredients.map(i=>`<option value="${esc(i.id)}" ${i.id===line.ingredientId?"selected":""}>${esc(i.name)} (${money(unitCost(i))}/${esc(i.unit)})</option>`).join("");
    wrap.innerHTML=`<label>Bahan<select class="line-ingredient" required><option value="">Pilih bahan…</option>${opts}</select></label><label>Kuantitas<input class="line-quantity" type="number" min="0.001" step="any" required value="${line.quantity??""}" placeholder="500"></label><button type="button" class="remove-line" aria-label="Hapus baris">×</button>`;
    wrap.querySelector(".remove-line").addEventListener("click",()=>{wrap.remove();});
    return wrap;
  }
  function addRecipeLine(line){$("#recipeLines").append(recipeLineMarkup(line));}
  function resetRecipeForm(){
    $("#recipeForm").reset();$("#recipeId").value="";$("#recipeYield").value=20;$("#recipeExtra").value=0;$("#targetProduction").value=100;$("#recipeLines").innerHTML="";addRecipeLine();$("#recipeForm").classList.remove("hidden");
  }
  function editRecipe(id){
    const r=data.recipes.find(x=>x.id===id);if(!r)return;
    $("#recipeId").value=r.id;$("#recipeName").value=r.name;$("#recipeYield").value=r.yield;$("#recipeExtra").value=r.extra||0;$("#targetProduction").value=r.yield||1;$("#recipeLines").innerHTML="";
    (r.lines||[]).forEach(l=>addRecipeLine(l));if(!r.lines?.length)addRecipeLine();
    $("#recipeForm").scrollIntoView({behavior:"smooth",block:"center"});
  }
  function currentRecipeFormLines(){
    return $$(".recipe-line").map(row=>({ingredientId:row.querySelector(".line-ingredient").value,quantity:Number(row.querySelector(".line-quantity").value)})).filter(l=>l.ingredientId&&l.quantity>0);
  }
  function simulate(){
    const r=data.recipes.find(x=>x.id===$("#simulationRecipe").value),target=Math.max(1,Math.floor(Number($("#simulationTarget").value)||1)),out=$("#simulationResult");
    if(!r){out.innerHTML='<p>Pilih resep terlebih dahulu.</p>';return;}
    const batches=target/Math.max(1,Number(r.yield)||1),needs=(r.lines||[]).map(l=>{
      const i=ingredientById(l.ingredientId),qty=Number(l.quantity)*batches;
      return {name:i?.name||"Bahan dihapus",unit:i?.unit||"",qty,cost:unitCost(i)*qty,missing:!i};
    });
    out.innerHTML=`<strong>Untuk ${number(target)} pcs diperlukan ${number(batches)} batch (${batches===Math.floor(batches)?"pas":"dibulatkan ke atas menjadi "+Math.ceil(batches)}).</strong><table class="result-table"><thead><tr><th>Bahan</th><th>Kebutuhan</th><th>Estimasi biaya</th></tr></thead><tbody>${needs.map(n=>`<tr><td>${esc(n.name)}${n.missing?" ⚠":""}</td><td>${number(n.qty)} ${esc(n.unit)}</td><td>${money(n.cost)}</td></tr>`).join("")}</tbody></table><p>Estimasi biaya bahan untuk target ini: <strong>${money(needs.reduce((s,n)=>s+n.cost,0))}</strong>. Belum memperhitungkan pembulatan produksi dan kapasitas stok aktual.</p>`;
  }
  function calculateProfit(){
    const r=data.recipes.find(x=>x.id===$("#profitRecipe").value),out=$("#profitOutput");
    if(!r){out.innerHTML='<div class="empty-state compact"><h3>Pilih resep terlebih dahulu</h3><p>Hasil perhitungan akan tampil setelah resep dipilih.</p></div>';return;}
    const c=recipeCost(r),yieldCount=Math.max(1,Number(r.yield)||1),sell=Math.max(0,Number($("#sellingPrice").value)||0),extra=Math.max(0,Number($("#profitExtra").value)||0),batches=Math.max(1,Number($("#profitBatches").value)||1);
    const totalCost=(c.ingredients+c.extra+extra)*batches,units=yieldCount*batches,hpp=totalCost/units,revenue=sell*units,profit=revenue-totalCost,perPiece=sell-hpp,margin=revenue>0?profit/revenue*100:0;
    out.innerHTML=`<div class="profit-hero"><p class="eyebrow">ESTIMASI LABA BATCH</p><strong class="${profit<0?"negative":""}">${money(profit)}</strong><p>${number(units)} pcs · ${number(batches)} batch · omzet ${money(revenue)}</p></div><div class="metrics-grid"><div class="metric"><span>HPP per pcs</span><strong>${money(hpp)}</strong><small>Biaya produksi / unit</small></div><div class="metric"><span>Laba per pcs</span><strong class="${perPiece<0?"negative":"positive"}">${money(perPiece)}</strong><small>Harga jual − HPP</small></div><div class="metric"><span>Margin laba</span><strong class="${margin<0?"negative":"positive"}">${number(margin)}%</strong><small>Laba / omzet</small></div><div class="metric"><span>Total biaya</span><strong>${money(totalCost)}</strong><small>Termasuk biaya tambahan</small></div></div><div class="note-card"><strong>Rincian biaya</strong><p>Bahan baku: ${money(c.ingredients*batches)} · Biaya tambahan resep: ${money(c.extra*batches)} · Biaya non-bahan tambahan: ${money(extra*batches)}.</p><p>${profit<0?"Perhatian: harga jual belum menutup estimasi biaya.":"Ini estimasi laba sebelum pajak, diskon, retur, dan biaya lain yang belum dicatat."}</p></div>`;
  }
  function renderProfitIfReady(){if($("#profitRecipe").value)calculateProfit();}
  function exportData(){
    const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString(),app:"RotiRapi"},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`rotirapi-backup-${today()}.json`;a.click();URL.revokeObjectURL(url);showToast("Cadangan data berhasil disiapkan.");
  }
  async function importData(file){
    try{
      const parsed=JSON.parse(await file.text());
      if(!Array.isArray(parsed.ingredients)||!Array.isArray(parsed.recipes))throw new Error("Format cadangan tidak cocok.");
      if(!confirm("Impor akan mengganti data yang ada pada perangkat ini. Lanjutkan?"))return;
      data={ingredients:parsed.ingredients,recipes:parsed.recipes,priceHistory:Array.isArray(parsed.priceHistory)?parsed.priceHistory:[]};save();showToast("Data berhasil diimpor.");
    }catch(e){showToast("Gagal impor: "+(e.message||"berkas tidak valid."));}
    finally{$("#importFile").value="";}
  }
  function bind(){
    $$(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
    $("#todayLabel").textContent=`WORKSPACE / ${new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date()).toUpperCase()}`;
    $("#ingredientDate").value=today();
    ["#ingredientPrice","#ingredientQty","#ingredientUnit"].forEach(s=>$(s).addEventListener("input",updateUnitPreview));
    $("#addIngredientBtn").addEventListener("click",()=>{resetIngredientForm();$("#ingredientName").focus();});
    $("#emptyAddIngredient").addEventListener("click",()=>{resetIngredientForm();$("#ingredientName").focus();});
    $("#cancelIngredientBtn").addEventListener("click",resetIngredientForm);
    $("#ingredientForm").addEventListener("submit",e=>{
      e.preventDefault();const id=$("#ingredientId").value||uid(),existing=ingredientById(id);
      const item={id,name:$("#ingredientName").value.trim(),category:$("#ingredientCategory").value,price:Number($("#ingredientPrice").value),quantity:Number($("#ingredientQty").value),unit:$("#ingredientUnit").value,date:$("#ingredientDate").value||today()};
      if(!item.name||item.quantity<=0||item.price<0){showToast("Periksa kembali harga dan isi kemasan.");return;}
      if(existing&&(existing.price!==item.price||existing.quantity!==item.quantity||existing.unit!==item.unit))data.priceHistory.push({ingredientId:id,name:item.name,price:existing.price,quantity:existing.quantity,unit:existing.unit,date:existing.date,changedAt:today()});
      const idx=data.ingredients.findIndex(x=>x.id===id);if(idx>=0)data.ingredients[idx]=item;else data.ingredients.push(item);
      save();resetIngredientForm();showToast("Bahan berhasil disimpan.");
    });
    $("#ingredientList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit-ing]"),del=e.target.closest("[data-delete-ing]");
      if(edit)editIngredient(edit.dataset.editIng);
      if(del&&confirm("Hapus bahan ini? Resep yang memakai bahan tersebut perlu diperiksa kembali.")){data.ingredients=data.ingredients.filter(i=>i.id!==del.dataset.deleteIng);save();showToast("Bahan dihapus.");}
    });
    $("#addRecipeBtn").addEventListener("click",()=>{resetRecipeForm();$("#recipeName").focus();});
    $("#emptyAddRecipe").addEventListener("click",()=>{resetRecipeForm();$("#recipeName").focus();});
    $("#cancelRecipeBtn").addEventListener("click",resetRecipeForm);
    $("#addRecipeLineBtn").addEventListener("click",()=>addRecipeLine());
    $("#recipeForm").addEventListener("submit",e=>{
      e.preventDefault();const id=$("#recipeId").value||uid(),lines=currentRecipeFormLines();
      if(!lines.length){showToast("Tambahkan minimal satu bahan ke resep.");return;}
      if(lines.some(l=>!ingredientById(l.ingredientId))){showToast("Ada bahan yang tidak ditemukan.");return;}
      const item={id,name:$("#recipeName").value.trim(),yield:Math.max(1,Math.floor(Number($("#recipeYield").value)||1)),extra:Math.max(0,Number($("#recipeExtra").value)||0),lines};
      const idx=data.recipes.findIndex(x=>x.id===id);if(idx>=0)data.recipes[idx]=item;else data.recipes.push(item);
      save();resetRecipeForm();showToast("Resep berhasil disimpan.");
    });
    $("#recipeList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit-recipe]"),del=e.target.closest("[data-delete-recipe]");
      if(edit)editRecipe(edit.dataset.editRecipe);
      if(del&&confirm("Hapus resep ini?")){data.recipes=data.recipes.filter(r=>r.id!==del.dataset.deleteRecipe);save();showToast("Resep dihapus.");}
    });
    $("#runSimulationBtn").addEventListener("click",simulate);
    $("#calculateProfitBtn").addEventListener("click",calculateProfit);
    $("#profitRecipe").addEventListener("change",()=>{const r=data.recipes.find(x=>x.id===$("#profitRecipe").value);if(r)$("#profitExtra").value=0;calculateProfit();});
    ["#sellingPrice","#profitExtra","#profitBatches"].forEach(s=>$(s).addEventListener("input",renderProfitIfReady));
    $("#exportBtn").addEventListener("click",exportData);
    $("#importFile").addEventListener("change",e=>{if(e.target.files?.[0])importData(e.target.files[0]);});
  }
  load();bind();renderAll();resetRecipeForm();
  if("serviceWorker" in navigator && location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
  $("#installBtn").addEventListener("click",async()=>{if(!deferredPrompt){showToast("Gunakan menu Bagikan (iPhone) atau Tambahkan ke layar utama di browser.");return;}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;});
})();