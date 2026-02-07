import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

function money(amount, currency = "USD") {
  if (amount == null || amount === "") return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (x) => String(x).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function computeOldPriceFromDiscount(currentPrice, discount) {
  const p = Number(currentPrice);
  if (!p || p <= 0) return { hasDiscount: false, oldPrice: null, label: "" };
  if (!discount?.isActive)
    return { hasDiscount: false, oldPrice: null, label: "" };

  const v = Number(discount?.value);
  if (!v || v <= 0) return { hasDiscount: false, oldPrice: null, label: "" };

  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { hasDiscount: false, oldPrice: null, label: "" };
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    return { hasDiscount: false, oldPrice: null, label: "" };
  }

  if (discount.type === "flat") {
    const oldPrice = p + v;
    return {
      hasDiscount: true,
      oldPrice,
      label: `-${money(v, discount.currency || "USD")}`,
    };
  }

  if (discount.type === "percentage") {
    if (v >= 100) return { hasDiscount: false, oldPrice: null, label: "" };
    const oldPrice = p / (1 - v / 100);
    return { hasDiscount: true, oldPrice, label: `-${Math.round(v)}%` };
  }

  return { hasDiscount: false, oldPrice: null, label: "" };
}

const PricePreview = ({ price, currency, discount }) => {
  const { hasDiscount, oldPrice, label } = computeOldPriceFromDiscount(
    price,
    discount,
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-slate-600">Preview:</span>

      {!hasDiscount ? (
        <span className="font-semibold text-slate-900">
          {money(price, currency)}
        </span>
      ) : (
        <>
          {/* ✅ Discounted price (price - discount) */}
          <span className="font-semibold text-slate-900">
            {money(
              discount.type === "percentage"
                ? price - (price * discount.value) / 100
                : price - discount.value,
              currency,
            )}
          </span>

          {/* ✅ Original price (slashed) */}
          <span className="text-xs text-slate-500 line-through">
            {money(price, currency)}
          </span>

          {/* Discount label */}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            {discount.type === "percentage"
              ? `-${discount.value}%`
              : `-${money(discount.value, currency)}`}
          </span>
        </>
      )}
    </div>
  );
};

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  // Existing images from DB (urls)
  const [existingImages, setExistingImages] = useState([]); // [{url, alt, isPrimary}]
  const [keepUrls, setKeepUrls] = useState([]); // urls to keep

  // New images to upload
  const [newImages, setNewImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "ring",
    price: "",
    stock: "",
    metalType: "",
    gender: "unisex",
    isFeatured: false,
    currency: "USD",
    subcategory: "",
    karat: "",
    metalColor: "",
    stoneType: "",
    stoneColor: "",
  });

  const [discountForm, setDiscountForm] = useState({
    isActive: false,
    type: "percentage",
    value: "",
    startsAt: "",
    endsAt: "",
  });

  const newImagePreviews = useMemo(
    () => newImages.map((file) => URL.createObjectURL(file)),
    [newImages],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoadingPage(true);
        const { data } = await api.get(`/api/admin/products/${id}`, {
          withCredentials: true,
        });

        const p = data?.product;
        if (!p) throw new Error("Product not found");

        if (!mounted) return;

        setForm({
          name: p.name || "",
          description: p.description || "",
          category: p.category || "ring",
          price: p.price ?? "",
          stock: p.stock ?? "",
          metalType: p.metalType || "",
          gender: p.gender || "unisex",
          isFeatured: Boolean(p.isFeatured),
          currency: p.currency || "USD",
          subcategory: p.subcategory || "",
          karat: p.karat ?? "",
          metalColor: p.metalColor || "",
          stoneType: p.stoneType || "",
          stoneColor: p.stoneColor || "",
        });

        const imgs = Array.isArray(p.images) ? p.images : [];
        setExistingImages(imgs);
        setKeepUrls(imgs.map((i) => i.url)); // default keep all

        const d = p.discount || {};
        setDiscountForm({
          isActive: Boolean(d.isActive),
          type: d.type || "percentage",
          value: d.value ?? "",
          startsAt: toLocalInputValue(d.startsAt),
          endsAt: toLocalInputValue(d.endsAt),
        });
      } catch (e) {
        alert(
          e?.response?.data?.error || e?.message || "Failed to load product",
        );
        navigate("/admin");
      } finally {
        if (mounted) setLoadingPage(false);
      }
    }

    load();
    return () => {
      mounted = false;
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDiscountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDiscountForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewImageChange = (e) => {
    setNewImages(Array.from(e.target.files || []));
  };

  const toggleKeep = (url) => {
    setKeepUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const setPrimaryFromExisting = (url) => {
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.url === url })),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Must keep at least 1 image either existing kept or new
      const keptCount = keepUrls.length;
      if (keptCount === 0 && newImages.length === 0) {
        alert("Please keep at least one existing image or upload a new one.");
        setLoading(false);
        return;
      }

      // Update primary: if user changed existing primary but then removed it, backend will auto-fix
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "boolean")
          data.append(key, value ? "true" : "false");
        else data.append(key, value);
      });

      // ✅ Discount JSON
      const discountPayload = {
        isActive: Boolean(discountForm.isActive),
        type: discountForm.type,
        value: discountForm.value !== "" ? Number(discountForm.value) : 0,
        startsAt: discountForm.startsAt
          ? new Date(discountForm.startsAt).toISOString()
          : null,
        endsAt: discountForm.endsAt
          ? new Date(discountForm.endsAt).toISOString()
          : null,
      };
      data.append("discount", JSON.stringify(discountPayload));

      // ✅ Keep image urls
      data.append("keepImageUrls", JSON.stringify(keepUrls));

      // ✅ Upload new images
      newImages.forEach((img) => data.append("images", img));

      await api.put(`/api/admin/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Product updated successfully");
      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border bg-white p-6">
          Loading product…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Edit Product
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Update details, discount, and images ✨
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            ← Back
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="ring">Ring</option>
                  <option value="bracelet">Bracelet</option>
                  <option value="necklace">Necklace</option>
                  <option value="earring">Earring</option>
                  <option value="anklet">Anklet</option>
                  <option value="watch">Watch</option>
                  <option value="pendant">Pendant</option>
                  <option value="set">Set</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Price
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  required
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Currency
                </label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Stock
                </label>
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                />
              </div>

              {/* Metal Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Metal Type
                </label>
                <input
                  name="metalType"
                  value={form.metalType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="unisex">Unisex</option>
                  <option value="mens">Men</option>
                  <option value="womens">Women</option>
                </select>
              </div>
            </div>

            {/* Discount */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Discount
                  </div>
                  <div className="text-xs text-slate-500">
                    New price + slashed old price preview
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={discountForm.isActive}
                    onChange={handleDiscountChange}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                  />
                  <span className="font-medium">Enable discount</span>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">
                    Type
                  </label>
                  <select
                    name="type"
                    value={discountForm.type}
                    onChange={handleDiscountChange}
                    disabled={!discountForm.isActive}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition disabled:opacity-60 focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">
                    Value
                  </label>
                  <input
                    name="value"
                    type="number"
                    value={discountForm.value}
                    onChange={handleDiscountChange}
                    disabled={!discountForm.isActive}
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition disabled:opacity-60 focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">
                    Starts At (optional)
                  </label>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    value={discountForm.startsAt}
                    onChange={handleDiscountChange}
                    disabled={!discountForm.isActive}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition disabled:opacity-60 focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">
                    Ends At (optional)
                  </label>
                  <input
                    name="endsAt"
                    type="datetime-local"
                    value={discountForm.endsAt}
                    onChange={handleDiscountChange}
                    disabled={!discountForm.isActive}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition disabled:opacity-60 focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="mt-4">
                <PricePreview
                  price={form.price}
                  currency={form.currency}
                  discount={{ ...discountForm, currency: form.currency }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              />
            </div>

            {/* Existing images */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Existing Images
                </div>
                <div className="text-xs text-slate-500">
                  Uncheck to remove. Click “Primary” to set main.
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {existingImages.map((img) => {
                  const kept = keepUrls.includes(img.url);
                  return (
                    <div
                      key={img.url}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-square"
                    >
                      <img
                        src={img.url}
                        alt={img.alt || "product"}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-x-2 bottom-2 flex flex-col gap-1">
                        <label className="flex items-center gap-2 rounded-xl bg-white/90 px-2 py-1 text-[10px]">
                          <input
                            type="checkbox"
                            checked={kept}
                            onChange={() => toggleKeep(img.url)}
                          />
                          Keep
                        </label>

                        <button
                          type="button"
                          onClick={() => setPrimaryFromExisting(img.url)}
                          className="rounded-xl bg-slate-900/90 px-2 py-1 text-[10px] font-semibold text-white"
                          disabled={!kept}
                          title={
                            !kept
                              ? "Keep image to set as primary"
                              : "Set as primary"
                          }
                        >
                          {img.isPrimary ? "Primary ✓" : "Make Primary"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload new images */}
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Add New Images
                </div>
                <div className="text-xs text-slate-500">
                  Optional: uploads + keeps selected existing
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  Choose Images
                </label>
                <span className="text-xs text-slate-600">
                  {newImages.length
                    ? `${newImages.length} selected`
                    : "PNG/JPG"}
                </span>
              </div>
            </div>

            {/* New previews */}
            {newImagePreviews.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">
                    New Image Preview
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewImages([])}
                    className="text-xs px-3 py-1 rounded-xl border bg-white hover:bg-slate-50"
                  >
                    Clear new images
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {newImagePreviews.map((src, idx) => (
                    <div
                      key={src}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-square"
                    >
                      <img
                        src={src}
                        alt={`new-${idx}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured */}
            <label className="flex items-center gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              />
              <span className="font-medium">
                Feature this product{" "}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  (shows on featured list)
                </span>
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          If you remove all existing images, upload at least one new one 😄✨
        </p>
      </div>
    </div>
  );
}
