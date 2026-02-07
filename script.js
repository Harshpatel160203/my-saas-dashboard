// 1. DATA INITIALIZATION
let transactions = JSON.parse(localStorage.getItem('saas_data')) || [];
let currency = localStorage.getItem('saas_curr') || '$';
let myChart = null;

const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');

// 2. DOM ELEMENTS
const modal = document.getElementById('modal');
const tableBody = document.getElementById('table-body');

// 3. NAVIGATION LOGIC
document.getElementById('nav-dash').onclick = () => switchView('dash');
document.getElementById('nav-trans').onclick = () => switchView('trans');

function switchView(view) {
    if (view === 'dash') {
        document.getElementById('dash-view').style.display = 'block';
        document.getElementById('trans-view').style.display = 'none';
        document.getElementById('page-title').innerText = 'Overview';
        document.getElementById('nav-dash').classList.add('active');
        document.getElementById('nav-trans').classList.remove('active');
    } else {
        document.getElementById('dash-view').style.display = 'none';
        document.getElementById('trans-view').style.display = 'block';
        document.getElementById('page-title').innerText = 'Transactions';
        document.getElementById('nav-trans').classList.add('active');
        document.getElementById('nav-dash').classList.remove('active');
    }
}

// 4. THEME & CURRENCY
document.getElementById('theme-toggle').onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('saas_theme', target);
};

document.getElementById('currency-select').onchange = (e) => {
    currency = e.target.value;
    localStorage.setItem('saas_curr', currency);
    updateUI();
};

// 5. MODAL LOGIC
document.getElementById('add-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('cancel-btn').onclick = () => modal.style.display = 'none';

document.getElementById('save-btn').onclick = () => {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (desc && amount > 0) {
        transactions.push({ desc, amount, type });
        localStorage.setItem('saas_data', JSON.stringify(transactions));
        updateUI();
        modal.style.display = 'none';
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
    } else {
        alert("Please enter a valid description and amount!");
    }
};

if (searchInput) searchInput.oninput = () => updateUI();
if (filterType) filterType.onchange = () => updateUI();
// 6. CORE UPDATE FUNCTION
function updateUI() {
    if (!tableBody) return;
    
    // 1. Capture what the user is searching for
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedType = filterType ? filterType.value : "all";

    tableBody.innerHTML = '';
    let income = 0;
    let expense = 0;

    // 2. THE FILTER ENGINE: Create a temporary list that matches the search
    const filteredData = transactions.filter(t => {
        const matchesSearch = t.desc.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === 'all' || t.type === selectedType;
        return matchesSearch && matchesType;
    });

    // 3. SHOW FILTERED DATA: Only loop through the items that matched
    filteredData.forEach((t, i) => {
        tableBody.innerHTML += `
            <tr>
                <td>${t.desc}</td>
                <td style="color: ${t.type === 'income' ? '#27ae60' : '#e74c3c'}">${t.type.toUpperCase()}</td>
                <td>${currency}${t.amount}</td>
                <td><button onclick="deleteItem(${i})" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td>
            </tr>`;
    });

    // 4. TOTALS: We still calculate totals from the ORIGINAL 'transactions' array
    // so the dashboard cards don't change just because you're searching.
    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount; else expense += t.amount;
    });

    if (document.getElementById('total-income')) document.getElementById('total-income').innerText = `${currency}${income}`;
    if (document.getElementById('total-expenses')) document.getElementById('total-expenses').innerText = `${currency}${expense}`;
    if (document.getElementById('net-balance')) document.getElementById('net-balance').innerText = `${currency}${income - expense}`;

    renderChart(income, expense);
}

function deleteItem(index) {
    transactions.splice(index, 1);
    localStorage.setItem('saas_data', JSON.stringify(transactions));
    updateUI();
}

// 7. CHART LOGIC
function renderChart(inc, exp) {
    const canvas = document.getElementById('myChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{ data: [inc, exp], backgroundColor: ['#2ecc71', '#e74c3c'] }]
        },
        options: { maintainAspectRatio: false }
    });
}

// 8. EXPORT LOGIC
document.getElementById('export-btn').onclick = () => {
    let csv = "Item,Type,Amount\n";
    transactions.forEach(t => csv += `${t.desc},${t.type},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance_data.csv';
    a.click();
};

// INITIAL LOAD
const savedTheme = localStorage.getItem('saas_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('currency-select').value = currency;
updateUI();

