"use client";

import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import type { Brand, Category, Product } from "@/types";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Package,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { DeleteProductButton } from "./DeleteProductButton";
import {
  hasProductListFilters,
  productListSearchParams,
  type ProductListFilters,
} from "./query";

type ProductRow = Product & {
  category?: { name_sq: string } | null;
  brand?: { name: string } | null;
};

interface Props {
  products: ProductRow[];
  categories: Pick<Category, "id" | "name_sq">[];
  brands: Pick<Brand, "id" | "name">[];
  matched: number;
  page: number;
  pageSize: number;
  stats: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
    onSale: number;
  };
  filters: ProductListFilters;
}

const AUDIENCE_LABELS: Record<string, string> = {
  home: "🏠 Shtëpi",
  business: "🏢 Biznes",
  both: "👥 Të Gjithë",
};

function getScrollEl() {
  return typeof document !== "undefined"
    ? document.getElementById("admin-main")
    : null;
}

function pageNumbers(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(set).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("gap");
    out.push(sorted[i]);
  }
  return out;
}

export function ProductsClient({
  products,
  categories,
  brands,
  matched,
  page,
  pageSize,
  stats,
  filters,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin-products-scroll");
    if (!saved) return;
    sessionStorage.removeItem("admin-products-scroll");
    const y = parseInt(saved, 10);
    const restore = () => {
      const el = getScrollEl();
      if (el) el.scrollTop = y;
      else window.scrollTo(0, y);
    };
    setTimeout(restore, 50);
    setTimeout(restore, 200);
  }, []);

  const pushFilters = (next: ProductListFilters) => {
    const qs = productListSearchParams(next);
    startTransition(() => {
      router.push(qs ? `/admin/products?${qs}` : "/admin/products", {
        scroll: false,
      });
    });
  };

  const setFilter = (patch: Partial<ProductListFilters>) => {
    pushFilters({ ...filters, ...patch, page: 1 });
  };

  useEffect(() => {
    const q = search.trim();
    if (q === filtersRef.current.q) return;
    const t = window.setTimeout(() => {
      pushFilters({ ...filtersRef.current, q, page: 1 });
    }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const hasFilters = hasProductListFilters(filters);
  const hasDropdownFilters = Boolean(
    filters.categoryId ||
      filters.brandId ||
      filters.audience ||
      filters.status ||
      filters.stock ||
      filters.listingType
  );

  const totalPages = Math.max(1, Math.ceil(matched / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = matched === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, matched);

  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages);
    pushFilters({ ...filters, page: next });
    getScrollEl()?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => {
    setSearch("");
    pushFilters({
      q: "",
      categoryId: "",
      brandId: "",
      audience: "",
      status: "",
      stock: "",
      listingType: "",
      onSale: false,
      featured: false,
      bestSeller: false,
      page: 1,
    });
  };

  const {
    categoryId,
    brandId,
    audience,
    status,
    stock,
    listingType,
    onSale,
    featured,
    bestSeller,
  } = filters;

  const saveScroll = () => {
    const el = getScrollEl();
    sessionStorage.setItem(
      "admin-products-scroll",
      String(el ? el.scrollTop : window.scrollY)
    );
  };

  const statCards = [
    {
      label: "Gjithsej",
      value: stats.total,
      color: "text-gray-900",
      active: !hasFilters,
      onClick: clearAll,
    },
    {
      label: "Aktive",
      value: stats.active,
      color: "text-emerald-600",
      active: status === "active",
      onClick: () => setFilter({ status: status === "active" ? "" : "active" }),
    },
    {
      label: "Nuk ka në stok",
      value: stats.outOfStock,
      color: "text-red-500",
      active: stock === "out",
      onClick: () => setFilter({ stock: stock === "out" ? "" : "out" }),
    },
    {
      label: "I ulët",
      value: stats.lowStock,
      color: "text-amber-500",
      active: stock === "low",
      onClick: () => setFilter({ stock: stock === "low" ? "" : "low" }),
    },
    {
      label: "Zbritje",
      value: stats.onSale,
      color: "text-brand-600",
      active: onSale,
      onClick: () => setFilter({ onSale: !onSale }),
    },
  ] as const;

  return (
    <div className="admin-page space-y-3">
      {/* ── STATS ── */}
      <div className="grid grid-cols-5 gap-2">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className={`admin-card px-2 py-2.5 text-center transition-all active:scale-[0.97] ${
              s.active
                ? "border-brand-400 ring-1 ring-brand-300 bg-brand-50/30"
                : "hover:border-brand-200"
            }`}
          >
            <p
              className={`text-base md:text-lg font-bold tabular-nums ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-[10px] md:text-[11px] text-text-muted mt-0.5 leading-none">
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="admin-card-flush overflow-hidden">
        {/* Search row — always visible */}
        <div className="flex items-center gap-2 p-2.5">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Emri ose SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 bg-gray-50/50"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter({ q: "" });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Toggle filters — mobile only */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              filtersOpen || hasDropdownFilters
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-gray-200 text-gray-500"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filtra
            {hasDropdownFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            )}
          </button>

          {/* Desktop dropdowns — always visible on md+ */}
          <div className="hidden md:flex items-center gap-2">
            {[
              {
                val: categoryId,
                set: (v: string) => setFilter({ categoryId: v }),
                placeholder: "Kategoria",
                opts: categories.map((c) => ({ v: c.id, l: c.name_sq })),
              },
              ...(brands.length > 0
                ? [
                    {
                      val: brandId,
                      set: (v: string) => setFilter({ brandId: v }),
                      placeholder: "Brendi",
                      opts: brands.map((b) => ({ v: b.id, l: b.name })),
                    },
                  ]
                : []),
              {
                val: audience,
                set: (v: string) => setFilter({ audience: v }),
                placeholder: "Audienca",
                opts: [
                  { v: "home", l: "🏠 Shtëpi" },
                  { v: "business", l: "🏢 Biznes" },
                  { v: "both", l: "👥 Të Gjithë" },
                ],
              },
              {
                val: status,
                set: (v: string) => setFilter({ status: v }),
                placeholder: "Statusi",
                opts: [
                  { v: "active", l: "✅ Aktiv" },
                  { v: "inactive", l: "⛔ Joaktiv" },
                ],
              },
              {
                val: stock,
                set: (v: string) => setFilter({ stock: v }),
                placeholder: "Stoku",
                opts: [
                  { v: "in", l: "✅ I disponueshëm" },
                  { v: "low", l: "⚠️ I ulët" },
                  { v: "out", l: "❌ Nuk ka në stok" },
                ],
              },
              {
                val: listingType,
                set: (v: string) => setFilter({ listingType: v }),
                placeholder: "Listimi",
                opts: [
                  { v: "sale", l: "🛒 Shitje" },
                  { v: "lease", l: "🔧 Shfrytëzim" },
                ],
              },
            ].map(({ val, set, placeholder, opts }) => (
              <div key={placeholder} className="relative">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className={`appearance-none pl-2.5 pr-6 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer ${
                    val
                      ? "border-brand-400 bg-brand-50 text-brand-700 font-semibold"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  <option value="">{placeholder}</option>
                  {opts.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile expanded filters */}
        {filtersOpen && (
          <div className="md:hidden border-t border-gray-100 p-2.5 grid grid-cols-2 gap-2">
            {[
              {
                val: categoryId,
                set: (v: string) => setFilter({ categoryId: v }),
                placeholder: "Kategoria",
                opts: categories.map((c) => ({ v: c.id, l: c.name_sq })),
              },
              ...(brands.length > 0
                ? [
                    {
                      val: brandId,
                      set: (v: string) => setFilter({ brandId: v }),
                      placeholder: "Brendi",
                      opts: brands.map((b) => ({ v: b.id, l: b.name })),
                    },
                  ]
                : []),
              {
                val: audience,
                set: (v: string) => setFilter({ audience: v }),
                placeholder: "Audienca",
                opts: [
                  { v: "home", l: "🏠 Shtëpi" },
                  { v: "business", l: "🏢 Biznes" },
                  { v: "both", l: "👥 Të Gjithë" },
                ],
              },
              {
                val: status,
                set: (v: string) => setFilter({ status: v }),
                placeholder: "Statusi",
                opts: [
                  { v: "active", l: "✅ Aktiv" },
                  { v: "inactive", l: "⛔ Joaktiv" },
                ],
              },
              {
                val: stock,
                set: (v: string) => setFilter({ stock: v }),
                placeholder: "Stoku",
                opts: [
                  { v: "in", l: "✅ I disponueshëm" },
                  { v: "low", l: "⚠️ I ulët" },
                  { v: "out", l: "❌ Nuk ka në stok" },
                ],
              },
              {
                val: listingType,
                set: (v: string) => setFilter({ listingType: v }),
                placeholder: "Listimi",
                opts: [
                  { v: "sale", l: "🛒 Shitje" },
                  { v: "lease", l: "🔧 Shfrytëzim" },
                ],
              },
            ].map(({ val, set, placeholder, opts }) => (
              <div key={placeholder} className="relative">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className={`w-full appearance-none pl-3 pr-7 py-2 text-xs border rounded-xl focus:outline-none cursor-pointer ${
                    val
                      ? "border-brand-400 bg-brand-50 text-brand-700 font-semibold"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  <option value="">{placeholder}</option>
                  {opts.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* Chips + count */}
        <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
          {(
            [
              { label: "⭐ I Zgjedhur", state: featured, toggle: () => setFilter({ featured: !featured }) },
              { label: "🔥 Bestseller", state: bestSeller, toggle: () => setFilter({ bestSeller: !bestSeller }) },
              { label: "🏷️ Zbritje", state: onSale, toggle: () => setFilter({ onSale: !onSale }) },
            ] as const
          ).map(({ label, state, toggle }) => (
            <button
              key={label}
              onClick={toggle}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                state
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              <span className="font-bold text-gray-700">
                {matched === 0 ? 0 : `${pageStart}–${pageEnd}`}
              </span>
              <span> / {matched}</span>
              {hasFilters && <span className="text-gray-300"> · {stats.total}</span>}
              <span className="hidden sm:inline"> produkte</span>
            </span>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={11} /> Pastro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE CARDS (< md) ── */}
      <div className={`md:hidden space-y-2 ${isPending ? "opacity-50" : ""}`}>
        {matched === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400">
            <Package size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {hasFilters ? "Asnjë produkt nuk përputhet" : "Nuk ka produkte"}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="mt-1 text-xs text-brand-600"
              >
                Pastro filtrat
              </button>
            )}
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              {/* Image */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    🧴
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 leading-snug truncate">
                  {product.name_sq}
                  {(product.available_for_lease || product.listing_type === 'lease') && (
                    <span className="ml-1.5 text-[10px] font-bold text-brand-600">SH</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 font-mono">
                  {product.sku}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      product.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {product.is_active ? "Aktiv" : "Joaktiv"}
                  </span>
                  {product.stock === 0 ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-50 text-red-500">
                      Nuk ka në stok
                    </span>
                  ) : product.stock <= 10 ? (
                    <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                      <AlertTriangle size={9} />
                      {product.stock}
                    </span>
                  ) : null}
                  {product.is_featured && (
                    <Star
                      size={11}
                      className="text-amber-400"
                      fill="currentColor"
                    />
                  )}
                  {product.sale_price && (
                    <Tag size={10} className="text-red-400" />
                  )}
                </div>
              </div>

              {/* Price + actions */}
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                  {product.sale_price && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {formatPrice(product.sale_price)}
                    </p>
                  )}
                </div>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  onClick={saveScroll}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-[11px] font-semibold transition-colors active:bg-brand-100"
                >
                  <Edit size={11} /> Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP TABLE (≥ md) ── */}
      <div className={`hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden ${isPending ? "opacity-50" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {[
                  "Foto",
                  "Produkti",
                  "Kategoria",
                  "Brendi",
                  "Çmimi",
                  "Stoku",
                  "Audienca",
                  "Statusi",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className={`text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 ${
                      h ? "text-left" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  <td className="px-3 py-2 w-10">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm">
                          🧴
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900 text-sm leading-snug">
                      {product.name_sq}
                      {(product.available_for_lease || product.listing_type === 'lease') && (
                        <span className="ml-1.5 text-[10px] font-bold text-brand-600">SH</span>
                      )}
                    </p>
                    <p className="text-gray-400 text-[11px] font-mono">
                      {product.sku}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {product.category?.name_sq ?? (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {product.brand?.name ?? (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900">
                      {formatPrice(product.price)}
                    </p>
                    {product.sale_price && (
                      <p className="text-[11px] text-red-500 font-medium flex items-center gap-0.5">
                        <Tag size={9} /> {formatPrice(product.sale_price)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {product.stock === 0 ? (
                        <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          0
                        </span>
                      ) : product.stock <= 10 ? (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                          <AlertTriangle size={10} /> {product.stock}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-700">
                          {product.stock}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {product.unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        product.audience_type === "home"
                          ? "brand"
                          : product.audience_type === "business"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {AUDIENCE_LABELS[product.audience_type]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {product.is_active ? "Aktiv" : "Joaktiv"}
                      </span>
                      {product.is_featured && (
                        <span title="I Zgjedhur">
                          <Star
                            size={10}
                            className="text-amber-400"
                            fill="currentColor"
                          />
                        </span>
                      )}
                      {product.is_best_seller && (
                        <span title="Best Seller">
                          <TrendingUp size={10} className="text-brand-400" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 w-16">
                    <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        onClick={saveScroll}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        title="Modifiko"
                      >
                        <Edit size={14} />
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name_sq}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {matched === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">
                      {hasFilters
                        ? "Asnjë produkt nuk përputhet"
                        : "Nuk ka produkte ende"}
                    </p>
                    {hasFilters && (
                      <button
                        onClick={clearAll}
                        className="mt-1 text-xs text-brand-600 hover:underline"
                      >
                        Pastro filtrat
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {matched > pageSize && (
        <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-400 tabular-nums">
            {pageStart}–{pageEnd} nga {matched}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Faqja e mëparshme"
            >
              <ChevronLeft size={15} />
            </button>
            {pageNumbers(currentPage, totalPages).map((item, i) =>
              item === "gap" ? (
                <span key={`gap-${i}`} className="px-1.5 text-xs text-gray-300">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold tabular-nums ${
                    item === currentPage
                      ? "bg-brand-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Faqja tjetër"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
