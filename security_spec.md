# Security Specification - Quincaillerie LDB

## 1. Data Invariants
1. Products catalog (/products/{productId}):
   - Public read for all authenticated and guest users (active products).
   - Only admins can create, update, or delete products.
   - Products contain public data (selling_price, stock, unit, category, name, reference, image_url).
2. Confidential Costs (/product_costs/{productId}):
   - Strictly admin-only (read & write).
   - Regular clients cannot read or query this collection under any circumstances.
3. User Profiles (/users/{userId}):
   - Users can only read their own profile or admin can read.
   - Users cannot escalate their own role from 'CLIENT' to 'ADMIN'.
   - Self-assigned admin role is rejected.
4. Admins Registry (/admins/{adminId}):
   - Strictly read-only for admin verification, writable only by existing admins or bootstrap email (sekouballayira512@gmail.com).
5. Quotes (/quotes/{quoteId}):
   - Authenticated client can create a quote with their own userId.
   - Client can only read and list their own quotes (userId == auth.uid).
   - Admins can read, list, and update all quotes (modify quantities, prices, discounts, status).
   - Client cannot update quotes directly once submitted except accepting/refusing their own quote.
6. Orders (/orders/{orderId}):
   - Client can only read and list their own orders.
   - Admins can manage all orders and status transitions.
7. Payments (/payments/{paymentId}):
   - Client can create a payment with status 'PAIEMENT EN ATTENTE' for their own quote/order.
   - Client cannot mark payment as 'PAYÉ' or approve it.
   - Only admin can transition payment status to 'PAYÉ' or 'REFUSÉ'.
8. Notifications (/notifications/{notificationId}):
   - Users can only read their own notifications (userId == auth.uid).
   - Users can only mark their own notifications as read.
9. Settings (/settings/{settingId}):
   - Read allowed for all users.
   - Write allowed only for admins.

## 2. The "Dirty Dozen" Payloads
1. Client attempts to read /product_costs/{id} directly. -> Expect PERMISSION_DENIED.
2. Unauthenticated user attempts to write to /products. -> Expect PERMISSION_DENIED.
3. Client attempts to modify /products/{id}/selling_price. -> Expect PERMISSION_DENIED.
4. Client attempts to create user profile with role: 'ADMIN'. -> Expect PERMISSION_DENIED.
5. Client attempts to update own user profile role to 'ADMIN'. -> Expect PERMISSION_DENIED.
6. Client attempts to list another user's quotes (/quotes where userId != auth.uid). -> Expect PERMISSION_DENIED.
7. Client attempts to read another user's quote document directly. -> Expect PERMISSION_DENIED.
8. Client attempts to transition payment status to 'PAYÉ'. -> Expect PERMISSION_DENIED.
9. Client attempts to list all payments across all users. -> Expect PERMISSION_DENIED.
10. Attacker attempts to inject malicious script into product name with 100kb payload. -> Expect PERMISSION_DENIED (size constraint).
11. Client attempts to create an order belonging to another userId. -> Expect PERMISSION_DENIED.
12. Unauthenticated user attempts to write to /admins. -> Expect PERMISSION_DENIED.
