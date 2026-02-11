const SUPABASE_URL = 'https://voomevazcghifbehrrcw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvb21ldmF6Y2doaWZiZWhycmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzI0ODUsImV4cCI6MjA4NjIwODQ4NX0.LTbJJnd3GLtOCxnok9J-Kyg7TSgyccu-Un0Ag4OnQpE';

const supabase_client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let transactions = [];
let currency = '$'; 
let myChart = null;

// --- AUTHENTICATION ---
const authView = document.getElementById('auth-view');
const dashContainer = document.querySelector('.dashboard-container');

async function checkUser() {
    const { data: { user } } = await supabase_client.auth.getUser();
    if (user) {
        if (authView) authView.style.display = 'none';
        dashContainer.style.display = 'flex';
        fetchData();
    } else {
        if (authView) authView.style.display = 'flex';
        dashContainer.style.display = 'none';
    }
}

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase_client.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else checkUser();
};

document.getElementById('signup-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase_client.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for the confirmation link!");
};

document.getElementById('logout-btn').onclick = async () => {
    await supabase_client.auth.signOut();
    checkUser();
};

// --- DATA FETCHING ---
async function fetchData() {
    const { data: { user } } = await supabase_client.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase_client
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

    if (!error) {
        transactions = data || [];
        updateUI();
    }
}

// --- GLOBAL DELETE ---
window.deleteTransaction = async (id) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this?")) {
        const { error } = await supabase_client.from('transactions').delete().eq('id', id);
        if (error) console.error("Delete Error:", error.message);
        else fetchData();
    }
};

// --- UTILITIES ---
function getIcon(desc) {
    if (!desc) return '📝';
    const d = desc.toLowerCase();
    if (d.includes('food')) return '🍔';
    if (d.includes('salary')) return '💰';
    if (d.includes('rent')) return '🏠';
    if (d.includes('travel')) return '🚗';
    return '📝';
}

// --- CORE UI UPDATE (With Search & Filter) ---
function updateUI() {
    const tableBody = document.getElementById('table-body');
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;

    tableBody.innerHTML = '';
    let inc = 0, exp = 0;

    const filtered = transactions.filter(item => {
        const matchesSearch = item.description.toLowerCase().includes(searchQuery);
        const matchesFilter = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesFilter;
    });

    filtered.forEach(item => {
        const isInc = item.type === 'income';
        if (isInc) inc += item.amount; else exp += item.amount;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${getIcon(item.description)} ${item.description}</td>
            <td>${item.type}</td>
            <td style="color: ${isInc ? '#2ecc71' : '#e74c3c'}">
                ${isInc ? '+' : '-'}${currency}${item.amount.toFixed(2)}
            </td>
            <td>
                <button onclick="deleteTransaction(${item.id})" style="border:none; background:none; cursor:pointer;">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('total-inc').innerText = currency + inc.toFixed(2);
    document.getElementById('total-exp').innerText = currency + exp.toFixed(2);
    document.getElementById('balance').innerText = currency + (inc - exp).toFixed(2);

    updateBudgetBar(exp);
    renderChart(inc, exp);
}

// --- EXPORT TO CSV ---
document.getElementById('export-btn').onclick = () => {
    if (transactions.length === 0) return alert("No data to export!");
    let csv = "Description,Type,Amount,Date\n";
    transactions.forEach(t => {
        csv += `"${t.description}",${t.type},${t.amount},${new Date(t.created_at).toLocaleDateString()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack_report.csv';
    a.click();
};

// --- CHART & BUDGET ---
function renderChart(inc, exp) {
    const canvas = document.getElementById('myChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { 
            labels: ['Income', 'Expense'], 
            datasets: [{ data: [inc, exp], backgroundColor: ['#2ecc71', '#e74c3c'] }] 
        },
        options: { maintainAspectRatio: false }
    });
}

function updateBudgetBar(totalExp) {
    const limit = 2000;
    const bar = document.getElementById('budget-progress');
    const status = document.getElementById('budget-status');
    const percent = Math.min((totalExp / limit) * 100, 100);

    if(bar) {
        bar.style.width = percent + '%';
        status.innerText = `${currency}${totalExp} / ${currency}${limit}`;
        if (percent >= 100) bar.style.background = '#e74c3c';
        else if (percent > 75) bar.style.background = '#f1c40f';
        else bar.style.background = '#2ecc71';
    }
}

// --- MODAL & NAV ---
document.getElementById('add-btn').onclick = () => document.getElementById('modal').style.display = 'flex';
document.getElementById('cancel-btn').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('save-btn').onclick = async () => {
    const { data: { user } } = await supabase_client.auth.getUser();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (user && desc && amount > 0) {
        const { error } = await supabase_client.from('transactions').insert([{
            description: desc, amount, type, user_id: user.id
        }]);
        if (!error) {
            document.getElementById('modal').style.display = 'none';
            document.getElementById('desc').value = '';
            document.getElementById('amount').value = '';
            fetchData();
        }
    }
};

function switchView(view) {
    document.getElementById('dash-view').style.display = view === 'dash' ? 'block' : 'none';
    document.getElementById('trans-view').style.display = view === 'trans' ? 'block' : 'none';
    document.getElementById('nav-dash').classList.toggle('active', view === 'dash');
    document.getElementById('nav-trans').classList.toggle('active', view === 'trans');
}

// --- INITIALIZATION ---
document.getElementById('search-input').oninput = updateUI;
document.getElementById('filter-type').onchange = updateUI;

document.getElementById('nav-dash').onclick = () => switchView('dash');
document.getElementById('nav-trans').onclick = () => switchView('trans');

document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('saas_theme', newTheme);
    document.getElementById('theme-toggle').innerText = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
};

document.getElementById('currency-select').onchange = (e) => {
    currency = e.target.value;
    localStorage.setItem('saas_curr', currency);
    updateUI();
};

const savedTheme = localStorage.getItem('saas_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').innerText = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

const savedCurr = localStorage.getItem('saas_curr');
if (savedCurr) {
    currency = savedCurr;
    document.getElementById('currency-select').value = savedCurr;
}

checkUser();
