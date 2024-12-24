const AXIE_IMAGE_STYLE = 'new'; // 'classic' or 'new'
let AXIE_IMAGE_BASE_URL;

if (AXIE_IMAGE_STYLE === 'classic') {
    AXIE_IMAGE_BASE_URL = 'https://assets.axieinfinity.com/axies';
} else if (AXIE_IMAGE_STYLE === 'new') {
    AXIE_IMAGE_BASE_URL = 'https://axiecdn.axieinfinity.com/axies';
} else {
    AXIE_IMAGE_BASE_URL = 'https://assets.axieinfinity.com/axies'; // Default to classic if invalid input
    console.warn('Invalid AXIE_IMAGE_STYLE. Please use only "classic" or "new". Defaulting to classic style.');
}

async function fetchEggs() {
    const query = `
    query FetchAllEggs {
        axies(
            auctionType: All
            criteria: {stages: [1]}
            sort: IdDesc
            size: 5000
        ) {
            results {
                id
                sireId
                matronId
                ownerProfile {
                    name
                    addresses {
                        ronin
                    }
                }
                birthDate
            }
            total
        }
    }
    `;

    const response = await fetch('https://api-gateway.skymavis.com/graphql/marketplace', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'CfY9CRVz9SmvhtoCXfC53MybY3ZhJ3qU'
        },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const { data } = await response.json();
    return data.axies;
}

function calculateProgress(birthDate) {
    const hatchingDuration = 5 * 24 * 60 * 60; // 5 days in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Current time in Unix timestamp (seconds)
    const timePassed = currentTime - birthDate;
    const progress = (timePassed / hatchingDuration) * 100;
    return Math.min(progress, 100); // Ensure progress doesn't exceed 100%
}

function formatRemainingTime(birthDate) {
    const hatchingDuration = 5 * 24 * 60 * 60; // 5 days in seconds
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeLeft = hatchingDuration - (currentTime - birthDate);
    
    if (timeLeft <= 0) {
        return "Hatched";
    } else {
        const days = Math.floor(timeLeft / (24 * 60 * 60));
        const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }
}

function analyzeWallets(eggs) {
    const walletInfo = {};
    eggs.forEach(egg => {
        const wallet = egg.ownerProfile?.addresses?.ronin;
        const name = egg.ownerProfile?.name || 'Unknown';
        if (wallet) {
            if (!walletInfo[wallet]) {
                walletInfo[wallet] = { count: 0, name: name };
            }
            walletInfo[wallet].count += 1;
        }
    });

    const sortedWallets = Object.entries(walletInfo)
        .filter(([, info]) => info.count > 4) // Filter out wallets with 4 or fewer eggs
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([wallet, info]) => ({ wallet, name: info.name, count: info.count }));

    return sortedWallets;
}

function displayWalletAnalysis(walletAnalysis) {
    const analysisContainer = document.getElementById('wallet-analysis');
    analysisContainer.innerHTML = '<h3>Wallet Analysis</h3>';
    
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Wallet</th>
            <th>Name</th>
            <th>Egg Count</th>
        </tr>
    `;

    walletAnalysis.forEach((wallet, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${wallet.wallet}</td>
            <td>${wallet.name}</td>
            <td>${wallet.count}</td>
        `;
    });

    analysisContainer.appendChild(table);
}

function toggleWalletAnalysis() {
    const analysisOverlay = document.getElementById('analysis-overlay');
    analysisOverlay.style.display = analysisOverlay.style.display === 'none' ? 'flex' : 'none';
}

function closeWalletAnalysis() {
    const analysisOverlay = document.getElementById('analysis-overlay');
    analysisOverlay.style.display = 'none';
}

let allEggs = []; // Store all fetched eggs
let currentFilter = ''; // Store current filter

