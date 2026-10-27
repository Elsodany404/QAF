/*
 * The site's English text. ar.ts has to provide every key of this file (its
 * type comes from here), with the same {placeholders}: format() and rich()
 * in ../format.ts and ../rich.tsx fill them in.
 */
const en = {
  metadata: {
    siteName: "QAF Coffee",
    titleTemplate: "%s | QAF Coffee",
    description:
      "QAF — premium coffee crafted from carefully selected beans and expertly roasted for a rich, distinctive taste.",
    openGraphLocale: "en_EG",
  },

  common: {
    brand: "Qaf Coffee",
    address: "C8, 10th of Ramadan, Al-Sharqya, Egypt",
    loading: "Loading",
    dismissNotification: "Dismiss notification",
  },

  language: {
    // The other language's name, written in that language.
    other: "العربية",
    switchLabel: "View this page in Arabic",
  },

  nav: {
    label: "Main",
    home: "Home",
    shop: "Shop",
    about: "About us",
    contact: "Contact",
    policies: "Our Policies",
    account: "Account",
    dashboard: "Dashboard",
    openCart: "Open cart",
    openCartOne: "Open cart (1 item)",
    openCartMany: "Open cart ({count} items)",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    signUp: "Sign Up",
    signIn: "Sign In",
    signOut: "Sign Out",
  },

  footer: {
    subtitle: "Artisan Roasters",
    description:
      "Small-batch roasted coffee from the world's finest origins. Crafted with passion, served with purpose.",
    instagram: "Qaf Coffee on Instagram",
    facebook: "Qaf Coffee on Facebook",
    contact: "Contact",
    copyright: "© {year} Qaf Coffee Co. All rights reserved.",
    privacy: "Privacy Policy",
    delivery: "Delivery & Shipping",
    returns: "Returns & Refunds",
  },

  home: {
    hero: {
      imageAlt: "coffee roaster for hero section",
      badge: "Premium Artisan Coffee",
      headingTop: "Elevate Your",
      headingAccent: "Coffee Ritual",
      text: "Discover exceptional, hand-roasted blends sourced from Ethiopia, Colombia, and Yemen. Each cup tells a story of craft, tradition, and uncompromising quality.",
      explore: "Explore Collection",
      story: "Learn Our Story",
      stats: [
        { label: "Coffee Origins", value: "3 Continents" },
        { label: "Roast Masters", value: "Q-Certified" },
        { label: "Flavor Profiles", value: "10+ Blends" },
      ],
      scroll: "Scroll to explore",
    },
    collections: {
      badge: "Our Collections",
      titleStart: "Three Worlds of",
      titleAccent: "Exceptional Coffee",
      explore: "Explore",
      turkish_coffee: {
        title: "Turkish Coffee",
        subtitle: "Time-Honored Tradition",
        description:
          "Finely ground, slow-brewed perfection in three exceptional blends.",
        blends: ["Qaf Blend", "Colombian Blend", "Golden Blend"],
      },
      espresso: {
        title: "Espresso",
        subtitle: "Intense & Refined",
        description:
          "Bold shots crafted for baristas, perfectionists, and everyday ritualists.",
        blends: [] as string[],
      },
      flavored_coffee: {
        title: "Flavored Coffee",
        subtitle: "Creative Indulgence",
        description:
          "Natural infusions that transform your cup into a sensory experience.",
        blends: [] as string[],
      },
    },
    featured: {
      badge: "Bestsellers",
      title: "Featured Blends",
      viewAll: "View All",
      viewAllProducts: "View All Products",
    },
    features: [
      {
        title: "Ethically Sourced",
        description:
          "Direct relationships with farmers in Ethiopia, Colombia, and Yemen ensure fair trade and exceptional quality.",
      },
      {
        title: "Master Roasted",
        description:
          "Q-certified roasters bring precision and passion to every batch, unlocking peak flavor potential.",
      },
      {
        title: "Sustainable",
        description:
          "Carbon-neutral shipping, compostable packaging, and forest restoration in every order.",
      },
    ],
    signature: {
      badge: "Our Signature",
      titleStart: "Turkish Coffee",
      titleAccent: "Reimagined",
      text: "Three distinct blends that honor centuries of tradition while pushing flavor boundaries. Each tells a story of origin, craft, and devotion.",
      blends: [
        {
          name: "Qaf Blend",
          description: "Deep chocolate, rich body, our signature taste",
        },
        {
          name: "Colombian Blend",
          description: "Bright acidity, caramel sweetness, vibrant origin",
        },
        {
          name: "Golden Blend",
          description: "Honey, dried fruits, warming spice, our finest",
        },
      ],
      shop: "Shop Turkish Coffee",
      imageAlt: "Turkish Coffee",
      secondImageAlt: "Coffee beans",
    },
    cta: {
      imageAlt: "Coffee",
      title: "Ready for Extraordinary?",
      text: "Experience the difference that small-batch roasting, ethical sourcing, and pure passion make.",
      button: "Shop Now",
    },
  },

  about: {
    metaTitle: "About",
    metaDescription:
      "Learn the story behind Qaf Coffee — from our roots in 10th of Ramadan to small-batch roasting and global sourcing.",
    heroImageAlt: "About section coffee photo",
    badge: "Our Journey",
    titleStart: "Passion for",
    titleAccent: "Perfect Coffee",
    text: "From single-origin sourcing to precision roasting — we obsess over every detail to bring you extraordinary coffee.",
    storyTitleStart: "Rooted in",
    storyTitleAccent: "Tradition",
    story: [
      "Founded in 10th of Ramadan, Qaf Coffee is the culmination of generations of coffee culture and modern roasting science. We source from the world's premier growing regions — Ethiopia, Colombia, Yemen — and bring those stories to your cup.",
      "Our Turkish coffee blends pay homage to centuries of tradition while pushing the boundaries of what ground coffee can be. Each of our three blends — Qaf, Colombian, and Golden — represents a distinct flavor philosophy.",
      "We believe that exceptional coffee should be accessible to everyone who cares about quality. That is why we roast in small batches, ship within 24 hours of roasting, and obsess over every detail of the process.",
    ],
    storyImageAlt: "Coffee",
    storySecondImageAlt: "Beans",
    valuesBadge: "Values",
    valuesTitle: "What Drives Us",
    values: [
      {
        title: "Global Sourcing",
        description:
          "We partner directly with farmers in Colombia, Ethiopia, and Yemen for traceable, premium beans.",
      },
      {
        title: "Expert Roasting",
        description:
          "Our Q-certified roasters bring precision and passion to every small-batch roast.",
      },
      {
        title: "Sustainability",
        description:
          "Carbon-neutral shipping, compostable packaging, and forest restoration with every order.",
      },
      {
        title: "Community First",
        description:
          "We reinvest in farming communities through fair pricing and long-term partnerships.",
      },
    ],
    processBadge: "Our Process",
    processTitle: "From Farm to Cup",
    process: [
      { title: "Source", description: "Direct relationships with micro-farms" },
      { title: "Import", description: "Fresh beans to our roastery" },
      { title: "Roast", description: "Small-batch precision roasting" },
      { title: "Deliver", description: "Fresh to your door in 24-48 hours" },
    ],
    ctaTitle: "Experience the Difference",
    ctaText:
      "Taste coffee that's been crafted with passion, sourced ethically, and roasted to perfection.",
    ctaShop: "Shop Our Blends",
    ctaContact: "Get in Touch",
  },

  contact: {
    metaTitle: "Contact",
    metaDescription:
      "Get in touch with Qaf Coffee for product questions, orders, and delivery support.",
    badge: "We're here for you",
    titleStart: "Let's Talk",
    titleAccent: "Coffee",
    text: "Questions about an order, a product, or just want to say hello? Our team is ready to help.",
    detailsTitle: "Contact Details",
    detailsText:
      "Qaf Coffee is based at C8, 10th of Ramadan, Al-Sharqya, Egypt. Our team can help with product questions, orders, and delivery support.",
    address: "Address",
    phone: "Phone",
    email: "Email",
    hours: "Business Hours",
    hoursValue: "Sat – Thu, 9 am – 6 pm EET",
    whatsappMessage: "Hello Qaf Coffee, I would like to get in touch.",
    whatsapp: "Chat on WhatsApp",
  },

  contactForm: {
    eyebrow: "Send an email",
    title: "Contact Us",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    sending: "Sending...",
    send: "Send Message",
  },

  policies: {
    metaTitle: "Policies",
    metaDescription:
      "Privacy policy, delivery & shipping policy, and return & refund policy for Qaf Coffee.",
    badge: "Customer Information",
    title: "Our Policies",
    text: "Everything you need to know about privacy, delivery, and returns — all in one place.",
    privacy: {
      title: "Privacy Policy",
      paragraphs: [
        "We collect the name, email, phone number, and delivery address needed to process and deliver orders, plus the account details you choose to create. We use this information for payment confirmation, preparation, delivery, order updates by email, support, and legal requirements. We do not sell customer information.",
        "Online card payments are handled by our payment provider, Paymob, and card details are never stored by Qaf Coffee. Your name, phone number, and address are shared with our courier, Bosta, only to deliver your order.",
        "Signing in uses a cookie to keep your session active for up to 30 days. It is required for your account to work and is not used for advertising. Another cookie remembers the language you chose for the site.",
        "Privacy questions, or requests to view or delete your data, can be sent to {email}.",
      ],
    },
    delivery: {
      title: "Delivery & Shipping Policy",
      paragraphs: [
        "We deliver across Egypt through our courier partner, Bosta, to the cities and districts listed at checkout. Orders are prepared and dispatched within 24 hours on business days. Delivery normally takes 24 to 48 hours after dispatch, depending on the destination and courier availability.",
        "Delivery fees depend on your city and payment method and are shown at checkout before you place your order. You can pay online by card or in cash on delivery. Cash on delivery is available for orders up to 30,000 EGP including delivery; larger orders must be paid online.",
        "Customers should provide an accurate phone number and address. If a delivery attempt is missed, the courier may contact the customer to arrange another attempt.",
      ],
    },
    returns: {
      title: "Return & Refund Policy",
      paragraphs: [
        "Returns and refunds are handled personally on WhatsApp at {whatsapp}. Message us with your order number and we'll take it from there.",
        "If you paid in cash on delivery, or haven't paid yet, you can cancel an order from {account} while it is still being prepared, before it is handed to the courier. If you paid online, message us on WhatsApp to cancel it and we'll arrange your refund. Once the courier has the order, it can no longer be cancelled.",
        "If something is wrong with a delivered order (damaged, incorrect, or materially different from what you ordered), message us on WhatsApp within 48 hours of delivery, with photos of the problem if you can. We review every request and agree the next step with you, whether a return, a replacement or a refund.",
        "Refunds are arranged with you directly on WhatsApp. Nothing is refunded automatically through the website.",
      ],
    },
    accountLink: "your account",
  },

  menu: {
    metaTitle: "Shop",
    metaDescription:
      "Shop Qaf Coffee's Turkish coffee, espresso, flavored coffee and Arabian blends, freshly roasted and delivered across Egypt.",
    heading: "Shop our coffee",
    searchLabel: "Search coffee",
    searchPlaceholder: "Search by name or flavor...",
    clearSearch: "Clear search",
    filterLabel: "Filter by category",
    emptyTitle: "No coffee found",
    emptyText: "Try adjusting your filters or search",
    resetFilters: "Reset filters",
  },

  // Keyed by the category IDs stored with each product.
  categories: {
    all: "All Coffee",
    turkish: "Turkish Coffee",
    espresso: "Espresso",
    flavored: "Flavored Coffee",
    "arabian & green blends": "Arabian & Green Blends",
  },

  product: {
    featured: "Featured",
    comingSoon: "Coming Soon",
    restocking: "Currently restocking",
    perUnit: "Per unit",
    add: "Add",
    soldOut: "Sold out",
    addLabel: "Add {name} to cart",
    soldOutLabel: "{name} is sold out",
    select: "Select {option}",
    soldOutSuffix: " (sold out)",
    addToCart: "Add to cart",
    buyNow: "Buy now",
    price: "Price: ",
    optionSoldOut: "This option is sold out",
    outOfStock: "Out of stock",
  },

  cart: {
    title: "Cart",
    close: "Close cart",
    emptyTitle: "Cart is empty",
    emptyText: "Start adding some premium coffee!",
    continueShopping: "Continue Shopping",
    remove: "Remove {name} from the cart",
    decrease: "Decrease quantity of {name}",
    increase: "Increase quantity of {name}",
    subtotal: "Subtotal",
    shippingNote: "Shipping calculated at checkout",
    clear: "Clear Cart",
    checkout: "Checkout",
    added: "{name} added to your cart",
    maxQuantity:
      "You can order up to {max} of one item. For bulk orders, please contact us.",
    full: "Your cart can hold {max} different items. Please check out or remove something first.",
    removed:
      "{name} can no longer be ordered with the options you chose, so it was removed from your cart.",
    pricesChanged:
      "Some prices changed since you added these items. Your cart shows the current prices.",
  },

  checkout: {
    metaTitle: "Checkout",
    back: "Back to Shopping",
    title: "Checkout",
    paymentMethods: {
      paymob_card: {
        title: "Online card",
        description: "Pay securely through Paymob.",
      },
      mobile_wallet: {
        title: "Mobile wallet",
        description: "Complete wallet payment through Paymob.",
      },
      cash_on_delivery: {
        title: "Cash on delivery",
        description: "Pay in cash when your order arrives.",
      },
    },
    chooseCityAndDistrict: "Please choose your city and district",
    shippingPending: "Shipping is still being calculated",
    placing: "Placing your order…",
    calculatingShipping: "Calculating shipping…",
    completePurchase: "Complete purchase",
    continueToPayment: "Continue to payment",
    placeOrder: "Place order",
    submitWithTotal: "{action} — {total}",
    contactTitle: "Contact Information",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Ahmed Hassan",
    email: "Email Address",
    emailRequired: "Please enter your email address",
    emailInvalid: "Please enter a valid email address",
    mobile: "Mobile Number",
    mobileRequired: "Please enter your mobile number",
    mobileInvalid: "Please enter a valid Egyptian mobile number (01xxxxxxxxx)",
    addressTitle: "Shipping Address",
    city: "City",
    cityRequired: "Please choose your city",
    selectCity: "Select your city",
    district: "District",
    districtRequired: "Please choose your district",
    selectDistrict: "Select your district",
    chooseCityFirst: "Choose a city first",
    street: "Street",
    streetPlaceholder: "e.g. 12 El Nasr Street",
    streetRequired: "Please enter your street",
    apartment: "Building & Apartment",
    apartmentPlaceholder: "e.g. Building 4, floor 2, apt 7",
    apartmentRequired: "Please enter your building and apartment",
    paymentTitle: "Payment Method",
    paymentGroup: "Payment method",
    onlineTitle: "Secure online payment",
    onlineText:
      "You'll be redirected to Paymob's secure checkout to complete your payment.",
    encrypted: "256-bit SSL encrypted",
    codTitle: "Pay on delivery",
    codTooHigh:
      "Cash on delivery is available for orders up to {max}. Please pay online by card or mobile wallet.",
    codText: "Pay the courier in cash when your order arrives.",
    codReady: "Please have {total} ready in cash for the courier.",
    tryAgain: "Try again",
    shippingError:
      "We couldn't calculate shipping to this city. Please try again.",
    summary: {
      title: "Order Summary",
      unavailable: "Unavailable",
      calculating: "Calculating…",
      chooseCity: "Choose your city",
      free: "Free",
      quantity: "Qty: {count}",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      plusShipping: "{amount} + shipping",
    },
  },

  // Checked in the browser and again on the server.
  validation: {
    fullName: "Please enter your full name: first and last name",
    streetTooShort:
      "Please enter the full street address (at least {min} characters), e.g. 12 El Nasr Street",
  },

  emptyCart: {
    metaTitle: "Your Cart",
    title: "Your cart is empty",
    text: "Add some premium coffee before checking out.",
    browse: "Browse Products",
  },

  orderSuccess: {
    metaTitle: "Your Order",
    confirmedTitle: "Order Confirmed!",
    confirmedText:
      "Thank you for your purchase. We are roasting your coffee now.",
    processingTitle: "Payment Processing",
    processingText:
      "We're confirming your payment with Paymob. This usually takes a few seconds — this page will update on its own.",
    failedTitle: "Payment Failed",
    failedText:
      "Your payment didn't go through and you have not been charged. You can retry the payment from your account page.",
    order: "Order:",
    goToOrders: "Go to my orders",
    emailTitle: "Confirmation Email",
    emailSent: "Your receipt is on its way to {email}",
    emailPending:
      "We'll email {email} as soon as the payment is confirmed",
    roastingTitle: "Roasting & Packaging",
    roastingText:
      "Freshly roasted and dispatched within 24 hours on business days",
    deliveryTitle: "Fast Delivery",
    deliveryText: "Delivered 24–48 hours after dispatch",
    tipTitle: "Brewing tip from our roasters:",
    tipText:
      "Let your coffee rest for 7 days after roasting to reach peak flavor. Quality takes time!",
    track: "Track my order",
    continueShopping: "Continue Shopping",
  },

  account: {
    metaTitle: "My Account",
    badge: "My Account",
    welcome: "Welcome back,",
    fallbackName: "Coffee Lover",
    overview: "Account overview",
    ordersPlaced: "Orders placed",
    inProgress: "In progress",
    delivered: "Delivered",
    profileTitle: "Profile details",
    emailVerified: "Email verified",
    emailNotVerified: "Email not verified",
    ordersTitle: "Your Orders",
    helpTitle: "Need Help?",
    helpText:
      "Returns, refunds and cancelling an order you paid for online are handled on WhatsApp: message us with your order number and we'll take care of it. For anything else, you can also send us a message.",
    whatsapp: "WhatsApp: {number}",
    sendMessage: "Send us a message",
  },

  profile: {
    displayName: "Display name",
    saving: "Saving…",
    save: "Save profile",
    updated: "Profile updated",
  },

  sidebar: {
    memberSince: "Member since {date}",
    admin: "Admin",
    quickLinks: "Quick Links",
    shop: "Shop Coffee",
    contact: "Contact Us",
    dashboard: "Dashboard",
    signOut: "Sign Out",
  },

  orders: {
    emptyTitle: "No orders yet",
    emptyText: "When you place an order it will appear here.",
    browse: "Browse Our Blends",
    order: "Order {number}",
    placed: "Placed {date}",
    progress: "Order progress",
    deliveryProgress: "Delivery progress",
    delivered: "Delivered",
    estimate: "Est. {dates}",
    total: "Total",
    track: "Track shipment",
    statuses: {
      awaiting_payment: "Awaiting payment",
      payment_failed: "Payment failed",
      processing: "Processing",
      ready_for_pickup: "Ready for courier",
      shipped: "Shipped",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      exception: "Delivery issue",
      cancelled: "Cancelled",
      returned: "Returned",
    },
    steps: {
      placed: "Placed",
      preparing: "Preparing",
      shipped: "Shipped",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
    },
    notes: {
      awaitingPayment:
        "We haven't received your payment yet. Complete it to start preparing your order.",
      paymentFailed:
        "Your last payment attempt didn't go through. You can try again below.",
      exception:
        "There's an issue with your delivery. Our team is on it and will contact you shortly.",
      cancelledRefunded: "Your order was cancelled and your payment refunded.",
      cancelledPaid:
        "Your order was cancelled. You paid online: message us on WhatsApp and we'll arrange your refund.",
      returnedRefunded: "This order came back to us and has been refunded.",
      returnedPaid:
        "This order came back to us. Message us on WhatsApp and we'll arrange your refund.",
      returnedUnpaid:
        "This order came back to us. Message us on WhatsApp if you have any questions.",
    },
    whatsapp: {
      cancel: {
        label: "Cancel on WhatsApp",
        message: "Hello Qaf Coffee, I'd like to cancel order {number}.",
      },
      return: {
        label: "Request a return on WhatsApp",
        message: "Hello Qaf Coffee, I'd like to return order {number}.",
      },
      refund: {
        label: "Ask about my refund",
        message:
          "Hello Qaf Coffee, I'm writing about the refund for order {number}.",
      },
      help: {
        label: "Message us on WhatsApp",
        message: "Hello Qaf Coffee, I'm writing about order {number}.",
      },
    },
  },

  orderActions: {
    confirmCancel: "Cancel order {number}?",
    cancelled: "Order cancelled",
    cancelling: "Cancelling…",
    cancel: "Cancel order",
    paymentFailed: "Could not start payment",
    redirecting: "Redirecting…",
    pay: "Complete payment",
  },

  auth: {
    metaTitle: "Account",
    emailLabel: "Email address",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email address",
    passwordLabel: "Password",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 8 characters",
    passwordMin: "Must be at least 8 characters",
    passwordMax: "Must be at most 128 characters",
    confirmRequired: "Please confirm your password",
    passwordsDiffer: "Passwords do not match",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signIn: {
      metaTitle: "Sign In",
      heading: "Welcome back",
      subheading: "Sign in to your account to continue",
      forgot: "Forgot password?",
      submitting: "Signing in…",
      submit: "Sign In",
      noAccount: "Don't have an account?",
      createOne: "Create one",
    },
    signUp: {
      metaTitle: "Create Account",
      heading: "Create an account",
      subheading: "Join us and enjoy premium coffee",
      name: "Full name",
      namePlaceholder: "Ahmed Al-Rashid",
      nameRequired: "Name is required",
      nameTooShort: "Name must be at least 2 characters",
      confirmPassword: "Confirm password",
      submitting: "Creating account…",
      submit: "Create Account",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    forgot: {
      metaTitle: "Forgot Password",
      heading: "Forgot your password?",
      subheading:
        "Enter your email and we'll send you a link to choose a new one.",
      submitting: "Sending…",
      submit: "Send reset link",
      remembered: "Remembered it?",
      back: "Back to sign in",
    },
    reset: {
      metaTitle: "Reset Password",
      heading: "Choose a new password",
      subheading: "You'll be signed out of every other device.",
      invalidLink: "This reset link is invalid or has expired.",
      requestNew: "Request a new one",
      requestNewLink: "Request a new link",
      goToSignIn: "Go to sign in",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      submitting: "Saving…",
      submit: "Reset password",
    },
    verify: {
      metaTitle: "Verify Your Email",
      expiredHeading: "This link has expired",
      checkHeading: "Check your email",
      expiredText:
        "Verification links are valid for a limited time. Send yourself a new one below.",
      sentTo:
        "We sent a verification link to {email}. Click it to activate your account — then you can sign in and order.",
      sent: "We sent you a verification link. Click it to activate your account — then you can sign in and order.",
      spamNote:
        "Can't find it? Check your spam or promotions folder. The email comes from Qaf Coffee.",
      sending: "Sending…",
      resendIn: "Resend available in {seconds}s",
      resend: "Resend verification email",
      alreadyVerified: "Already verified?",
      signIn: "Sign in",
      differentEmail: "Use a different email",
    },
    // What the auth forms report back (src/lib/authActions.ts).
    results: {
      enterEmailAndPassword: "Enter your email and password",
      signedIn: "Signed in successfully",
      rateLimited: "Too many attempts. Please wait a few minutes and try again.",
      verifyEmail:
        "Please verify your email address — we've sent you a new verification link.",
      invalidCredentials: "Invalid email or password",
      nameAndEmail: "Please enter your name and a valid email",
      nameTooLong: "Name must be at most 80 characters",
      passwordTooShort: "Password must be at least {min} characters",
      signUpSent: "Almost there! We sent a verification link to your email.",
      signUpFailed: "Unable to create your account",
      emailInvalid: "Enter a valid email address",
      resetLinkSent:
        "If an account exists for that email, we've sent a link to reset your password.",
      resetLinkInvalid: "This reset link is invalid. Please request a new one.",
      passwordReset: "Your password has been reset. You can sign in now.",
      resetLinkExpired:
        "This reset link is invalid or has expired. Please request a new one.",
      emailNotSent: "We couldn't send the email. Please try again.",
      verificationSent: "A new verification link is on its way.",
    },
  },

  errorPage: {
    title: "Something went wrong",
    text: "We could not quite perfect this brew. Our servers encountered an unexpected issue while loading this page.",
    details: "Error details:",
    reference: "Reference: {digest}",
    tryAgain: "Try Again",
  },

  notFound: {
    metaTitle: "Page not found",
    eyebrow: "Page not found",
    title: "That page has gone off the menu.",
    text: "The link may be outdated, or the page may have moved. Let us get you back to something worth opening.",
    back: "Back to QAF Coffee",
  },

  forbidden: {
    eyebrow: "Access restricted",
    title: "This space is reserved.",
    text: "You do not have permission to view this page. Sign in with an authorized account or return to the coffee menu.",
    home: "Return home",
    signIn: "Sign in",
  },

  // Messages returned by server actions to the storefront.
  server: {
    unexpected: "Unexpected error happened",
    signedOut: "Signed out successfully",
    signInToOrder: "Please sign in to place your order",
    signInToManageOrders: "Please sign in to manage your orders",
    signInToPay: "Please sign in to pay for your order",
    invalidOrderForm: "Invalid order form data",
    invalidMobile: "Please enter a valid Egyptian mobile number",
    noDelivery: "We don't deliver to the selected area. Please choose another.",
    cartMissing: "Cart is missing",
    invalidCartData: "Invalid cart data",
    invalidCartStructure: "Invalid cart structure",
    invalidCartItem: "Invalid cart item",
    tooManyItems: "Too many items in the cart",
    invalidSelection: "Invalid option or value selection",
    cartEmpty: "Your cart is empty",
    maxPerItem: "You can order up to {max} of one item",
    productsNotLoaded:
      "We couldn't load your cart's products. Please try again.",
    productsUnavailable: "One or more products are no longer available",
    productNotFound: "Product {id} not found",
    productOutOfStock: "Product {name} is out of stock",
    invalidOptions: "Invalid option selection for product {id}",
    valueNotInProduct: "Value {value} does not belong to product {id}",
    valueOutOfStock: "Selected option value {value} is out of stock",
    invalidValues: "Invalid value selection for option {id}",
    invalidPrice: "Invalid price for product {id}",
    invalidCartTotal: "Invalid cart total",
    shippingFailed: "Failed to calculate shipping fees",
    invalidShipping: "Invalid shipping fee",
    pricesChanged:
      "Prices changed since you added these items. Please check the new total and place your order again.",
    codLimit:
      "Cash on delivery is limited to {max} EGP. Please pay online or split your order.",
    invalidOrderID: "Invalid order ID",
    invalidOrder: "Invalid order",
    orderNotFound: "Order not found",
    paymentNotStarted:
      "Your order was saved but we couldn't start the payment. You can retry from your account page.",
    alreadyCancelled: "This order is already cancelled",
    withCourier:
      "This order has already been handed to the courier and can no longer be cancelled. Please message us on WhatsApp.",
    paidOnline:
      "You've paid for this order online, so please message us on WhatsApp to cancel it and arrange your refund.",
    courierCancelFailed:
      "We couldn't cancel the courier shipment. Please message us on WhatsApp and we'll cancel it for you.",
    statusChanged:
      "The order status just changed. Please refresh and try again.",
    orderCancelled: "Order cancelled",
    cannotPayOnline: "This order cannot be paid online",
    nameLength: "Name must be between 2 and 80 characters",
    profileNotUpdated: "Could not update your profile",
    messageSent: "Thanks. Your message has been sent.",
    completeAllFields: "Please complete all fields.",
    messageTooLong: "Your message is too long.",
    invalidEmail: "Please enter a valid email address.",
    tooManyMessages:
      "You've sent several messages in a row. Please wait a few minutes and try again.",
    messageNotSent: "Unable to send your message.",
  },

  emails: {
    footer: "Questions? Reply to this email or write to {email}.",
    verify: {
      subject: "Verify your email address",
      intro:
        "Hi {name}, welcome to Qaf Coffee! Confirm your email address to activate your account.",
      action: "Verify email",
      outro: "If you didn't create an account, you can ignore this email.",
    },
    resetPassword: {
      subject: "Reset your password",
      intro:
        "Hi {name}, we received a request to reset your Qaf Coffee password. This link is valid for 1 hour.",
      action: "Choose a new password",
      outro:
        "If you didn't ask to reset your password, you can ignore this email — your password won't change.",
    },
    existingAccount: {
      subject: "Sign-up attempt with your email",
      text: "Someone tried to create an account using your email address. If this was you, try signing in instead — or use “Forgot password” if you can't remember it. If not, you can safely ignore this email.",
    },
    orderConfirmation: {
      subject: "Your Qaf Coffee order {number} is confirmed",
      title: "Order {number} confirmed",
      fallbackName: "there",
      greeting: "Hi {name},",
      received:
        "Thanks for your order! We've received order {number} and we're preparing it now.",
      intro: "Hi {name}, thanks for your order! We're preparing it now.",
      paid: "Your payment was received.",
      payOnDelivery: "Please have {total} ready when the courier arrives.",
      subtotal: "Subtotal",
      shipping: "Shipping",
      total: "Total",
      payment: "Payment",
      deliveringTo: "Delivering to",
      track: "Track your order",
      paymentMethods: {
        paymob_card: "Card (paid)",
        mobile_wallet: "Mobile wallet (paid)",
        cash_on_delivery: "Cash on delivery",
      },
    },
  },
};

export type Messages = typeof en;

export default en;
