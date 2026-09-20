"use server";

import { ActionState } from "@/types/customTypes";
import supabaseAdmin from "@/supabase/admin";
// Admin client bypasses RLS

export async function deleteOrder(orderID: number): Promise<ActionState> {
  try {
    // 1. Fetch the order to check if a Bosta delivery exists
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("Order")
      .select("*")
      .eq("id", orderID)
      .single();

    if (fetchError || !order) {
      return { status: "failed", message: "Order not found" };
    }
    const bostaTrackingNumber = order.bostaTrackingNumber;
    // 2. Cancel Bosta delivery if one was created
    if (order.bostaOrderID) {
      try {
        const bostaRes = await fetch(
          `http://app.bosta.co/api/v2/deliveries/business/${bostaTrackingNumber}/terminate`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.BOSTA_API_KEY!,
            },
          },
        );

        if (!bostaRes.ok) {
          const err = await bostaRes.json().catch(() => ({}));
          console.warn(
            `Bosta delivery cancel failed (continuing deletion): ${err?.message ?? bostaRes.status}`,
          );
        }
      } catch (bostaErr) {
        // Log but don't block the deletion — Bosta may already have processed it
        console.warn("Bosta cancel request threw:", bostaErr);
      }
    }

    // 3. Delete the order (cascade deletes OrderItems via FK)
    const { error: deleteError } = await supabaseAdmin
      .from("Order")
      .delete()
      .eq("id", orderID);

    if (deleteError) {
      return {
        status: "failed",
        message: `Failed to delete order: ${deleteError.message}`,
      };
    }

    return { status: "success", message: "Order deleted successfully" };
  } catch (err) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
