// 1. Initialize Data from Storage
let transactions = JSON.parse(localStorage.getItem('my_data')) || [];

// 2. DOM Elements
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const tableBody = document.getElementById('table-body');

// 3. Open/Close Modal
addBtn.onclick = () => modal.style.display = 'flex';
cancelBtn.onclick = () => modal.style.display = 'none';

// 4. Save Transaction
saveBtn.onclick = () => {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (desc && amount) {
        transactions.push({ desc, amount, type });
        localStorage.setItem('my_data', JSON.stringify(transactions));
        updateUI();
        modal.style.display = 'none';
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
    }
};

// 5. Update UI & Chart
function updateUI() {
    tableBody.innerHTML = '';
    let income = 0;
    let expense = 0;

    // We add 'index' here to track which row is which
    transactions.forEach((t, index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${t.desc}</td>
                <td>${t.type}</td>
                <td>$${t.amount}</td>
                <td>
                    <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
                </td>
            </tr>`;
        
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });

    document.getElementById('total-income').innerText = `$${income}`;
    document.getElementById('total-expenses').innerText = `$${expense}`;
    document.getElementById('net-balance').innerText = `$${income - expense}`;
    
    renderChart(income, expense);
}

// The New Delete Function
function deleteTransaction(index) {
    // Remove 1 item at the specific index
    transactions.splice(index, 1); 
    
    // Save the new shortened list to LocalStorage
    localStorage.setItem('my_data', JSON.stringify(transactions));
    
    // Refresh the screen
    updateUI();
}

// 6. Chart.js Function
let myChart;
function renderChart(inc, exp) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart) myChart.destroy(); // Fix for chart overlap
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ['#27ae60', '#e74c3c']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Initial Load
updateUI();

// Sidebar Navigation Logic
const navDash = document.getElementById('nav-dash');
const navTrans = document.getElementById('nav-trans');
const dashView = document.getElementById('overview-view');
const transView = document.getElementById('transactions-view');
const pageTitle = document.getElementById('page-title');

navDash.onclick = () => {
    // Show Dashboard, Hide Transactions
    dashView.style.display = 'block';
    transView.style.display = 'none';
    pageTitle.innerText = "Overview";
    
    // Update active class for CSS
    navDash.classList.add('active');
    navTrans.classList.remove('active');
};

navTrans.onclick = () => {
    // Show Transactions, Hide Dashboard
    dashView.style.display = 'none';
    transView.style.display = 'block';
    pageTitle.innerText = "Transactions";
    
    // Update active class for CSS
    navTrans.classList.add('active');
    navDash.classList.remove('active');
};

