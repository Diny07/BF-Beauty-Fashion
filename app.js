/* ==========================================================================
   BF Beauty & Fashion — Controller UI & Logika Aplikasi
   ========================================================================== */

(function (global) {
  var DATA = global.BF_DATA;
  var STORE = global.BF_STORAGE;

  var ui = {
    activeTab: 'home',
    categoryFilter: 'all',
    sortBy: 'popular',
    searchQuery: '',
    activeBookingCode: (STORE.state.bookings[0] && STORE.state.bookings[0].code) || '#BF-9042',
    selectedDayId: (STORE.state.bookings[0] && STORE.state.bookings[0].fittingDateId) || '2026-11-01',
    selectedTimeSlot: (STORE.state.bookings[0] && STORE.state.bookings[0].fittingTime) || '11:00 WIB',
    fittingDressChoice:
      (STORE.state.bookings[0] && STORE.state.bookings[0].itemsSummary[0]) ||
      DATA.PRODUCTS[0].title,
    modalProductId: null,
    modalSelectedSize: 'S',
    toastTimer: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    var toastEl = $('toast');
    var textEl = $('toastText');
    if (!toastEl || !textEl) return;

    textEl.textContent = message;
    toastEl.classList.remove('hidden');

    if (ui.toastTimer) {
      global.clearTimeout(ui.toastTimer);
    }
    ui.toastTimer = global.setTimeout(function () {
      toastEl.classList.add('hidden');
    }, 2800);
  }

  /* ========================================================================
     1. NAVIGASI TAB & HEADER
     ======================================================================== */

  function switchTab(tabName) {
    ui.activeTab = tabName;

    var pages = {
      home: $('pageHome'),
      catalog: $('pageCatalog'),
      fitting: $('pageFitting'),
      cart: $('pageCart'),
      profile: $('pageProfile')
    };

    Object.keys(pages).forEach(function (key) {
      if (pages[key]) {
        pages[key].classList.toggle('hidden', key !== tabName);
        pages[key].classList.toggle('active', key === tabName);
      }
    });

    document.querySelectorAll('[data-nav]').forEach(function (btn) {
      if (btn.classList.contains('nav-link') || btn.classList.contains('bottom-nav-btn')) {
        btn.classList.toggle('active', btn.getAttribute('data-nav') === tabName);
      }
    });

    var searchSection = $('searchSection');
    if (searchSection) {
      var showSearch = tabName === 'home' || tabName === 'catalog';
      searchSection.classList.toggle('hidden', !showSearch);
    }

    closeNotifDropdown();
    global.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHeaderBadges() {
    var totals = STORE.getCartTotals();
    if ($('headerCartCount')) $('headerCartCount').textContent = String(totals.totalCount);

    var mobileBadge = $('mobileCartBadge');
    if (mobileBadge) {
      mobileBadge.textContent = String(totals.totalCount);
      mobileBadge.classList.toggle('hidden', totals.totalCount === 0);
    }

    var unreadCount = STORE.state.notifications.filter(function (n) {
      return !n.read;
    }).length;
    if ($('notifDot')) {
      $('notifDot').classList.toggle('hidden', unreadCount === 0);
    }
  }

  function renderNotifications() {
    var listEl = $('notifList');
    if (!listEl) return;

    listEl.innerHTML = STORE.state.notifications
      .map(function (n) {
        return (
          '<div class="notif-item">' +
          '<p class="notif-item-title">' + escapeHtml(n.title) + '</p>' +
          '<p class="notif-item-detail">' + escapeHtml(n.detail) + '</p>' +
          '</div>'
        );
      })
      .join('');
  }

  function closeNotifDropdown() {
    var dd = $('notifDropdown');
    if (dd) dd.classList.add('hidden');
  }

  /* ========================================================================
     2. KATALOG, FILTER & PENCARIAN
     ======================================================================== */

  function getFilteredProducts() {
    var q = ui.searchQuery.trim().toLowerCase();

    var filtered = DATA.PRODUCTS.filter(function (p) {
      var matchesCategory = ui.categoryFilter === 'all' || p.category === ui.categoryFilter;
      var matchesSearch =
        !q ||
        p.title.toLowerCase().indexOf(q) !== -1 ||
        p.desc.toLowerCase().indexOf(q) !== -1 ||
        p.categoryLabel.toLowerCase().indexOf(q) !== -1;
      return matchesCategory && matchesSearch;
    });

    var sorted = filtered.slice();
    if (ui.sortBy === 'price-asc') {
      sorted.sort(function (a, b) { return a.price - b.price; });
    } else if (ui.sortBy === 'price-desc') {
      sorted.sort(function (a, b) { return b.price - a.price; });
    } else {
      sorted.sort(function (a, b) { return parseFloat(b.rating) - parseFloat(a.rating); });
    }

    return sorted;
  }

  function createProductCardElement(product) {
    var favActive = STORE.isFavorite(product.id);
    var card = document.createElement('article');
    card.className = 'product-card';

    card.innerHTML =
      '<div>' +
        '<div class="card-media" data-open-modal="' + product.id + '">' +
          '<img src="' + escapeHtml(product.img) + '" alt="' + escapeHtml(product.title) + '" />' +
          '<span class="card-rating tabular-nums">&#9733; ' + escapeHtml(product.rating) + '</span>' +
          '<button type="button" class="fav-circle-btn ' + (favActive ? 'is-fav' : '') + '" data-toggle-fav="' + product.id + '" aria-label="Favorit">&#9829;</button>' +
        '</div>' +
        '<p class="card-cat">' + escapeHtml(product.categoryLabel) + '</p>' +
        '<h3 class="card-title-sm" data-open-modal="' + product.id + '">' + escapeHtml(product.title) + '</h3>' +
        '<p class="card-price tabular-nums">' + DATA.formatRupiah(product.price) + '</p>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button type="button" class="btn-detail" data-open-modal="' + product.id + '">Detail</button>' +
        '<button type="button" class="btn-add-sm" data-quick-add="' + product.id + '" aria-label="Tambah ke keranjang">+</button>' +
      '</div>';

    var imgEl = card.querySelector('img');
    if (imgEl) {
      imgEl.addEventListener('error', function () {
        var media = imgEl.parentNode;
        if (media) {
          imgEl.remove();
          var fallback = document.createElement('div');
          fallback.className = 'img-fallback';
          fallback.textContent = product.title;
          media.insertBefore(fallback, media.firstChild);
        }
      });
    }

    return card;
  }

  function syncFilterTabButtons() {
    document.querySelectorAll('.filter-btn[data-category]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-category') === ui.categoryFilter);
    });
  }

  function renderProductGrids() {
    var items = getFilteredProducts();
    var homeGrid = $('homeProductGrid');
    var catalogGrid = $('catalogProductGrid');
    var homeEmpty = $('homeEmptyState');
    var catalogEmpty = $('catalogEmptyState');

    if ($('totalProductCount')) {
      $('totalProductCount').textContent = String(DATA.PRODUCTS.length);
    }
    if ($('catalogCountLabel')) {
      $('catalogCountLabel').textContent =
        items.length + ' dari ' + DATA.PRODUCTS.length + ' koleksi tersedia';
    }

    if (homeGrid) {
      homeGrid.innerHTML = '';
      items.forEach(function (p) {
        homeGrid.appendChild(createProductCardElement(p));
      });
    }
    if (catalogGrid) {
      catalogGrid.innerHTML = '';
      items.forEach(function (p) {
        catalogGrid.appendChild(createProductCardElement(p));
      });
    }

    if (homeEmpty) homeEmpty.classList.toggle('hidden', items.length > 0);
    if (catalogEmpty) catalogEmpty.classList.toggle('hidden', items.length > 0);

    syncFilterTabButtons();
  }

  function resetFilters() {
    ui.categoryFilter = 'all';
    ui.searchQuery = '';
    if ($('searchInput')) $('searchInput').value = '';
    if ($('btnClearSearch')) $('btnClearSearch').classList.add('hidden');
    renderProductGrids();
  }

  /* ========================================================================
     3. MODAL DETAIL PRODUK
     ======================================================================== */

  function openProductModal(productId) {
    var product = DATA.getProductById(productId);
    if (!product) return;

    ui.modalProductId = product.id;
    ui.modalSelectedSize = product.sizes[0] || 'S';

    var modal = $('productModal');
    var img = $('modalImg');

    if (img) {
      img.src = product.img;
      img.alt = product.title;
      img.onerror = function () {
        img.alt = product.title;
      };
    }

    if ($('modalCategory')) $('modalCategory').textContent = product.categoryLabel;
    if ($('modalRating')) $('modalRating').textContent = product.rating;
    if ($('modalDuration')) $('modalDuration').textContent = product.rentalDuration;
    if ($('modalTitle')) $('modalTitle').textContent = product.title;
    if ($('modalPrice')) $('modalPrice').textContent = DATA.formatRupiah(product.price) + ' / minggu';
    if ($('modalDesc')) $('modalDesc').textContent = product.desc;

    updateModalFavoriteButton();
    renderModalSizeOptions(product.sizes);

    if (modal) modal.classList.remove('hidden');
  }

  function closeProductModal() {
    var modal = $('productModal');
    if (modal) modal.classList.add('hidden');
    ui.modalProductId = null;
  }

  function updateModalFavoriteButton() {
    var btn = $('btnModalFav');
    if (!btn || ui.modalProductId === null) return;
    btn.classList.toggle('is-fav', STORE.isFavorite(ui.modalProductId));
  }

  function renderModalSizeOptions(sizes) {
    var grid = $('modalSizesGrid');
    if (!grid) return;

    grid.innerHTML = sizes
      .map(function (size) {
        var active = size === ui.modalSelectedSize;
        return (
          '<button type="button" class="size-btn ' + (active ? 'active' : '') + '" data-size="' + escapeHtml(size) + '">' +
          escapeHtml(size) +
          '</button>'
        );
      })
      .join('');
  }

  /* ========================================================================
     4. FITTING & KALENDER RESERVASI
     ======================================================================== */

  function getActiveBooking() {
    var list = STORE.state.bookings;
    return (
      list.find(function (b) { return b.code === ui.activeBookingCode; }) ||
      list[0] ||
      null
    );
  }

  function renderFittingPage() {
    var bookings = STORE.state.bookings;
    var active = getActiveBooking();
    if (active) ui.activeBookingCode = active.code;

    // Selector multi-booking jika lebih dari 1
    var selectorEl = $('bookingSelector');
    if (selectorEl) {
      selectorEl.classList.toggle('hidden', bookings.length <= 1);
      selectorEl.innerHTML = bookings
        .map(function (b) {
          var isSel = active && b.code === active.code;
          return (
            '<button type="button" class="booking-chip tabular-nums ' + (isSel ? 'active' : '') + '" data-select-booking="' + escapeHtml(b.code) + '">' +
            escapeHtml(b.code) + ' &middot; ' + escapeHtml(b.fittingDateLabel) +
            '</button>'
          );
        })
        .join('');
    }

    // Tracker active booking
    if (active) {
      if ($('trackerCode')) $('trackerCode').textContent = 'Reservasi ' + active.code;
      if ($('trackerStatusLabel')) {
        $('trackerStatusLabel').textContent = DATA.STEP_STATUS_LABELS[active.statusStep] || '';
      }
      if ($('trackerCustomer')) {
        $('trackerCustomer').textContent = active.customerName + ' · ' + active.whatsapp;
      }
      if ($('trackerSchedule')) {
        $('trackerSchedule').textContent = active.fittingDateLabel + ' (' + active.fittingTime + ')';
      }
      if ($('trackerItems')) {
        $('trackerItems').textContent = active.itemsSummary.join(', ');
      }
      if ($('trackerEventDate')) {
        $('trackerEventDate').textContent = 'Hari-H: ' + active.eventDate;
      }

      var notesEl = $('trackerNotes');
      if (notesEl) {
        notesEl.classList.toggle('hidden', !active.notes);
        notesEl.textContent = active.notes ? 'Catatan: ' + active.notes : '';
      }

      var stepsEl = $('fittingSteps');
      if (stepsEl) {
        stepsEl.innerHTML = [1, 2, 3, 4]
          .map(function (step) {
            var done = step <= active.statusStep;
            var current = step === active.statusStep;
            var label = step < active.statusStep ? '&#10003;' : String(step);
            return (
              '<div class="step-circle tabular-nums ' +
              (done ? 'done ' : '') +
              (current ? 'current' : '') +
              '">' +
              label +
              '</div>'
            );
          })
          .join('');
      }
    }

    // Dropdown pilihan busana fitting
    var dressSelect = $('fittingDressSelect');
    if (dressSelect) {
      dressSelect.innerHTML = DATA.PRODUCTS.map(function (p) {
        var selected = ui.fittingDressChoice.indexOf(p.title) !== -1 ? 'selected' : '';
        return (
          '<option value="' + escapeHtml(p.title) + '" ' + selected + '>' +
          escapeHtml(p.title) + ' (' + escapeHtml(p.categoryLabel) + ')' +
          '</option>'
        );
      }).join('');
    }

    renderCalendarAndTimeSlots();
  }

  function renderCalendarAndTimeSlots() {
    var calGrid = $('calendarGrid');
    if (calGrid) {
      var headersHtml = DATA.WEEKDAYS.map(function (day) {
        return '<span class="calendar-weekday">' + day + '</span>';
      }).join('');

      var daysHtml = DATA.FITTING_CALENDAR_DAYS.map(function (slot) {
        var isSel = slot.id === ui.selectedDayId;
        var label = slot.dayNum < 10 ? '0' + slot.dayNum : String(slot.dayNum);
        return (
          '<button type="button" class="calendar-day tabular-nums ' +
          (isSel ? 'active' : '') +
          '" data-day-id="' + slot.id + '" ' +
          (!slot.available ? 'disabled' : '') +
          '>' +
          label +
          '</button>'
        );
      }).join('');

      calGrid.innerHTML = headersHtml + daysHtml;
    }

    var timeGrid = $('timeSlotsGrid');
    if (timeGrid) {
      timeGrid.innerHTML = DATA.TIME_SLOTS.map(function (time) {
        var isSel = time === ui.selectedTimeSlot;
        return (
          '<button type="button" class="time-slot-btn tabular-nums ' +
          (isSel ? 'active' : '') +
          '" data-time-slot="' + time + '">' +
          time.replace(' WIB', '') +
          '</button>'
        );
      }).join('');
    }

    var dayObj =
      DATA.FITTING_CALENDAR_DAYS.find(function (d) { return d.id === ui.selectedDayId; }) ||
      DATA.FITTING_CALENDAR_DAYS[6];
    if ($('selectedScheduleText')) {
      $('selectedScheduleText').textContent =
        dayObj.fullDateLabel + ' (' + ui.selectedTimeSlot + ')';
    }
  }

  /* ========================================================================
     5. KERANJANG & CHECKOUT RESERVASI
     ======================================================================== */

  function renderCartPage() {
    var totals = STORE.getCartTotals();
    var cartListEl = $('cartItemsList');
    var contentGrid = $('cartContentGrid');
    var emptyEl = $('cartEmptyState');

    if ($('cartPageCount')) $('cartPageCount').textContent = totals.totalCount + ' Item';

    if (STORE.state.cart.length === 0) {
      if (contentGrid) contentGrid.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      renderHeaderBadges();
      return;
    }

    if (contentGrid) contentGrid.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');

    if (cartListEl) {
      cartListEl.innerHTML = STORE.state.cart
        .map(function (item) {
          var product = DATA.getProductById(item.productId);
          if (!product) return '';
          return (
            '<div class="cart-item">' +
              '<div class="cart-thumb">' +
                '<img src="' + escapeHtml(product.img) + '" alt="' + escapeHtml(product.title) + '" />' +
              '</div>' +
              '<div class="cart-info">' +
                '<h3>' + escapeHtml(product.title) + '</h3>' +
                '<p class="muted-small">Ukuran ' + escapeHtml(item.size) + ' &middot; ' + escapeHtml(product.rentalDuration) + '</p>' +
                '<div class="cart-info-bottom">' +
                  '<strong class="card-price tabular-nums">' + DATA.formatRupiah(product.price * item.quantity) + '</strong>' +
                  '<div class="qty-stepper">' +
                    '<button type="button" class="qty-btn" data-qty-delta="-1" data-item-id="' + escapeHtml(item.id) + '" aria-label="Kurangi">&minus;</button>' +
                    '<span class="tabular-nums">' + item.quantity + '</span>' +
                    '<button type="button" class="qty-btn" data-qty-delta="1" data-item-id="' + escapeHtml(item.id) + '" aria-label="Tambah">+</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="trash-btn" data-remove-cart="' + escapeHtml(item.id) + '" aria-label="Hapus item">Hapus</button>' +
            '</div>'
          );
        })
        .join('');
    }

    if ($('cartSubtotal')) $('cartSubtotal').textContent = DATA.formatRupiah(totals.subtotal);
    if ($('cartDeposit')) $('cartDeposit').textContent = DATA.formatRupiah(totals.deposit);
    if ($('cartTotal')) $('cartTotal').textContent = DATA.formatRupiah(totals.totalEstimate);

    syncCheckoutDefaultFields();
    renderHeaderBadges();
  }

  function syncCheckoutDefaultFields() {
    if ($('chkName') && !$('chkName').value) $('chkName').value = STORE.state.profile.name;
    if ($('chkPhone') && !$('chkPhone').value) $('chkPhone').value = STORE.state.profile.phone;
    if ($('chkEventDate') && !$('chkEventDate').value) $('chkEventDate').value = '2026-11-22';
  }

  /* ========================================================================
     6. PROFIL, FAVORIT & KONSULTASI STYLIST
     ======================================================================== */

  function renderProfilePage() {
    var prof = STORE.state.profile;
    var initials = prof.name
      .split(' ')
      .filter(Boolean)
      .map(function (w) { return w[0]; })
      .slice(0, 2)
      .join('')
      .toUpperCase();

    if ($('profileAvatar')) $('profileAvatar').textContent = initials || 'BF';
    if ($('profileName')) $('profileName').textContent = prof.name;
    if ($('profileMeta')) $('profileMeta').textContent = prof.email + ' · ' + prof.tier;
    if ($('profileBookingCount')) $('profileBookingCount').textContent = String(STORE.state.bookings.length);

    var favProducts = DATA.PRODUCTS.filter(function (p) {
      return STORE.isFavorite(p.id);
    });

    if ($('profileFavCount')) $('profileFavCount').textContent = favProducts.length + ' item';

    var favListEl = $('profileFavList');
    if (favListEl) {
      if (favProducts.length === 0) {
        favListEl.innerHTML =
          '<p class="muted-small">Belum ada koleksi favorit yang disimpan. Ketuk ikon hati pada produk untuk menyimpannya.</p>';
      } else {
        favListEl.innerHTML = favProducts
          .map(function (p) {
            return (
              '<button type="button" class="fav-item" data-open-modal="' + p.id + '">' +
                '<div class="fav-item-left">' +
                  '<div class="fav-thumb">' +
                    '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.title) + '" />' +
                  '</div>' +
                  '<div>' +
                    '<p class="card-title-sm">' + escapeHtml(p.title) + '</p>' +
                    '<p class="card-price tabular-nums">' + DATA.formatRupiah(p.price) + '</p>' +
                  '</div>' +
                '</div>' +
                '<span class="chevron">&rsaquo;</span>' +
              '</button>'
            );
          })
          .join('');
      }
    }
  }

  function openStylistModal() {
    if ($('stylistName')) $('stylistName').value = STORE.state.profile.name;
    if ($('stylistPhone')) $('stylistPhone').value = STORE.state.profile.phone;
    if ($('stylistModal')) $('stylistModal').classList.remove('hidden');
  }

  function closeStylistModal() {
    if ($('stylistModal')) $('stylistModal').classList.add('hidden');
  }

  /* ========================================================================
     7. EVENT LISTENERS & INISIALISASI
     ======================================================================== */

  function bindGlobalEvents() {
    // Delegasi klik umum
    document.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        switchTab(navBtn.getAttribute('data-nav'));
        return;
      }

      var filterBtn = e.target.closest('.filter-btn[data-category]');
      if (filterBtn) {
        ui.categoryFilter = filterBtn.getAttribute('data-category');
        renderProductGrids();
        return;
      }

      var favBtn = e.target.closest('[data-toggle-fav]');
      if (favBtn) {
        e.stopPropagation();
        var added = STORE.toggleFavorite(favBtn.getAttribute('data-toggle-fav'));
        showToast(added ? 'Ditambahkan ke koleksi favorit' : 'Dihapus dari koleksi favorit');
        renderProductGrids();
        renderProfilePage();
        return;
      }

      var quickAddBtn = e.target.closest('[data-quick-add]');
      if (quickAddBtn) {
        e.stopPropagation();
        var res = STORE.addToCart(quickAddBtn.getAttribute('data-quick-add'));
        if (res) {
          showToast(res.product.title + ' (' + res.size + ') ditambahkan ke keranjang');
          renderCartPage();
        }
        return;
      }

      var modalTrigger = e.target.closest('[data-open-modal]');
      if (modalTrigger) {
        openProductModal(modalTrigger.getAttribute('data-open-modal'));
        return;
      }

      var sizeBtn = e.target.closest('.size-btn[data-size]');
      if (sizeBtn) {
        ui.modalSelectedSize = sizeBtn.getAttribute('data-size');
        var prod = DATA.getProductById(ui.modalProductId);
        if (prod) renderModalSizeOptions(prod.sizes);
        return;
      }

      var bookingChip = e.target.closest('[data-select-booking]');
      if (bookingChip) {
        ui.activeBookingCode = bookingChip.getAttribute('data-select-booking');
        var b = getActiveBooking();
        if (b) {
          ui.selectedDayId = b.fittingDateId;
          ui.selectedTimeSlot = b.fittingTime;
          ui.fittingDressChoice = b.itemsSummary[0] || DATA.PRODUCTS[0].title;
        }
        renderFittingPage();
        return;
      }

      var dayBtn = e.target.closest('.calendar-day[data-day-id]');
      if (dayBtn && !dayBtn.disabled) {
        ui.selectedDayId = dayBtn.getAttribute('data-day-id');
        renderCalendarAndTimeSlots();
        return;
      }

      var timeBtn = e.target.closest('.time-slot-btn[data-time-slot]');
      if (timeBtn) {
        ui.selectedTimeSlot = timeBtn.getAttribute('data-time-slot');
        renderCalendarAndTimeSlots();
        return;
      }

      var qtyBtn = e.target.closest('[data-qty-delta]');
      if (qtyBtn) {
        STORE.updateCartQty(
          qtyBtn.getAttribute('data-item-id'),
          Number(qtyBtn.getAttribute('data-qty-delta'))
        );
        renderCartPage();
        return;
      }

      var removeBtn = e.target.closest('[data-remove-cart]');
      if (removeBtn) {
        STORE.removeFromCart(removeBtn.getAttribute('data-remove-cart'));
        showToast('Item dihapus dari keranjang');
        renderCartPage();
      }
    });

    // Pencarian real-time
    if ($('searchInput')) {
      $('searchInput').addEventListener('input', function (e) {
        ui.searchQuery = e.target.value;
        if ($('btnClearSearch')) {
          $('btnClearSearch').classList.toggle('hidden', !ui.searchQuery);
        }
        renderProductGrids();
      });
    }

    if ($('btnClearSearch')) {
      $('btnClearSearch').addEventListener('click', function () {
        ui.searchQuery = '';
        if ($('searchInput')) $('searchInput').value = '';
        $('btnClearSearch').classList.add('hidden');
        renderProductGrids();
      });
    }

    if ($('btnResetHomeFilter')) $('btnResetHomeFilter').addEventListener('click', resetFilters);
    if ($('btnResetCatalogFilter')) $('btnResetCatalogFilter').addEventListener('click', resetFilters);

    if ($('catalogSort')) {
      $('catalogSort').addEventListener('change', function (e) {
        ui.sortBy = e.target.value;
        renderProductGrids();
      });
    }

    // Notifikasi
    if ($('btnNotif')) {
      $('btnNotif').addEventListener('click', function (e) {
        e.stopPropagation();
        var dd = $('notifDropdown');
        if (!dd) return;
        dd.classList.toggle('hidden');
        STORE.markNotificationsRead();
        renderHeaderBadges();
        renderNotifications();
      });
    }
    if ($('btnCloseNotif')) {
      $('btnCloseNotif').addEventListener('click', closeNotifDropdown);
    }

    // Modal Produk
    if ($('btnCloseProductModal')) $('btnCloseProductModal').addEventListener('click', closeProductModal);
    if ($('productModal')) {
      $('productModal').addEventListener('click', function (e) {
        if (e.target === $('productModal')) closeProductModal();
      });
    }
    if ($('btnModalFav')) {
      $('btnModalFav').addEventListener('click', function () {
        if (ui.modalProductId === null) return;
        var added = STORE.toggleFavorite(ui.modalProductId);
        updateModalFavoriteButton();
        renderProductGrids();
        renderProfilePage();
        showToast(added ? 'Ditambahkan ke koleksi favorit' : 'Dihapus dari koleksi favorit');
      });
    }
    if ($('btnModalAddToCart')) {
      $('btnModalAddToCart').addEventListener('click', function () {
        if (ui.modalProductId === null) return;
        var dateVal = ($('modalRentalDate') && $('modalRentalDate').value) || '2026-11-01';
        var res = STORE.addToCart(ui.modalProductId, ui.modalSelectedSize, dateVal);
        if (res) {
          showToast(res.product.title + ' (' + res.size + ') ditambahkan ke keranjang');
          renderCartPage();
        }
        closeProductModal();
      });
    }
    if ($('btnModalBookFitting')) {
      $('btnModalBookFitting').addEventListener('click', function () {
        var prod = DATA.getProductById(ui.modalProductId);
        var dateVal = ($('modalRentalDate') && $('modalRentalDate').value) || '2026-11-01';
        if (prod) {
          ui.fittingDressChoice = prod.title + ' (' + ui.modalSelectedSize + ')';
          var matched = DATA.FITTING_CALENDAR_DAYS.find(function (d) {
            return d.isoDate === dateVal && d.available;
          });
          if (matched) ui.selectedDayId = matched.id;
          showToast('Pilih waktu fitting untuk ' + prod.title);
        }
        closeProductModal();
        renderFittingPage();
        switchTab('fitting');
      });
    }

    // Fitting controls
    if ($('fittingDressSelect')) {
      $('fittingDressSelect').addEventListener('change', function (e) {
        ui.fittingDressChoice = e.target.value;
      });
    }
    if ($('btnSaveFitting')) {
      $('btnSaveFitting').addEventListener('click', function () {
        var dayObj =
          DATA.FITTING_CALENDAR_DAYS.find(function (d) { return d.id === ui.selectedDayId; }) ||
          DATA.FITTING_CALENDAR_DAYS[6];
        var result = STORE.updateBookingSchedule(
          ui.activeBookingCode,
          dayObj,
          ui.selectedTimeSlot,
          ui.fittingDressChoice
        );
        ui.activeBookingCode = result.booking.code;
        renderFittingPage();
        renderProfilePage();
        showToast(
          'Jadwal ' + result.booking.code + ' disimpan: ' + dayObj.fullDateLabel + ' (' + ui.selectedTimeSlot + ')'
        );
      });
    }
    if ($('btnAdvanceStep')) {
      $('btnAdvanceStep').addEventListener('click', function () {
        var updated = STORE.advanceBookingStep(ui.activeBookingCode);
        if (updated) {
          renderFittingPage();
          showToast('Status ' + updated.code + ': ' + DATA.STEP_STATUS_LABELS[updated.statusStep]);
        }
      });
    }

    // Checkout form
    if ($('checkoutForm')) {
      $('checkoutForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (STORE.state.cart.length === 0) {
          showToast('Keranjang masih kosong, pilih koleksi terlebih dahulu');
          return;
        }
        var dayObj =
          DATA.FITTING_CALENDAR_DAYS.find(function (d) { return d.id === ui.selectedDayId; }) ||
          DATA.FITTING_CALENDAR_DAYS[6];

        var booking = STORE.createBookingFromCheckout({
          customerName: $('chkName').value.trim(),
          whatsapp: $('chkPhone').value.trim(),
          eventDate: $('chkEventDate').value,
          notes: $('chkNotes').value.trim(),
          fittingDateId: dayObj.id,
          fittingDateLabel: dayObj.fullDateLabel,
          fittingTime: ui.selectedTimeSlot
        });

        ui.activeBookingCode = booking.code;
        if (booking.itemsSummary[0]) ui.fittingDressChoice = booking.itemsSummary[0];
        $('chkNotes').value = '';

        renderCartPage();
        renderFittingPage();
        renderProfilePage();
        renderNotifications();
        renderHeaderBadges();
        switchTab('fitting');
        showToast('Reservasi ' + booking.code + ' berhasil dikonfirmasi!');
      });
    }

    // Profil & Stylist
    if ($('btnToggleEditProfile')) {
      $('btnToggleEditProfile').addEventListener('click', function () {
        var form = $('editProfileForm');
        if (!form) return;
        var opening = form.classList.contains('hidden');
        if (opening) {
          $('editName').value = STORE.state.profile.name;
          $('editEmail').value = STORE.state.profile.email;
          $('editPhone').value = STORE.state.profile.phone;
          $('btnToggleEditProfile').textContent = 'Batal';
        } else {
          $('btnToggleEditProfile').textContent = 'Ubah Profil';
        }
        form.classList.toggle('hidden', !opening);
      });
    }
    if ($('editProfileForm')) {
      $('editProfileForm').addEventListener('submit', function (e) {
        e.preventDefault();
        STORE.updateProfile({
          name: $('editName').value.trim(),
          email: $('editEmail').value.trim(),
          phone: $('editPhone').value.trim()
        });
        $('editProfileForm').classList.add('hidden');
        $('btnToggleEditProfile').textContent = 'Ubah Profil';
        renderProfilePage();
        showToast('Profil akun berhasil diperbarui');
      });
    }
    if ($('btnResetDemo')) {
      $('btnResetDemo').addEventListener('click', function () {
        STORE.resetDemoData();
        ui.activeBookingCode = STORE.state.bookings[0].code;
        ui.selectedDayId = STORE.state.bookings[0].fittingDateId;
        ui.selectedTimeSlot = STORE.state.bookings[0].fittingTime;
        ui.fittingDressChoice = STORE.state.bookings[0].itemsSummary[0];
        resetFilters();
        renderCartPage();
        renderFittingPage();
        renderProfilePage();
        renderNotifications();
        renderHeaderBadges();
        showToast('Data awal butik berhasil dipulihkan');
      });
    }

    if ($('btnOpenStylistFromFitting')) $('btnOpenStylistFromFitting').addEventListener('click', openStylistModal);
    if ($('btnOpenStylistFromProfile')) $('btnOpenStylistFromProfile').addEventListener('click', openStylistModal);
    if ($('btnCloseStylistModal')) $('btnCloseStylistModal').addEventListener('click', closeStylistModal);
    if ($('stylistModal')) {
      $('stylistModal').addEventListener('click', function (e) {
        if (e.target === $('stylistModal')) closeStylistModal();
      });
    }
    if ($('stylistForm')) {
      $('stylistForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var topic = $('stylistTopic').value;
        var msg = $('stylistMessage').value.trim();
        if (!msg) return;

        STORE.addNotification('Permintaan Konsultasi: ' + topic, msg);
        $('stylistMessage').value = '';
        closeStylistModal();
        renderNotifications();
        renderHeaderBadges();
        showToast('Pesan konsultasi terkirim ke stylist studio');
      });
    }
  }

  function init() {
    renderProductGrids();
    renderCartPage();
    renderFittingPage();
    renderProfilePage();
    renderNotifications();
    renderHeaderBadges();
    bindGlobalEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);