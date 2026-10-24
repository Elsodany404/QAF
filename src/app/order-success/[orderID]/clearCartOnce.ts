/*
 * Remembers, in the browser, which orders' confirmation pages already
 * emptied the cart, so it survives reloads and Back/Forward.
 */

const STORAGE_KEY = "cartClearedForOrders";
// Plenty for one browser; the oldest entries are dropped.
const MAX_REMEMBERED = 20;

function parseOrderIDs(saved: string | null): number[] {
  try {
    const parsed: unknown = JSON.parse(saved ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((id) => Number.isInteger(id))
      : [];
  } catch {
    return []; // Unreadable: start over rather than clear every time.
  }
}

/**
 * True the first time it's asked about an order (empty the cart now),
 * false every time after that.
 */
export function claimCartClear(orderID: number): boolean {
  let saved: string | null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage disabled (private mode): the cart can't outlive the tab then,
    // so emptying it for the order just placed is the right call.
    return true;
  }

  const cleared = parseOrderIDs(saved);
  if (cleared.includes(orderID)) return false;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...cleared, orderID].slice(-MAX_REMEMBERED)),
    );
  } catch {
    // Storage full: still empty the cart this time.
  }
  return true;
}