function displayEggs(eggs, totalFetched) {
    const container = document.getElementById('axies-container');
    const statsHeader = document.getElementById('egg-stats');
    container.innerHTML = ''; // Clear existing content
    
    // Filter eggs with ID 12 million or higher
    const recentEggs = eggs.filter(egg => parseInt(egg.id) >= 12000000);
    
    // Apply Ronin address filter if present
    const filteredEggs = currentFilter
        ? recentEggs.filter(egg => egg.ownerProfile?.addresses?.ronin?.toLowerCase() === currentFilter.toLowerCase())
        : recentEggs;
    
    // Display total in the header
    statsHeader.innerHTML = `
        <h2>Total Eggs: ${filteredEggs.length}</h2>
        ${currentFilter ? `<h4>Filtered by Ronin: ${currentFilter}</h4>` : ''}
    `;

    const walletAnalysis = analyzeWallets(recentEggs);
    displayWalletAnalysis(walletAnalysis);

    filteredEggs.forEach(egg => {
        const eggElement = document.createElement('div');
        eggElement.className = 'axie';
        eggElement.innerHTML = `
            <h2><a href="https://app.axieinfinity.com/marketplace/axies/${egg.id}" target="_blank" rel="noopener noreferrer">${egg.id}</a></h2>
            <h2><a href="https://app.axieinfinity.com/profile/${egg.ownerProfile?.addresses?.ronin}/axies/" target="_blank" rel="noopener noreferrer">${egg.ownerProfile?.name || 'Unknown'}</a></h2>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${calculateProgress(egg.birthDate)}%"></div>
                <div class="progress-bar-text">${formatRemainingTime(egg.birthDate)}</div>
            </div>
            <div class="image-container">
                <div>
                    <a href="https://app.axieinfinity.com/marketplace/axies/${egg.sireId}" target="_blank" rel="noopener noreferrer">
                        <img src="${AXIE_IMAGE_BASE_URL}/${egg.sireId}/axie/axie-full-transparent.png" alt="Sire">
                        <p>${egg.sireId}</p>
                    </a>
                </div>
                <div>
                    <a href="https://app.axieinfinity.com/marketplace/axies/${egg.matronId}" target="_blank" rel="noopener noreferrer">
                        <img src="${AXIE_IMAGE_BASE_URL}/${egg.matronId}/axie/axie-full-transparent.png" alt="Matron">
                        <p>${egg.matronId}</p>
                    </a>
                </div>
            </div>
        `;
        container.appendChild(eggElement);
    });
}

function applyFilter() {
    const filterInput = document.getElementById('ronin-filter');
    const filterValue = filterInput.value.trim();
    
    if (filterValue.startsWith('0x') && filterValue.length === 42) {
        currentFilter = filterValue;
        displayEggs(allEggs, allEggs.length);
    } else {
        alert('Please enter a valid Ronin address starting with 0x');
    }
}

function clearFilter() {
    currentFilter = '';
    document.getElementById('ronin-filter').value = '';
    displayEggs(allEggs, allEggs.length);
}

function checkPassword() {
    const password = document.getElementById('password-input').value;
    if (password === 'ABU123') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', checkPassword);

    // Allow login on Enter key press
    document.getElementById('password-input').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    const applyFilterButton = document.getElementById('apply-filter');
    const clearFilterButton = document.getElementById('clear-filter');
    const toggleAnalysisButton = document.getElementById('toggle-analysis');
    
    applyFilterButton.addEventListener('click', applyFilter);
    clearFilterButton.addEventListener('click', clearFilter);
    toggleAnalysisButton.addEventListener('click', toggleWalletAnalysis);
    
    fetchEggs()
        .then(({ results, total }) => {
            allEggs = results; // Store all fetched eggs
            displayEggs(results, total);
            
            // Prepare wallet analysis but don't display it yet
            const walletAnalysis = analyzeWallets(results.filter(egg => parseInt(egg.id) >= 12000000));
            displayWalletAnalysis(walletAnalysis);
        })
        .catch(error => {
            console.error("Failed to fetch eggs:", error);
            document.getElementById('axies-container').innerHTML = `<p>Error fetching data. Please try again later.</p>`;
        });
});

// Add a global event listener for the Escape key
document.addEventListener('keydown', (event) => {
    console.log('Global key pressed:', event.key);
    if (event.key === 'Escape') {
        console.log('Global Escape key pressed');
        closeWalletAnalysis();
    }
});