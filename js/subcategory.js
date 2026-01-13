// Subcategory page functionality
let currentDesigns = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentFilters = {
    color: 'all',
    pattern: 'all'
};

function loadSubcategoryDesigns() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    const subcategory = urlParams.get('subcat');
    
    if (!category || !subcategory) {
        window.location.href = 'store.html';
        return;
    }
    
    const categoryData = productsData.categories[category];
    if (!categoryData) return;
    
    const subcategoryData = categoryData.subcategories[subcategory];
    if (!subcategoryData) return;
    
    // Update page title
    document.getElementById('subcategory-title').textContent = 
        `${subcategoryData.name} Designs`;
    
    // Load designs
    currentDesigns = subcategoryData.designs;
    
    // Initialize filters
    initFilters();
    
    // Apply initial filters and render
    applyFiltersAndRender();
    
    // Setup pagination
    setupPagination();
    
    // Setup view toggle
    setupViewToggle();
}

function initFilters() {
    // Get unique colors and patterns
    const colors = [...new Set(currentDesigns.map(d => d.color))];
    const patterns = [...new Set(currentDesigns.map(d => d.pattern))];
    
    // Populate color filter
    const colorFilter = document.getElementById('color-filter');
    colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.toLowerCase();
        option.textContent = color;
        colorFilter.appendChild(option);
    });
    
    // Populate pattern filter
    const patternFilter = document.getElementById('pattern-filter');
    patterns.forEach(pattern => {
        const option = document.createElement('option');
        option.value = pattern.toLowerCase();
        option.textContent = pattern;
        patternFilter.appendChild(option);
    });
    
    // Add filter event listeners
    colorFilter.addEventListener('change', function() {
        currentFilters.color = this.value;
        applyFiltersAndRender();
    });
    
    patternFilter.addEventListener('change', function() {
        currentFilters.pattern = this.value;
        applyFiltersAndRender();
    });
    
    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', function() {
        document.getElementById('color-filter').value = 'all';
        document.getElementById('pattern-filter').value = 'all';
        currentFilters = { color: 'all', pattern: 'all' };
        applyFiltersAndRender();
    });
}

function applyFiltersAndRender() {
    let filteredDesigns = currentDesigns;
    
    // Apply color filter
    if (currentFilters.color !== 'all') {
        filteredDesigns = filteredDesigns.filter(d => 
            d.color.toLowerCase() === currentFilters.color
        );
    }
    
    // Apply pattern filter
    if (currentFilters.pattern !== 'all') {
        filteredDesigns = filteredDesigns.filter(d => 
            d.pattern.toLowerCase() === currentFilters.pattern
        );
    }
    
    // Update design count
    document.getElementById('design-count').textContent = 
        `(${filteredDesigns.length} designs)`;
    
    // Render current page
    renderDesignsPage(filteredDesigns, currentPage);
}

function renderDesignsPage(designs, page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageDesigns = designs.slice(startIndex, endIndex);
    
    const container = document.getElementById('designs-container');
    const isListView = container.classList.contains('list-view');
    
    container.innerHTML = pageDesigns.map(design => `
        <div class="design-card ${isListView ? 'list-view' : ''}">
            <div class="design-img">
                <img src="${design.image}" alt="${design.name}" 
                     onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"200\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"14\" text-anchor=\"middle\">${design.name}</text></svg>'">
                <div class="design-badge">₦${design.price.toLocaleString('en-NG')}</div>
            </div>
            <div class="design-info">
                <h4>${design.name}</h4>
                <div class="design-meta">
                    <div class="design-color">
                        <span>Color:</span>
                        <div class="color-dot" style="background-color: ${getColorCode(design.color)}"></div>
                        <span>${design.color}</span>
                    </div>
                    <div class="design-pattern">
                        <span>${design.pattern}</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="addToCart('${design.id}')">
                        <i class="fas fa-shopping-bag"></i> Add to Cart
                    </button>
                    <button class="quick-view-btn" onclick="showProductDetails('${design.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update pagination info
    updatePaginationInfo(designs.length, page);
}

function getColorCode(color) {
    const colorMap = {
        'blue': '#2563eb',
        'red': '#dc2626',
        'green': '#16a34a',
        'yellow': '#ca8a04',
        'purple': '#7c3aed',
        'pink': '#db2777',
        'black': '#000000',
        'white': '#ffffff',
        'brown': '#92400e',
        'orange': '#ea580c'
    };
    return colorMap[color.toLowerCase()] || '#7D3CFF';
}

function setupPagination() {
    const prevBtn = document.querySelector('.page-btn.prev');
    const nextBtn = document.querySelector('.page-btn.next');
    
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            applyFiltersAndRender();
        }
    });
    
    nextBtn.addEventListener('click', function() {
        const filteredDesigns = getFilteredDesigns();
        const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
        
        if (currentPage < totalPages) {
            currentPage++;
            applyFiltersAndRender();
        }
    });
}

function updatePaginationInfo(totalItems, page) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.querySelector('.page-numbers').textContent = 
        `Page ${page} of ${totalPages}`;
    
    const prevBtn = document.querySelector('.page-btn.prev');
    const nextBtn = document.querySelector('.page-btn.next');
    
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages || totalPages === 0;
}

function getFilteredDesigns() {
    let filtered = currentDesigns;
    
    if (currentFilters.color !== 'all') {
        filtered = filtered.filter(d => 
            d.color.toLowerCase() === currentFilters.color
        );
    }
    
    if (currentFilters.pattern !== 'all') {
        filtered = filtered.filter(d => 
            d.pattern.toLowerCase() === currentFilters.pattern
        );
    }
    
    return filtered;
}

function setupViewToggle() {
    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');
    const container = document.getElementById('designs-container');
    
    gridBtn.addEventListener('click', function() {
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        container.classList.remove('list-view');
        applyFiltersAndRender();
    });
    
    listBtn.addEventListener('click', function() {
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        container.classList.add('list-view');
        applyFiltersAndRender();
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadSubcategoryDesigns);
