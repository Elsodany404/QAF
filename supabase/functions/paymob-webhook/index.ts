const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
// @ts-expect-error Deno is provided by Supabase Edge Functions runtime
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Paymob webhooks send the event inside an "obj" object
    const transaction = payload.obj;

    if (!transaction) {
      return new Response(JSON.stringify({ message: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine transaction success from Paymob booleans
    const isSuccess =
      transaction.success === true && transaction.pending === false;

    // Extract your special reference / internal order ID passed during intention creation
    const specialReference =
      transaction.order?.merchant_order_id || transaction.special_reference;
    const paymobTransactionID = transaction.id;

    if (!specialReference) {
      throw new Error("Merchant order reference missing from Paymob webhook");
    }

    // @ts-expect-error Deno is provided by Supabase runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-expect-error Deno is provided by Supabase runtime
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Bypasses RLS to safely update records

    // Update your "Order" table based on your exact schema columns
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/Order?id=eq.${specialReference}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status: isSuccess ? "completed" : "failed",
          paymentStatus: isSuccess ? "paid" : "failed",
          paymobTransactionID: String(paymobTransactionID),
        }),
      },
    );

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      throw new Error(`Failed to update database: ${errText}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
