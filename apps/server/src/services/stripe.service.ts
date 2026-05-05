import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-05-27.dahlia', // Standardize on a stable Stripe API version
  appInfo: {
    name: 'Contract AI',
    version: '1.0.0',
  },
});

// Logical representation of our platform's monetization tiers
export const SubscriptionTiers = {
  FREE: {
    id: 'free',
    name: 'Free Plan',
    maxContractsPerMonth: 3,
    hasCompareFeature: false,
    pricePerMonth: 0,
    features: ['Upload up to 3 PDFs/month', 'AI Summaries', 'Clause Extraction', 'Vector Chat'],
  },
  PRO: {
    id: 'pro',
    name: 'Pro Plan',
    maxContractsPerMonth: Infinity, // Unlimited
    hasCompareFeature: true,
    pricePerMonth: 19,
    features: ['Unlimited Contracts', 'Advanced AI Compare Tool', 'Email Reminders', 'Priority Support'],
  }
};

/**
 * Creates a Stripe Checkout session for a user upgrading to the Pro plan.
 * @param userId - The internal Clerk user ID
 * @param email - The email address of the user (pre-fills the checkout form)
 * @returns Stripe Checkout Session object
 */
export const createCheckoutSession = async (userId: string, email: string) => {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!priceId) {
    throw new Error('STRIPE_PRO_PRICE_ID environment variable is missing.');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    client_reference_id: userId, // Links Stripe webhook events back to our Clerk user
    success_url: `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
    metadata: {
      userId, // Extra safety net for webhooks
    }
  });

  return session;
};

/**
 * Creates a Stripe Customer Portal session so an existing Pro user can manage, pause, or cancel their subscription.
 * @param customerId - The Stripe customer ID (retrieved from your database after successful checkout webhook)
 * @returns Stripe Billing Portal Session object
 */
export const createPortalSession = async (customerId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!customerId) {
    throw new Error('No Stripe customer ID provided.');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard`,
  });

  return portalSession;
};
