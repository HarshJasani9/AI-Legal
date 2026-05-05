import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-05-27.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    // 1. Get raw body to mathematically verify the Stripe Signature
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing stripe signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;

    // 2. Verify Signature
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // 3. Connect to Database (Next.js serverless connection caching)
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
      }
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const usersCollection = mongoose.connection.collection('users');

    // 4. Handle specific Webhook Events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // userId was injected into client_reference_id in stripe.service.ts
        const userId = session.client_reference_id || session.metadata?.userId;
        const stripeCustomerId = session.customer as string;

        if (userId && stripeCustomerId) {
          await usersCollection.updateOne(
            { clerkId: userId },
            { 
              $set: { 
                plan: 'pro',
                stripeCustomerId: stripeCustomerId,
                updatedAt: new Date()
              } 
            }
          );
          console.log(`✅ Successfully upgraded user ${userId} to Pro plan.`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        if (stripeCustomerId) {
          await usersCollection.updateOne(
            { stripeCustomerId: stripeCustomerId },
            { 
              $set: { 
                plan: 'free',
                updatedAt: new Date()
              } 
            }
          );
          console.log(`🔻 Successfully downgraded customer ${stripeCustomerId} to Free plan.`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Webhook handler failed: ${error.message}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
