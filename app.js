// API Configuration
const GEMINI_API_KEY = 'AIzaSyDi5Qc1l-zRWsB9oSpgGpnH_9WUvesScDQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Supabase Configuration
const SUPABASE_URL = 'https://kdqwwyvfmweinmmmdand.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcXd3eXZmbXdlaW5tbW1kYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTUxMzUsImV4cCI6MjA3MDY3MTEzNX0.t-XnQMzLERZcRT5IriILC3yNNp_56VPFAvsLy1tWzRs';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.log('Supabase not available, using fallback');
    supabase = null;
}

// Sample Data
const sampleStocks = {
    "AAPL": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "price": 185.92,
        "change": 2.34,
        "changePercent": 1.28,
        "volume": 45234567,
        "marketCap": 2890000000000,
        "pe": 28.5,
        "eps": 6.52,
        "dividend": 0.96,
        "yield": 0.52,
        "sector": "Technology",
        "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
    },
    "MSFT": {
        "symbol": "MSFT",
        "name": "Microsoft Corporation",
        "price": 378.45,
        "change": -3.67,
        "changePercent": -0.96,
        "volume": 28456789,
        "marketCap": 2810000000000,
        "pe": 32.1,
        "eps": 11.79,
        "dividend": 3.00,
        "yield": 0.79,
        "sector": "Technology",
        "description": "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide."
    },
    "GOOGL": {
        "symbol": "GOOGL",
        "name": "Alphabet Inc.",
        "price": 142.37,
        "change": 1.89,
        "changePercent": 1.35,
        "volume": 19876543,
        "marketCap": 1780000000000,
        "pe": 25.8,
        "eps": 5.52,
        "dividend": 0.00,
        "yield": 0.00,
        "sector": "Technology",
        "description": "Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America."
    },
    "TSLA": {
        "symbol": "TSLA",
        "name": "Tesla, Inc.",
        "price": 248.42,
        "change": 8.95,
        "changePercent": 3.74,
        "volume": 67890123,
        "marketCap": 789000000000,
        "pe": 65.4,
        "eps": 3.80,
        "dividend": 0.00,
        "yield": 0.00,
        "sector": "Consumer Discretionary",
        "description": "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems."
    },
    "NVDA": {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "price": 456.78,
        "change": 12.45,
        "changePercent": 2.81,
        "volume": 34567890,
        "marketCap": 1120000000000,
        "pe": 58.9,
        "eps": 7.75,
        "dividend": 0.16,
        "yield": 0.04,
        "sector": "Technology",
        "description": "NVIDIA Corporation operates as a computing company in the United States and internationally."
    }
};

const sampleNews = [
    {
        "title": "Apple Reports Strong Q4 Earnings Beat",
        "content": "Apple Inc. exceeded analyst expectations with strong iPhone sales driving revenue growth.",
        "sentiment": "positive",
        "source": "Financial Times",
        "timestamp": "2025-01-15T10:30:00Z",
        "relatedStocks": ["AAPL"]
    },
    {
        "title": "Tech Stocks Rally on AI Optimism",
        "content": "Technology stocks continue their upward momentum as investors remain bullish on AI developments.",
        "sentiment": "positive", 
        "source": "Reuters",
        "timestamp": "2025-01-15T09:15:00Z",
        "relatedStocks": ["AAPL", "MSFT", "GOOGL", "NVDA"]
    },
    {
        "title": "Tesla Delivers Record Q4 Vehicle Numbers",
        "content": "Tesla announces record quarterly deliveries beating analyst estimates by 5%.",
        "sentiment": "positive",
        "source": "Bloomberg",
        "timestamp": "2025-01-14T16:45:00Z",
        "relatedStocks": ["TSLA"]
    }
];

// Global State
let currentUser = null;
let userPortfolio = [];
let isLoggedIn = false;

// Utility Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

function formatMarketCap(value) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return formatCurrency(value);
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Gemini AI Functions
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API Error:', error);
        return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
}

