import { useMemo, useState } from "react";
import api from "../../api/axios";

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "ring",
    price: "",
    stock: "",
    metalType: "",
    gender: "unisex",
    isFeatured: false,
  });

  const imagePreviews = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file));
  }, [images]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === "boolean")
          data.append(key, value ? "true" : "false");
        else data.append(key, value);
      });

      images.forEach((img) => data.append("images", img));

      await api.post("/api/admin/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Product added successfully");

      setForm({
        name: "",
        description: "",
        category: "ring",
        price: "",
        stock: "",
        metalType: "",
        gender: "unisex",
        isFeatured: false,
      });
      setImages([]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm({
      name: "",
      description: "",
      category: "ring",
      price: "",
      stock: "",
      metalType: "",
      gender: "unisex",
      isFeatured: false,
    });
    setImages([]);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Add New Product
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Create a new jewelry item with images, pricing, and details ✨
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Admin
          </div>
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
                  placeholder="e.g. Crystal Bloom Ring"
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
                  Price <span className="text-rose-500">*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 120"
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                  required
                />
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
                  placeholder="e.g. 15"
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
                  placeholder="e.g. gold, silver, stainless steel"
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
                placeholder="Write a short description that sells the vibe..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              />
            </div>

            {/* Featured + Upload */}
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
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

              {/* Upload */}
              <div className="flex items-center gap-3">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  Choose Images
                </label>
                <span className="text-xs text-slate-600">
                  {images.length
                    ? `${images.length} selected`
                    : "PNG/JPG (max 6)"}
                </span>
              </div>
            </div>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">
                    Image Preview
                  </p>
                  <p className="text-xs text-slate-500">
                    First image becomes{" "}
                    <span className="font-semibold">Primary</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={src}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-square"
                    >
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/85 px-2 py-1 text-[10px] font-semibold text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>

        {/* Tiny footer hint */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: Use sharp, bright photos — jewelry loves light 😄✨
        </p>
      </div>
    </div>
  );
}
