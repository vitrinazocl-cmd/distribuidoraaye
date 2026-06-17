document.addEventListener('DOMContentLoaded', () => {
    
    // Elements - SPA
    const homeSection = document.getElementById('home-section');
    const storeSection = document.getElementById('store-section');
    const enterStoreBtns = document.querySelectorAll('.btnEnterStore');
    const counterBox = document.getElementById('counterBox');

    // Elements - Store
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const cartBadge = document.querySelector('.cart-badge');
    
    // State
    let cartCount = 0;

    // --- SPA Navigation ---
    if (enterStoreBtns.length > 0) {
        enterStoreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
            homeSection.style.display = 'none';
            storeSection.style.display = 'block';
            storeSection.style.animation = 'fadeIn 0.5s ease-out';
            window.scrollTo(0,0);
            });
        });
    }

    // --- Visitor Counter Logic ---
    if (counterBox) {
        let currentVisits = localStorage.getItem('ae_visits');
        if (!currentVisits) {
            currentVisits = 14258;
        } else {
            currentVisits = parseInt(currentVisits) + 1;
        }
        localStorage.setItem('ae_visits', currentVisits);

        const visitsString = currentVisits.toString().padStart(6, '0');
        for (let i = 0; i < visitsString.length; i++) {
            const digitSpan = document.createElement('span');
            digitSpan.classList.add('digit');
            digitSpan.textContent = visitsString[i];
            counterBox.appendChild(digitSpan);
        }
    }

    // Search Interaction
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            // Here you would normally redirect to search results page
            alert(`Buscando: ${query}`);
            searchInput.value = ''; // clear
        } else {
            searchInput.focus();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Add to Cart Interaction
    addToCartBtn.addEventListener('click', () => {
        // Increment cart
        cartCount++;
        cartBadge.textContent = cartCount;
        
        // Add a nice visual feedback
        addToCartBtn.innerHTML = `<span class="material-icons">check</span> ¡AÑADIDO!`;
        addToCartBtn.style.backgroundColor = '#38a169'; // Green success color
        
        // Reset button after 2 seconds
        setTimeout(() => {
            addToCartBtn.innerHTML = `<span class="material-icons">shopping_cart_checkout</span> AÑADIR AL CARRITO`;
            addToCartBtn.style.backgroundColor = ''; // Reset to CSS default
        }, 2000);
    });
    // Grid Products Interaction
    const gridBtns = document.querySelectorAll('.btn-grid-add');
    gridBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Increment cart
            cartCount++;
            cartBadge.textContent = cartCount;
            
            const originalText = this.innerHTML;
            this.innerHTML = `<span class="material-icons">check</span> ¡AÑADIDO!`;
            this.style.backgroundColor = '#38a169'; // Green
            this.style.borderColor = '#38a169';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.style.backgroundColor = '';
                this.style.borderColor = '';
                this.style.color = '';
            }, 1500);
        });
    });

    // --- Render Products ---
    const productGrid = document.getElementById('productGrid');
    if (productGrid && window.storeProducts) {
        window.storeProducts.forEach(product => {
            const formatter = new Intl.NumberFormat('es-CL');
            const priceStr = '$ ' + formatter.format(product.price);
            
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');
            
            gridItem.innerHTML = `
                <div class="grid-img-wrap">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h3>${product.name}</h3>
                <p class="grid-price">${priceStr}</p>
                <button class="btn-grid-add">
                    <span class="material-icons">add_shopping_cart</span> Añadir
                </button>
            `;
            
            const addBtn = gridItem.querySelector('.btn-grid-add');
            addBtn.addEventListener('click', () => {
                cartCount++;
                cartBadge.textContent = cartCount;
                cartBadge.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    cartBadge.style.transform = 'scale(1)';
                }, 200);
            });

            productGrid.appendChild(gridItem);
        });
    }

    // --- Initialize Main Slider (Swiper) ---
    const mainHeroSwiper = new Swiper('.mainHeroSwiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        effect: 'fade', // Optional fade effect
        fadeEffect: {
            crossFade: true
        }
    });

});
