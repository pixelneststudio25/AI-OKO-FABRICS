// Shopping Cart JavaScript
const CART_KEY = 'aioko-cart';

// Add item to cart
function addToCart(productId) {
    const product = findProductById(productId);
    if (!product) {
        alert('Product not found!');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            size: product.size || 'Standard'
        });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    
    // Show confirmation
    showCartNotification('Added to cart!');
}

// Remove item from cart
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    
    // Refresh cart display if on cart page
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
    
    showCartNotification('Removed from cart');
}

// Update item quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        
        // Refresh cart display if on cart page
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    }
}

// Display cart items on cart page
function displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartContainer || !cartSummary) return;
    
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to your cart</p>
                <a href="store.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        cartSummary.innerHTML = '';
        return;
    }
    
    // Display cart items
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"none\"><rect width=\"100\" height=\"100\" fill=\"%237D3CFF\"/><text x=\"50%\" y=\"50%\" dy=\".3em\" fill=\"white\" font-family=\"Montserrat\" font-size=\"10\" text-anchor=\"middle\">${item.name.substring(0, 10)}</text></svg>'">
            </div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-size">Size: ${item.size}</p>
                <p class="cart-item-price">${formatPrice(item.price)} each</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">
                ${formatPrice(item.price * item.quantity)}
            </div>
            <div class="cart-item-remove">
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50000 ? 0 : 2000; // Free shipping over ₦50,000
    const total = subtotal + shipping;
    
    // Display summary
    cartSummary.innerHTML = `
        <div class="summary-item">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-item">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
        </div>
        <div class="summary-item total">
            <span>Total</span>
            <span>${formatPrice(total)}</span>
        </div>
        <button class="btn btn-primary checkout-btn" onclick="proceedToCheckout()">
            Proceed to Checkout
        </button>
        <a href="store.html" class="continue-shopping">Continue Shopping</a>
    `;
}

// Proceed to checkout
function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // For now, redirect to WhatsApp with order details
    const orderDetails = cart.map(item => 
        `${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`
    ).join('%0A');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = total > 50000 ? 0 : 2000;
    const finalTotal = total + shipping;
    
    const message = `New Order from Ai-oko Fabrics Website%0A%0A${orderDetails}%0A%0ATotal: ${formatPrice(finalTotal)}%0A%0APlease contact customer for shipping details.`;
    
    window.open(`https://wa.me/2349060185654?text=${message}`, '_blank');
}

// Show cart notification
function showCartNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .cart-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--primary);
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notification-content i {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Initialize cart page
if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        displayCartItems();
        updateCartCount();
    });
}