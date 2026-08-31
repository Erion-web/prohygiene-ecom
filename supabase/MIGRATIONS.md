# Supabase migrations (run in order)

Apply on a fresh database:

1. `schema.sql` — base schema
2. `add-brands-subscriptions.sql`
3. `add-banners.sql`
4. `add-banners-campaign-id.sql`
5. `add-addresses-settings.sql`
6. `add-newsletter.sql`
7. `add-newsletter-campaigns.sql`
8. `add-lease-devices.sql`
9. `add-lease-client-addresses.sql`
10. `add-available-for-lease.sql`
11. `products-as-materials.sql`
12. `fix-materials-columns.sql`
13. `materials-use-categories.sql` (optional if using category_id only)
14. `add-contract-number.sql`
15. `contract-number-sequence.sql`
16. `add-falcon-posta.sql`
17. `search-store-products.sql`
18. `simplify-order-status.sql`
19. `production-security-rls.sql`
20. `adjust-product-stock.sql`
21. `add-homepage-packages.sql`

Operational scripts (not for routine deploy):

- `fix-rls.sql` — legacy RLS repair
- `make-admin.sql` — promote a user to admin via service role

After any migration: `notify pgrst, 'reload schema';` is included where needed.
