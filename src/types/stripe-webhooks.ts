/**
 * Type definitions for Stripe webhook event objects.
 *
 * These interfaces define the structure of objects received from Stripe webhooks.
 * They are intentionally flexible to accommodate different API versions and
 * handle both numeric timestamps and string dates.
 */

/**
 * Stripe Subscription object received in webhook events.
 * Used for: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
 */
export interface StripeSubscriptionWebhook {
  /** Unique identifier for the subscription */
  id: string;

  /** Current status of the subscription (e.g., 'active', 'canceled', 'past_due') */
  status: string;

  /** Custom metadata attached to the subscription */
  metadata?: {
    /** Team ID associated with this subscription */
    teamId?: string;
    /** Package ID from our database */
    packageId?: string;
    /** Package slug identifier */
    packageSlug?: string;
  };

  /** Start timestamp of the current billing period (Unix timestamp or ISO string) */
  current_period_start?: number | string;

  /** End timestamp of the current billing period (Unix timestamp or ISO string) */
  current_period_end?: number | string;

  /** Timestamp when the subscription is scheduled to be canceled (Unix timestamp or ISO string) */
  cancel_at?: number | string | null;

  /** Timestamp when the subscription was canceled (Unix timestamp or ISO string) */
  canceled_at?: number | string | null;
}

/**
 * Stripe Invoice object received in webhook events.
 * Used for: invoice.paid, invoice.payment_failed
 */
export interface StripeInvoiceWebhook {
  /** Unique identifier for the invoice */
  id: string;

  /** Associated subscription ID or object */
  subscription?: string | { id: string } | null;
}