async function analyzeStock(symbol) {
    const stock = sampleStocks[symbol.toUpperCase()];
    if (!stock) return 'Stock not found in our database.';
    
    const prompt = `Analyze the stock ${stock.symbol} (${stock.name}) with current price $${stock.price}, P/E ratio ${stock.pe}, and recent performance change of ${stock.changePercent}%. The company is in the ${stock.sector} sector. Market cap is $${stock.marketCap}. Provide investment recommendations, technical analysis insights, and risk assessment in a professional but accessible tone. Keep the response concise but comprehensive.`;
    
    return await callGeminiAPI(prompt);
}

async function getPortfolioAdvice(portfolio) {
    if (!portfolio || portfolio.length === 0) {
        return 'Your portfolio is empty. Consider starting with diversified index funds or well-established companies across different sectors.';
    }
    
    const portfolioSummary = portfolio.map(holding => {
        const stock = sampleStocks[holding.symbol];
        return `${holding.symbol}: ${holding.quantity} shares at $${stock?.price || holding.purchasePrice}`;
    }).join(', ');
    
    const prompt = `Review this investment portfolio and provide optimization suggestions: ${portfolioSummary}. Consider diversification, risk levels, current market conditions, and provide actionable advice for improvement. Focus on portfolio balance and risk management.`;
    
    return await callGeminiAPI(prompt);
}

// Authentication Functions
async function signUp(email, password) {
    try {
        if (!supabase) throw new Error('Authentication service unavailable');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.log('Using demo mode for signup');
        // Simulate successful signup
        return { success: true, data: { user: { email: email } } };
    }
}

async function signIn(email, password) {
    try {
        if (!supabase) throw new Error('Authentication service unavailable');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        currentUser = data.user;
        isLoggedIn = true;
        updateUIForAuthenticatedUser();
        return { success: true, data };
    } catch (error) {
        console.log('Using demo mode for login');
        // Simulate successful login
        currentUser = { email: email, id: 'demo-user' };
        isLoggedIn = true;
        updateUIForAuthenticatedUser();
        return { success: true, data: { user: currentUser } };
    }
}

function signOut() {
    currentUser = null;
    isLoggedIn = false;
    userPortfolio = [];
    updateUIForUnauthenticatedUser();
}

function updateUIForAuthenticatedUser() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    loginBtn.textContent = 'Sign Out';
    loginBtn.onclick = signOut;
    signupBtn.style.display = 'none';
    loadUserPortfolio();
}

function updateUIForUnauthenticatedUser() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    loginBtn.textContent = 'Login';
    loginBtn.onclick = () => showModal('loginModal');
    signupBtn.style.display = 'inline-flex';
    
    const portfolioHoldings = document.getElementById('portfolioHoldings');
    if (portfolioHoldings) {
        portfolioHoldings.innerHTML = '<div class="empty-state"><h3>Please log in to view your portfolio</h3><p>Sign up or log in to start tracking your investments.</p></div>';
    }
}

// Portfolio Functions
async function loadUserPortfolio() {
    if (!currentUser) return;
    
    // Try to load from localStorage as fallback
    try {
        const stored = localStorage.getItem(`portfolio_${currentUser.id}`);
        if (stored) {
            userPortfolio = JSON.parse(stored);
        }
    } catch (error) {
        console.log('Error loading portfolio:', error);
    }
    
    updatePortfolioDisplay();
}

async function addStockToPortfolio(symbol, quantity, purchasePrice) {
    if (!currentUser) return false;
    
    const holding = {
        id: Date.now(),
        user_id: currentUser.id,
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        purchase_price: parseFloat(purchasePrice),
        purchase_date: new Date().toISOString()
    };
    
    userPortfolio.push(holding);
    
    // Save to localStorage
    try {
        localStorage.setItem(`portfolio_${currentUser.id}`, JSON.stringify(userPortfolio));
    } catch (error) {
        console.log('Error saving portfolio:', error);
    }
    
    updatePortfolioDisplay();
    return true;
}

