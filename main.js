document.addEventListener('DOMContentLoaded', function() {
  // Print logic
  const nonFiscalToggle = document.getElementById('nonFiscalToggle');
  const nonFiscalLabel = document.getElementById('non-fiscal-label');
  const printBtn = document.getElementById('print-receipt-btn');
  const receiptPreview = document.getElementById('receipt-preview');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');

  if (printBtn) {
    printBtn.addEventListener('click', function() {
      // Show/hide NON FISCALE label based on toggle
      if (nonFiscalToggle && nonFiscalToggle.checked) {
        nonFiscalLabel.style.display = '';
        nonFiscalLabel.classList.add('text-danger');
      } else {
        nonFiscalLabel.style.display = 'none';
        nonFiscalLabel.classList.remove('text-danger');
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
      li.innerHTML = `
        <span>${service.name}</span>
        <span>
          ${service.price.toFixed(2)}€
          <button class ="btn btn-sm btn-danger ms-2 remove-service-btn" data-idx="${idx}">&times;</button>
        </span>
      `;
      selectedServices.appendChild(li);
    });
    totalDiv.textContent = `${total.toFixed(2)}€`;
    updateReceiptPreview();
  }

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
    if (awaitingDiscountType && !isNaN(value) && value > 0) {
      const subtotal = totalDiv.textContent.slice(0, -1);
      if (awaitingDiscountType === 'percent') {
        // Calculate discount on subtotal (excluding discounts/markups)
        const discount = subtotal * (value / 100);
        services.push({ name: `Sconto ${value}%`, price: -discount });
      } else if (awaitingDiscountType === 'euro') {
        services.push({ name: `Sconto €`, price: -value });
      } else if (awaitingDiscountType === 'markup') {
        services.push({ name: `Maggiorazione €`, price: value });
      } else if (awaitingDiscountType === 'markup-percent') {
        // Calculate markup on subtotal (excluding discounts/markups)
        const markup = subtotal * (value / 100);
        services.push({ name: `Maggiorazione ${value}%`, price: markup });
      } else if (awaitingDiscountType === 'markup-euro') {
        services.push({ name: `Maggiorazione €`, price: value });
      }
      updateServiceList();
      awaitingDiscountType = null;
      calcDisplay.classList.remove('border-danger');
      calcDisplay.value = 0;
      calcValue = 0; // Reset calculator
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

  // Initialize with empty list
  updateServiceList();
  updateCalcDisplay();

  const bewaTitle = document.getElementById('exampleModalLabel');

  if (nonFiscalToggle && bewaTitle) {
    nonFiscalToggle.addEventListener('change', function() {
      if (nonFiscalToggle.checked) {
        bewaTitle.classList.add('text-danger');
      } else {
        bewaTitle.classList.remove('text-danger');
      }
    });
  }
});

// Helper to get total
function getTotal() {
  return services.reduce((sum, s) => sum + s.price, 0);
}