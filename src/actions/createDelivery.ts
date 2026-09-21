"use server";

import { getOrderByID } from "@/services/Order";

const businessLocationId = "q3g2v58sxw";

export async function createDelivery(orderID: string) {
  try {
    const order = await getOrderByID(orderID);

    if (!order) {
      throw new Error("Bosta: can't find order in database");
    }

    const isCOD = order.paymentMethod === "cash_on_delivery";

    if (!isCOD && order.paymentStatus !== "paid") {
      throw new Error("Order is not paid yet to create delivery");
    }

    if (!process.env.BOSTA_API_KEY) {
      throw new Error("BOSTA_API_KEY is not configured");
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      throw new Error("SITE_URL is not configured");
    }

    const codAmount = isCOD ? order.totalPrice : 0;

    const nameParts = order.customerName.trim().split(/\s+/);

    const payload = {
      type: 10,
      cod: codAmount,
      businessLocationId,
      businessReference: orderID,

      allowToOpenPackage: true,

      specs: {
        packageType: "Parcel",
        size: "MEDIUM",
        packageDetails: {
          itemsCount: order.orderItems.length,
          description: "Coffee Packages",
        },
      },

      dropOffAddress: {
        cityId: order.cityID,
        city: order.city,
        districtName: order.district,
        districtId: order.districtID,
        firstLine: order.street,
        apartment: order.apartment,
      },

      goodsInfo: {
        value: order.totalPrice,
        currency: "EGP",
      },

      receiver: {
        firstName: nameParts[0] || "Customer",
        lastName: nameParts.slice(1).join(" ") || "Name",
        phone: order.customerPhone,
        email: order.customerEmail || "no-reply@domain.com",
      },

    };

    console.log("Creating Bosta delivery:", {
      orderID,
      payload,
    });

    const response = await fetch(
      "https://app.bosta.co/api/v2/deliveries?apiVersion=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.BOSTA_API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    const responseText = await response.text();

    let responseBody: unknown;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    console.log("Bosta response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
    });

    if (!response.ok) {
      throw new Error(
        `Bosta API error ${response.status}: ${
          typeof responseBody === "object" &&
          responseBody !== null &&
          "message" in responseBody
            ? String(responseBody.message)
            : responseText
        }`,
      );
    }

    if (
      typeof responseBody === "object" &&
      responseBody !== null &&
      "success" in responseBody &&
      responseBody.success === false
    ) {
      throw new Error(
        "message" in responseBody
          ? String(responseBody.message)
          : "Bosta rejected the delivery",
      );
    }

    return {
      status: "success",
      message: "The shipment was created successfully",
    };
  } catch (err) {
    console.error("createDelivery failed:", err);

    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error happened",
    };
  }
}
