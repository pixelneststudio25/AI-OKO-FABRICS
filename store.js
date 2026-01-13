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
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('aioko-cart')) || [];
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = cart.length;
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

    // Initialize sorting (kept as before, though it will sort the initially passed array)
    initSorting(filteredProducts, container);
}

// --- NEW FUNCTION: load next batch for infinite scroll ---
function loadNextBatch() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const start = currentPage * pageSize;
    const end = start + pageSize;
    const batch = filteredProducts.slice(start, end);

    batch.forEach(product => {
        container.insertAdjacentHTML('beforeend', renderProduct(product));
    });

    currentPage++;
}
// -------------------------------------------------------

// Initialize product sorting
function initSorting(products, container) {
    const sortSelect = document.getElementById('sort-by');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        const sortedProducts = [...products];

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
        container.innerHTML = sortedProducts.map(product => `
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
            </div>
        `).join('');
    });
}

// --- NEW FUNCTION: initialize color filter UI handlers ---
function initColorFilters() {
    const colorEls = document.querySelectorAll('.color-filters span');
    if (!colorEls.length) return;

    colorEls.forEach(btn => {
        btn.addEventListener('click', () => {
            // remove active from all
            colorEls.forEach(b => b.classList.remove('active'));
            // set active on clicked
            btn.classList.add('active');

            // update active color and apply filter
            activeColor = btn.dataset.color || 'all';
            applyFilters();
        });
    });
}
// -------------------------------------------------------

// --- NEW FUNCTION: apply filters ---
function applyFilters() {
    if (activeColor === 'all') {
        filteredProducts = [...currentCategoryProducts];
    } else {
        filteredProducts = currentCategoryProducts.filter(p =>
            Array.isArray(p.colors) && p.colors.includes(activeColor)
        );
    }

    // reset for infinite scroll
    currentPage = 0;
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';

    loadNextBatch();
}
// -------------------------------------------------------

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
        ).slice(0, 10); // Limit to 10 results

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

// Initialize category search
function initCategorySearch(category) {
    const searchInput = document.getElementById('category-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const productName = card.querySelector('h3').textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
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
            .addToCart-modal, .add-to-cart-modal { /* ensure compatibility */
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
    // small offset before reaching bottom
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        loadNextBatch();
    }
});
// -------------------------------------------------------

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initStore);
