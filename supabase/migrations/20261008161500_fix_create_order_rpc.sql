CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_id text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_apartment text,
  p_street text,
  p_city text,
  p_cityid text,
  p_district text,
  p_districtid text,
  p_subtotal numeric,
  p_shipping_fees numeric,
  p_payment_method text,
  p_items jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id bigint;
  v_total_price numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items must be a non-empty array';
  END IF;

  v_total_price := p_subtotal + p_shipping_fees;

  INSERT INTO public."Order" (
    "customer_ID",
    "customerName",
    "customerEmail",
    "customerPhone",
    "apartment",
    "street",
    "city",
    "cityID",
    "district",
    "districtID",
    "subTotal",
    "shippingFees",
    "totalPrice",
    "paymentMethod"
  )
  VALUES (
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_apartment,
    p_street,
    p_city,
    p_cityid,
    p_district,
    p_districtid,
    p_subtotal,
    p_shipping_fees,
    v_total_price,
    p_payment_method
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public."OrderItem" (
    "productName",
    "quantity",
    "totalPrice",
    "productID",
    "orderID",
    "options"
  )
  SELECT
    item->>'productName',
    (item->>'quantity')::integer,
    (item->>'totalPrice')::numeric,
    (item->>'productID')::bigint,
    v_order_id,
    COALESCE(NULLIF(item->'options', 'null'::jsonb), '[]'::jsonb)
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$function$;