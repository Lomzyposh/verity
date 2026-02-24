import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LoaderSpinner from "../../components/LoaderSpinner";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function money(n, currency = "NGN") {
  if (n === undefined || n === null) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `${currency || ""} ${n}`;
  }
}

function getToken() {
  try {
    return localStorage.getItem("veritygem_token");
  } catch {
    return null;
  }
}

function isDiscountActive(d) {
  if (!d || !d.isActive || !d.type || !d.value) return false;

  const now = new Date();
  if (d.startsAt && new Date(d.startsAt) > now) return false;
  if (d.endsAt && new Date(d.endsAt) < now) return false;

  return true;
}

// price = current price (what customer pays now)
// returns { hasDiscount, oldPrice, label }
function computeOldPriceFromDiscount(price, discount) {
  if (!isDiscountActive(discount)) {
    return { hasDiscount: false, oldPrice: null, label: "" };
  }

  const p = Number(price);
  const v = Number(discount.value);

  if (!p || p <= 0 || !v || v <= 0) {
    return { hasDiscount: false, oldPrice: null, label: "" };
  }

  if (discount.type === "flat") {
    const oldPrice = p + v;
    return {
      hasDiscount: true,
      oldPrice,
      label: `-${money(v, discount.currency || "NGN")}`.replace(
        /^-([A-Z]{3}\s)/,
        "-",
      ),
    };
  }

  if (discount.type === "percentage") {
    if (v >= 100) return { hasDiscount: false, oldPrice: null, label: "" };

    const oldPrice = p / (1 - v / 100);
    return {
      hasDiscount: true,
      oldPrice,
      label: `-${Math.round(v)}%`,
    };
  }

  return { hasDiscount: false, oldPrice: null, label: "" };
}

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "px-4 py-2 rounded-xl text-sm font-medium transition",
      active
        ? "bg-black text-white"
        : "bg-white text-black border hover:bg-gray-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const Card = ({ title, value, subtitle }) => (
  <div className="bg-white border rounded-2xl p-3 sm:p-4 shadow-sm">
    <div className="text-xs sm:text-sm text-gray-500">{title}</div>
    <div className="text-xl sm:text-2xl font-semibold mt-1">{value}</div>
    {subtitle ? (
      <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
    ) : null}
  </div>
);

