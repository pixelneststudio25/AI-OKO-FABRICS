// Store Page JavaScript
let allProducts = [];

// --- NEW GLOBALS for infinite scroll and filtering ---
let currentCategoryProducts = [];
let filteredProducts = [];
let currentPage = 0;
const pageSize = 12;
let activeColor = 'all';
// -------------------------------------------------------

// Initialize store functionality
function initStore() {
    allProducts = getAllProducts();
    updateCartCount();

    // Initialize color filter UI if present
    initColorFilters();

    // Initialize other features
    loadFeaturedProducts();
    initSearch();
    
    // Update floating cart
    if (typeof updateFloatingCart === 'function') {
        updateFloatingCart();
    }
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('aioko-cart')) || [];
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    });
}

// Load featured products on store page
function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    const featuredProducts = productsData.featured || [];

    container.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-img">
                <div class="product-badge">Featured</div>
                <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"200\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"16\" text-anchor=\"middle\">${product.name}</text></svg>'">
            </div>
            <div class="product-content">
                <h3>${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-meta">
                    <span>${product.category.toUpperCase()}</span>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        <i class="fas fa-shopping-bag"></i> Add to Cart
                    </button>
                    <button class="quick-view-btn" onclick="quickView('${product.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- NEW FUNCTION: render a single product card ---
function renderProduct(product) {
    return `
    <div class="product-card" data-product-id="${product.id}">
        <div class="product-img">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 200\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"200\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"16\" text-anchor=\"middle\">${product.name}</text></svg>'">
        </div>
        <div class="product-content">
            <h3>${product.name}</h3>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-meta">
                <span><i class="fas fa-ruler"></i> ${product.size || 'Standard'}</span>
                <span><i class="fas fa-tag"></i> ${product.sku || ''}</span>
            </div>
            <div class="product-actions">
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
                <button class="quick-view-btn" onclick="showProductDetails('${product.id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        </div>
    </div>`;
}
// -------------------------------------------------------

// Load products for a specific category
function loadCategoryProducts(category) {
    const container = document.getElementById('products-container');
    if (!container) return;

    // Set up the source and initial filtered set
    currentCategoryProducts = productsData[category] || [];
    filteredProducts = [...currentCategoryProducts];
    currentPage = 0;

    // Clear any existing content
    container.innerHTML = '';

    // Load first batch
    loadNextBatch();

    // Initialize sorting
    initSorting();
    
    // Generate color filters for this category
    generateColorFilters(currentCategoryProducts);
}

// --- NEW FUNCTION: load next batch for infinite scroll ---
function loadNextBatch() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const start = currentPage * pageSize;
    const end = start + pageSize;
    const batch = filteredProducts.slice(start, end);

    if (batch.length === 0) {
        // No more products to load
        if (currentPage === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try selecting a different color filter</p>
                </div>
            `;
        }
        return;
    }

    batch.forEach(product => {
        container.insertAdjacentHTML('beforeend', renderProduct(product));
    });

    currentPage++;
    
    // Update product count display
    updateProductCount();
}
// -------------------------------------------------------

// Initialize product sorting
function initSorting() {
    const sortSelect = document.getElementById('sort-by');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        const sortedProducts = [...filteredProducts];

        switch(this.value) {
            case 'price-low':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
            default:
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // Re-render products
        const container = document.getElementById('products-container');
        if (!container) return;
        
        container.innerHTML = '';
        filteredProducts = sortedProducts;
        currentPage = 0;
        loadNextBatch();
    });
}

// ============================================
// AUTOMATIC COLOR DETECTION SYSTEM
// ============================================

// --- MAIN FUNCTION: Initialize color filters with automatic detection ---
function initColorFilters() {
    const colorContainer = document.getElementById('colorTagsContainer');
    if (!colorContainer) return;
    
    // Show loading state
    colorContainer.innerHTML = '<div class="loading-tags"><i class="fas fa-spinner fa-spin"></i> Detecting colors...</div>';
    
    // Get products based on current page
    let products = [];
    
    // Check if we're on a category page or main store
    const categoryMatch = window.location.pathname.match(/category\.html\?category=(\w+)/);
    const currentCategory = categoryMatch ? categoryMatch[1] : null;
    
    if (currentCategory && productsData[currentCategory]) {
        // On category page - use category products
        products = productsData[currentCategory];
    } else {
        // On main store page or unknown - use all products
        products = getAllProducts();
    }
    
    // Generate color filters from products
    generateColorFilters(products);
}

// --- FUNCTION: Extract color combinations from products ---
function extractColorCombinations(products) {
    const colorMap = {};
    let totalProducts = 0;
    
    // Count occurrences of each color combination
    products.forEach(product => {
        totalProducts++;
        
        // Check for color information in different possible properties
        let colors = [];
        
        // Try different property names
        if (product.colorTags && Array.isArray(product.colorTags)) {
            colors = product.colorTags;
        } else if (product.colors && Array.isArray(product.colors)) {
            colors = product.colors;
        } else if (product.color && typeof product.color === 'string') {
            // If single color string, split by common separators
            colors = product.color.split(/[,\/&]+/).map(c => c.trim());
        } else if (product.name) {
            // Extract colors from product name (fallback)
            colors = extractColorsFromName(product.name);
        }
        
        // Clean and normalize colors
        colors = colors.map(color => 
            color.trim().toLowerCase().replace(/[^a-z\s&]/g, '')
        ).filter(color => color.length > 0);
        
        if (colors.length > 0) {
            // Sort colors for consistency
            const sortedColors = [...colors].sort();
            const colorKey = sortedColors.join(' & ');
            
            // Initialize or increment count
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        } else {
            // If no colors detected, mark as 'Other'
            colorMap['other'] = (colorMap['other'] || 0) + 1;
        }
    });
    
    // Convert to array format
    const colorCombinations = Object.entries(colorMap).map(([name, count]) => ({
        id: name.toLowerCase().replace(/[& ]+/g, '-').replace(/[^a-z\-]/g, ''),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: count
    }));
    
    // Sort by count (descending) then by name
    colorCombinations.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
    });
    
    // Add "All Colors" option at the beginning
    colorCombinations.unshift({
        id: 'all',
        name: 'All Colors',
        count: totalProducts
    });
    
    return colorCombinations;
}

// --- FUNCTION: Extract colors from product name (fallback) ---
function extractColorsFromName(productName) {
    const colorKeywords = [
        'red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'pink',
        'orange', 'brown', 'grey', 'gray', 'gold', 'silver', 'navy', 'maroon',
        'teal', 'turquoise', 'violet', 'indigo', 'magenta', 'cyan', 'beige',
        'cream', 'khaki', 'olive', 'lime', 'mint', 'lavender', 'coral', 'peach'
    ];
    
    const foundColors = [];
    const nameLower = productName.toLowerCase();
    
    colorKeywords.forEach(color => {
        if (nameLower.includes(color)) {
            foundColors.push(color);
        }
    });
    
    return foundColors;
}

// --- FUNCTION: Generate color filters from products ---
function generateColorFilters(products) {
    const colorContainer = document.getElementById('colorTagsContainer');
    if (!colorContainer) return;
    
    if (!products || products.length === 0) {
        colorContainer.innerHTML = '<div class="no-colors">No products to analyze</div>';
        return;
    }
    
    // Extract color combinations
    const colorCombinations = extractColorCombinations(products);
    
    // Clear container
    colorContainer.innerHTML = '';
    
    // Generate color tags
    colorCombinations.forEach(color => {
        const colorTag = document.createElement('div');
        colorTag.className = 'color-tag';
        colorTag.textContent = `${color.name} (${color.count})`;
        colorTag.dataset.color = color.id;
        colorTag.title = `Click to filter by ${color.name}`;
        
        colorTag.addEventListener('click', function() {
            // Remove active class from all tags
            document.querySelectorAll('.color-tag').forEach(tag => {
                tag.classList.remove('active');
            });
            
            // Add active class to clicked tag
            this.classList.add('active');
            
            // Update active color and apply filter
            activeColor = color.id;
            applyFilters();
            
            // Scroll to products for better UX
            const productsSection = document.getElementById('products-container');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        colorContainer.appendChild(colorTag);
    });
    
    // Set "All Colors" as active by default
    const allColorsTag = colorContainer.querySelector('.color-tag[data-color="all"]');
    if (allColorsTag) {
        allColorsTag.classList.add('active');
        activeColor = 'all';
    }
    
    // Initialize the toggle functionality
    initColorFilterToggle();
}

// --- FUNCTION: Expand/Collapse Color Filter Toggle ---
// --- FUNCTION: Expand/Collapse Color Filter Toggle ---
function initColorFilterToggle() {
    const colorContainer = document.getElementById('colorTagsContainer');
    const toggleBtn = document.getElementById('colorToggleBtn');
    
    if (!colorContainer || !toggleBtn) return;
    
    const toggleText = toggleBtn.querySelector('span');
    const toggleIcon = toggleBtn.querySelector('i');
    
    let isExpanded = false;
    
    // Function to check if we should show the toggle
    function shouldShowToggle() {
        const colorTags = colorContainer.querySelectorAll('.color-tag');
        if (colorTags.length === 0) return false;
        
        // Different thresholds for mobile vs desktop
        const isMobile = window.innerWidth <= 768;
        const threshold = isMobile ? 4 : 6; // Show toggle with fewer tags on mobile
        
        return colorTags.length > threshold;
    }
    
    // Function to update toggle state
    function updateToggleState() {
        const shouldShow = shouldShowToggle();
        
        if (shouldShow) {
            toggleBtn.style.display = 'flex';
            
            if (!isExpanded) {
                colorContainer.style.maxHeight = '120px'; // Smaller on mobile by default
                colorContainer.style.overflow = 'hidden';
            }
        } else {
            toggleBtn.style.display = 'none';
            colorContainer.style.maxHeight = 'none';
            colorContainer.style.overflow = 'visible';
        }
    }
    
    // Initialize toggle state
    updateToggleState();
    
    // Update on window resize
    window.addEventListener('resize', updateToggleState);
    
    // Toggle button click handler
    toggleBtn.addEventListener('click', function() {
        const isMobile = window.innerWidth <= 768;
        
        if (isExpanded) {
            // Collapse the container
            colorContainer.classList.remove('expanded');
            toggleText.textContent = 'Show More Colors';
            toggleIcon.className = 'fas fa-chevron-down';
            toggleBtn.classList.remove('expanded');
            colorContainer.style.maxHeight = isMobile ? '120px' : '150px';
        } else {
            // Expand the container
            colorContainer.classList.add('expanded');
            toggleText.textContent = 'Show Less';
            toggleIcon.className = 'fas fa-chevron-up';
            toggleBtn.classList.add('expanded');
            colorContainer.style.maxHeight = isMobile ? '300px' : '400px';
        }
        isExpanded = !isExpanded;
    });
}

// --- FUNCTION: Apply filters based on selected color ---
function applyFilters() {
    if (activeColor === 'all') {
        filteredProducts = [...currentCategoryProducts];
    } else {
        // Filter products based on color
        filteredProducts = currentCategoryProducts.filter(product => {
            // Get colors from product
            let productColors = [];
            
            if (product.colorTags && Array.isArray(product.colorTags)) {
                productColors = product.colorTags;
            } else if (product.colors && Array.isArray(product.colors)) {
                productColors = product.colors;
            } else if (product.color && typeof product.color === 'string') {
                productColors = product.color.split(/[,\/&]+/).map(c => c.trim());
            }
            
            // Normalize for comparison
            productColors = productColors.map(c => c.toLowerCase().replace(/[^a-z\s&]/g, ''));
            
            if (activeColor === 'other') {
                // Show products with no detected colors
                return productColors.length === 0;
            } else {
                // Check if product has this color combination
                const productColorKey = [...productColors].sort().join(' & ');
                const normalizedActiveColor = activeColor.replace(/-/g, ' & ');
                
                return productColorKey.includes(normalizedActiveColor) || 
                       productColors.some(color => color.includes(normalizedActiveColor.replace(' & ', ' ')));
            }
        });
    }
    
    // Reset for infinite scroll
    currentPage = 0;
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Re-render filtered products
    loadNextBatch();
    
    // Update product count
    updateProductCount();
}
// ============================================

// --- FUNCTION: Update product count display ---
function updateProductCount() {
    const countElement = document.getElementById('product-count');
    if (countElement) {
        const total = filteredProducts.length;
        const showing = Math.min(total, currentPage * pageSize);
        countElement.textContent = `Showing ${showing} of ${total} products`;
    }
}

// Initialize global search
function initSearch() {
    const searchInput = document.getElementById('global-search');
    const resultsContainer = document.getElementById('search-results');

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();

        if (searchTerm.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const allProducts = getAllProducts();
        const results = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        ).slice(0, 10);

        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(product => `
                <div class="search-result-item" onclick="navigateToProduct('${product.id}')">
                    <div class="search-result-img">
                        <i class="fas fa-tshirt"></i>
                    </div>
                    <div class="search-result-info">
                        <h4>${product.name}</h4>
                        <div class="price">${formatPrice(product.price)}</div>
                        <div class="category">${product.category.toUpperCase()}</div>
                    </div>
                </div>
            `).join('');
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No products found</div>';
            resultsContainer.style.display = 'block';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
}

// Navigate to product page or show details
function navigateToProduct(productId) {
    const product = findProductById(productId);
    if (!product) return;

    // For now, just show details in a modal
    showProductDetails(productId);
}

// Find product by ID
function findProductById(productId) {
    const allProducts = getAllProducts();
    return allProducts.find(p => p.id === productId);
}

// Show product details modal
function showProductDetails(productId) {
    const product = findProductById(productId);
    if (!product) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'product-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-body">
                <div class="modal-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300\" preserveAspectRatio=\"none\"><rect width=\"300\" height=\"300\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"18\" text-anchor=\"middle\">${product.name}</text></svg>'">
                </div>
                <div class="modal-info">
                    <h2>${product.name}</h2>
                    <div class="modal-price">${formatPrice(product.price)}</div>
                    <div class="modal-meta">
                        <p><strong>Category:</strong> ${product.category.toUpperCase()}</p>
                        <p><strong>Size:</strong> ${product.size || 'Standard'}</p>
                        <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                        ${product.colorTags ? `<p><strong>Colors:</strong> ${product.colorTags.join(', ')}</p>` : ''}
                    </div>
                    <p class="modal-description">${product.description}</p>
                    <button class="btn btn-primary add-to-cart-modal" onclick="addToCart('${product.id}'); closeModal();">
                        <i class="fas fa-shopping-bag"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .product-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                padding: 20px;
            }
            .modal-content {
                background: white;
                border-radius: 10px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            }
            .close-modal {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 28px;
                cursor: pointer;
                color: var(--text);
                z-index: 10;
            }
            .modal-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                padding: 30px;
            }
            .modal-image img {
                width: 100%;
                height: 300px;
                object-fit: cover;
                border-radius: 10px;
            }
            .modal-info h2 {
                margin-bottom: 15px;
                color: var(--primary);
            }
            .modal-price {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--primary);
                margin-bottom: 20px;
            }
            .modal-meta {
                margin-bottom: 20px;
                color: var(--text-light);
            }
            .modal-meta p {
                margin-bottom: 8px;
            }
            .modal-description {
                line-height: 1.6;
                margin-bottom: 25px;
            }
            .addToCart-modal, .add-to-cart-modal {
                width: 100%;
                padding: 15px;
                font-size: 1.1rem;
            }
            @media (max-width: 768px) {
                .modal-body {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Close modal functionality
    modal.querySelector('.close-modal').onclick = closeModal;
    modal.onclick = function(e) {
        if (e.target === modal) closeModal();
    };

    function closeModal() {
        document.body.removeChild(modal);
    }
}

// Quick view product
function quickView(productId) {
    showProductDetails(productId);
}

// --- NEW: infinite scroll trigger ---
window.addEventListener('scroll', () => {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    // Check if we've reached the bottom (with a small buffer)
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        loadNextBatch();
    }
});

// Helper function to format price
function formatPrice(price) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(price);
}

// Helper function to get all products
function getAllProducts() {
    const allProducts = [];
    for (const category in productsData) {
        if (Array.isArray(productsData[category])) {
            // Add category to each product for filtering
            const categoryProducts = productsData[category].map(product => ({
                ...product,
                category: category
            }));
            allProducts.push(...categoryProducts);
        }
    }
    return allProducts;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initStore();
    
    // Initialize infinite scroll for category pages
    if (document.getElementById('products-container')) {
        currentPage = 0;
        loadNextBatch();
    }
});
