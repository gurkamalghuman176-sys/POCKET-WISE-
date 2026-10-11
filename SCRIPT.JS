/* ==========================================
   PocketWise - Vanilla JavaScript Application Logic
   ========================================== */

// --- Application State & Default Data ---
const DEFAULT_BUDGET = 10000;
const TOTAL_DAYS = 30;

let appState = {
    budget: DEFAULT_BUDGET,
    transactions: [
        { id: "tx-1", type: "income", amount: 10000, description: "Monthly Allowance", category: "Other", date: "2026-10-01" },
        { id: "tx-2", type: "expense", amount: 1500, description: "Grocery & Canteen", category: "Food", date: "2026-10-02" },
        { id: "tx-3", type: "expense", amount: 400, description: "Metro Pass", category: "Transport", date: "2026-10-03" },
        { id: "tx-4", type: "expense", amount: 1200, description: "Textbooks & Notes", category: "Education", date: "2026-10-05" },
        { id: "tx-5", type: "expense", amount: 799, description: "OTT Subscription", category: "Entertainment", date: "2026-10-07" }
    ],
    goals: [
        { id: "goal-1", name: "New Sneakers", target: 3500, current: 1500, deadline: "2026-10-30" },
        { id: "goal-2", name: "Concert Ticket", target: 2000, current: 800, deadline: "2026-10-25" }
    ],
    subscriptions: [
        { id: "sub-1", name: "Spotify Student", category: "Entertainment", amount: 59, cycle: "Monthly", nextDate: "2026-10-20" },
        { id: "sub-2", name: "Mobile Recharge", category: "Bills", amount: 299, cycle: "Monthly", nextDate: "2026-10-18" }
    ]
};

// Chart instances
let dashCategoryChartInstance = null;
let insightsCategoryChartInstance = null;

// --- Initialization on DOM Load ---
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupEventListeners();
    setDefaultDates();
    renderAll();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- LocalStorage Persistence ---
function saveData() {
    localStorage.setItem("pocketwise_state", JSON.stringify(appState));
}

function loadData() {
    const saved = localStorage.getItem("pocketwise_state");
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }
}

// --- Navigation Logic ---
function setupNavigation() {
    const navButtons = document.querySelectorAll(".nav-item");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetView = btn.getAttribute("data-target");
            switchView(targetView);
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("data-target") === viewId) {
            item.classList.add("active");
        }
    });

    document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
    });

    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.add("active");
        
        // Update header title
        const titles = {
            "dashboard-view": "Dashboard",
            "transactions-view": "Transactions",
            "budget-view": "Budget Planner",
            "savings-view": "Savings Goals",
            "subscriptions-view": "Subscriptions",
            "simulator-view": "Financial Decision Simulator",
            "insights-view": "AI Financial Insights"
        };
        document.getElementById("page-title").textContent = titles[viewId] || "Dashboard";
        
        // Re-render charts if insights or dashboard are opened
        if (viewId === "dashboard-view" || viewId === "insights-view") {
            renderCharts();
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Quick Add Transaction Button
    document.getElementById("quick-add-btn").addEventListener("click", () => openTransactionModal());
    
    // Reset Demo Data
    document.getElementById("reset-data-btn").addEventListener("click", () => {
        if (confirm("Reset all data back to default sample records?")) {
            localStorage.removeItem("pocketwise_state");
            location.reload();
        }
    });

    // Transaction Form Submission
    document.getElementById("transaction-form").addEventListener("submit", handleTransactionSubmit);
    
    // Budget Input Update
    document.getElementById("update-budget-btn").addEventListener("click", () => {
        const val = parseFloat(document.getElementById("monthly-budget-input").value);
        if (isNaN(val) || val <= 0) {
            alert("Please enter a valid budget amount.");
            return;
        }
        appState.budget = val;
        saveData();
        renderAll();
        alert("Monthly budget updated successfully!");
    });

    // Goal Form Submission
    document.getElementById("goal-form").addEventListener("submit", handleGoalSubmit);

    // Subscription Form Submission
    document.getElementById("sub-form").addEventListener("submit", handleSubSubmit);

    // Deposit Form Submission
    document.getElementById("deposit-form").addEventListener("submit", handleDepositSubmit);

    // Simulator Form Submission
    document.getElementById("simulator-form").addEventListener("submit", handleSimulation);

    // Filters for Transactions
    document.getElementById("tx-search").addEventListener("input", renderTransactionsTable);
    document.getElementById("tx-category-filter").addEventListener("change", renderTransactionsTable);
    document.getElementById("tx-type-filter").addEventListener("change", renderTransactionsTable);
}

