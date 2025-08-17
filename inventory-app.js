const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyWLIElS5csQoG0W6DYcA7SMLi71_9-fIqoXn1qiviYLSZeMWLaf4Ht0G7d10Qvmuevig/exec";

let inventory = [];
let editingIndex = -1;

async function fetchInventory() {
  document.getElementById('msg').innerText = "Loading inventory...";
  try {
    const resp = await fetch(SHEET_API_URL);
    inventory = await resp.json();
    renderInventory();
    document.getElementById('msg').innerText = "";
  } catch(err) {
    document.getElementById('msg').innerText = "Failed to load inventory.";
  }
}

async function pushInventory() {
  document.getElementById('msg').innerText = "Saving inventory...";
  try {
    const resp = await fetch(SHEET_API_URL, {
      method: "POST",
      body: JSON.stringify(inventory),
      headers: {"Content-Type": "application/json"}
    });
    const result = await resp.json();
    if (result.ok) {
      document.getElementById('msg').innerText = "Inventory saved.";
      await fetchInventory();
    } else {
      document.getElementById('msg').innerText = "Failed to save: " + result.error;
    }
  } catch(err) {
    document.getElementById('msg').innerText = "Save error.";
  }
}

function renderInventory() {
  const tbody = document.getElementById('invBody');
  tbody.innerHTML = '';
  inventory.forEach((item, i) => {
    if(i === editingIndex) {
      tbody.innerHTML += `
        <tr>
          <td><input id="edit_id" value="${item.Item_ID || ''}"></td>
          <td><input id="edit_name" value="${item['Item/వస్తువు'] || ''}"></td>
          <td><input id="edit_qty" type="number" value="${item.Quantity || 0}"></td>
          <td><input id="edit_unit" value="${item.Unit_Type || ''}"></td>
          <td><input id="edit_mp" type="number" value="${item.Market_Price || 0}"></td>
          <td><input id="edit_mrp" type="number" value="${item.MRP || 0}"></td>
          <td><input id="edit_rl" type="number" value="${item.Reorder_Level || 0}"></td>
          <td>
            <button onclick="saveEdit(${i})">Save</button>
            <button onclick="cancelEdit()">Cancel</button>
          </td>
        </tr>`;
    } else {
      tbody.innerHTML += `
        <tr>
          <td>${item.Item_ID || ''}</td>
          <td>${item['Item/వస్తువు'] || ''}</td>
          <td>${item.Quantity || 0}</td>
          <td>${item.Unit_Type || ''}</td>
          <td>${item.Market_Price || 0}</td>
          <td>${item.MRP || 0}</td>
          <td>${item.Reorder_Level || 0}</td>
          <td>
            <button onclick="startEdit(${i})">Edit</button>
            <button onclick="deleteItem(${i})">Delete</button>
          </td>
        </tr>`;
    }
  });
}

function startEdit(i) {
  editingIndex = i;
  renderInventory();
}

function cancelEdit() {
  editingIndex = -1;
  renderInventory();
}

function saveEdit(i) {
  inventory[i] = {
    Item_ID: document.getElementById('edit_id').value,
    'Item/వస్తువు': document.getElementById('edit_name').value,
    Quantity: document.getElementById('edit_qty').value,
    Unit_Type: document.getElementById('edit_unit').value,
    Market_Price: document.getElementById('edit_mp').value,
    MRP: document.getElementById('edit_mrp').value,
    Reorder_Level: document.getElementById('edit_rl').value
  };
  editingIndex = -1;
  pushInventory();
}

function deleteItem(i) {
  if(confirm("Delete item?")) {
    inventory.splice(i, 1);
    pushInventory();
  }
}

function addNewItem() {
  if(editingIndex !== -1) return alert("Save or cancel edit first.");
  editingIndex = inventory.length;
  inventory.push({
    Item_ID: '',
    'Item/వస్తువు': '',
    Quantity: 0,
    Unit_Type: '',
    Market_Price: 0,
    MRP: 0,
    Reorder_Level: 0
  });
  renderInventory();
}

// Reorder WhatsApp and Email
function sendReorderWhatsApp() {
  const reorderItems = inventory.filter(i => Number(i.Quantity) <= Number(i.Reorder_Level));
  if(reorderItems.length === 0) return alert("No items to reorder.");
  const msg = reorderItems.map(i =>
    `${i.Item_ID} (${i['Item/వస్తువు']}): Qty ${i.Quantity}, RL ${i.Reorder_Level}`).join('\n');
  const url = `https://wa.me/9440163952?text=${encodeURIComponent("Reorder List:\n" + msg)}`;
  window.open(url, '_blank');
}

function sendReorderEmail() {
  const reorderItems = inventory.filter(i => Number(i.Quantity) <= Number(i.Reorder_Level));
  if(reorderItems.length === 0) return alert("No items to reorder.");
  const body = reorderItems.map(i =>
    `${i.Item_ID} (${i['Item/వస్తువు']}): Qty ${i.Quantity}, RL ${i.Reorder_Level}`).join('\n');
  const mailto = `mailto:jhansikirana10@gmail.com?subject=Reorder%20Needed&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

window.onload = fetchInventory;
