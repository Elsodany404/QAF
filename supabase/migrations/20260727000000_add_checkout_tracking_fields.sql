alter table public."Order"
  add column if not exists "paymentMethod" text,
  add column if not exists "paymentStatus" text default 'pending',
  add column if not exists "shippingStatus" text default 'pending',
  add column if not exists "bostaOrderID" text,
  add column if not exists "bostaTrackingNumber" text,
  add column if not exists "bostaTrackingUrl" text;
