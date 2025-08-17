const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyWLIElS5csQoG0W6DYcA7SMLi71_9-fIqoXn1qiviYLSZeMWLaf4Ht0G7d10Qvmuevig/exec";

let inventory = [];

async function fetchInventory() {
  try {
    const resp = await fetch(SHEET_API_URL);
    inventory = await resp.json();
    populateReturnItems();
    document.getElementById('msg').innerText = '';
  } catch {
    document.getElementById('msg').innerText = 'Failed to load inventory.';
  }
}

function populateReturnItems() {
  let sel = document.getElementById('returnItem');
  sel.innerHTML = '';
  inventory.forEach((item, i) => {
    sel.innerHTML += `<option value="${i}">${item["Item/వస్తువు"]}</option>`;
  });
}

async function processReturn(e) {
  e.preventDefault();
  const idx = +document.getElementById('returnItem').value;
  const qty = +document.getElementById('returnQty').value;
  if (qty <= 0) {
    alert('Invalid quantity.');
    return;
  }
  inventory[idx].Quantity = (Number(inventory[idx].Quantity) + qty).toString();
  await pushInventory(inventory);
  alert('Item return processed and inventory updated.');
  document.getElementById('returnQty').value = 1;
  populateReturnItems();
}

async function pushInventory(data) {
  try {
    const resp = await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await resp.json();
    if(!result.ok) throw new Error(result.error);
  } catch(e) {
    alert("Error updating inventory: "+ e.message);
  }
}

document.getElementById('returnsForm').onsubmit = processReturn;
window.onload = fetchInventory;
