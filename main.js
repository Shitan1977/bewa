document.addEventListener('DOMContentLoaded', function() {
  const nonFiscalToggle = document.getElementById('nonFiscalToggle');
  const nonFiscalLabel = document.getElementById('non-fiscal-label');
  const printBtn = document.getElementById('print-receipt-btn');
  const receiptPreview = document.getElementById('receipt-preview');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');
  let awaitingServiceIdx = null;

  const bewaTitle = document.getElementById('exampleModalLabel');

  let isNonFiscal = false;

  // Toggle non fiscale mode on BEWA click
  bewaTitle.addEventListener('click', function() {
    isNonFiscal = !isNonFiscal;
    bewaTitle.classList.toggle('text-danger', isNonFiscal);
  });

  // Show/hide NON FISCALE label on receipt preview when printing
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      if (isNonFiscal) {
        nonFiscalLabel.style.display = '';
      } else {
        nonFiscalLabel.style.display = 'none';
      }
      receiptPreview.classList.remove('d-none');
      window.print();
      receiptPreview.classList.add('d-none');
    });
  }

  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', function() {
      receiptPreview.classList.add('d-none');
    });
  }

  const selectedServices = document.getElementById('selected-services');
  const totalDiv = document.getElementById('total');
  let services = [];

  // For custom price workflow
  let awaitingCustomPrice = null;
  let awaitingDiscountType = null;

  // Handle fixed price service buttons
  document.querySelectorAll('.service-fixed').forEach(btn => {
    btn.addEventListener('click', function() {
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));
      services.push({ name, price });
      updateServiceList();
    });
  });

  // Handle custom price service button
  document.querySelectorAll('.service-custom').forEach(btn => {
    btn.addEventListener('click', function() {
      awaitingCustomPrice = btn.getAttribute('data-name');
      document.getElementById('calc-display').classList.add('border-danger');
    });
  });

  // Receipt preview elements
  const receiptItems = document.getElementById('receipt-items');
  const receiptTotal = document.getElementById('receipt-total');

  function updateServiceList() {
  selectedServices.innerHTML = '';
  let total = 0;
  services.forEach((service, idx) => {
    total += service.price;
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    if (service.editing) {
      li.innerHTML = `
        <span>
          <input type="text" class="form-control form-control-sm service-name-input" value="${service.name}" data-idx="${idx}" style="width: 160px; display:inline-block;">
        </span>
        <span>
          <input type="number" min="0" step="0.01" class="form-control form-control-sm service-price-input" value="${service.price.toFixed(2)}" data-idx="${idx}" style="width:80px; display:inline-block;">
          <button class="btn btn-sm btn-outline-success ms-1 discount-service-percent-btn" data-idx="${idx}" title="Sconto %">-%</button>
          <button class="btn btn-sm btn-outline-success ms-1 discount-service-euro-btn" data-idx="${idx}" title="Sconto €">-€</button>
          <button class="btn btn-sm btn-outline-primary ms-1 markup-service-percent-btn" data-idx="${idx}" title="Magg. %">+%</button>
          <button class="btn btn-sm btn-outline-primary ms-1 markup-service-euro-btn" data-idx="${idx}" title="Magg. €">+€</button>
          <button class="btn btn-sm btn-success ms-2 save-edit-btn" data-idx="${idx}" title="Salva">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
              <path d="M13.485 1.929a.75.75 0 0 1 1.06 1.06l-8 8a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l3.47 3.47 7.47-7.47z"/>
            </svg>
          </button>
        </span>
      `;
    } else {
      li.innerHTML = `
        <span>
          <span class="service-name">${service.name}</span>
        </span>
        <span>
          <span class="service-price" data-idx="${idx}">${service.price.toFixed(2)}€</span>
          <button class="btn btn-sm btn-outline-secondary ms-2 edit-service-btn" data-idx="${idx}" title="Modifica nome e prezzo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-danger ms-2 remove-service-btn" data-idx="${idx}">&times;</button>
        </span>
      `;
    }
    selectedServices.appendChild(li);
  });
  totalDiv.textContent = `${total.toFixed(2)}€`;
  updateReceiptPreview();


    // Edit logic
    selectedServices.querySelectorAll('.edit-service-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(btn.getAttribute('data-idx'));
        services[idx].editing = true;
        updateServiceList();
        setTimeout(() => {
          const nameInput = selectedServices.querySelector('.service-name-input[data-idx="' + idx + '"]');
          if (nameInput) nameInput.focus();
        }, 0);
      });
    });

    // Save logic (on save button, blur, or Enter)
    selectedServices.querySelectorAll('.save-edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const nameInput = selectedServices.querySelector('.service-name-input[data-idx="' + idx + '"]');
        const priceInput = selectedServices.querySelector('.service-price-input[data-idx="' + idx + '"]');
        if (nameInput && priceInput) {
          services[idx].name = nameInput.value;
          let newPrice = parseFloat(priceInput.value.replace(',', '.'));
          if (!isNaN(newPrice) && newPrice >= 0) {
            services[idx].price = newPrice;
          }
          services[idx].editing = false;
          updateServiceList();
        }
      });
    });

    // Also save on blur or Enter
    selectedServices.querySelectorAll('.service-name-input, .service-price-input').forEach(input => {
      input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
          const idx = parseInt(input.getAttribute('data-idx'));
          const nameInput = selectedServices.querySelector('.service-name-input[data-idx="' + idx + '"]');
          const priceInput = selectedServices.querySelector('.service-price-input[data-idx="' + idx + '"]');
          if (nameInput && priceInput) {
            services[idx].name = nameInput.value;
            let newPrice = parseFloat(priceInput.value.replace(',', '.'));
            if (!isNaN(newPrice) && newPrice >= 0) {
              services[idx].price = newPrice;
            }
            services[idx].editing = false;
            updateServiceList();
          }
        }
      });
    });
  }

  selectedServices.addEventListener('click', function(e) {
    const idx = parseInt(e.target.closest('button').getAttribute('data-idx'));
    if (e.target.classList.contains('remove-service-btn')) {
      services.splice(idx, 1);
      updateServiceList();
    }
    // Edit price
    if (e.target.classList.contains('edit-service-btn') || e.target.closest('.edit-service-btn')) {
      const priceSpan = selectedServices.querySelector(`.service-price[data-idx="${idx}"]`);
      const oldPrice = services[idx].price;
      priceSpan.innerHTML = `<input type="number" min="0" step="0.01" class="form-control form-control-sm service-price-input" value="${oldPrice.toFixed(2)}" style="width:80px;display:inline-block;">`;
      const input = priceSpan.querySelector('input');
      input.focus();
      input.addEventListener('blur', function() {
        let newPrice = parseFloat(input.value.replace(',', '.'));
        if (!isNaN(newPrice) && newPrice >= 0) {
          services[idx].price = newPrice;
        }
        updateServiceList();
      });
      input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') input.blur();
      });
    }
    // Discount/markup for single service
    if (e.target.classList.contains('discount-service-percent-btn')) {
      awaitingDiscountType = 'service-discount-percent';
      awaitingServiceIdx = idx;
      calcDisplay.classList.add('border-danger');
    }
    if (e.target.classList.contains('discount-service-euro-btn')) {
      awaitingDiscountType = 'service-discount-euro';
      awaitingServiceIdx = idx;
      calcDisplay.classList.add('border-danger');
    }
    if (e.target.classList.contains('markup-service-percent-btn')) {
      awaitingDiscountType = 'service-markup-percent';
      awaitingServiceIdx = idx;
      calcDisplay.classList.add('border-danger');
    }
    if (e.target.classList.contains('markup-service-euro-btn')) {
      awaitingDiscountType = 'service-markup-euro';
      awaitingServiceIdx = idx;
      calcDisplay.classList.add('border-danger');
    }
  });

  function updateReceiptPreview() {
    receiptItems.innerHTML = '';
    let total = 0;
    services.forEach(service => {
      total += service.price;
      const div = document.createElement('div');
      div.className = 'd-flex justify-content-between border-bottom';
      div.innerHTML = `<span>${service.name}</span><span>${service.price.toFixed(2)}€</span>`;
      receiptItems.appendChild(div);
    });
    receiptTotal.textContent = `Totale: ${total.toFixed(2)}€`;
  }

  selectedServices.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-service-btn')) {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      services.splice(idx, 1);
      updateServiceList();
    }
  });

  // Calculator logic for AREA 2
  const calcDisplay = document.getElementById('calc-display');
  const calcBtns = document.querySelectorAll('.calc-btn');
  const calcClearBtn = document.getElementById('calc-clear-btn');
  const calcEqualsBtn = document.getElementById('calc-equals-btn');

  let calcValue = 0;
  let calcTimeout = null;

  function updateCalcDisplay() {
    calcDisplay.value = calcValue;
  }

  calcBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const val = btn.getAttribute('data-value');
      if (calcValue === 0 && val !== '.' && !isNaN(val)) {
        calcValue = val;
      } else {
        calcValue += val;
      }
      updateCalcDisplay();
    });
  });

  calcClearBtn.addEventListener('mousedown', function() {
    calcTimeout = setTimeout(() => {
      // Long press: reset everything
      calcValue = 0;
      updateCalcDisplay();
      // Reset receipt
      services = [];
      updateServiceList();
    }, 2000); // 2 seconds
  });

  calcClearBtn.addEventListener('mouseup', function() {
    if (calcTimeout) {
      clearTimeout(calcTimeout);
      // Short press: delete last digit
      if (calcValue.length > 1) {
        calcValue = calcValue.slice(0, -1);
      } else {
        calcValue = 0;
      }
      updateCalcDisplay();
    }
  });

  calcClearBtn.addEventListener('mouseleave', function() {
    if (calcTimeout) clearTimeout(calcTimeout);
  });

  calcEqualsBtn.addEventListener('click', function() {
    try {
      // Evaluate the expression safely
      let result = eval(calcValue.replace(/[^-()\d/*+.]/g, ''));
      calcValue = result.toString();
      updateCalcDisplay();
    } catch {
      calcValue = 'Errore';
      updateCalcDisplay();
      setTimeout(() => {
        calcValue = 0;
        updateCalcDisplay();
      }, 1000);
    }
  });

  // Calculator logic (add this after your calculator = button logic)
  calcEqualsBtn.addEventListener('click', function() {
    let value = parseFloat(calcDisplay.value.replace(',', '.'));
    if (awaitingCustomPrice && !isNaN(value) && value > 0) {
      services.push({ name: awaitingCustomPrice, price: value });
      updateServiceList();
      awaitingCustomPrice = null;
      calcDisplay.classList.remove('border-danger');
      calcDisplay.value = 0;
      calcValue = 0;
      return;
    }
    if (awaitingDiscountType && awaitingServiceIdx !== null && !isNaN(value) && value > 0) {
      let s = services[awaitingServiceIdx];
      if (awaitingDiscountType === 'service-discount-percent') {
        s.price = s.price - (s.price * value / 100);
      } else if (awaitingDiscountType === 'service-discount-euro') {
        s.price = s.price - value;
      } else if (awaitingDiscountType === 'service-markup-percent') {
        s.price = s.price + (s.price * value / 100);
      } else if (awaitingDiscountType === 'service-markup-euro') {
        s.price = s.price + value;
      }
      // Prevent negative price
      if (s.price < 0) s.price = 0;
      updateServiceList();
      awaitingDiscountType = null;
      awaitingServiceIdx = null;
      calcDisplay.classList.remove('border-danger');
      calcDisplay.value = 0;
      calcValue = 0;
      return;
    }
  });

  // AREA 4 buttons
  const discountPercentBtn = document.getElementById('discount-percent-btn');
  const discountEuroBtn = document.getElementById('discount-euro-btn');
  const markupBtn = document.getElementById('markup-btn');
  const markupPercentBtn = document.getElementById('markup-percent-btn'); // NEW
  const markupEuroBtn = document.getElementById('markup-euro-btn');

  if (discountPercentBtn) {
    discountPercentBtn.addEventListener('click', function() {
      awaitingDiscountType = 'percent';
      calcDisplay.classList.add('border-danger');
    });
  }
  if (discountEuroBtn) {
    discountEuroBtn.addEventListener('click', function() {
      awaitingDiscountType = 'euro';
      calcDisplay.classList.add('border-danger');
    });
  }
  if (markupBtn) {
    markupBtn.addEventListener('click', function() {
      awaitingDiscountType = 'markup';
      calcDisplay.classList.add('border-danger');
    });
  }
  if (markupPercentBtn) {
    markupPercentBtn.addEventListener('click', function() {
      awaitingDiscountType = 'markup-percent';
      calcDisplay.classList.add('border-danger');
    });
  }
  if (markupEuroBtn) {
    markupEuroBtn.addEventListener('click', function() {
      awaitingDiscountType = 'markup-euro';
      calcDisplay.classList.add('border-danger');
    });
  }

  const openServiceBtn = document.getElementById('open-service-search');
  const openProductBtn = document.getElementById('open-product-search');
  const searchBarContainer = document.getElementById('search-bar-container');
  const serviceSearch = document.getElementById('service-search');
  const serviceSuggestions = document.getElementById('service-suggestions');

  let searchMode = 'services'; // or 'products'

  // Example static lists
  const availableServices = [
    { name: "Taglio", price: 20 },
    { name: "Piega", price: 15 },
    { name: "Shampoo", price: 8 },
    { name: "Colore", price: 30 },
    { name: "Barba", price: 10 }
  ];
  const availableProducts = [
    { name: "Gel", price: 5 },
    { name: "Lacca", price: 7 },
    { name: "Shampoo Bottiglia", price: 12 }
  ];

  openServiceBtn.addEventListener('click', function() {
    searchMode = 'services';
    searchBarContainer.style.display = '';
    serviceSearch.placeholder = "Cerca servizio...";
    serviceSearch.value = '';
    serviceSuggestions.style.display = 'none';
    serviceSearch.focus();
  });

  openProductBtn.addEventListener('click', function() {
    searchMode = 'products';
    searchBarContainer.style.display = '';
    serviceSearch.placeholder = "Cerca prodotto...";
    serviceSearch.value = '';
    serviceSuggestions.style.display = 'none';
    serviceSearch.focus();
  });

  // Autocomplete logic (update to use searchMode)
  serviceSearch.addEventListener('input', function() {
    const query = serviceSearch.value.trim().toLowerCase();
    serviceSuggestions.innerHTML = '';
    let suggestionIndex = -1;
    let currentMatches = [];
    const list = searchMode === 'services' ? availableServices : availableProducts;
    if (!query) {
      serviceSuggestions.style.display = 'none';
      return;
    }
    currentMatches = list.filter(s => s.name.toLowerCase().includes(query));
    if (currentMatches.length === 0) {
      serviceSuggestions.style.display = 'none';
      return;
    }
    currentMatches.forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item list-group-item-action';
      li.textContent = `${s.name} - €${s.price.toFixed(2)}`;
      li.tabIndex = 0;
      li.addEventListener('click', function() {
        services.push({ name: s.name, price: s.price });
        updateServiceList();
        serviceSearch.value = '';
        serviceSuggestions.style.display = 'none';
        searchBarContainer.style.display = 'none';
      });
      serviceSuggestions.appendChild(li);
    });
    serviceSuggestions.style.display = 'block';
  });

  // Hide search bar when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchBarContainer.contains(e.target) && !openServiceBtn.contains(e.target) && !openProductBtn.contains(e.target)) {
      searchBarContainer.style.display = 'none';
      serviceSuggestions.style.display = 'none';
    }
  });

  let cClickCount = 0;
  let cClickTimer = null;

  const reportModal = document.getElementById('reportModal');
  const reportContent = document.getElementById('report-content');

  if (calcClearBtn) {
    calcClearBtn.addEventListener('click', function() {
      cClickCount++;
      if (cClickTimer) clearTimeout(cClickTimer);
      cClickTimer = setTimeout(() => { cClickCount = 0; }, 500); // Reset after 1.5s

      if (cClickCount === 3) {
        cClickCount = 0;
        showReportModal();
      }
    });
  }

  function showReportModal() {
    let totalReceipts = 1;
    let totalAmount = services.reduce((sum, s) => sum + s.price, 0);
    let serviceCount = {};
    services.forEach(s => {
      serviceCount[s.name] = (serviceCount[s.name] || 0) + 1;
    });
    let mostUsed = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0] || ["-", 0];

    reportContent.innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>Numero scontrini correnti:</strong> ${totalReceipts}</li>
        <li class="list-group-item"><strong>Totale importo corrente:</strong> ${totalAmount.toFixed(2)}€</li>
        <li class="list-group-item"><strong>Servizio più usato:</strong> ${mostUsed[0]} (${mostUsed[1]} volte)</li>
      </ul>
      <div class="mt-3 text-muted small">Questa funzione è riservata agli operatori.</div>
    `;
    const modal = new bootstrap.Modal(reportModal);
    modal.show();
  }
  updateServiceList();
  updateCalcDisplay();

  const resetBtn = document.getElementById('reset-receipt-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      services = [];
      updateServiceList();
    });
  }
});
