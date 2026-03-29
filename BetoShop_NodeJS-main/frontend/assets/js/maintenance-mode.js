/**
 * BetoShop - Maintenance Mode Script
 * Intercepta clics en botones de compra/carrito y muestra modal de "Sitio en construcción"
 * Usa event delegation para capturar eventos en elementos dinámicos
 */
(function() {
  'use strict';

  const DATOS_CONTACTO = 'betostore72@gmail.com';

  const createMaintenanceModal = function() {
    if (document.getElementById('maintenanceModal')) {
      return;
    }

    const modalHTML = `
      <div class="modal fade" id="maintenanceModal" tabindex="-1" aria-labelledby="maintenanceModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
              <h5 class="modal-title" id="maintenanceModalLabel">
                <i class="fas fa-tools me-2"></i>Sitio en Construcción
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body text-center">
              <p class="lead">Estamos trabajando para mejorar tu experiencia de compra.</p>
              <p>Si desea realizar sus compras, contáctenos a:</p>
              <p class="fw-bold text-success">
                <i class="fas fa-envelope me-2"></i>${DATOS_CONTACTO}
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-success" data-bs-dismiss="modal">Entendido</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
  };

  const showMaintenanceModal = function() {
    createMaintenanceModal();
    const modalElement = document.getElementById('maintenanceModal');
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    } else {
      modalElement.style.display = 'block';
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-modal', 'true');
      modalElement.removeAttribute('aria-hidden');
      
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      
      const closeModal = function() {
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        backdrop.remove();
        modalElement.removeEventListener('click', handleModalClick);
        document.querySelectorAll('.btn-close[data-bs-dismiss="modal"], .btn-success[data-bs-dismiss="modal"]').forEach(btn => {
          btn.removeEventListener('click', closeModal);
        });
      };
      
      const handleModalClick = function(e) {
        if (e.target === modalElement || e.target.classList.contains('modal-content')) {
          closeModal();
        }
      };
      
      setTimeout(() => {
        modalElement.addEventListener('click', handleModalClick);
        document.querySelectorAll('.btn-close[data-bs-dismiss="modal"], .btn-success[data-bs-dismiss="modal"]').forEach(btn => {
          btn.addEventListener('click', closeModal);
        });
      }, 100);
    }
  };

  const isPurchaseAction = function(target) {
    if (target.closest('#contactForm')) {
      return false;
    }

    const purchaseSelectors = [
      'button.btn-success:not([type="submit"])',
      'a.btn-success',
      'button[onclick*="agregarAlCarrito"]',
      'button[onclick*="addToCart"]',
      'button[onclick*="comprar"]',
      'button[name="submit"][value="buy"]',
      'button[name="submit"][value="addtocard"]',
      'form[action*="/cart/add"]',
      'form[action*="/cart/"]',
      'a[href*="/cart"]',
      'a[href*="/checkout"]',
      'i.fas.fa-cart-plus',
      'i.fas.fa-shopping-cart',
      '.fa-cart-plus',
      '.fa-shopping-cart',
    ];

    for (const selector of purchaseSelectors) {
      if (target.matches(selector)) {
        return true;
      }
    }

    const form = target.closest('form');
    if (form) {
      const action = form.getAttribute('action') || '';
      const submit = form.querySelector('button[type="submit"]');
      if (action.includes('/cart') || action.includes('/checkout') || 
          (submit && (submit.value === 'buy' || submit.value === 'addtocard'))) {
        return true;
      }
    }

    return false;
  };

  const handlePurchaseClick = function(event) {
    const target = event.target;
    
    if (isPurchaseAction(target)) {
      event.preventDefault();
      event.stopPropagation();
      showMaintenanceModal();
      return false;
    }
  };

  const init = function() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        createMaintenanceModal();
        document.addEventListener('click', handlePurchaseClick, true);
      });
    } else {
      createMaintenanceModal();
      document.addEventListener('click', handlePurchaseClick, true);
    }

    const observeDynamicContent = function() {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              const purchaseButtons = node.querySelectorAll &&
                node.querySelectorAll('button.btn-success, a.btn-success, i.fas.fa-cart-plus, form[action*="/cart"]');
              if (purchaseButtons && purchaseButtons.length > 0) {
                createMaintenanceModal();
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    };

    if (typeof MutationObserver !== 'undefined') {
      observeDynamicContent();
    }
  };

  init();

  window.showMaintenanceModal = showMaintenanceModal;

})();
