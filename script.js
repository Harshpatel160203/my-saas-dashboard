let transactions = JSON.parse(localStorage.getItem('saas_data')) || [];
let currency = localStorage.getItem('saas_curr') || '$';
let myChart = null;

// --- UTILITIES ---
function getIcon(desc) {
    const d = desc.toLowerCase();
    if (d.includes('food')) return '🍔';
    if (d.includes('salary')) return '💰';
    if (d.includes('rent')) return '🏠';
    if (d.includes('travel')) return '🚗';
    return '📝';
}

// --- NAVIGATION ---
document.getElementById('nav-dash').onclick = () => switchView('dash');
document.getElementById('nav-trans').onclick = () => switchView('trans');

function switchView(view) {
    document.getElementById('dash-view').style.display = view === 'dash' ? 'block' : 'none';
    document.getElementById('trans-view').style.display = view === 'trans' ? 'block' : 'none';
    document.getElementById('nav-dash').classList.toggle('active', view === 'dash');
    document.getElementById('nav-trans').classList.toggle('active', view === 'trans');
}

// --- THEME & CURRENCY ---
document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('saas_theme', isDark ? 'light' : 'dark');
};

document.getElementById('currency-select').onchange = (e) => {
    currency = e.target.value;
    localStorage.setItem('saas_curr', currency);
    updateUI();
};

// --- MODAL ---
document.getElementById('add-btn').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('cancel-btn').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('save-btn').onclick = () => {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (desc && amount > 0) {
        transactions.push({ desc, amount, type });
        localStorage.setItem('saas_data', JSON.stringify(transactions));
        updateUI();
        document.getElementById('modal').style.display = 'none';
        document.getElementById('desc').value = ''; document.getElementById('amount').value = '';
    }
};

// --- CORE UI UPDATE ---
function updateUI() {
    const tbody = document.getElementById('table-body');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    
    tbody.innerHTML = '';
    let inc = 0, exp = 0;

    // Filter Logic
    const filtered = transactions.filter(t => {
        const matchesSearch = t.desc.toLowerCase().includes(searchTerm);
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    filtered.forEach((t, i) => {
        tbody.innerHTML += `<tr>
            <td>${getIcon(t.desc)} ${t.desc}</td>
            <td style="color:${t.type==='income'?'#2ecc71':'#e74c3c'}">${t.type.toUpperCase()}</td>
            <td>${currency}${t.amount}</td>
            <td><button onclick="deleteItem(${i})" style="cursor:pointer; border:none; background:none;">❌</button></td>
        </tr>`;
    });

    // Totals & Budget
    transactions.forEach(t => { if (t.type === 'income') inc += t.amount; else exp += t.amount; });
    
    document.getElementById('total-income').innerText = `${currency}${inc}`;
    document.getElementById('total-expenses').innerText = `${currency}${exp}`;
    document.getElementById('net-balance').innerText = `${currency}${inc - exp}`;

    updateBudgetBar(exp);
    renderChart(inc, exp);
}

function updateBudgetBar(totalExp) {
    const limit = 2000;
    const bar = document.getElementById('budget-progress');
    const status = document.getElementById('budget-status');
    const warning = document.getElementById('budget-warning');
    const percent = Math.min((totalExp / limit) * 100, 100);

    bar.style.width = percent + '%';
    status.innerText = `${currency}${totalExp} / ${currency}${limit}`;

    // Toggle CSS Classes
    bar.classList.remove('bg-green', 'bg-yellow', 'bg-red');
    if (percent >= 100) { bar.classList.add('bg-red'); warning.style.display = 'block'; }
    else if (percent > 75) { bar.classList.add('bg-yellow'); warning.style.display = 'none'; }
    else { bar.classList.add('bg-green'); warning.style.display = 'none'; }
}

function deleteItem(index) {
    transactions.splice(index, 1);
    localStorage.setItem('saas_data', JSON.stringify(transactions));
    updateUI();
}

// --- EXPORT & CHART ---
document.getElementById('export-btn').onclick = () => {
    let csv = "Item,Type,Amount\n";
    transactions.forEach(t => csv += `${t.desc},${t.type},${t.amount}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.csv';
    a.click();
};

function renderChart(inc, exp) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Income', 'Expense'], datasets: [{ data: [inc, exp], backgroundColor: ['#2ecc71', '#e74c3c'] }] },
        options: { maintainAspectRatio: false }
    });
}

// INIT
document.getElementById('search-input').oninput = updateUI;
document.getElementById('filter-type').onchange = updateUI;
const savedTheme = localStorage.getItem('saas_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
updateUI();
