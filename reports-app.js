function loadBills() {
  return JSON.parse(localStorage.getItem('bills') || '[]');
}

function showReports() {
  const bills = loadBills();
  if(bills.length === 0) {
    document.getElementById('reportContent').innerHTML = '<p>No bills yet!</p>';
    return;
  }
  let html = '<table><thead><tr><th>Date/Time</th><th>Items</th><th>Total</th></tr></thead><tbody>';
  bills.forEach(bill => {
    let items = bill.items.map(i => `${i.Item} (x${i.Qty}) @ ₹${i.Price} = ₹${i.Total}`).join(', ');
    let total = bill.items.reduce((a, c) => a + c.Total, 0);
    html += `<tr><td>${bill.date}</td><td>${items}</td><td>₹${total.toFixed(2)}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('reportContent').innerHTML = html;
}

function downloadCSV() {
  const bills = loadBills();
  let csv = 'Date,Item,Qty,Price,Total\n';
  bills.forEach(bill => {
    bill.items.forEach(item => {
      csv += `"${bill.date}","${item.Item}",${item.Qty},${item.Price},${item.Total}\n`;
    });
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'billing_report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Initialize
window.onload = showReports;