function setDefaultDates() {
    const today = new Date().toISOString().split("T")[0];
    const dateInputs = ["tx-date", "goal-deadline", "sub-date"];
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });
    
    // Set current date display in header
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById("current-date-display").textContent = new Date().toLocaleDateString('en-IN', options);
    
    // Set budget input value
    document.getElementById("monthly-budget-input").value = appState.budget;
}

// --- Core Financial Calculations ---
function calculateFinancials() {
    let totalIncome = 0;
    let totalExpenses = 0;

    appState.transactions.forEach(tx => {
        if (tx.type === "income") {
            totalIncome += tx.amount;
        } else {
            totalExpenses += tx.amount;
        }
    });

    // Available Balance = Base Budget + Total Income - Total Expenses
    const availableBalance = appState.budget + totalIncome - totalExpenses;
    
    // Days remaining estimation (assume current day of month)
    const todayDate = new Date().getDate();
    const daysRemaining = Math.max(1, TOTAL_DAYS - todayDate);
    const dailyAllowance = Math.round(availableBalance / daysRemaining);

    // Forecast month-end balance
    const avgDailySpend = totalExpenses / Math.max(1, todayDate);
    const projectedExpenses = avgDailySpend * TOTAL_DAYS;
    const projectedBalance = Math.round(appState.budget + totalIncome - projectedExpenses);

    // Financial Health Score Calculation (0 - 100)
    let healthScore = 100;
    const expenseRatio = totalExpenses / appState.budget;
    if (expenseRatio > 0.9) healthScore -= 40;
    else if (expenseRatio > 0.75) healthScore -= 25;
    else if (expenseRatio > 0.5) healthScore -= 10;

    if (dailyAllowance < 100) healthScore -= 30;
    else if (dailyAllowance < 250) healthScore -= 15;

    healthScore = Math.max(10, Math.min(100, healthScore));

    // Risk Indicator
    let riskLevel = "low";
    let riskText = "Low Risk";
    if (healthScore < 50 || dailyAllowance < 100) {
        riskLevel = "high";
        riskText = "High Risk";
    } else if (healthScore < 75 || dailyAllowance < 250) {
        riskLevel = "medium";
        riskText = "Medium Risk";
    }

    return {
        totalIncome,
        totalExpenses,
        availableBalance,
        daysRemaining,
        dailyAllowance: Math.max(0, dailyAllowance),
        projectedBalance,
        healthScore,
        riskLevel,
        riskText
    };
}

