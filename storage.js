/* ==========================================================================
   BF Beauty & Fashion — Manajemen State & Persistensi localStorage
   ========================================================================== */

(function (global) {
  var DATA = global.BF_DATA;

  var STORAGE_KEYS = {
    cart: 'bf_bridal_cart_v2',
    favorites: 'bf_bridal_favs_v2',
    bookings: 'bf_bridal_bookings_v2',
    profile: 'bf_bridal_profile_v2',
    notifications: 'bf_bridal_notifs_v2'
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadStoredState(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return clone(fallback);
      return JSON.parse(raw);
    } catch (e) {
      return clone(fallback);
    }
  }

  function saveStoredState(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Abaikan jika localStorage penuh atau dibatasi
    }
  }

  function getDefaultFavorites() {
    return DATA.PRODUCTS
      .filter(function (p) { return p.isDefaultFav; })
      .map(function (p) { return p.id; });
  }

  var state = {
    cart: loadStoredState(STORAGE_KEYS.cart, DATA.INITIAL_CART),
    favorites: loadStoredState(STORAGE_KEYS.favorites, getDefaultFavorites()),
    bookings: loadStoredState(STORAGE_KEYS.bookings, DATA.INITIAL_BOOKINGS),
    profile: loadStoredState(STORAGE_KEYS.profile, DATA.DEFAULT_PROFILE),
    notifications: loadStoredState(STORAGE_KEYS.notifications, DATA.INITIAL_NOTIFICATIONS)
  };

  function persistAll() {
    saveStoredState(STORAGE_KEYS.cart, state.cart);
    saveStoredState(STORAGE_KEYS.favorites, state.favorites);
    saveStoredState(STORAGE_KEYS.bookings, state.bookings);
    saveStoredState(STORAGE_KEYS.profile, state.profile);
    saveStoredState(STORAGE_KEYS.notifications, state.notifications);
  }

  function toggleFavorite(productId) {
    var idNum = Number(productId);
    var idx = state.favorites.indexOf(idNum);
    var added = false;

    if (idx === -1) {
      state.favorites.push(idNum);
      added = true;
    } else {
      state.favorites.splice(idx, 1);
    }

    saveStoredState(STORAGE_KEYS.favorites, state.favorites);
    return added;
  }

  function isFavorite(productId) {
    return state.favorites.indexOf(Number(productId)) !== -1;
  }

  function addToCart(productId, size, rentalDate) {
    var product = DATA.getProductById(productId);
    if (!product) return null;

    var chosenSize = size || product.sizes[0] || 'S';
    var chosenDate = rentalDate || '2026-11-01';
    var key = product.id + '-' + chosenSize + '-' + chosenDate;

    var existing = state.cart.find(function (item) {
      return item.id === key;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: key,
        productId: product.id,
        size: chosenSize,
        rentalDate: chosenDate,
        quantity: 1
      });
    }

    saveStoredState(STORAGE_KEYS.cart, state.cart);
    return { product: product, size: chosenSize };
  }

  function updateCartQty(itemId, delta) {
    state.cart = state.cart
      .map(function (item) {
        if (item.id === itemId) {
          return Object.assign({}, item, { quantity: item.quantity + delta });
        }
        return item;
      })
      .filter(function (item) {
        return item.quantity > 0;
      });

    saveStoredState(STORAGE_KEYS.cart, state.cart);
  }

  function removeFromCart(itemId) {
    state.cart = state.cart.filter(function (item) {
      return item.id !== itemId;
    });
    saveStoredState(STORAGE_KEYS.cart, state.cart);
  }

  function getCartTotals() {
    var totalCount = 0;
    var subtotal = 0;

    state.cart.forEach(function (item) {
      var product = DATA.getProductById(item.productId);
      if (product) {
        totalCount += item.quantity;
        subtotal += product.price * item.quantity;
      }
    });

    var deposit = state.cart.length > 0 ? DATA.REFUNDABLE_DEPOSIT : 0;
    return {
      totalCount: totalCount,
      subtotal: subtotal,
      deposit: deposit,
      totalEstimate: subtotal + deposit
    };
  }

  function createBookingFromCheckout(payload) {
    var totals = getCartTotals();
    var code = '#BF-' + Math.floor(9100 + Math.random() * 850);

    var itemsSummary = state.cart.map(function (item) {
      var p = DATA.getProductById(item.productId);
      if (!p) return '';
      return p.title + ' (' + item.size + ')' + (item.quantity > 1 ? ' ×' + item.quantity : '');
    }).filter(Boolean);

    var newBooking = {
      code: code,
      customerName: payload.customerName,
      whatsapp: payload.whatsapp,
      eventDate: payload.eventDate,
      fittingDateId: payload.fittingDateId,
      fittingDateLabel: payload.fittingDateLabel,
      fittingTime: payload.fittingTime,
      itemsSummary: itemsSummary,
      totalAmount: totals.totalEstimate,
      statusStep: 2,
      notes: payload.notes || ''
    };

    state.bookings.unshift(newBooking);
    state.cart = [];
    addNotification(
      'Reservasi ' + code + ' Dibuat',
      itemsSummary.length + ' koleksi dijadwalkan untuk fitting ' + payload.fittingDateLabel + '.'
    );

    persistAll();
    return newBooking;
  }

  function updateBookingSchedule(code, daySlot, timeSlot, dressChoice) {
    var target = state.bookings.find(function (b) {
      return b.code === code;
    });

    if (target) {
      target.fittingDateId = daySlot.id;
      target.fittingDateLabel = daySlot.fullDateLabel;
      target.fittingTime = timeSlot;
      if (dressChoice && target.itemsSummary.indexOf(dressChoice) === -1) {
        target.itemsSummary = [dressChoice].concat(target.itemsSummary.slice(1));
      }
      if (target.statusStep < 2) {
        target.statusStep = 2;
      }
      saveStoredState(STORAGE_KEYS.bookings, state.bookings);
      return { created: false, booking: target };
    }

    var newCode = '#BF-' + Math.floor(9100 + Math.random() * 850);
    var newBooking = {
      code: newCode,
      customerName: state.profile.name,
      whatsapp: state.profile.phone,
      eventDate: '2026-11-22',
      fittingDateId: daySlot.id,
      fittingDateLabel: daySlot.fullDateLabel,
      fittingTime: timeSlot,
      itemsSummary: [dressChoice || DATA.PRODUCTS[0].title],
      totalAmount: 0,
      statusStep: 2,
      notes: 'Sesi fitting studio terjadwal.'
    };
    state.bookings.unshift(newBooking);
    saveStoredState(STORAGE_KEYS.bookings, state.bookings);
    return { created: true, booking: newBooking };
  }

  function advanceBookingStep(code) {
    var target = state.bookings.find(function (b) {
      return b.code === code;
    });
    if (!target) return null;

    target.statusStep = target.statusStep < 4 ? target.statusStep + 1 : 2;
    saveStoredState(STORAGE_KEYS.bookings, state.bookings);
    return target;
  }

  function updateProfile(nextProfile) {
    state.profile = Object.assign({}, state.profile, nextProfile);
    saveStoredState(STORAGE_KEYS.profile, state.profile);
    return state.profile;
  }

  function addNotification(title, detail) {
    state.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: title,
      detail: detail,
      read: false
    });
    saveStoredState(STORAGE_KEYS.notifications, state.notifications);
  }

  function markNotificationsRead() {
    state.notifications = state.notifications.map(function (n) {
      return Object.assign({}, n, { read: true });
    });
    saveStoredState(STORAGE_KEYS.notifications, state.notifications);
  }

  function resetDemoData() {
    state.cart = clone(DATA.INITIAL_CART);
    state.favorites = getDefaultFavorites();
    state.bookings = clone(DATA.INITIAL_BOOKINGS);
    state.profile = clone(DATA.DEFAULT_PROFILE);
    state.notifications = clone(DATA.INITIAL_NOTIFICATIONS);
    persistAll();
  }

  global.BF_STORAGE = {
    state: state,
    toggleFavorite: toggleFavorite,
    isFavorite: isFavorite,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    getCartTotals: getCartTotals,
    createBookingFromCheckout: createBookingFromCheckout,
    updateBookingSchedule: updateBookingSchedule,
    advanceBookingStep: advanceBookingStep,
    updateProfile: updateProfile,
    addNotification: addNotification,
    markNotificationsRead: markNotificationsRead,
    resetDemoData: resetDemoData
  };
})(window);