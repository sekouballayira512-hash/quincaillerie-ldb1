import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './firebase/authContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { CartPage } from './pages/CartPage';
import { QuotesPage } from './pages/QuotesPage';
import { OrdersPage } from './pages/OrdersPage';
import { PaymentModal } from './pages/PaymentModal';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminQuotes } from './pages/admin/AdminQuotes';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminExcelImport } from './pages/admin/AdminExcelImport';
import { AdminClients } from './pages/admin/AdminClients';
import { AdminSettings } from './pages/admin/AdminSettings';
import { Product, ProductWithCost, Quote, Order, PaymentRecord, AppNotification } from './types';
import { getActiveProducts, getAllProductsAdmin } from './services/productService';
import { getCategories, DEFAULT_CATEGORIES } from './services/categoryService';
import { getQuotesForUser, getAllQuotesAdmin } from './services/quoteService';
import { getOrdersForUser, getAllOrdersAdmin } from './services/orderService';
import { getPaymentsForUser, getAllPaymentsAdmin } from './services/paymentService';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './services/notificationService';
import { checkAndSeedDatabase } from './services/seedService';
import { STORE_NAME, STORE_PHONE, STORE_ADDRESS, STORE_MOTTO } from './utils/formatters';

const AppContent: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('accueil');
  const [quotesInitialTab, setQuotesInitialTab] = useState<'quotes' | 'payments'>('quotes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<ProductWithCost[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toutes', ...DEFAULT_CATEGORIES]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentModalQuote, setPaymentModalQuote] = useState<Quote | null>(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load products and categories
  const loadCatalogData = useCallback(async () => {
    setLoadingProducts(true);
    try {
      // Check if DB is empty and auto-seed initial products
      await checkAndSeedDatabase();

      const [prods, cats] = await Promise.all([
        getActiveProducts(),
        getCategories(),
      ]);

      if (prods) setProducts(prods);
      if (cats && cats.length > 0) {
        setCategories(['Toutes', ...cats.map(c => c.name)]);
      }
    } catch (e) {
      console.error('Failed to load catalog data:', e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load quotes, orders, and payments based on role
  const loadUserData = useCallback(async () => {
    if (!user) {
      setQuotes([]);
      setOrders([]);
      setPayments([]);
      setNotifications([]);
      return;
    }

    try {
      if (isAdmin) {
        const [allQ, allO, allP, allProdsWithCost, notifs] = await Promise.all([
          getAllQuotesAdmin(),
          getAllOrdersAdmin(),
          getAllPaymentsAdmin(),
          getAllProductsAdmin(),
          getUserNotifications(user.uid),
        ]);
        if (allQ) setQuotes(allQ);
        if (allO) setOrders(allO);
        if (allP) setPayments(allP);
        if (allProdsWithCost) setAdminProducts(allProdsWithCost);
        if (notifs) setNotifications(notifs);
      } else {
        const [userQ, userO, userP, notifs] = await Promise.all([
          getQuotesForUser(user.uid),
          getOrdersForUser(user.uid),
          getPaymentsForUser(user.uid),
          getUserNotifications(user.uid),
        ]);
        if (userQ) setQuotes(userQ);
        if (userO) setOrders(userO);
        if (userP) setPayments(userP);
        if (notifs) setNotifications(notifs);
      }
    } catch (e) {
      console.error('Failed to load user records:', e);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Route security check: prevent regular clients from accessing admin routes
  useEffect(() => {
    if (currentTab.startsWith('admin') && !isAdmin && !authLoading) {
      setCurrentTab('accueil');
    }
  }, [currentTab, isAdmin, authLoading]);

  const handleNavigate = (tab: string) => {
    if (tab === 'paiements') {
      setQuotesInitialTab('payments');
      setCurrentTab('devis');
    } else {
      if (tab === 'devis') {
        setQuotesInitialTab('quotes');
      }
      setCurrentTab(tab);
    }
    // Always refresh user records on navigation to keep payment & order statuses 100% fresh
    loadUserData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleMarkNotifRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = async () => {
    await markAllNotificationsAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        onNavigate={handleNavigate}
        currentTab={currentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadCount={unreadNotifsCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-20 md:pb-8">
        {/* CLIENT VIEWS */}
        {currentTab === 'accueil' && (
          <Home
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={cat => {
              setSelectedCategory(cat);
              if (cat !== 'Toutes') {
                handleNavigate('catalogue');
              }
            }}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
            loading={loadingProducts}
          />
        )}

        {currentTab === 'catalogue' && (
          <Catalog
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loadingProducts}
          />
        )}

        {currentTab === 'panier' && (
          <CartPage
            onNavigate={handleNavigate}
            onSelectQuoteId={id => {
              setSelectedQuoteId(id);
              handleNavigate('devis');
              loadUserData();
            }}
          />
        )}

        {currentTab === 'devis' && (
          <QuotesPage
            quotes={quotes}
            payments={payments}
            orders={orders}
            onOpenPaymentModal={quote => setPaymentModalQuote(quote)}
            onRefreshQuotes={loadUserData}
            onNavigate={handleNavigate}
            selectedQuoteId={selectedQuoteId}
            initialTab={quotesInitialTab}
          />
        )}

        {currentTab === 'commandes' && (
          <OrdersPage
            orders={orders}
            onNavigate={handleNavigate}
            onRefreshOrders={loadUserData}
          />
        )}

        {currentTab === 'connexion' && (
          <AuthPage
            onSuccess={() => handleNavigate('profil')}
            onNavigateHome={() => handleNavigate('accueil')}
          />
        )}

        {currentTab === 'profil' && (
          <ProfilePage
            onNavigate={handleNavigate}
            quotesCount={quotes.length}
            ordersCount={orders.length}
            paymentsCount={payments.length}
            onNavigateToPayments={() => handleNavigate('paiements')}
          />
        )}

        {/* ADMIN VIEWS (Protected by isAdmin) */}
        {isAdmin && (
          <>
            {/* Admin secondary navigation tab bar */}
            {currentTab.startsWith('admin') && (
              <div className="mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  onClick={() => setCurrentTab('admin-produits')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-produits'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Produits & Marges
                </button>

                <button
                  onClick={() => setCurrentTab('admin-devis')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-devis'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Devis ({quotes.length})
                </button>

                <button
                  onClick={() => setCurrentTab('admin-paiements')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-paiements'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Paiements Wave/OM
                </button>

                <button
                  onClick={() => setCurrentTab('admin-commandes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-commandes'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Commandes ({orders.length})
                </button>

                <button
                  onClick={() => setCurrentTab('admin-import')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-import'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Import Excel
                </button>

                <button
                  onClick={() => setCurrentTab('admin-clients')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-clients'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Clients
                </button>

                <button
                  onClick={() => setCurrentTab('admin-parametres')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    currentTab === 'admin-parametres'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Paramètres & Démo
                </button>
              </div>
            )}

            {currentTab === 'admin' && (
              <AdminDashboard
                products={adminProducts}
                quotes={quotes}
                orders={orders}
                payments={payments}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'admin-produits' && (
              <AdminProducts
                products={adminProducts}
                categories={DEFAULT_CATEGORIES}
                onRefresh={() => {
                  loadCatalogData();
                  loadUserData();
                }}
                onNavigateToImport={() => setCurrentTab('admin-import')}
              />
            )}

            {currentTab === 'admin-devis' && (
              <AdminQuotes
                quotes={quotes}
                onRefresh={loadUserData}
              />
            )}

            {currentTab === 'admin-paiements' && (
              <AdminPayments
                payments={payments}
                quotes={quotes}
                onRefresh={loadUserData}
                onNavigateTab={handleNavigate}
              />
            )}

            {currentTab === 'admin-commandes' && (
              <AdminOrders
                orders={orders}
                onRefresh={loadUserData}
              />
            )}

            {currentTab === 'admin-import' && (
              <AdminExcelImport
                onSuccess={() => {
                  loadCatalogData();
                  loadUserData();
                }}
                onCancel={() => setCurrentTab('admin-produits')}
              />
            )}

            {currentTab === 'admin-clients' && (
              <AdminClients
                quotes={quotes}
                orders={orders}
              />
            )}

            {currentTab === 'admin-parametres' && (
              <AdminSettings
                onRefreshAll={() => {
                  loadCatalogData();
                  loadUserData();
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        allProducts={products}
        onSelectProduct={handleSelectProduct}
        onNavigate={handleNavigate}
      />

      {/* Manual Payment Dialog */}
      <PaymentModal
        quote={paymentModalQuote}
        isOpen={!!paymentModalQuote}
        onClose={() => setPaymentModalQuote(null)}
        onPaymentSubmitted={() => {
          loadUserData();
        }}
      />

      {/* Notification Slide-Over */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onNavigate={handleNavigate}
      />

      {/* Fixed Bottom Mobile Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
      />

      {/* Footer (Desktop & Tablet) */}
      <footer className="hidden md:block bg-slate-900 text-slate-300 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="font-black text-white text-base tracking-tight">
              QUINCAILLERIE <span className="text-emerald-400">LDB</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              « {STORE_MOTTO} » • Votre partenaire fiable pour l'outillage, la plomberie, l'électricité, la peinture et les matériaux au Mali.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Adresse & Magasin</h4>
            <p className="text-slate-400">{STORE_ADDRESS}</p>
            <p className="text-slate-400">Bamako, Mali</p>
            <p className="text-emerald-400 font-semibold mt-1">Ouvert du Lundi au Samedi</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Contact & Commandes</h4>
            <p className="text-slate-400">Téléphone : {STORE_PHONE}</p>
            <p className="text-slate-400">WhatsApp direct : {STORE_PHONE}</p>
            <p className="text-slate-400">Devise officielle : Franc CFA (FCFA)</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Moyens de paiement</h4>
            <p className="text-slate-400">Wave Mali (0 frais)</p>
            <p className="text-slate-400">Orange Money / Max it (#144#)</p>
            <p className="text-slate-500 text-[11px] mt-2">
              © {new Date().getFullYear()} Quincaillerie LDB. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