function updatePortfolioDisplay() {
    const portfolioHoldings = document.getElementById('portfolioHoldings');
    const portfolioValue = document.getElementById('portfolioValue');
    const portfolioChange = document.getElementById('portfolioChange');
    
    if (!portfolioHoldings || !portfolioValue || !portfolioChange) return;
    
    if (userPortfolio.length === 0) {
        portfolioHoldings.innerHTML = '<div class="empty-state"><h3>No stocks in portfolio</h3><p>Add your first stock to start tracking your investments.</p></div>';
        portfolioValue.textContent = '$0.00';
        portfolioChange.textContent = '$0.00';
        return;
    }
    
    let totalValue = 0;
    let totalChange = 0;
    let portfolioData = [];
    
    const tableHTML = `
        <table class="holdings-table">
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Purchase Price</th>
                    <th>Current Price</th>
                    <th>Value</th>
                    <th>P&L</th>
                </tr>
            </thead>
            <tbody>
                ${userPortfolio.map(holding => {
                    const stock = sampleStocks[holding.symbol];
                    const currentPrice = stock?.price || holding.purchase_price;
                    const value = holding.quantity * currentPrice;
                    const purchaseValue = holding.quantity * holding.purchase_price;
                    const pnl = value - purchaseValue;
                    const pnlPercent = ((pnl / purchaseValue) * 100).toFixed(2);
                    
                    totalValue += value;
                    totalChange += pnl;
                    
                    portfolioData.push({
                        symbol: holding.symbol,
                        value: value,
                        color: getStockColor(holding.symbol)
                    });
                    
                    return `
                        <tr>
                            <td><strong>${holding.symbol}</strong></td>
                            <td>${holding.quantity}</td>
                            <td>${formatCurrency(holding.purchase_price)}</td>
                            <td>${formatCurrency(currentPrice)}</td>
                            <td>${formatCurrency(value)}</td>
                            <td class="${pnl >= 0 ? 'positive' : 'negative'}">
                                ${formatCurrency(pnl)} (${pnlPercent}%)
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    portfolioHoldings.innerHTML = tableHTML;
    portfolioValue.textContent = formatCurrency(totalValue);
    portfolioChange.textContent = formatCurrency(totalChange);
    portfolioChange.className = `metric-value ${totalChange >= 0 ? 'positive' : 'negative'}`;
    
    // Update portfolio chart
    updatePortfolioChart(portfolioData);
}

function getStockColor(symbol) {
    const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];
    const index = Object.keys(sampleStocks).indexOf(symbol);
    return colors[index % colors.length];
}

