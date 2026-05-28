document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs Logic
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            
            // Toggle active menu state
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Toggle active content pane
            tabContents.forEach(content => {
                if (content.id === `tab-${tabId}`) {
                    content.classList.remove('hidden');
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                }
            });

            // Auto-load database when opening explorer tab
            if (tabId === 'explorer') {
                loadDatabase();
            }
        });
    });

    // Chart.js Instance Management
    let spendingChartInstance = null;
    let clusterAverages = null;

    // Fetch Cluster Stats Averages on startup
    fetch('/api/stats')
        .then(res => res.json())
        .then(stats => {
            clusterAverages = stats;
        })
        .catch(err => console.error("Error fetching cluster stats:", err));

    // Form Submission & Prediction Logic
    const profilerForm = document.getElementById('profiler-form');
    const resultsEmpty = document.getElementById('results-empty');
    const resultsCard = document.getElementById('results-card');
    const chartsCard = document.getElementById('charts-card');
    const btnPredict = document.getElementById('btn-predict');

    profilerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Show loading state on button
        btnPredict.disabled = true;
        btnPredict.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Classifying...';

        const formData = new FormData(profilerForm);
        const dataPayload = {};

        formData.forEach((value, key) => {
            dataPayload[key] = parseFloat(value);
        });

        // Add additional computed total spending for visualization if necessary
        const spendingCategories = ['Wines', 'Fruits', 'Meat', 'Fish', 'Sweets', 'Gold'];
        let totalSpend = 0;
        spendingCategories.forEach(cat => {
            totalSpend += dataPayload[cat] || 0;
        });
        dataPayload['Total_Spending'] = totalSpend;

        // Perform AJAX request to Flask predict endpoint
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataPayload)
        })
        .then(res => {
            if (!res.ok) throw new Error("Inference failed.");
            return res.json();
        })
        .then(response => {
            // Restore button
            btnPredict.disabled = false;
            btnPredict.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Classify Customer';

            // Hide empty card, show results and charts
            resultsEmpty.classList.add('hidden');
            resultsCard.classList.remove('hidden');
            chartsCard.classList.remove('hidden');

            // Render Segment Badge classes
            const badge = document.getElementById('segment-badge');
            badge.className = `badge cluster-${response.predicted_cluster}`;
            badge.textContent = `Cluster ${response.predicted_cluster}`;

            // Add corresponding styling to the parent card
            resultsCard.className = `card result-card cluster-${response.predicted_cluster}`;

            // Set Segment Spotlight values
            document.getElementById('segment-name').textContent = response.segment_name;
            document.getElementById('segment-description').textContent = response.segment_description;

            // Render Strategy List
            const strategyList = document.getElementById('strategy-list');
            strategyList.innerHTML = '';
            response.marketing_strategies.forEach(strategy => {
                const li = document.createElement('li');
                li.textContent = strategy;
                strategyList.appendChild(li);
            });

            // Render Comparison Chart
            renderChart(response.predicted_cluster, dataPayload);
            
            // Smoothly scroll to the results on mobile screens
            if (window.innerWidth < 1024) {
                resultsCard.scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(err => {
            console.error("Error during prediction:", err);
            btnPredict.disabled = false;
            btnPredict.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Classify Customer';
            alert("Model categorization failed. Please verify your inputs and try again.");
        });
    });

    // Function to render custom comparison Chart.js
    function renderChart(predictedCluster, inputValues) {
        if (!clusterAverages) return;

        const ctx = document.getElementById('spending-chart').getContext('2d');
        const categories = ['Wines', 'Meat', 'Fruits', 'Fish', 'Sweets', 'Gold'];

        // Extract spending values from input profile
        const inputSpendData = categories.map(cat => inputValues[cat] || 0);

        // Extract average spending values from predicted cluster
        const clusterAvgData = categories.map(cat => {
            const clusterStat = clusterAverages[predictedCluster];
            return clusterStat ? Math.round(clusterStat[cat] || 0) : 0;
        });

        // Destroy previous chart instance before drawing a new one
        if (spendingChartInstance) {
            spendingChartInstance.destroy();
        }

        // Custom chart colors based on cluster accenting
        const accentColors = {
            0: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.25)' },
            1: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.25)' },
            2: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.25)' }
        };

        const themeColor = accentColors[predictedCluster] || accentColors[0];

        spendingChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'This Customer Profile',
                        data: inputSpendData,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: '#e5e7eb',
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: 'Average Segment Spender',
                        data: clusterAvgData,
                        backgroundColor: themeColor.bg,
                        borderColor: themeColor.border,
                        borderWidth: 2,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#9ca3af',
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#f3f4f6',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#9ca3af',
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#9ca3af',
                            font: { family: 'Inter', size: 11 },
                            callback: function(value) { return '$' + value; }
                        }
                    }
                }
            }
        });
    }

    // Database Explorer Pagination & Filtering
    let dbCurrentPage = 1;
    const dbPerPage = 10;

    const filterCluster = document.getElementById('filter-cluster');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const dbTableBody = document.querySelector('#db-table tbody');
    const paginationInfo = document.getElementById('pagination-info');

    function loadDatabase() {
        const filterVal = filterCluster.value;
        let url = `/api/database?page=${dbCurrentPage}&per_page=${dbPerPage}`;
        if (filterVal !== '') {
            url += `&cluster=${filterVal}`;
        }

        // Table loading spinner placeholder
        dbTableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 40px; text-align: center;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i><br><span style="margin-top: 10px; display: inline-block;">Loading records...</span></td></tr>';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                dbTableBody.innerHTML = '';
                
                if (data.records.length === 0) {
                    dbTableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 40px; text-align: center;">No customer records found.</td></tr>';
                    paginationInfo.textContent = 'Showing 0 to 0 of 0 records';
                    btnPrev.disabled = true;
                    btnNext.disabled = true;
                    return;
                }

                data.records.forEach(row => {
                    const tr = document.createElement('tr');
                    
                    const ageTd = document.createElement('td');
                    ageTd.textContent = row.Age;
                    tr.appendChild(ageTd);

                    const incomeTd = document.createElement('td');
                    incomeTd.textContent = `$${parseFloat(row.Income || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                    tr.appendChild(incomeTd);

                    const spendingTd = document.createElement('td');
                    spendingTd.textContent = `$${parseFloat(row.Total_Spending || 0).toLocaleString()}`;
                    tr.appendChild(spendingTd);

                    const wineTd = document.createElement('td');
                    wineTd.textContent = `$${parseFloat(row.Wines || 0).toLocaleString()}`;
                    tr.appendChild(wineTd);

                    const meatTd = document.createElement('td');
                    meatTd.textContent = `$${parseFloat(row.Meat || 0).toLocaleString()}`;
                    tr.appendChild(meatTd);

                    const storeTd = document.createElement('td');
                    storeTd.textContent = row.Store;
                    tr.appendChild(storeTd);

                    const webTd = document.createElement('td');
                    webTd.textContent = row.NumWebVisitsMonth;
                    tr.appendChild(webTd);

                    const segmentTd = document.createElement('td');
                    const segmentSpan = document.createElement('span');
                    segmentSpan.className = `badge cluster-${row.cluster}`;
                    segmentSpan.textContent = `Cluster ${row.cluster}`;
                    segmentTd.appendChild(segmentSpan);
                    tr.appendChild(segmentTd);

                    dbTableBody.appendChild(tr);
                });

                // Update pagination controls
                const startRange = (dbCurrentPage - 1) * dbPerPage + 1;
                const endRange = Math.min(startRange + data.records.length - 1, data.total);
                paginationInfo.textContent = `Showing ${startRange} to ${endRange} of ${data.total} records`;

                btnPrev.disabled = dbCurrentPage <= 1;
                btnNext.disabled = endRange >= data.total;
            })
            .catch(err => {
                console.error("Error loading database:", err);
                dbTableBody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 40px; color: var(--color-danger); text-align: center;">Error loading database records.</td></tr>';
            });
    }

    // Explorer Event Listeners
    filterCluster.addEventListener('change', () => {
        dbCurrentPage = 1;
        loadDatabase();
    });

    btnRefresh.addEventListener('click', () => {
        loadDatabase();
    });

    btnPrev.addEventListener('click', () => {
        if (dbCurrentPage > 1) {
            dbCurrentPage--;
            loadDatabase();
        }
    });

    btnNext.addEventListener('click', () => {
        dbCurrentPage++;
        loadDatabase();
    });
});
