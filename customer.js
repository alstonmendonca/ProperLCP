document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("addCustomerBtn")) {
        document.getElementById("addCustomerBtn").addEventListener("click", addCustomer);
    }
    fetchCustomers(); // Load customers on page load
});

// Fetch customers and populate the table
function fetchCustomers() {
    window.api.invoke('get-customers').then(customers => {
        const tableBody = document.getElementById("customerTableBody");
        tableBody.innerHTML = ''; // Clear table before updating

        customers.forEach(customer => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${customer.cid}</td>
                <td>${customer.cname}</td>
                <td>${customer.phone}</td>
                <td>${customer.address || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    }).catch(err => console.error("Error fetching customers:", err));
}

// Function to add a customer
function addCustomer() {
    const cname = prompt("Enter Customer Name:");
    if (!cname) return;

    const phone = prompt("Enter Customer Phone:");
    if (!phone) return;

    const address = prompt("Enter Customer Address (optional):");

    window.api.invoke('add-customer', { cname, phone, address }).then(() => {
        fetchCustomers(); // Refresh the table after adding a customer
    }).catch(err => console.error("Error adding customer:", err));
}
