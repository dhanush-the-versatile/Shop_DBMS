// Logout if not logged in
if (!localStorage.getItem("isLogged")) location.href="index.html";

// Store keys
const invKey = "jk_inventory";
const txnKey = "jk_bills";

// App state
let inventory = [];
let bills = [];
let sessionBill = { items:[], total:0 };

// INIT
function loadAll() {
  inventory = JSON.parse(localStorage.getItem(invKey) || "[]");
  bills = JSON.parse(localStorage.getItem(txnKey) || "[]");
  showSection("inventory");
}
// Navigation
function showSection(sec) {
  ["inventorySection","billingSection","returnsSection","reportsSection"].forEach(id=>{
    document.getElementById(id).style.display = (id.startsWith(sec))?"block":"none";
  });
  if(sec==="inventory")   buildInventory();
  if(sec==="billing")     buildBilling();
  if(sec==="returns")     buildReturns();
  if(sec==="reports")     buildReports();
}
// Logout
function logout() {
  localStorage.removeItem("isLogged");
  location.href="index.html";
}
// Inventory Section
function buildInventory() {
  let html = `<div class="section-title">Inventory</div>
    <button onclick="showAddForm()">➕ Add Item</button>
    <button onclick="showUpdateForm()">📝 Update Price</button>
    <button onclick="showLowStock()">⚠️ Low Stock Alert</button>
    <table><thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Reorder<br>Level</th></tr></thead><tbody>`;
  for (let item of inventory)
    html += `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>${item.rl}</td></tr>`;
  html += `</tbody></table><hr>`;
  document.getElementById("inventorySection").innerHTML = html;
}
function showAddForm() {
  document.getElementById("inventorySection").innerHTML += `<form id="addForm">
    <input type="text" id="aname" placeholder="Item Name" required autofocus>
    <input type="number" id="aqty" placeholder="Quantity" min=1 required>
    <input type="number" id="aprice" placeholder="Price" min=1 required>
    <input type="number" id="arl" placeholder="Reorder level" min=1 required>
    <button type="submit">Save</button>
    <button type="button" onclick="loadAll()">Cancel</button>
  </form>`;
  document.getElementById("addForm").onsubmit = function(e){
    e.preventDefault();
    let n = aname.value.trim(), q = +aqty.value, p = +aprice.value, rl = +arl.value;
    if (n && q>0 && p>0 && rl>0) {
      if (inventory.find(x=>x.name.toLowerCase()==n.toLowerCase())) { alert("Exists!"); return;}
      inventory.push({name:n, qty:q, price:p, rl:rl});
      localStorage.setItem(invKey, JSON.stringify(inventory));
      loadAll();
    }
  };
}

function showUpdateForm() {
  if(!inventory.length){alert("No items.");return;}
  let opts=inventory.map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
  document.getElementById("inventorySection").innerHTML += `<form id="upForm">
    <select id="upidx" required>${opts}</select>
    <input type="number" id="upp" placeholder="New Price" min=1 required>
    <button type="submit">Update</button>
    <button type="button" onclick="loadAll()">Cancel</button>
  </form>`;
  document.getElementById("upForm").onsubmit = function(e){
    e.preventDefault();
    let idx = upidx.value, np = +upp.value;
    inventory[idx].price = np;
    localStorage.setItem(invKey,JSON.stringify(inventory));
    loadAll();
  }
}

function showLowStock() {
  let ls = inventory.filter(x=>x.qty<=x.rl);
  if(!ls.length) {alert("No items at/below reorder.");return;}
  let list = ls.map(x=>x.name+" (Qty: "+x.qty+", RL: "+x.rl+")").join('\n');
  if(confirm("Low Stock:\n"+list+"\n\nSend to email?")) {
    let b=encodeURIComponent("Low Stock List:\n\n"+list);
    location = `mailto:jhansikirana10@gmail.com?subject=Low Stock Alert - Grocery Store&body=${b}`;
  }
}

