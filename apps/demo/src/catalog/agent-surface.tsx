/**
 * The entire agent frontend of the catalog. Delete this file and Northwind
 * Supply is a normal human-only storefront; keep it and any WebMCP agent gets
 * a fast lane through 72 products instead of reading every card.
 */
import {
  setAgentStateBudget,
  useAgentAction,
  useAgentState,
  webmcpSupported
} from "@agentperf/react";
import { z } from "zod";
import {
  CATEGORIES,
  PRODUCTS,
  PRODUCTS_BY_ID,
  filterProducts,
  money,
  type Filters,
  type Order,
  type Product
} from "./data";
import type { CartEntry, CatalogApi } from "./App";

/** A shop this size must summarise, not dump: get_page_state stays a summary. */
setAgentStateBudget(800);

/** How much of the current result set get_page_state shows, and search_products returns. */
const STATE_PREVIEW = 8;
const SEARCH_PAGE = 20;

interface AgentSurfaceProps {
  filters: Filters;
  visible: Product[];
  cartEntries: CartEntry[];
  cartTotal: number;
  order: Order | null;
  api: CatalogApi;
}

function row(product: Product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    rating: product.rating,
    inStock: product.inStock
  };
}

export function AgentSurface({
  filters,
  visible,
  cartEntries,
  cartTotal,
  order,
  api
}: AgentSurfaceProps) {
  // --- What agents can read (one token-budgeted get_page_state tool) ---
  // Deliberately NOT the whole catalog: this is the view the page is showing,
  // the same thing a person sees, and the reason to call search_products.
  useAgentState("store", {
    name: "Northwind Supply",
    totalProducts: PRODUCTS.length,
    categories: CATEGORIES
  });
  useAgentState("filters", filters);
  useAgentState("results", {
    matched: visible.length,
    sortedBy: filters.sortBy,
    preview: visible.slice(0, STATE_PREVIEW).map(row),
    previewNote:
      visible.length > STATE_PREVIEW
        ? `first ${STATE_PREVIEW} of ${visible.length}; call search_products for the rest`
        : "complete"
  });
  useAgentState("cart", {
    lines: cartEntries.map((entry) => ({
      productId: entry.product.id,
      name: entry.product.name,
      quantity: entry.quantity,
      lineTotal: entry.lineTotal
    })),
    itemCount: cartEntries.reduce((sum, entry) => sum + entry.quantity, 0),
    total: cartTotal
  });
  useAgentState(
    "lastOrder",
    order && {
      orderNumber: order.number,
      name: order.name,
      email: order.email,
      total: order.total,
      lines: order.lines.map((line) => `${line.quantity} x ${line.name}`)
    }
  );

  // --- What agents can do ---
  const search = useAgentAction("search_products", {
    description:
      "Filter the catalogue and show the result on the page. Each call states the whole filter: " +
      "arguments you leave out are cleared, not kept from the last call. query matches name, " +
      "brand, category, tags and description and every term must match, so 'wireless keyboard' " +
      "means both; category narrows to one department; minRating and maxPrice bound the numbers; " +
      "inStockOnly drops sold-out products; sortBy orders the result (price ascending, rating " +
      `descending, name A-Z, default price). Returns up to ${SEARCH_PAGE} rows plus the total ` +
      "match count — narrow the filters if there are more.",
    input: z.object({
      query: z.string().optional(),
      category: z
        .enum(["keyboards", "mice", "monitors", "headsets", "webcams", "docks"])
        .optional(),
      minRating: z.number().min(0).max(5).optional(),
      inStockOnly: z.boolean().optional(),
      maxPrice: z.number().positive().optional(),
      sortBy: z.enum(["price", "rating", "name"]).optional()
    }),
    readOnly: true,
    execute: (input) => {
      const applied: Filters = {
        query: input.query ?? "",
        category: input.category ?? null,
        minRating: input.minRating ?? 0,
        inStockOnly: input.inStockOnly ?? false,
        maxPrice: input.maxPrice ?? null,
        sortBy: input.sortBy ?? "price"
      };
      api.setFilters(applied);
      const matches = filterProducts(applied);
      return {
        matched: matches.length,
        sortedBy: applied.sortBy,
        products: matches.slice(0, SEARCH_PAGE).map(row),
        ...(matches.length > SEARCH_PAGE && {
          note: `showing the first ${SEARCH_PAGE} of ${matches.length}; add filters to narrow it`
        })
      };
    }
  });

  const detail = useAgentAction("get_product", {
    description:
      "Full record for one product by id — price, rating, review count, stock, tags and " +
      "description. Opens that card's detail panel on the page so the person sees what you " +
      "looked at. Product ids come from search_products or get_page_state.",
    input: z.object({ productId: z.string() }),
    readOnly: true,
    execute: ({ productId }) => {
      const product = PRODUCTS_BY_ID.get(productId);
      if (!product) {
        throw new Error(
          `No product with id "${productId}". Call search_products to get valid product ids.`
        );
      }
      api.showDetails(productId);
      const inCart = cartEntries.find((entry) => entry.product.id === productId);
      return { ...product, quantityInCart: inCart?.quantity ?? 0 };
    }
  });

  const add = useAgentAction("add_to_cart", {
    description:
      "Add a product to the cart, or increase the quantity if it is already there. Refused for " +
      "unknown ids and for sold-out products. Returns the new quantity and cart total.",
    input: z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(99).default(1)
    }),
    execute: ({ productId, quantity }) => {
      const newQuantity = api.addToCart(productId, quantity);
      const product = PRODUCTS_BY_ID.get(productId)!;
      const total = cartTotal + product.price * quantity;
      return `${product.name} x${newQuantity} in the cart. Cart total ${money(total)}.`;
    }
  });

  const remove = useAgentAction("remove_from_cart", {
    description:
      "Take a product out of the cart entirely, whatever its quantity. Only products already " +
      "in the cart can be removed.",
    input: z.object({ productId: z.string() }),
    destructive: true,
    execute: ({ productId }) => {
      api.removeFromCart(productId);
      return `Removed ${PRODUCTS_BY_ID.get(productId)?.name ?? productId} from the cart.`;
    }
  });

  const checkout = useAgentAction("place_order", {
    description:
      "Check out everything in the cart under this name and email, and show the confirmation " +
      "on the page. Returns the order number (NW-XXXXX). Refused when the cart is empty or the " +
      "email is not a valid address. Placing an order cannot be undone from this page.",
    input: z.object({
      name: z.string().min(1),
      email: z.string().email()
    }),
    destructive: true,
    consequential: true, // a real purchase: the agent must confirm with the person first
    price: "$0.00", // reserved for x402 settlement — inert today
    execute: ({ name, email }) => {
      const placed = api.placeOrder(name, email);
      const items = placed.lines.map((line) => `${line.quantity} x ${line.name}`).join(", ");
      return `Order ${placed.number} placed: ${items}, total ${money(placed.total)}. The confirmation is on the page.`;
    }
  });

  // --- The dock: humans see what agents can see ---
  const supported = webmcpSupported();
  const live =
    [search, detail, add, remove, checkout].filter((tool) => tool.supported).length +
    (supported ? 1 : 0);
  return (
    <div className="dock" data-testid="agent-dock">
      {supported ? (
        <>
          <span className="n">{live} tools live</span> — this page speaks WebMCP.
          <div className="hint">
            Ask your agent: “order the cheapest in-stock wireless keyboard rated 4.5 or higher.”
          </div>
        </>
      ) : (
        <>
          No WebMCP in this browser.
          <div className="hint">
            Chrome 149+ with chrome://flags/#enable-webmcp-testing, or the ChatGPT browser.
            The page works normally for humans either way.
          </div>
        </>
      )}
    </div>
  );
}
