// Security redirect if not logged in
if (!localStorage.getItem("isLogged")) {
  location.href = "index.html";
}

function logout() {
  localStorage.removeItem("isLogged");
  location.href = "index.html";
}

// Navigation placeholder (expand billing, returns, reports later)
function showSection(sectionId) {
  ["billingSection", "returnsSection", "reportsSection"].forEach(id => {
    document.getElementById(id).style.display = id === sectionId ? "block" : "none";
  });
}