// Billing Section
function buildBilling() {
  let opts=inventory.map((x,i)=>`<option value="${i}">${x.name} (Stock: ${x.qty})</option>`).join("");
  let html = `<div class="section-title">Billing</div>
    <form id="billForm">
      <select id="bidx">${opts}</select>
      <input type="number" id="bqty" min=1 value=1 required>
      <button type="button" onclick="addToBill()">Add to Bill</button>
      <button type="button" onclick="finalizeBill()">Finalize Bill</button>
      <button type="button" onclick="resetBill()">Clear</button>
    </form>
    <div id="cart"></div>`;
  document.getElementById("billingSection").innerHTML = html;
  renderCart();
}
function addToBill() {
  let idx=+bidx.value, q=+bqty.value, item=inventory[idx];
  if(q>0 && item.qty>=q) {
    let ci = sessionBill.items.findIndex(x=>x.idx===idx);
    if(ci!==-1) sessionBill.items[ci].qty+=q;
    else sessionBill.items.push({idx, qty:q});
    renderCart();
  } else alert("Not enough stock.");
}
function renderCart() {
  let cart = sessionBill.items, s = "", tot=0;
  if(!cart.length){document.getElementById("cart").innerHTML="No items in bill."; return;}
  s="<table><tr><th>Item</th><th>Qty</th><th>Amount</th><th></th></tr>";
  cart.forEach((ci,i)=>{
    let item=inventory[ci.idx],amt=ci.qty*item.price;
    tot+=amt;
    s+=`<tr><td>${item.name}</td><td>${ci.qty}</td><td>₹${amt}</td>
      <td><button onclick="delFromBill(${i})">✖</button></td></tr>`;
  });
  s+=`<tr><th colspan=2>Total</th><th>₹${tot}</th><th></th></tr></table>`;
  document.getElementById("cart").innerHTML = s;
  sessionBill.total = tot;
}
function delFromBill(i){
  sessionBill.items.splice(i,1); renderCart();
}
function finalizeBill() {
  if(!sessionBill.items.length){alert("Cart empty.");return;}
  // Adjust inventory
  sessionBill.items.forEach(ci=>{
    inventory[ci.idx].qty -= ci.qty;
  });
  // Record bill
  bills.push({dt:Date.now(), items:[...sessionBill.items], total:sessionBill.total});
  localStorage.setItem(invKey,JSON.stringify(inventory));
  localStorage.setItem(txnKey,JSON.stringify(bills));
  alert("Bill completed! Total: ₹"+sessionBill.total);
  resetBill(); loadAll();
}
function resetBill() { sessionBill={items:[],total:0}; buildBilling(); }

// Returns Section
function buildReturns() {
  let opts=inventory.map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
  let html = `<div class="section-title">Process Return</div>
    <form id="retForm">
      <select id="ridx" required>${opts}</select>
      <input type="number" id="rqty" min=1 value=1 required>
      <button type="submit">Process</button>
    </form>`;
  document.getElementById("returnsSection").innerHTML = html;
  document.getElementById("retForm").onsubmit = function(e){
    e.preventDefault();
    let idx = +ridx.value, q = +rqty.value;
    if(q>0){
      inventory[idx].qty += q;
      localStorage.setItem(invKey,JSON.stringify(inventory));
      alert("Return accepted.");
      showSection("returns");
    }
  }
}

// Reports
function buildReports() {
  let html = `<div class="section-title">Bills Report</div><table>
  <tr><th>Date/Time</th><th>Items</th><th>Total</th></tr>`;
  bills.forEach(b=>{
    let dt = new Date(b.dt).toLocaleString(),
      items = b.items.map(ci=>`${inventory[ci.idx]?.name||'?' }(x${ci.qty})`).join(', ');
    html += `<tr><td>${dt}</td><td>${items}</td><td>₹${b.total}</td></tr>`;
  });
  html += "</table>";
  document.getElementById("reportsSection").innerHTML = bills.length ? html : "<p>No bills yet!</p>";
}

// Startup
window.onload = loadAll;