function updatePortfolioChart(data) {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx || !window.Chart) return;
    
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
    }
    
    if (data.length === 0) return;
    
    window.portfolioChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.symbol),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: data.map(item => item.color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// View Management
function showView(viewId) {
    console.log('Switching to view:', viewId);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Update sidebar
    document.querySelectorAll('.sidebar__item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-view="${viewId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Modal Management
function showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideModal(modalId) {
    console.log('Hiding modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Stock Analysis
async function performStockAnalysis(symbol) {
    const analyzerContent = document.getElementById('analyzerContent');
    const stock = sampleStocks[symbol.toUpperCase()];
    
    if (!stock) {
        analyzerContent.innerHTML = '<div class="error-message">Stock symbol not found. Please try AAPL, MSFT, GOOGL, TSLA, or NVDA.</div>';
        return;
    }
    
    analyzerContent.innerHTML = '<div class="loading">Analyzing stock data...</div>';
    
    // Get AI analysis
    const aiAnalysis = await analyzeStock(symbol);
    
    // Create analysis display
    const analysisHTML = `
        <div class="stock-overview">
            <div class="stock-header">
                <div>
                    <h2>${stock.name} (${stock.symbol})</h2>
                    <p class="stock-description">${stock.description}</p>
                </div>
                <div class="stock-price-display">
                    <div class="current-price">${formatCurrency(stock.price)}</div>
                    <div class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                        ${stock.change >= 0 ? '+' : ''}${formatCurrency(stock.change)} (${stock.changePercent}%)
                    </div>
                </div>
            </div>
        </div>
        
        <div class="stock-analysis">
            <div class="analysis-section">
                <h3>Key Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                    <div class="metric">
                        <div class="metric__label">Market Cap</div>
                        <div class="metric__value">${formatMarketCap(stock.marketCap)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">P/E Ratio</div>
                        <div class="metric__value">${stock.pe}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">EPS</div>
                        <div class="metric__value">${formatCurrency(stock.eps)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">Volume</div>
                        <div class="metric__value">${formatNumber(stock.volume)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">Dividend</div>
                        <div class="metric__value">${formatCurrency(stock.dividend)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">Yield</div>
                        <div class="metric__value">${stock.yield}%</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3>AI Analysis & Recommendations</h3>
                <div class="ai-analysis">
                    <p>${aiAnalysis}</p>
                </div>
            </div>
        </div>
        
        <div class="analysis-section">
            <h3>Price Chart</h3>
            <div class="chart-container" style="position: relative; height: 300px;">
                <canvas id="stockChart"></canvas>
            </div>
        </div>
    `;
    
    analyzerContent.innerHTML = analysisHTML;
    
    // Create price chart with sample data
    setTimeout(() => createStockChart(symbol, stock.price), 100);
}

function createStockChart(symbol, currentPrice) {
    const ctx = document.getElementById('stockChart');
    if (!ctx || !window.Chart) return;
    
    // Generate sample price data
    const data = [];
    const labels = [];
    let price = currentPrice * 0.95; // Start slightly lower
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        // Add some random variation
        price += (Math.random() - 0.5) * currentPrice * 0.02;
        data.push(price.toFixed(2));
    }
    
    // Ensure the last point is the current price
    data[data.length - 1] = currentPrice;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Price`,
                data: data,
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Chat Functionality
async function sendChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Add user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user-message fade-in';
    userMessageDiv.innerHTML = `<div class="message-content"><p>${message}</p></div>`;
    chatMessages.appendChild(userMessageDiv);
    
    // Add typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message';
    typingDiv.innerHTML = '<div class="message-content"><p>Thinking...</p></div>';
    chatMessages.appendChild(typingDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Get AI response
    let prompt = message;
    if (userPortfolio.length > 0) {
        const portfolioContext = userPortfolio.map(h => `${h.symbol}: ${h.quantity} shares`).join(', ');
        prompt += ` (User's portfolio: ${portfolioContext})`;
    }
    
    const response = await callGeminiAPI(`You are a professional investment advisor. Answer this question: ${prompt}. Provide helpful, accurate financial advice while noting that this is for educational purposes and not personalized financial advice.`);
    
    // Remove typing indicator
    chatMessages.removeChild(typingDiv);
    
    // Add bot response
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'chat-message bot-message fade-in';
    botMessageDiv.innerHTML = `<div class="message-content"><p>${response}</p></div>`;
    chatMessages.appendChild(botMessageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Stock Screener
function screenStocks() {
    const sector = document.getElementById('sectorFilter').value;
    const marketCap = document.getElementById('marketCapFilter').value;
    const maxPE = parseFloat(document.getElementById('peFilter').value) || Infinity;
    
    let filteredStocks = Object.values(sampleStocks).filter(stock => {
        if (sector && stock.sector !== sector) return false;
        if (maxPE < Infinity && stock.pe > maxPE) return false;
        
        if (marketCap) {
            if (marketCap === 'large' && stock.marketCap < 10e9) return false;
            if (marketCap === 'mid' && (stock.marketCap < 2e9 || stock.marketCap >= 10e9)) return false;
            if (marketCap === 'small' && stock.marketCap >= 2e9) return false;
        }
        
        return true;
    });
    
    const resultsContainer = document.getElementById('screenerResults');
    
    if (filteredStocks.length === 0) {
        resultsContainer.innerHTML = '<div class="results-placeholder"><h3>No stocks match your criteria</h3><p>Try adjusting your filters to find more opportunities.</p></div>';
        return;
    }
    
    const tableHTML = `
        <div class="results-table">
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Company</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>P/E Ratio</th>
                        <th>Market Cap</th>
                        <th>Sector</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStocks.map(stock => `
                        <tr>
                            <td><strong>${stock.symbol}</strong></td>
                            <td>${stock.name}</td>
                            <td>${formatCurrency(stock.price)}</td>
                            <td class="${stock.change >= 0 ? 'positive' : 'negative'}">
                                ${stock.change >= 0 ? '+' : ''}${formatCurrency(stock.change)}
                            </td>
                            <td>${stock.pe}</td>
                            <td>${formatMarketCap(stock.marketCap)}</td>
                            <td>${stock.sector}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    resultsContainer.innerHTML = tableHTML;
}

// Initialize Dashboard
function initializeDashboard() {
    // Populate top stocks
    const topStocks = document.getElementById('topStocks');
    if (topStocks) {
        const stocksHTML = Object.values(sampleStocks).map(stock => `
            <div class="stock-card">
                <div class="stock-card__header">
                    <div class="stock-info">
                        <h3>${stock.name}</h3>
                        <div class="symbol">${stock.symbol}</div>
                    </div>
                    <div class="stock-price">
                        <div class="stock-price__value">${formatCurrency(stock.price)}</div>
                        <div class="stock-price__change ${stock.change >= 0 ? 'positive' : 'negative'}">
                            ${stock.change >= 0 ? '+' : ''}${formatCurrency(stock.change)} (${stock.changePercent}%)
                        </div>
                    </div>
                </div>
                <div class="stock-card__metrics">
                    <div class="metric">
                        <div class="metric__label">P/E Ratio</div>
                        <div class="metric__value">${stock.pe}</div>
                    </div>
                    <div class="metric">
                        <div class="metric__label">Market Cap</div>
                        <div class="metric__value">${formatMarketCap(stock.marketCap)}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        topStocks.innerHTML = stocksHTML;
    }
    
    // Populate news
    const marketNews = document.getElementById('marketNews');
    if (marketNews) {
        const newsHTML = sampleNews.map(news => `
            <div class="news-item">
                <div class="news-item__header">
                    <h3 class="news-item__title">${news.title}</h3>
                    <span class="status status--${news.sentiment === 'positive' ? 'success' : news.sentiment === 'negative' ? 'error' : 'info'}">${news.sentiment}</span>
                </div>
                <p class="news-item__content">${news.content}</p>
                <div class="news-item__footer">
                    <span>${news.source}</span>
                    <span>${timeAgo(news.timestamp)}</span>
                </div>
            </div>
        `).join('');
        
        marketNews.innerHTML = newsHTML;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Initialize dashboard
    initializeDashboard();
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar__item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.dataset.view;
            console.log('Sidebar clicked:', viewId);
            showView(viewId);
        });
    });
    
    // Modal controls
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                signOut();
            } else {
                showModal('loginModal');
            }
        });
    }
    
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('signupModal');
        });
    }
    
    const addStockBtn = document.getElementById('addStockBtn');
    if (addStockBtn) {
        addStockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn) {
                alert('Please log in to add stocks to your portfolio');
                return;
            }
            showModal('addStockModal');
        });
    }
    
    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await signIn(email, password);
            if (result.success) {
                hideModal('loginModal');
                loginForm.reset();
            } else {
                alert('Login failed: ' + result.error);
            }
        });
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            const result = await signUp(email, password);
            if (result.success) {
                hideModal('signupModal');
                signupForm.reset();
                alert('Sign up successful! You can now log in.');
            } else {
                alert('Sign up failed: ' + result.error);
            }
        });
    }
    
    const addStockForm = document.getElementById('addStockForm');
    if (addStockForm) {
        addStockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const symbol = document.getElementById('addStockSymbol').value;
            const quantity = document.getElementById('addStockQuantity').value;
            const price = document.getElementById('addStockPrice').value;
            
            if (!isLoggedIn) {
                alert('Please log in to add stocks to your portfolio');
                return;
            }
            
            const success = await addStockToPortfolio(symbol, quantity, price);
            if (success) {
                hideModal('addStockModal');
                addStockForm.reset();
            } else {
                alert('Failed to add stock to portfolio');
            }
        });
    }
    
    // Stock search
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const symbol = document.getElementById('stockSearch').value.trim();
            if (symbol) {
                performStockAnalysis(symbol);
            }
        });
    }
    
    const stockSearch = document.getElementById('stockSearch');
    if (stockSearch) {
        stockSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const symbol = e.target.value.trim();
                if (symbol) {
                    performStockAnalysis(symbol);
                }
            }
        });
    }
    
    // Chat functionality
    const sendChatBtn = document.getElementById('sendChatBtn');
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const chatInput = document.getElementById('chatInput');
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
                chatInput.value = '';
            }
        });
    }
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const message = e.target.value.trim();
                if (message) {
                    sendChatMessage(message);
                    e.target.value = '';
                }
            }
        });
    }
    
    // Stock screener
    const screenBtn = document.getElementById('screenBtn');
    if (screenBtn) {
        screenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            screenStocks();
        });
    }
    
    console.log('App initialization complete');
});