// --- 1. DATA & STATE ---
let transactions = JSON.parse(localStorage.getItem('saas_data')) || [];
let currency = localStorage.getItem('saas_curr') || '$';
let myChart = null;

// --- 2. ELEMENT SELECTORS ---
const dashView = document.getElementById('dash-view');
const transView = document.getElementById('trans-view');
const pageTitle = document.getElementById('page-title');
const modal = document.getElementById('modal');

// --- 3. NAVIGATION & THEME ---
document.getElementById('nav-dash').onclick = () => {
    dashView.style.display = 'block'; transView.style.display = 'none';
    pageTitle.innerText = "Overview";
    document.getElementById('nav-dash').classList.add('active');
    document.getElementById('nav-trans').classList.remove('active');
};

document.getElementById('nav-trans').onclick = () => {
    dashView.style.display = 'none'; transView.style.display = 'block';
    pageTitle.innerText = "Transactions";
    document.getElementById('nav-trans').classList.add('active');
    document.getElementById('nav-dash').classList.remove('active');
};

document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('saas_theme', isDark ? 'light' : 'dark');
};

// --- 4. CURRENCY & MODAL ---
document.getElementById('currency-select').onchange = (e) => {
    currency = e.target.value;
    localStorage.setItem('saas_curr', currency);
    updateUI();
};

document.getElementById('add-btn').onclick = () => modal.style.display = 'flex';
document.getElementById('cancel-btn').onclick = () => modal.style.display = 'none';

document.getElementById('save-btn').onclick = () => {
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (desc && amount) {
        transactions.push({ desc, amount, type });
        localStorage.setItem('saas_data', JSON.stringify(transactions));
        updateUI();
        modal.style.display = 'none';
        document.getElementById('desc').value = '';
        document.getElementById('amount').value = '';
    }
};

// --- 5. CORE LOGIC ---
function deleteItem(index) {
    transactions.splice(index, 1);
    localStorage.setItem('saas_data', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    let inc = 0, exp = 0;

    transactions.forEach((t, i) => {
        tbody.innerHTML += `<tr>
            <td>${t.desc}</td>
            <td style="color:${t.type==='income'?'#27ae60':'#e74c3c'}">${t.type.toUpperCase()}</td>
            <td>${currency}${t.amount}</td>
            <td><button onclick="deleteItem(${i})" style="color:red; cursor:pointer; border:none; background:none;">Delete</button></td>
        </tr>`;
        if (t.type === 'income') inc += t.amount; else exp += t.amount;
    });

    document.getElementById('total-income').innerText = `${currency}${inc}`;
    document.getElementById('total-expenses').innerText = `${currency}${exp}`;
    document.getElementById('net-balance').innerText = `${currency}${inc - exp}`;
    
    initChart(inc, exp);
}

function initChart(inc, exp) {
    const ctx = document.getElementById('myChart').getContext('2d');
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

// --- 6. INITIAL LOAD ---
const savedTheme = localStorage.getItem('saas_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('currency-select').value = currency;
updateUI();