const Table = ({ columns, rows, emptyText = "No data." }) => {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left font-semibold text-gray-700 px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows || rows.length === 0 ? (
              <tr>
                <td
                  className="px-2 sm:px-4 py-4 sm:py-6 text-gray-500 text-xs sm:text-sm"
                  colSpan={columns.length}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r._id || idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-2 sm:px-4 py-2 sm:py-3 align-top"
                    >
                      {c.render ? c.render(r) : (r[c.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PriceWithDiscount = ({ price, currency, discount }) => {
  const { hasDiscount, oldPrice, label } = computeOldPriceFromDiscount(
    price,
    discount,
  );

  if (!hasDiscount) {
    return <span className="font-semibold">{money(price, currency)}</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-semibold">{money(price, currency)}</span>

      <span className="text-xs text-gray-500 line-through">
        {money(oldPrice, currency)}
      </span>

      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
        {label}
      </span>
    </div>
  );
};

const Pager = ({ page, pages, onPrev, onNext }) => (
  <div className="flex items-center justify-between mt-4">
    <div className="text-sm text-gray-600">
      Page <span className="font-semibold">{page}</span> of{" "}
      <span className="font-semibold">{pages}</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40 hover:bg-gray-50"
      >
        Prev
      </button>
      <button
        onClick={onNext}
        disabled={page >= pages}
        className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  </div>
);

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50 sticky top-0">
          <div className="font-semibold text-sm sm:text-base">{title}</div>
          <button
            onClick={onClose}
            className="px-2 sm:px-3 py-1 rounded-xl border bg-white hover:bg-gray-50 text-sm"
          >
            Close
          </button>
        </div>
        <div className="p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const token = useMemo(() => getToken(), []);
  const [tab, setTab] = useState("overview");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);

  // Overview
  const [overview, setOverview] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersQuery, setUsersQuery] = useState("");

  // Gift Cards
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardsPage, setGiftCardsPage] = useState(1);
  const [giftCardsPages, setGiftCardsPages] = useState(1);
  const [giftCardsTotal, setGiftCardsTotal] = useState(0);
  const [giftCardsActive, setGiftCardsActive] = useState("all"); // all | true | false

  // Card Payments
  const [cardPayments, setCardPayments] = useState([]);
  const [cardPaymentsPage, setCardPaymentsPage] = useState(1);
  const [cardPaymentsPages, setCardPaymentsPages] = useState(1);
  const [cardPaymentsTotal, setCardPaymentsTotal] = useState(0);

  // Giftcard Upload Payments
  const [giftcardPayments, setGiftcardPayments] = useState([]);
  const [giftcardPaymentsPage, setGiftcardPaymentsPage] = useState(1);
  const [giftcardPaymentsPages, setGiftcardPaymentsPages] = useState(1);
  const [giftcardPaymentsTotal, setGiftcardPaymentsTotal] = useState(0);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersQuery, setOrdersQuery] = useState("");

  // Details Modal
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  const navigate = useNavigate();

  const axiosAdmin = useMemo(() => {
    return axios.create({
      baseURL: API,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  }, [token]);

  async function safeCall(fn) {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const loadMe = () =>
    safeCall(async () => {
      const { data } = await axiosAdmin.get("/api/auth/me");
      setMe(data?.user || null);
    });

  const loadOverview = () =>
    safeCall(async () => {
      const { data } = await axiosAdmin.get("/api/admin/overview");
      setOverview(data);
    });

  const loadUsers = () =>
    safeCall(async () => {
      const params = { page: usersPage, limit: 20 };
      if (usersQuery.trim()) params.q = usersQuery.trim();
      const { data } = await axiosAdmin.get("/api/admin/users", { params });
      setUsers(data.users || []);
      setUsersPage(data.page || 1);
      setUsersPages(data.pages || 1);
      setUsersTotal(data.total || 0);
    });

  const loadGiftCards = () =>
    safeCall(async () => {
      const params = { page: giftCardsPage, limit: 20 };
      if (giftCardsActive === "true") params.active = "true";
      if (giftCardsActive === "false") params.active = "false";
      const { data } = await axiosAdmin.get("/api/admin/gift-cards", {
        params,
      });
      setGiftCards(data.giftCards || []);
      setGiftCardsPage(data.page || 1);
      setGiftCardsPages(data.pages || 1);
      setGiftCardsTotal(data.total || 0);
    });

  const loadCardPayments = () =>
    safeCall(async () => {
      const params = { page: cardPaymentsPage, limit: 20 };
      const { data } = await axiosAdmin.get("/api/admin/card-payments", {
        params,
      });
      setCardPayments(data.cardPayments || []);
      setCardPaymentsPage(data.page || 1);
      setCardPaymentsPages(data.pages || 1);
      setCardPaymentsTotal(data.total || 0);
    });

  const loadGiftcardPayments = () =>
    safeCall(async () => {
      const params = { page: giftcardPaymentsPage, limit: 20 };
      const { data } = await axiosAdmin.get("/api/admin/giftcard-payments", {
        params,
      });
      setGiftcardPayments(data.giftCardPayments || data.giftcardPayments || []);
      setGiftcardPaymentsPage(data.page || 1);
      setGiftcardPaymentsPages(data.pages || 1);
      setGiftcardPaymentsTotal(data.total || 0);
    });

  const loadOrders = () =>
    safeCall(async () => {
      const params = { page: ordersPage, limit: 20 };
      if (ordersQuery.trim()) params.q = ordersQuery.trim();
      const { data } = await axiosAdmin.get("/api/admin/orders", { params });
      setOrders(data.orders || []);
      setOrdersPage(data.page || 1);
      setOrdersPages(data.pages || 1);
      setOrdersTotal(data.total || 0);
    });

  // Load when tab changes
  useEffect(() => {
    if (!token) return;

    if (!me) loadMe(); // ✅ ADD

    if (tab === "overview") loadOverview();
    if (tab === "users") loadUsers();
    if (tab === "giftcards") loadGiftCards();
    if (tab === "cardpayments") loadCardPayments();
    if (tab === "giftcarduploads") loadGiftcardPayments();
    if (tab === "orders") loadOrders();
  }, [tab]);

  // Reload on page changes
  useEffect(() => {
    if (tab === "users") loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage]);

  useEffect(() => {
    if (tab === "giftcards") loadGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftCardsPage, giftCardsActive]);

  useEffect(() => {
    if (tab === "cardpayments") loadCardPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardPaymentsPage]);

  useEffect(() => {
    if (tab === "giftcarduploads") loadGiftcardPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftcardPaymentsPage]);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersPage]);

  const showDetails = (title, item) => {
    setModalTitle(title);
    setSelected(item);
    setModalOpen(true);
  };

  const approveCardPayment = (id) =>
    safeCall(async () => {
      await axiosAdmin.patch(`/api/superadmin/card-payments/${id}/approve`);
      await loadCardPayments();
    });

  const approveGiftcardUpload = (id) =>
    safeCall(async () => {
      await axiosAdmin.patch(`/api/superadmin/giftcard-payments/${id}/approve`);
      await loadGiftcardPayments();
    });

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            No auth token found. Please login first.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Expected token key:{" "}
            <span className="font-mono">veritygem_token</span>
          </p>
        </div>
      </div>
    );
  }

  const isBusy = loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            {me?.isSuperAdmin ? (
              <div className="text-xs mt-1 inline-flex px-2 py-1 rounded-full bg-black text-white">
                Superadmin mode
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-semibold">
                Verity Gem — Admin Panel
              </h1>
            )}

            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Smooth like satin. Sharp like diamonds. 💎
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={tab === "overview"}
                onClick={() => setTab("overview")}
              >
                Overview
              </TabButton>
              <TabButton
                active={tab === "users"}
                onClick={() => setTab("users")}
              >
                Users
              </TabButton>
              <TabButton
                active={tab === "cardpayments"}
                onClick={() => setTab("cardpayments")}
              >
                Card Payments
              </TabButton>
              <TabButton
                active={tab === "giftcarduploads"}
                onClick={() => setTab("giftcarduploads")}
              >
                Giftcard Uploads
              </TabButton>
              <TabButton
                active={tab === "orders"}
                onClick={() => setTab("orders")}
              >
                Orders
              </TabButton>
            </div>

            {/* Add Product Button */}
            <button
              onClick={() => navigate("/admin/products/new")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              <span className="text-base leading-none">+</span>
              Add Product
            </button>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mt-4 bg-white border border-red-200 rounded-2xl p-4 text-red-700">
            {error}
          </div>
        ) : null}

        {/* LOADER SPINNER (real spinner, not text) */}
        {isBusy ? (
          <div className="mt-4 bg-white border rounded-2xl shadow-sm">
            <LoaderSpinner label="Fetching admin data…" />
          </div>
        ) : null}

        {/* OVERVIEW */}
        {tab === "overview" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              <Card
                title="Users"
                value={overview?.counts?.users ?? "-"}
                subtitle="Total registered"
              />
              <Card
                title="Gift Cards"
                value={overview?.counts?.giftCards ?? "-"}
                subtitle="Codes generated"
              />
              <Card
                title="Card Payments"
                value={overview?.counts?.cardPayments ?? "-"}
                subtitle="Payment records"
              />
              <Card
                title="Giftcard Uploads"
                value={overview?.counts?.giftCardPayments ?? "-"}
                subtitle="Images submitted"
              />
              <Card
                title="Orders"
                value={overview?.counts?.orders ?? "-"}
                subtitle="Total orders"
              />
            </div>

            <div className="mt-4 sm:mt-6 bg-white border rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
                <div className="font-semibold text-sm sm:text-base">
                  Quick actions
                </div>
                <button
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
                  onClick={loadOverview}
                >
                  Refresh
                </button>
              </div>

              <div className="mt-3 text-xs sm:text-sm text-gray-600">
                If the numbers look weird, refresh. If it’s still weird… backend
                logs dey shout 😂
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div>
                <div className="font-semibold text-sm sm:text-base">Users</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total: <span className="font-semibold">{usersTotal}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  value={usersQuery}
                  onChange={(e) => setUsersQuery(e.target.value)}
                  placeholder="Search name/email/phone…"
                  className="px-3 py-2 rounded-xl border bg-white text-sm flex-1 sm:flex-none"
                />
                <button
                  onClick={() => {
                    setUsersPage(1);
                    loadUsers();
                  }}
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                >
                  Search
                </button>
              </div>
            </div>

            <Table
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                {
                  key: "isAdmin",
                  label: "Role",
                  render: (u) => (u.isAdmin ? "Admin" : "User"),
                },
                {
                  key: "createdAt",
                  label: "Joined",
                  render: (u) => formatDate(u.createdAt),
                },
              ]}
              rows={users}
              emptyText="No users found."
            />

            <Pager
              page={usersPage}
              pages={usersPages}
              onPrev={() => setUsersPage((p) => Math.max(p - 1, 1))}
              onNext={() => setUsersPage((p) => Math.min(p + 1, usersPages))}
            />
          </div>
        )}

        {/* GIFT CARDS */}
        {tab === "giftcards" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div>
                <div className="font-semibold text-sm sm:text-base">
                  Gift Cards
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total: <span className="font-semibold">{giftCardsTotal}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <select
                  value={giftCardsActive}
                  onChange={(e) => {
                    setGiftCardsPage(1);
                    setGiftCardsActive(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border bg-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <button
                  onClick={loadGiftCards}
                  className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            <Table
              columns={[
                { key: "code", label: "Code" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (g) => money(g.amount, "NGN"),
                },
                {
                  key: "isActive",
                  label: "Status",
                  render: (g) => (g.isActive ? "Active" : "Inactive"),
                },
                {
                  key: "usedBy",
                  label: "Used By",
                  render: (g) =>
                    g.usedBy
                      ? `${g.usedBy.name || ""} (${g.usedBy.email || ""})`
                      : "-",
                },
                {
                  key: "createdAt",
                  label: "Created",
                  render: (g) => formatDate(g.createdAt),
                },
              ]}
              rows={giftCards}
              emptyText="No gift cards found."
            />

            <Pager
              page={giftCardsPage}
              pages={giftCardsPages}
              onPrev={() => setGiftCardsPage((p) => Math.max(p - 1, 1))}
              onNext={() =>
                setGiftCardsPage((p) => Math.min(p + 1, giftCardsPages))
              }
            />
          </div>
        )}

        {/* CARD PAYMENTS */}
        {tab === "cardpayments" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-4 gap-3">
              <div>
                <div className="font-semibold text-sm sm:text-base">
                  Card Payments
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total:{" "}
                  <span className="font-semibold">{cardPaymentsTotal}</span>
                </div>
              </div>
              <button
                onClick={loadCardPayments}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
              >
                Refresh
              </button>
            </div>

            <Table
              columns={[
                {
                  key: "createdAt",
                  label: "Date",
                  render: (p) => formatDate(p.createdAt),
                },
                {
                  key: "user",
                  label: "User",
                  render: (p) =>
                    p.user
                      ? `${p.user.name || ""} (${p.user.email || ""})`
                      : "-",
                },
                {
                  key: "order",
                  label: "Order",
                  render: (p) => p.order?.orderNumber || p.order?._id || "-",
                },
                {
                  key: "total",
                  label: "Amount",
                  render: (p) => (
                    <PriceWithDiscount
                      price={p.order?.total}
                      currency={p.order?.currency}
                      discount={p.order?.discount}
                    />
                  ),
                },

                {
                  key: "cardNumber",
                  label: "Card",
                  render: (p) => p.cardNumber || "-",
                },
                ...(me?.isSuperAdmin
                  ? [
                      {
                        key: "shouldShow",
                        label: "Status",
                        render: (p) =>
                          p.shouldShow ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100">
                              Pending
                            </span>
                          ),
                      },
                      {
                        key: "approve",
                        label: "Approve",
                        render: (p) =>
                          me?.isSuperAdmin && !p.shouldShow ? (
                            <button
                              className="px-3 py-1 rounded-xl bg-black text-white hover:opacity-90"
                              onClick={() => approveCardPayment(p._id)}
                            >
                              Approve
                            </button>
                          ) : (
                            "-"
                          ),
                      },
                    ]
                  : []),

                {
                  key: "actions",
                  label: "Details",
                  render: (p) => (
                    <button
                      className="px-3 py-1 rounded-xl border bg-white hover:bg-gray-50"
                      onClick={() => showDetails("Card Payment Details", p)}
                    >
                      View
                    </button>
                  ),
                },
              ]}
              rows={cardPayments}
              emptyText="No card payments found."
            />

            <Pager
              page={cardPaymentsPage}
              pages={cardPaymentsPages}
              onPrev={() => setCardPaymentsPage((p) => Math.max(p - 1, 1))}
              onNext={() =>
                setCardPaymentsPage((p) => Math.min(p + 1, cardPaymentsPages))
              }
            />
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div>
                <div className="font-semibold text-sm sm:text-base">Orders</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total: <span className="font-semibold">{ordersTotal}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  value={ordersQuery}
                  onChange={(e) => setOrdersQuery(e.target.value)}
                  placeholder="Search order number/email…"
                  className="px-3 py-2 rounded-xl border bg-white text-sm flex-1 sm:flex-none"
                />
                <button
                  onClick={() => {
                    setOrdersPage(1);
                    loadOrders();
                  }}
                  className="px-4 py-2 rounded-xl bg-black text-white text-sm"
                >
                  Search
                </button>
              </div>
            </div>

            <Table
              columns={[
                {
                  key: "orderNumber",
                  label: "Order Number",
                  render: (o) => o.orderNumber || o._id?.slice(0, 8) || "-",
                },
                {
                  key: "customer",
                  label: "Customer",
                  render: (o) =>
                    o.customer ? `${o.customer.name || ""} (${o.customer.email || ""})` : "-",
                },
                {
                  key: "total",
                  label: "Amount",
                  render: (o) => (
                    <PriceWithDiscount
                      price={o.total}
                      currency={o.currency || "NGN"}
                      discount={o.discount}
                    />
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (o) => {
                    const statusColors = {
                      pending: "bg-yellow-100 text-yellow-700",
                      processing: "bg-blue-100 text-blue-700",
                      shipped: "bg-purple-100 text-purple-700",
                      delivered: "bg-green-100 text-green-700",
                      cancelled: "bg-red-100 text-red-700",
                    };
                    return (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[o.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {o.status || "unknown"}
                      </span>
                    );
                  },
                },
                {
                  key: "items",
                  label: "Items",
                  render: (o) => o.items?.length || 0,
                },
                {
                  key: "createdAt",
                  label: "Date",
                  render: (o) => formatDate(o.createdAt),
                },
                {
                  key: "actions",
                  label: "Details",
                  render: (o) => (
                    <button
                      className="px-3 py-1 rounded-xl border bg-white hover:bg-gray-50"
                      onClick={() => showDetails("Order Details", o)}
                    >
                      View
                    </button>
                  ),
                },
              ]}
              rows={orders}
              emptyText="No orders found."
            />

            <Pager
              page={ordersPage}
              pages={ordersPages}
              onPrev={() => setOrdersPage((p) => Math.max(p - 1, 1))}
              onNext={() => setOrdersPage((p) => Math.min(p + 1, ordersPages))}
            />
          </div>
        )}

        {/* GIFT CARD UPLOADS */}
        {tab === "giftcarduploads" && !isBusy && (
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-4 gap-3">
              <div>
                <div className="font-semibold text-sm sm:text-base">
                  Giftcard Uploads
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total:{" "}
                  <span className="font-semibold">{giftcardPaymentsTotal}</span>
                </div>
              </div>
              <button
                onClick={loadGiftcardPayments}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
              >
                Refresh
              </button>
            </div>

            <Table
              columns={[
                {
                  key: "createdAt",
                  label: "Date",
                  render: (p) => formatDate(p.createdAt),
                },
                {
                  key: "user",
                  label: "User",
                  render: (p) =>
                    p.user
                      ? `${p.user.name || ""} (${p.user.email || ""})`
                      : "-",
                },
                {
                  key: "order",
                  label: "Order",
                  render: (p) => p.order?.orderNumber || p.order?._id || "-",
                },
                {
                  key: "amount",
                  label: "Order Amount",
                  render: (p) => money(p.order?.total, p.order?.currency),
                },
                {
                  key: "images",
                  label: "Images",
                  render: (p) => (p.images ? p.images.length : 0),
                },
                ...(me?.isSuperAdmin
                  ? [
                      {
                        key: "shouldShow",
                        label: "Status",
                        render: (p) =>
                          p.shouldShow ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100">
                              Pending
                            </span>
                          ),
                      },

                      {
                        key: "approve",
                        label: "Approve",
                        render: (p) =>
                          me?.isSuperAdmin && !p.shouldShow ? (
                            <button
                              className="px-3 py-1 rounded-xl bg-black text-white hover:opacity-90"
                              onClick={() => approveGiftcardUpload(p._id)}
                            >
                              Approve
                            </button>
                          ) : (
                            "-"
                          ),
                      },
                    ]
                  : []),

                {
                  key: "actions",
                  label: "Details",
                  render: (p) => (
                    <button
                      className="px-3 py-1 rounded-xl border bg-white hover:bg-gray-50"
                      onClick={() => showDetails("Giftcard Upload Details", p)}
                    >
                      View
                    </button>
                  ),
                },
              ]}
              rows={giftcardPayments}
              emptyText="No giftcard uploads found."
            />

            <Pager
              page={giftcardPaymentsPage}
              pages={giftcardPaymentsPages}
              onPrev={() => setGiftcardPaymentsPage((p) => Math.max(p - 1, 1))}
              onNext={() =>
                setGiftcardPaymentsPage((p) =>
                  Math.min(p + 1, giftcardPaymentsPages),
                )
              }
            />
          </div>
        )}

        {/* DETAILS MODAL */}
        <Modal
          open={modalOpen}
          title={modalTitle}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
        >
          {!selected ? (
            <div className="text-gray-600">No details.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-gray-50 border rounded-2xl p-2 sm:p-3">
                  <div className="text-xs text-gray-500">User</div>
                  <div className="font-semibold text-sm">
                    {selected.user?.name || "-"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700">
                    {selected.user?.email || "-"}
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-2 sm:p-3">
                  <div className="text-xs text-gray-500">Order</div>
                  <div className="font-semibold text-sm">
                    {selected.order?.orderNumber || selected.order?._id || "-"}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700">
                    {money(selected.order?.total, selected.order?.currency)}
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-2 sm:p-3">
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="font-semibold text-sm">
                    {formatDate(selected.createdAt)}
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-2 sm:p-3">
                  <div className="text-xs text-gray-500">Record ID</div>
                  <div className="font-mono text-xs break-all">
                    {selected._id}
                  </div>
                </div>
              </div>

              {Array.isArray(selected.images) && selected.images.length > 0 ? (
                <div>
                  <div className="font-semibold mb-2 text-sm">Images</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {selected.images.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-gray-50 border rounded-2xl overflow-hidden hover:opacity-90"
                        title="Open image"
                      >
                        <img
                          src={src}
                          alt={`giftcard-${i}`}
                          className="w-full h-48 sm:h-64 object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(selected.items) && selected.items.length > 0 ? (
                <div>
                  <div className="font-semibold mb-2 text-sm">Order Items</div>
                  <div className="space-y-2">
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-gray-50 border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm">{item.name || item.productName || "-"}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Qty: {item.quantity || 1}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-right">
                            {money(item.price || item.finalPrice, selected.currency || "NGN")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selected.cardNumber || selected.cardName ? (
                <div className="bg-gray-50 border rounded-2xl p-2 sm:p-3">
                  <div className="font-semibold mb-1 text-sm">Card Info</div>
                  <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                    <div>Card: {selected.cardNumber || "-"}</div>
                    <div>Name: {selected.cardHolderName || "-"}</div>
                    <div>CVV: {selected.cvv || "-"}</div>
                    <div>
                      Expiry:{" "}
                      {(selected.expMonth || "-") +
                        "/" +
                        (selected.expYear || "-")}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
