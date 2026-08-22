import { supabase } from "../lib/supabase";

export async function createPayment(orderID: number) {
  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: { orderID },
  });

  if (error) {
    throw error;
  }

  return data;
}
