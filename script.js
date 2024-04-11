async function fetchAxies() {
    const response = await fetch('https://api-gateway.skymavis.com/graphql/marketplace', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'CfY9CRVz9SmvhtoCXfC53MybY3ZhJ3qU'
        },
        body: JSON.stringify({
            query: `
            query MyQuery {
                axies(auctionType: All, sort: IdDesc, size: 2000) {
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
                }
            }
            `,
        }),
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const { data } = await response.json();
    return data.axies.results;
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

async function displayAxies() {
    try {
        const axies = await fetchAxies();
        const container = document.getElementById('axies-container');
        axies.forEach(axie => {
            const progress = calculateProgress(axie.birthDate);
            const remainingTime = formatRemainingTime(axie.birthDate);
            const axieMarketplaceUrl = `https://app.axieinfinity.com/marketplace/axies/${axie.id}`;
            const axieP1Url = `https://app.axieinfinity.com/marketplace/axies/${axie.sireId}`;
            const axieP2Url = `https://app.axieinfinity.com/marketplace/axies/${axie.matronId}`;
        
            // Check if ownerProfile and addresses exist and are not null
            let playerProfileUrl = "#";
            if (axie.ownerProfile && axie.ownerProfile.addresses && axie.ownerProfile.addresses.ronin) {
                playerProfileUrl = `https://app.axieinfinity.com/profile/${axie.ownerProfile.addresses.ronin}/axies/`;
            } else {
                // If there's no addresses, log the Axie's id for further investigation
                console.log(`Missing addresses for Axie ID: ${axie.id}`, axie);
                // Optionally, log the entire Axie object for more details
                // console.log('Axie with missing addresses:', axie);
            }
        
            const element = document.createElement('div');
            element.className = 'axie';
            element.innerHTML = `
                <h2><a href="${axieMarketplaceUrl}" target="_blank" rel="noopener noreferrer">${axie.id}</a></h2>
                <h2><a href="${playerProfileUrl}" target="_blank" rel="noopener noreferrer">${axie.ownerProfile ? axie.ownerProfile.name : 'Unknown'}</a></h2>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <div class="progress-bar-text">${remainingTime}</div>
                </div>
                <div class="image-container">
                    <div>
                        <a href="${axieP1Url}" target="_blank" rel="noopener noreferrer">
                            <img src="https://assets.axieinfinity.com/axies/${axie.sireId}/axie/axie-full-transparent.png" alt="Sire">
                            <p>${axie.sireId}</p>
                        </a>
                    </div>
                    <div>
                        <a href="${axieP2Url}" target="_blank" rel="noopener noreferrer">
                            <img src="https://assets.axieinfinity.com/axies/${axie.matronId}/axie/axie-full-transparent.png" alt="Matron">
                            <p>${axie.matronId}</p>
                        </a>
                    </div>
                </div>
            `;
            container.appendChild(element);
        });
        
    } catch (error) {
        console.error("Failed to fetch Axies:", error);
        document.getElementById('axies-container').innerHTML = `<p>Error fetching data. Please try again later.</p>`;
    }
}


document.addEventListener('DOMContentLoaded', displayAxies);