// --- Render All UI Components ---
function renderAll() {
    renderDashboardMetrics();
    renderTransactionsTable();
    renderDashboardRecentTransactions();
    renderBudgetPlanner();
    renderSavingsGoals();
    renderSubscriptions();
    renderAIInsights();
    renderCharts();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Dashboard Rendering ---
function renderDashboardMetrics() {
    const fin = calculateFinancials();

    document.getElementById("dash-balance").textContent = formatINR(fin.availableBalance);
    document.getElementById("dash-income").textContent = formatINR(fin.totalIncome);
    document.getElementById("dash-expenses").textContent = formatINR(fin.totalExpenses);
    document.getElementById("dash-daily-allowance").textContent = `${formatINR(fin.dailyAllowance)} /day`;
    
    const incomeCount = appState.transactions.filter(t => t.type === 'income').length;
    const expenseCount = appState.transactions.filter(t => t.type === 'expense').length;
    document.getElementById("income-count").textContent = `${incomeCount} transactions`;
    document.getElementById("expense-count").textContent = `${expenseCount} transactions`;
    document.getElementById("days-left-text").textContent = `${fin.daysRemaining} days remaining`;

    document.getElementById("health-score-val").textContent = fin.healthScore;
    document.getElementById("dash-forecast").textContent = formatINR(fin.projectedBalance);

    const riskBadge = document.getElementById("risk-badge");
    riskBadge.className = `badge risk-${fin.riskLevel}`;
    riskBadge.textContent = fin.riskText;

    const feedbackEl = document.getElementById("health-feedback");
    if (fin.riskLevel === "high") {
        feedbackEl.textContent = "Warning: Your spending rate is too high. Cut down on non-essential shopping and entertainment!";
    } else if (fin.riskLevel === "medium") {
        feedbackEl.textContent = "Caution: You are approaching your budget limits. Monitor your daily allowance closely.";
    } else {
        feedbackEl.textContent = "Great job! Your spending is well within safe limits for a ₹10,000 budget.";
    }

    // Top Goal Preview
    const topGoalContainer = document.getElementById("dash-top-goal");
    if (appState.goals.length > 0) {
        const goal = appState.goals[0];
        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
        topGoalContainer.innerHTML = `
            <div class="goal-card-header">
                <h4>${goal.name}</h4>
                <span>${pct}%</span>
            </div>
            <div class="progress-bar-bg mt-20">
                <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="goal-stats mt-20">
                <span>Saved: <strong>${formatINR(goal.current)}</strong></span>
                <span>Target: <strong>${formatINR(goal.target)}</strong></span>
            </div>
        `;
    } else {
        topGoalContainer.innerHTML = `<p class="text-muted">No active savings goals set.</p>`;
    }
}

function renderDashboardRecentTransactions() {
    const tbody = document.getElementById("dash-recent-transactions");
    const recent = [...appState.transactions].reverse().slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No transactions found.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(tx => `
        <tr>
            <td>
                <strong>${tx.description}</strong><br>
                <small class="text-muted">${tx.category} • ${tx.date}</small>
            </td>
            <td class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'} text-right">
                ${tx.type === 'income' ? '+' : '-'}${formatINR(tx.amount)}
            </td>
        </tr>
    `).join("");
}

// --- Transactions Management ---
function renderTransactionsTable() {
    const search = document.getElementById("tx-search").value.toLowerCase();
    const catFilter = document.getElementById("tx-category-filter").value;
    const typeFilter = document.getElementById("tx-type-filter").value;

    const filtered = appState.transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(search) || tx.category.toLowerCase().includes(search);
        const matchesCat = catFilter === "all" || tx.category === catFilter;
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        return matchesSearch && matchesCat && matchesType;
    });

    const tbody = document.getElementById("full-transactions-list");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No matching transactions found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.reverse().map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td><strong>${tx.description}</strong></td>
            <td><span class="badge risk-low">${tx.category}</span></td>
            <td><span class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">${tx.type.toUpperCase()}</span></td>
            <td class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">${tx.type === 'income' ? '+' : '-'}${formatINR(tx.amount)}</td>
            <td>
                <button class="action-icon-btn" onclick="editTransaction('${tx.id}')"><i data-lucide="edit-3"></i></button>
                <button class="action-icon-btn delete" onclick="deleteTransaction('${tx.id}')"><i data-lucide="trash-2"></i></button>
            </td>
        </tr>
    `).join("");

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function openTransactionModal(editId = null) {
    document.getElementById("transaction-modal").classList.add("active");
    const titleEl = document.getElementById("tx-modal-title");
    const form = document.getElementById("transaction-form");
    form.reset();
    document.getElementById("tx-edit-id").value = "";
    setDefaultDates();

    if (editId) {
        titleEl.textContent = "Edit Transaction";
        const tx = appState.transactions.find(t => t.id === editId);
        if (tx) {
            document.getElementById("tx-edit-id").value = tx.id;
            document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
            document.getElementById("tx-amount").value = tx.amount;
            document.getElementById("tx-desc").value = tx.description;
            document.getElementById("tx-cat").value = tx.category;
            document.getElementById("tx-date").value = tx.date;
        }
    } else {
        titleEl.textContent = "Add Transaction";
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById("tx-edit-id").value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const amount = parseFloat(document.getElementById("tx-amount").value);
    const description = document.getElementById("tx-desc").value;
    const category = document.getElementById("tx-cat").value;
    const date = document.getElementById("tx-date").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (editId) {
        const index = appState.transactions.findIndex(t => t.id === editId);
        if (index !== -1) {
            appState.transactions[index] = { id: editId, type, amount, description, category, date };
        }
    } else {
        const newTx = {
            id: 'tx-' + Date.now(),
            type,
            amount,
            description,
            category,
            date
        };
        appState.transactions.push(newTx);
    }

    saveData();
    renderAll();
    closeModal("transaction-modal");
}

function editTransaction(id) {
    openTransactionModal(id);
}

function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        appState.transactions = appState.transactions.filter(t => t.id !== id);
        saveData();
        renderAll();
    }
}

// --- Budget Planner Rendering ---
function renderBudgetPlanner() {
    const container = document.getElementById("category-budget-bars");
    const categories = ["Food", "Transport", "Education", "Shopping", "Entertainment", "Bills", "Other"];
    
    // Allocate estimated budget per category for visualization
    const categoryCeilings = {
        Food: 3000,
        Transport: 1000,
        Education: 2000,
        Shopping: 1500,
        Entertainment: 1000,
        Bills: 1000,
        Other: 500
    };

    const spentByCategory = {};
    categories.forEach(cat => spentByCategory[cat] = 0);

    appState.transactions.forEach(tx => {
        if (tx.type === "expense" && spentByCategory[tx.category] !== undefined) {
            spentByCategory[tx.category] += tx.amount;
        }
    });

    container.innerHTML = categories.map(cat => {
        const spent = spentByCategory[cat];
        const ceiling = categoryCeilings[cat];
        const pct = Math.min(100, Math.round((spent / ceiling) * 100));
        let fillClass = "";
        if (pct > 90) fillClass = "danger";
        else if (pct > 75) fillClass = "warning";

        return `
            <div class="category-bar-item">
                <div class="category-bar-meta">
                    <span>${cat}</span>
                    <span>${formatINR(spent)} / ${formatINR(ceiling)} (${pct}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${fillClass}" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

// --- Savings Goals Management ---
function renderSavingsGoals() {
    const container = document.getElementById("savings-goals-container");
    if (appState.goals.length === 0) {
        container.innerHTML = `<p class="text-muted">No savings goals created yet.</p>`;
        return;
    }

    container.innerHTML = appState.goals.map(goal => {
        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const remaining = Math.max(0, goal.target - goal.current);
        return `
            <div class="goal-card">
                <div class="goal-card-header">
                    <h4>${goal.name}</h4>
                    <span class="badge risk-low">Deadline: ${goal.deadline}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
                <div class="goal-stats">
                    <span>Saved: <strong>${formatINR(goal.current)}</strong></span>
                    <span>Target: <strong>${formatINR(goal.target)}</strong></span>
                </div>
                <div class="goal-stats">
                    <span>Remaining: <strong>${formatINR(remaining)}</strong></span>
                    <span>${pct}% Complete</span>
                </div>
                <button class="btn-secondary w-full mt-20" onclick="openDepositModal('${goal.id}')">
                    <i data-lucide="plus-circle"></i> Add Funds
                </button>
            </div>
        `;
    }).join("");

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function openGoalModal() {
    document.getElementById("goal-form").reset();
    document.getElementById("goal-modal").classList.add("active");
    setDefaultDates();
}

function handleGoalSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("goal-name").value;
    const target = parseFloat(document.getElementById("goal-target").value);
    const deadline = document.getElementById("goal-deadline").value;

    if (isNaN(target) || target <= 0) {
        alert("Please enter a valid target amount.");
        return;
    }

    const newGoal = {
        id: 'goal-' + Date.now(),
        name,
        target,
        current: 0,
        deadline
    };

    appState.goals.push(newGoal);
    saveData();
    renderAll();
    closeModal("goal-modal");
}

function openDepositModal(goalId) {
    document.getElementById("deposit-form").reset();
    document.getElementById("deposit-goal-id").value = goalId;
    const goal = appState.goals.find(g => g.id === goalId);
    if (goal) {
        document.getElementById("deposit-goal-title").textContent = `Add Funds to "${goal.name}"`;
    }
    document.getElementById("deposit-modal").classList.add("active");
}

function handleDepositSubmit(e) {
    e.preventDefault();
    const goalId = document.getElementById("deposit-goal-id").value;
    const amount = parseFloat(document.getElementById("deposit-amount").value);

    const goal = appState.goals.find(g => g.id === goalId);
    if (goal && !isNaN(amount) && amount > 0) {
        goal.current += amount;
        
        // Also record as an expense transaction for realistic tracking
        appState.transactions.push({
            id: 'tx-' + Date.now(),
            type: 'expense',
            amount: amount,
            description: `Savings Deposit: ${goal.name}`,
            category: 'Other',
            date: new Date().toISOString().split("T")[0]
        });

        saveData();
        renderAll();
        closeModal("deposit-modal");
    }
}

// --- Subscriptions Management ---
function renderSubscriptions() {
    const tbody = document.getElementById("subscriptions-list");
    if (appState.subscriptions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No recurring subscriptions added.</td></tr>`;
        return;
    }

    tbody.innerHTML = appState.subscriptions.map(sub => `
        <tr>
            <td><strong>${sub.name}</strong></td>
            <td><span class="badge risk-low">${sub.category}</span></td>
            <td>${formatINR(sub.amount)}</td>
            <td>${sub.cycle}</td>
            <td>${sub.nextDate}</td>
            <td>
                <button class="action-icon-btn delete" onclick="deleteSubscription('${sub.id}')"><i data-lucide="trash-2"></i></button>
            </td>
        </tr>
    `).join("");

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function openSubModal() {
    document.getElementById("sub-form").reset();
    document.getElementById("sub-modal").classList.add("active");
    setDefaultDates();
}

function handleSubSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("sub-name").value;
    const amount = parseFloat(document.getElementById("sub-amount").value);
    const category = document.getElementById("sub-cat").value;
    const nextDate = document.getElementById("sub-date").value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const newSub = {
        id: 'sub-' + Date.now(),
        name,
        amount,
        category,
        cycle: "Monthly",
        nextDate
    };

    appState.subscriptions.push(newSub);
    saveData();
    renderAll();
    closeModal("sub-modal");
}

function deleteSubscription(id) {
    if (confirm("Remove this subscription?")) {
        appState.subscriptions = appState.subscriptions.filter(s => s.id !== id);
        saveData();
        renderAll();
    }
}

// --- Financial Decision Simulator ---
function handleSimulation(e) {
    e.preventDefault();
    const itemName = document.getElementById("sim-item").value;
    const itemAmount = parseFloat(document.getElementById("sim-amount").value);
    const itemCategory = document.getElementById("sim-category").value;

    if (isNaN(itemAmount) || itemAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const fin = calculateFinancials();
    const projectedBalanceAfter = fin.availableBalance - itemAmount;
    const daysLeft = fin.daysRemaining;
    const newDailyAllowance = Math.max(0, Math.round(projectedBalanceAfter / daysLeft));

    let riskLevel = "low";
    let riskBadgeClass = "risk-low";
    let riskText = "Safe to Buy";
    let advice = "This purchase fits comfortably within your remaining budget.";

    if (projectedBalanceAfter < 0) {
        riskLevel = "high";
        riskBadgeClass = "risk-high";
        riskText = "Unaffordable / Critical Risk";
        advice = "Warning: This purchase will push your balance into negative territory! You cannot afford this without extra income.";
    } else if (newDailyAllowance < 100) {
        riskLevel = "high";
        riskBadgeClass = "risk-high";
        riskText = "High Risk";
        advice = "Warning: Buying this will drop your daily allowance below ₹100/day, making food and travel difficult.";
    } else if (newDailyAllowance < 250) {
        riskLevel = "medium";
        riskBadgeClass = "risk-medium";
        riskText = "Moderate Risk";
        advice = "Caution: This will significantly lower your daily allowance for the rest of the month.";
    }

    const resultBox = document.getElementById("simulator-result-box");
    resultBox.innerHTML = `
        <div class="simulation-card-result">
            <div class="card-header">
                <h3>Simulation: ${itemName}</h3>
                <span class="badge ${riskBadgeClass}">${riskText}</span>
            </div>
            <div class="simulation-metric-row">
                <span>Purchase Cost:</span>
                <strong>${formatINR(itemAmount)}</strong>
            </div>
            <div class="simulation-metric-row">
                <span>Current Available Balance:</span>
                <span>${formatINR(fin.availableBalance)}</span>
            </div>
            <div class="simulation-metric-row">
                <span>Projected Balance After Purchase:</span>
                <strong class="${projectedBalanceAfter < 0 ? 'amount-expense' : ''}">${formatINR(projectedBalanceAfter)}</strong>
            </div>
            <div class="simulation-metric-row">
                <span>New Daily Allowance:</span>
                <strong>${formatINR(newDailyAllowance)} /day</strong>
            </div>
            <div class="recommendation-item mt-20">
                <i data-lucide="info"></i>
                <p><strong>AI Recommendation:</strong> ${advice}</p>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 16px;">
                <button class="btn-primary w-full" onclick="confirmSimulatedPurchase('${itemName}', ${itemAmount}, '${itemCategory}')">
                    Confirm & Make Purchase
                </button>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function confirmSimulatedPurchase(name, amount, category) {
    appState.transactions.push({
        id: 'tx-' + Date.now(),
        type: 'expense',
        amount: amount,
        description: name,
        category: category,
        date: new Date().toISOString().split("T")[0]
    });

    saveData();
    renderAll();
    alert(`Successfully recorded purchase of ${formatINR(amount)} for "${name}"!`);
    switchView('dashboard-view');
}

// --- AI Insights & Recommendations ---
function renderAIInsights() {
    const list = document.getElementById("ai-recommendations-list");
    const fin = calculateFinancials();

    // Find highest spending category
    const catTotals = {};
    appState.transactions.forEach(t => {
        if (t.type === 'expense') {
            catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        }
    });

    let highestCat = "None";
    let highestAmount = 0;
    for (const [cat, amt] of Object.entries(catTotals)) {
        if (amt > highestAmount) {
            highestAmount = amt;
            highestCat = cat;
        }
    }

    const tips = [
        {
            icon: "trending-down",
            text: `Your highest spending category is <strong>${highestCat}</strong> (${formatINR(highestAmount)}). Try reducing non-essential orders in this category by 20% next week.`
        },
        {
            icon: "calendar",
            text: `You have ${fin.daysRemaining} days left in the month with a daily allowance of <strong>${formatINR(fin.dailyAllowance)}/day</strong>. Stick to this ceiling to avoid month-end shortages.`
        },
        {
            icon: "piggy-bank",
            text: `Automating small daily savings of ₹50 towards your active goals can help you achieve them 15% faster.`
        }
    ];

    list.innerHTML = tips.map(tip => `
        <div class="recommendation-item">
            <i data-lucide="${tip.icon}"></i>
            <p>${tip.text}</p>
        </div>
    `).join("");

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Chart.js Integration ---
function renderCharts() {
    const categories = ["Food", "Transport", "Education", "Shopping", "Entertainment", "Bills", "Other"];
    const catTotals = categories.map(cat => {
        return appState.transactions
            .filter(t => t.type === 'expense' && t.category === cat)
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: catTotals,
                backgroundColor: [
                    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } }
                }
            }
        }
    };

    // Dashboard mini chart
    const dashCtx = document.getElementById("dashCategoryChart");
    if (dashCtx) {
        if (dashCategoryChartInstance) dashCategoryChartInstance.destroy();
        dashCategoryChartInstance = new Chart(dashCtx, chartConfig);
    }

    // Insights chart
    const insightsCtx = document.getElementById("insightsCategoryChart");
    if (insightsCtx) {
        if (insightsCategoryChartInstance) insightsCategoryChartInstance.destroy();
        insightsCategoryChartInstance = new Chart(insightsCtx, {
            ...chartConfig,
            type: 'bar',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { family: 'Plus Jakarta Sans' } } },
                    x: { ticks: { font: { family: 'Plus Jakarta Sans' } } }
                }
            }
        });
    }
}

// --- Utility Functions ---
function formatINR(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// Close modal when clicking outside content
window.addEventListener("click", (e) => {
    document.querySelectorAll(".modal").forEach(modal => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });
});