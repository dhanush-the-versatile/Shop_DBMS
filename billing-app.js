const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyWLIElS5csQoG0W6DYcA7SMLi71_9-fIqoXn1qiviYLSZeMWLaf4Ht0G7d10Qvmuevig/exec";

let inventory = [];
let bills = [];
let cart = [];

async function fetchInventory() {
  const resp = await fetch(SHEET_API_URL);
  inventory = await resp.json();
  populateBillItemsSelect();
  renderCart();
  document.getElementById('msg').innerText = '';
}

function populateBillItemsSelect() {
  const select = document.getElementById('billItem');
  select.innerHTML = '';
  inventory.forEach((item, i) => {
    select.innerHTML += `<option value="${i}">${item['Item/వస్తువు']} (Stock: ${item.Quantity})</option>`;
  });
}

function addToBill() {
  const idx = +document.getElementById('billItem').value;
  const qty = +document.getElementById('billQty').value;
  if (qty <= 0) {
    alert("Quantity must be > 0");
    return;
  }
  let item = inventory[idx];
  if (qty <= +item.Quantity) {
    let existing = cart.find(c => c.idx === idx);
    if (existing) existing.qty += qty;
    else cart.push({ idx, qty });
    renderCart();
  } else {
    alert("Insufficient stock");
  }
  document.getElementById('billQty').value = 1;
}

function renderCart() {
  const cartDiv = document.getElementById('cart');
  if (!cart.length) {
    cartDiv.innerHTML = 'Cart is empty.';
    return;
  }
  let html = '<table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th>Remove</th></tr>';
  let total = 0;
  cart.forEach((c, idx) => {
    let item = inventory[c.idx];
    let price = Number(item.MRP) || 0;
    let lineTotal = price * c.qty;
    total += lineTotal;
    html += `<tr>
      <td>${item['Item/వస్తువు']}</td>
      <td>${c.qty}</td>
      <td>₹${price}</td>
      <td>₹${lineTotal.toFixed(2)}</td>
      <td><button onclick="removeCartItem(${idx})">X</button></td>
    </tr>`;
  });
  html += `<tr><th colspan="3">Grand Total</th><th>₹${total.toFixed(2)}</th><th></th></tr></table>`;
  cartDiv.innerHTML = html;
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  renderCart();
}

async function finalizeBill() {
  if (!cart.length) {
    alert("Cart empty.");
    return;
  }
  // Update inventory quantities
  cart.forEach(c => {
    inventory[c.idx].Quantity = (Number(inventory[c.idx].Quantity) - c.qty).toString();
  });
  await pushInventory(inventory);

  // Save bills locally (extend here for Google Sheet Bills tab)
  bills.push({
    date: new Date().toLocaleString(),
    items: cart.map(c => {
      let item = inventory[c.idx];
      return {
        Item_ID: item.Item_ID,
        Item: item['Item/వస్తువు'],
        Qty: c.qty,
        Price: Number(item.MRP) || 0,
        Total: (Number(item.Market_MRP) || 0) * c.qty
      };
    }),
  });
  localStorage.setItem('bills', JSON.stringify(bills));

  alert("Bill completed successfully!");
  cart = [];
  renderCart();
  populateBillItemsSelect();
}

function clearBill() {
  cart = [];
  renderCart();
}

// Google Sheets push for updated inventory (PUT your pushInventory code here)
async function pushInventory(data) {
  try {
    const resp = await fetch(SHEET_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const res = await resp.json();
    if (!res.ok) throw new Error(res.error);
  } catch (e) {
    alert('Error saving inventory data: ' + e.message);
  }
}

// Initialize
window.onload = () => {
  bills = JSON.parse(localStorage.getItem('bills') || '[]');
  fetchInventory();
};
