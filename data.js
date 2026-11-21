/* ==========================================================================
   BF Beauty & Fashion — Master Data & Utilitas
   ========================================================================== */

(function (global) {
  const PRODUCTS = [
    {
      id: 0,
      title: 'Royal Princess Pink Ballgown',
      category: 'gaun',
      categoryLabel: 'Gaun Royal',
      price: 15000000,
      rating: '4.9',
      isDefaultFav: true,
      img: 'royal_pink_ballgown.jpg',
      desc: 'Gaun pengantin ala putri kerajaan bernuansa soft pink dengan detail payet kristal buatan tangan, ekor panjang 2 meter, dan bahan lace brokat eksklusif.',
      rentalDuration: 'Sewa 7 Hari + Cleaning',
      sizes: ['S', 'M', 'L', 'Custom Fit']
    },
    {
      id: 1,
      title: 'Rose Gold Crystal Tiara',
      category: 'perhiasan',
      categoryLabel: 'Mahkota & Perhiasan',
      price: 3000000,
      rating: '5.0',
      isDefaultFav: false,
      img: 'rose_gold_tiara.jpg',
      desc: 'Mahkota tiara berlapis kristal rose gold yang memberikan kilau anggun romantis dan memikat di hari pernikahan.',
      rentalDuration: 'Sewa 7 Hari',
      sizes: ['Custom Fit']
    },
    {
      id: 2,
      title: 'Blush Sparkle Fairy Gown',
      category: 'gaun',
      categoryLabel: 'Gaun Royal',
      price: 18500000,
      rating: '4.8',
      isDefaultFav: false,
      img: 'blush_fairy_gown.jpg',
      desc: 'Gaun bermodel A-line bernuansa blush pink berglitter sutra dengan korset transparan bermotif bunga mawar.',
      rentalDuration: 'Sewa 7 Hari + Cleaning',
      sizes: ['S', 'M', 'L', 'Custom Fit']
    },
    {
      id: 3,
      title: 'Pearl & Diamond Wedding Set',
      category: 'perhiasan',
      categoryLabel: 'Mahkota & Perhiasan',
      price: 4500000,
      rating: '4.9',
      isDefaultFav: true,
      img: 'pearl_diamond_set.jpg',
      desc: 'Set kalung dan anting kristal mutiara pink murni untuk penampilan anggun megah selayaknya putri istana.',
      rentalDuration: 'Sewa 7 Hari',
      sizes: ['Custom Fit']
    },
    {
      id: 4,
      title: 'Mocha Royal Tuxedo',
      category: 'pria',
      categoryLabel: 'Jas Pengantin',
      price: 7000000,
      rating: '4.9',
      isDefaultFav: false,
      img: 'mocha_royal_tuxedo.jpg',
      desc: 'Jas resmi pria gaya Eropa klasik berwarna mocha hangat dengan potongan presisi dan vest eksklusif.',
      rentalDuration: 'Sewa 7 Hari + Pressing',
      sizes: ['S', 'M', 'L', 'Custom Fit']
    }
  ];

  // Susunan hari kalender nyata untuk akhir Oktober - awal November 2026
  // 26 Okt 2026 = Senin (Sn), 1 Nov 2026 = Minggu (Mg)
  const WEEKDAYS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

  const FITTING_CALENDAR_DAYS = [
    { id: '2026-10-26', dayNum: 26, fullDateLabel: 'Senin, 26 Okt 2026', isoDate: '2026-10-26', available: false },
    { id: '2026-10-27', dayNum: 27, fullDateLabel: 'Selasa, 27 Okt 2026', isoDate: '2026-10-27', available: false },
    { id: '2026-10-28', dayNum: 28, fullDateLabel: 'Rabu, 28 Okt 2026', isoDate: '2026-10-28', available: false },
    { id: '2026-10-29', dayNum: 29, fullDateLabel: 'Kamis, 29 Okt 2026', isoDate: '2026-10-29', available: false },
    { id: '2026-10-30', dayNum: 30, fullDateLabel: 'Jumat, 30 Okt 2026', isoDate: '2026-10-30', available: true },
    { id: '2026-10-31', dayNum: 31, fullDateLabel: 'Sabtu, 31 Okt 2026', isoDate: '2026-10-31', available: true },
    { id: '2026-11-01', dayNum: 1, fullDateLabel: 'Minggu, 01 Nov 2026', isoDate: '2026-11-01', available: true },
    { id: '2026-11-02', dayNum: 2, fullDateLabel: 'Senin, 02 Nov 2026', isoDate: '2026-11-02', available: true },
    { id: '2026-11-03', dayNum: 3, fullDateLabel: 'Selasa, 03 Nov 2026', isoDate: '2026-11-03', available: true },
    { id: '2026-11-04', dayNum: 4, fullDateLabel: 'Rabu, 04 Nov 2026', isoDate: '2026-11-04', available: true },
    { id: '2026-11-05', dayNum: 5, fullDateLabel: 'Kamis, 05 Nov 2026', isoDate: '2026-11-05', available: true },
    { id: '2026-11-06', dayNum: 6, fullDateLabel: 'Jumat, 06 Nov 2026', isoDate: '2026-11-06', available: true },
    { id: '2026-11-07', dayNum: 7, fullDateLabel: 'Sabtu, 07 Nov 2026', isoDate: '2026-11-07', available: true },
    { id: '2026-11-08', dayNum: 8, fullDateLabel: 'Minggu, 08 Nov 2026', isoDate: '2026-11-08', available: true }
  ];

  const TIME_SLOTS = ['10:00 WIB', '11:00 WIB', '14:00 WIB', '16:00 WIB'];

  const REFUNDABLE_DEPOSIT = 2000000;

  const STEP_STATUS_LABELS = {
    1: 'Menunggu Konfirmasi',
    2: 'Fitting Dikonfirmasi',
    3: 'Dalam Penyesuaian',
    4: 'Siap Acara Hari-H'
  };

  const INITIAL_CART = [
    {
      id: '0-S-2026-11-01',
      productId: 0,
      size: 'S',
      rentalDate: '2026-11-01',
      quantity: 1
    },
    {
      id: '1-Custom Fit-2026-11-01',
      productId: 1,
      size: 'Custom Fit',
      rentalDate: '2026-11-01',
      quantity: 1
    }
  ];

  const INITIAL_BOOKINGS = [
    {
      code: '#BF-9042',
      customerName: 'Vebi fadilah Maharani',
      whatsapp: '0812-8840-2026',
      eventDate: '2026-11-22',
      fittingDateId: '2026-11-01',
      fittingDateLabel: 'Minggu, 01 Nov 2026',
      fittingTime: '11:00 WIB',
      itemsSummary: ['Royal Princess Pink Ballgown (S)', 'Rose Gold Crystal Tiara'],
      totalAmount: 20000000,
      statusStep: 2,
      notes: 'Penyesuaian panjang rok untuk heels 9cm.'
    }
  ];

  const DEFAULT_PROFILE = {
    name: 'Vebi fadilah Maharani',
    email: 'febifadilahMharani@gmail.com',
    phone: '0812-8840-2026',
    tier: 'Royal VIP Member'
  };

  const INITIAL_NOTIFICATIONS = [
    {
      id: 'n1',
      title: 'Koleksi Royal 2026 Tersedia',
      detail: 'Penawaran spesial sewa paket gaun & tiara untuk sesi fitting bulan ini.',
      read: false
    },
    {
      id: 'n2',
      title: 'Jadwal Fitting #BF-9042 Dikonfirmasi',
      detail: 'Stylist siap menyambut Anda pada sesi studio Minggu, 01 Nov 2026.',
      read: false
    }
  ];

  function formatRupiah(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
  }

  function getProductById(id) {
    return PRODUCTS.find(function (p) {
      return p.id === Number(id);
    }) || null;
  }

  global.BF_DATA = {
    PRODUCTS: PRODUCTS,
    WEEKDAYS: WEEKDAYS,
    FITTING_CALENDAR_DAYS: FITTING_CALENDAR_DAYS,
    TIME_SLOTS: TIME_SLOTS,
    REFUNDABLE_DEPOSIT: REFUNDABLE_DEPOSIT,
    STEP_STATUS_LABELS: STEP_STATUS_LABELS,
    INITIAL_CART: INITIAL_CART,
    INITIAL_BOOKINGS: INITIAL_BOOKINGS,
    DEFAULT_PROFILE: DEFAULT_PROFILE,
    INITIAL_NOTIFICATIONS: INITIAL_NOTIFICATIONS,
    formatRupiah: formatRupiah,
    getProductById: getProductById
  };
})(window);