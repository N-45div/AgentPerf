import { useMemo, useState } from "react";
import { AgentSurface } from "./agent-surface";
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  PRODUCTS,
  PRODUCTS_BY_ID,
  filterProducts,
  makeOrderNumber,
  money,
  type CartLine,
  type Filters,
  type Order,
  type Product,
  type SortBy
} from "./data";

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const RATING_STEPS = [0, 3.5, 4, 4.5];

export interface CatalogApi {
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  /** Returns the new quantity. Throws with a human-readable reason. */
  addToCart: (productId: string, quantity: number) => number;
  /** Throws when the product is not in the cart. */
  removeFromCart: (productId: string) => void;
  /** Returns the placed order. Throws when the cart is empty. */
  placeOrder: (name: string, email: string) => Order;
  toggleDetails: (productId: string) => void;
  /** Idempotent: opens a card's detail panel so a person sees what was looked up. */
  showDetails: (productId: string) => void;
}

export interface CartEntry {
  product: Product;
  quantity: number;
  lineTotal: number;
}

function stars(rating: number): string {
  const filled = Math.round(rating);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

export default function App() {
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderSeq, setOrderSeq] = useState(1);

  const visible = useMemo(() => filterProducts(filters), [filters]);

  const cartEntries: CartEntry[] = cart.flatMap((line) => {
    const product = PRODUCTS_BY_ID.get(line.productId);
    if (!product) return [];
    return [{ product, quantity: line.quantity, lineTotal: product.price * line.quantity }];
  });
  const cartTotal = cartEntries.reduce((sum, entry) => sum + entry.lineTotal, 0);
  const cartCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0);

  const api: CatalogApi = {
    setFilters: (patch) => setFiltersState((prev) => ({ ...prev, ...patch })),
    resetFilters: () => setFiltersState(DEFAULT_FILTERS),
    addToCart: (productId, quantity) => {
      const product = PRODUCTS_BY_ID.get(productId);
      if (!product) {
        throw new Error(
          `No product with id "${productId}". Use search_products to get valid product ids.`
        );
      }
      if (!product.inStock) {
        throw new Error(`${product.name} is sold out and cannot be added to the cart.`);
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Quantity must be a whole number of 1 or more, got ${quantity}.`);
      }
      const existing = cart.find((line) => line.productId === productId);
      const next = (existing?.quantity ?? 0) + quantity;
      setCart((prev) =>
        existing
          ? prev.map((line) => (line.productId === productId ? { ...line, quantity: next } : line))
          : [...prev, { productId, quantity }]
      );
      return next;
    },
    removeFromCart: (productId) => {
      if (!cart.some((line) => line.productId === productId)) {
        throw new Error(`"${productId}" is not in the cart, so there is nothing to remove.`);
      }
      setCart((prev) => prev.filter((line) => line.productId !== productId));
    },
    placeOrder: (who, mail) => {
      if (cartEntries.length === 0) {
        throw new Error("The cart is empty. Add at least one product before placing an order.");
      }
      const placed: Order = {
        number: makeOrderNumber(`${who}|${mail}|${cart.map((l) => `${l.productId}x${l.quantity}`).join(",")}`, orderSeq),
        name: who,
        email: mail,
        lines: cartEntries.map((entry) => ({
          productId: entry.product.id,
          name: entry.product.name,
          quantity: entry.quantity,
          price: entry.product.price
        })),
        total: cartTotal
      };
      setOrder(placed);
      setOrderSeq((n) => n + 1);
      setCart([]);
      setName(who);
      setEmail(mail);
      setTouched(false);
      return placed;
    },
    toggleDetails: (productId) =>
      setExpanded((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      ),
    showDetails: (productId) =>
      setExpanded((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
  };

  const nameError = name.trim() === "" ? "Enter the name for the order." : null;
  const emailError = EMAIL_RE.test(email.trim()) ? null : "Enter a valid email address.";
  const canSubmit = cartEntries.length > 0 && nameError === null && emailError === null;

  return (
    <div className="shell">
      <header>
        <a className="backlink" href="../">← AgentPerf</a>
        <h1>Northwind Supply</h1>
        <p>Desk hardware, shipped from Leeds. Humans browse the grid; agents call the tools.</p>
        <p className="numbers">
          The <strong>heavy page</strong> in the AgentPerf benchmark: {PRODUCTS.length} products
          across {CATEGORIES.length} categories, all rendered — a 32,916-character
          accessibility tree. Measured 1 Sep 2026 (n=5, both lanes 100%): buying the cheapest
          qualifying keyboard cost <strong>7,434 tokens through these tools</strong> and{" "}
          <strong>102,537 by DOM driving</strong> — <strong>13.8x</strong>. On the{" "}
          <a href="../demo/">small salon page</a> the same comparison is only 2.4x, which is
          the point: the gap belongs to the page, not to WebMCP.{" "}
          <a
            href="https://github.com/N-45div/AgentPerf/blob/main/benchmarks/2026-09-01-catalog-gpt-5.6-luna/report.md"
            target="_blank"
            rel="noreferrer"
          >
            Full report
          </a>
        </p>
      </header>

      {order && (
        <div className="confirm" role="status">
          <p className="line">
            Order <code>{order.number}</code> confirmed:{" "}
            {order.lines.map((line) => `${line.quantity} x ${line.name}`).join(", ")}, total{" "}
            {money(order.total)}
          </p>
          <p className="sub">
            A receipt is on its way to {order.email}. Free delivery, arriving in 2–3 working days.
          </p>
        </div>
      )}

      <div className="filters">
        <input
          className="search"
          placeholder="Search products (wireless keyboard, 4k monitor, dock…)"
          value={filters.query}
          onChange={(e) => api.setFilters({ query: e.target.value })}
          aria-label="Search products"
        />

        <div className="chips" role="group" aria-label="Filter by category">
          <button
            className={`chip${filters.category === null ? " on" : ""}`}
            onClick={() => api.setFilters({ category: null })}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`chip${filters.category === category ? " on" : ""}`}
              onClick={() =>
                api.setFilters({ category: filters.category === category ? null : category })
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => api.setFilters({ inStockOnly: e.target.checked })}
            />
            In stock only
          </label>

          <label>
            Minimum rating
            <select
              value={String(filters.minRating)}
              onChange={(e) => api.setFilters({ minRating: Number(e.target.value) })}
            >
              {RATING_STEPS.map((step) => (
                <option key={step} value={step}>
                  {step === 0 ? "Any" : `${step.toFixed(1)}+`}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort by
            <select
              value={filters.sortBy}
              onChange={(e) => api.setFilters({ sortBy: e.target.value as SortBy })}
            >
              <option value="price">Price, low to high</option>
              <option value="rating">Rating, high to low</option>
              <option value="name">Name, A to Z</option>
            </select>
          </label>

          <button className="ghost" onClick={api.resetFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="resultbar">
        <h2>
          Showing {visible.length} of {PRODUCTS.length} products
        </h2>
        {filters.query.trim() !== "" && <span className="q">for “{filters.query.trim()}”</span>}
      </div>

      <div className="grid">
        {visible.map((product) => {
          const open = expanded.includes(product.id);
          return (
            <article className="product" key={product.id}>
              <div className="phead">
                <div>
                  <h3>{product.name}</h3>
                  <div className="brand">
                    {product.brand} · {product.category}
                  </div>
                </div>
                <div className="price">{money(product.price)}</div>
              </div>

              <div className="rating">
                <span className="stars" aria-hidden="true">
                  {stars(product.rating)}
                </span>
                <span className="score">{product.rating.toFixed(1)}</span>
                <span className="reviews">{product.reviewCount.toLocaleString("en-GB")} reviews</span>
                <span className={product.inStock ? "badge in" : "badge out"}>
                  {product.inStock ? "In stock" : "Sold out"}
                </span>
              </div>

              <p className="desc">{product.shortDescription}</p>

              <ul className="tags">
                {product.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>

              <div className="actions">
                <button
                  onClick={() => api.addToCart(product.id, 1)}
                  disabled={!product.inStock}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {product.inStock ? "Add to cart" : "Sold out"}
                </button>
                <button
                  className="ghost"
                  aria-expanded={open}
                  aria-label={`${open ? "Hide" : "Show"} details for ${product.name}`}
                  onClick={() => api.toggleDetails(product.id)}
                >
                  {open ? "Hide details" : "Details"}
                </button>
              </div>

              {open && (
                <dl className="detail">
                  <dt>SKU</dt>
                  <dd>{product.id.toUpperCase()}</dd>
                  <dt>Rating</dt>
                  <dd>
                    {product.rating.toFixed(1)} out of 5, from{" "}
                    {product.reviewCount.toLocaleString("en-GB")} verified reviews
                  </dd>
                  <dt>Availability</dt>
                  <dd>
                    {product.inStock
                      ? "In stock in the Leeds warehouse — ships the next working day."
                      : "Sold out — cannot be ordered until the next batch arrives."}
                  </dd>
                  <dt>Connection</dt>
                  <dd>{product.tags.join(", ")}</dd>
                  <dt>Warranty</dt>
                  <dd>Two years, parts and labour, handled by Northwind.</dd>
                  <dt>Returns</dt>
                  <dd>30 days, unopened or not, return postage paid.</dd>
                </dl>
              )}
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="empty">Nothing matches those filters. Try clearing one of them.</p>
        )}
      </div>

      <h2 className="carthead">Your cart</h2>
      {cartEntries.length === 0 ? (
        <p className="empty">The cart is empty.</p>
      ) : (
        <ul className="cart">
          {cartEntries.map((entry) => (
            <li key={entry.product.id}>
              <div className="ci">
                <span className="cn">{entry.product.name}</span>
                <span className="cb">
                  {entry.product.brand} · {money(entry.product.price)} each
                </span>
              </div>
              <div className="qty">
                <button
                  aria-label={`Decrease quantity of ${entry.product.name}`}
                  onClick={() =>
                    entry.quantity === 1
                      ? api.removeFromCart(entry.product.id)
                      : setCart((prev) =>
                          prev.map((line) =>
                            line.productId === entry.product.id
                              ? { ...line, quantity: line.quantity - 1 }
                              : line
                          )
                        )
                  }
                >
                  −
                </button>
                <span aria-label={`Quantity of ${entry.product.name}`}>{entry.quantity}</span>
                <button
                  aria-label={`Increase quantity of ${entry.product.name}`}
                  onClick={() => api.addToCart(entry.product.id, 1)}
                >
                  +
                </button>
              </div>
              <span className="lt">{money(entry.lineTotal)}</span>
              <button
                className="ghost"
                aria-label={`Remove ${entry.product.name} from cart`}
                onClick={() => api.removeFromCart(entry.product.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {cartEntries.length > 0 && (
        <p className="total">
          {cartCount} {cartCount === 1 ? "item" : "items"} · Total <strong>{money(cartTotal)}</strong>{" "}
          <span className="muted">— delivery included</span>
        </p>
      )}

      <h2>Checkout</h2>
      <form
        className="checkout"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!canSubmit) return;
          api.placeOrder(name.trim(), email.trim());
        }}
      >
        <label>
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-label="Full name"
            placeholder="Dana Smith"
          />
          {touched && nameError && <span className="err">{nameError}</span>}
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-label="Email"
            placeholder="dana@example.com"
          />
          {touched && emailError && <span className="err">{emailError}</span>}
        </label>
        <button type="submit" disabled={!canSubmit}>
          Place order
        </button>
      </form>

      <AgentSurface
        filters={filters}
        visible={visible}
        cartEntries={cartEntries}
        cartTotal={cartTotal}
        order={order}
        api={api}
      />
    </div>
  );
}
