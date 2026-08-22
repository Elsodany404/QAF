import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Database } from "../_shared/database.types.ts";
import type { OrderQuery } from "../_shared/customTypes.ts";

const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys.default,
);

const API_URL = "https://v5jd33rn-4173.uks1.devtunnels.ms";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// @ts-expect-error Deno is provided by the Supabase Edge Functions runtime
Deno.serve(async (req) => {
  try {
    // Handle browser CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Fix: Parse the entire body first so we can use 'body.itemName', etc. later
    const body = await req.json();
    const { orderID } = body;

    if (!orderID) {
      throw new Error("orderID isn't provided in the request");
    }

    const { data: orderData, error } = await supabase
      .from("Order")
      .select(
        `
    *,
    orderItems:OrderItem(
      *,
      product:Product(*)
    )
  `,
      )
      .eq("id", orderID)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!orderData) {
      throw new Error("Order not found");
    }
    const order = orderData as OrderQuery;
    const paymentMethod = order.paymentMethod;
    const integrationID = paymentMethod === "paymob_card" ? 5360439 : 5815163;
    const items = order.orderItems.map((item) => ({
      name: item.productName,
      amount: item.totalPrice,
      description: item.product.description,
      quantity: item.quantity,
    }));
    // ==========================================
    // 2. CREATE PAYMOB INTENTION
    // ==========================================
    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      {
        method: "POST",
        headers: {
          // @ts-expect-error Deno is provided by the Supabase Edge Functions runtime
          Authorization: `Token ${Deno.env.get("PAYMOB_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Using the fetched order data
          amount: order.totalPrice,
          currency: "EGP",
          payment_methods: [integrationID],

          // Using the request body data (as structured in your original code)
          items,

          billing_data: {
            apartment: order.apartment,
            first_name: order.customerName.trim().split(" ")[0],
            last_name: order.customerName.trim().split(" ")[1]
              ? order.customerName.trim().split(" ")[1]
              : "NA",
            street: order.street,
            building: order.apartment,
            phone_number: order.customerPhone,
            city: order.city,
            country: "EGY",
            email: order.customerEmail,
            floor: "NA",
            state: order.governorate,
          },

          extras: {
            ee: 22,
          },

          special_reference: body.specialReference,
          expiration: 3600,

          notification_url:
            "https://bdksjsmaqssxasrlyzci.supabase.co/functions/v1/paymob-webhook",

          redirection_url: `${API_URL}/order-success/${orderID}`,
        }),
      },
    );

    const data = await paymobResponse.json();

    if (!paymobResponse.ok) {
      return new Response(JSON.stringify(data), {
        status: paymobResponse.status,
        headers: {
          ...corsHeaders, // Fix: Must include CORS headers in error responses too
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders, // Fix: Must include CORS headers in success response
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders, // Fix: Must include CORS headers in catch block
          "Content-Type": "application/json",
        },
      },
    );
  }
});
