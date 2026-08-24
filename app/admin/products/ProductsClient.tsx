"use client";

import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import type { Brand, Category, Product } from "@/types";
import {
  AlertTriangle,
  ChevronDown,
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
import { useEffect, useMemo, useState } from "react";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductRow = Product & {
  category?: { name_sq: string } | null;
  brand?: { name: string } | null;
};

interface Props {
  products: ProductRow[];
  categories: Pick<Category, "id" | "name_sq">[];
  brands: Pick<Brand, "id" | "name">[];
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

export function ProductsClient({ products, categories, brands }: Props) {
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

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [listingType, setListingType] = useState('')

  const hasFilters =
    search ||
    categoryId ||
    brandId ||
    audience ||
    status ||
    stock ||
    listingType ||
    onSale ||
    featured ||
    bestSeller;
  const hasDropdownFilters =
    categoryId || brandId || audience || status || stock;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (
        q &&
        !p.name_sq.toLowerCase().includes(q) &&
        !p.sku.toLowerCase().includes(q) &&
        !(p.name_en ?? "").toLowerCase().includes(q)
      )
        return false;
      if (categoryId && p.category_id !== categoryId) return false;
      if (brandId && p.brand_id !== brandId) return false;
      if (audience && p.audience_type !== audience) return false;
      if (status === "active" && !p.is_active) return false;
      if (status === "inactive" && p.is_active) return false;
      if (stock === "in" && p.stock <= 0) return false;
      if (stock === "out" && p.stock !== 0) return false;
      if (stock === "low" && (p.stock <= 0 || p.stock > 10)) return false;
      if (onSale && !p.sale_price) return false;
      if (featured && !p.is_featured) return false;
      if (bestSeller && !p.is_best_seller) return false;
      if (listingType && (p.listing_type ?? "sale") !== listingType) return false;
      return true;
    });
  }, [
    products,
    search,
    categoryId,
    brandId,
    audience,
    status,
    stock,
    onSale,
    featured,
    bestSeller,
    listingType,
  ]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      onSale: products.filter((p) => !!p.sale_price).length,
    }),
    [products]
  );

  const clearAll = () => {
    setSearch("");
    setCategoryId("");
    setBrandId("");
    setAudience("");
    setStatus("");
    setStock("");
    setListingType("");
    setOnSale(false);
    setFeatured(false);
    setBestSeller(false);
  };

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
      onClick: () => setStatus((s) => (s === "active" ? "" : "active")),
    },
    {
      label: "Nuk ka në stok",
      value: stats.outOfStock,
      color: "text-red-500",
      active: stock === "out",
      onClick: () => setStock((s) => (s === "out" ? "" : "out")),
    },
    {
      label: "I ulët",
      value: stats.lowStock,
      color: "text-amber-500",
      active: stock === "low",
      onClick: () => setStock((s) => (s === "low" ? "" : "low")),
    },
    {
      label: "Zbritje",
      value: stats.onSale,
      color: "text-brand-600",
      active: onSale,
      onClick: () => setOnSale((v) => !v),
    },
  ] as const;

  return (
    <div className="p-3 md:p-4 space-y-3">
      {/* ── STATS ── */}
      <div className="grid grid-cols-5 gap-2">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className={`bg-white border rounded-xl px-2 py-2.5 text-center transition-all active:scale-[0.97] ${
              s.active
                ? "border-brand-400 ring-1 ring-brand-300 bg-brand-50/30"
                : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
            }`}
          >
            <p
              className={`text-lg md:text-xl font-black tabular-nums ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-[10px] md:text-[11px] text-gray-400 mt-0.5 leading-none">
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
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
                onClick={() => setSearch("")}
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
                set: setCategoryId,
                placeholder: "Kategoria",
                opts: categories.map((c) => ({ v: c.id, l: c.name_sq })),
              },
              ...(brands.length > 0
                ? [
                    {
                      val: brandId,
                      set: setBrandId,
                      placeholder: "Brendi",
                      opts: brands.map((b) => ({ v: b.id, l: b.name })),
                    },
                  ]
                : []),
              {
                val: audience,
                set: setAudience,
                placeholder: "Audienca",
                opts: [
                  { v: "home", l: "🏠 Shtëpi" },
                  { v: "business", l: "🏢 Biznes" },
                  { v: "both", l: "👥 Të Gjithë" },
                ],
              },
              {
                val: status,
                set: setStatus,
                placeholder: "Statusi",
                opts: [
                  { v: "active", l: "✅ Aktiv" },
                  { v: "inactive", l: "⛔ Joaktiv" },
                ],
              },
              {
                val: stock,
                set: setStock,
                placeholder: "Stoku",
                opts: [
                  { v: "in", l: "✅ I disponueshëm" },
                  { v: "low", l: "⚠️ I ulët" },
                  { v: "out", l: "❌ Nuk ka në stok" },
                ],
              },
              {
                val: listingType,
                set: setListingType,
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
                set: setCategoryId,
                placeholder: "Kategoria",
                opts: categories.map((c) => ({ v: c.id, l: c.name_sq })),
              },
              ...(brands.length > 0
                ? [
                    {
                      val: brandId,
                      set: setBrandId,
                      placeholder: "Brendi",
                      opts: brands.map((b) => ({ v: b.id, l: b.name })),
                    },
                  ]
                : []),
              {
                val: audience,
                set: setAudience,
                placeholder: "Audienca",
                opts: [
                  { v: "home", l: "🏠 Shtëpi" },
                  { v: "business", l: "🏢 Biznes" },
                  { v: "both", l: "👥 Të Gjithë" },
                ],
              },
              {
                val: status,
                set: setStatus,
                placeholder: "Statusi",
                opts: [
                  { v: "active", l: "✅ Aktiv" },
                  { v: "inactive", l: "⛔ Joaktiv" },
                ],
              },
              {
                val: stock,
                set: setStock,
                placeholder: "Stoku",
                opts: [
                  { v: "in", l: "✅ I disponueshëm" },
                  { v: "low", l: "⚠️ I ulët" },
                  { v: "out", l: "❌ Nuk ka në stok" },
                ],
              },
              {
                val: listingType,
                set: setListingType,
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
              { label: "⭐ I Zgjedhur", state: featured, set: setFeatured },
              { label: "🔥 Bestseller", state: bestSeller, set: setBestSeller },
              { label: "🏷️ Zbritje", state: onSale, set: setOnSale },
            ] as const
          ).map(({ label, state, set }) => (
            <button
              key={label}
              onClick={() => set(!state)}
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
              <span className="font-bold text-gray-700">{filtered.length}</span>
              {hasFilters && <span> / {products.length}</span>}
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
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
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
          filtered.map((product) => (
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
      <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden">
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
              {filtered.map((product) => (
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
              {filtered.length === 0 && (
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
    </div>
  );
}
