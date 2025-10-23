import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        {
          error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
        { status: 400 },
      );
    }

    // Handle the event
    console.log('Received Stripe event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        const teamId = session.metadata?.teamId;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (teamId && subscriptionId) {
          // Deactivate existing active subscriptions
          await prisma.teamSubscription.updateMany({
            where: { teamId, isActive: true },
            data: { isActive: false },
          });

          // Activate the new subscription
          await prisma.teamSubscription.updateMany({
            where: {
              teamId,
              stripeCheckoutSessionId: session.id,
            },
            data: {
              isActive: true,
              stripeSubscriptionId: subscriptionId,
              startedAt: new Date(),
            },
          });

          console.log(
            `Activated subscription for team ${teamId}, subscription ${subscriptionId}`
          );
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);

        const teamId = subscription.metadata?.teamId;
        if (teamId) {
          await prisma.teamSubscription.updateMany({
            where: {
              teamId,
              stripeSubscriptionId: subscription.id,
            },
            data: {
              isActive: subscription.status === 'active',
              startedAt: new Date(subscription.current_period_start * 1000),
              expiresAt: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);

        const isActive = subscription.status === 'active';
        const updateData: {
          isActive: boolean;
          expiresAt: Date;
          cancelAt?: Date | null;
          canceledAt?: Date | null;
        } = {
          isActive,
          expiresAt: new Date(subscription.current_period_end * 1000),
        };

        if (subscription.cancel_at) {
          updateData.cancelAt = new Date(subscription.cancel_at * 1000);
        }

        if (subscription.canceled_at) {
          updateData.canceledAt = new Date(subscription.canceled_at * 1000);
        }

        await prisma.teamSubscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: updateData,
        });

        console.log(
          `Updated subscription ${subscription.id}, active: ${isActive}`
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        await prisma.teamSubscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            isActive: false,
            canceledAt: new Date(),
          },
        });

        console.log(`Deactivated subscription ${subscription.id}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);

        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          await prisma.teamSubscription.updateMany({
            where: {
              stripeSubscriptionId: subscriptionId,
            },
            data: {
              isActive: true,
            },
          });
          console.log(`Marked subscription ${subscriptionId} as active`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          await prisma.teamSubscription.updateMany({
            where: {
              stripeSubscriptionId: subscriptionId,
            },
            data: {
              isActive: false,
            },
          });
          console.log(
            `Deactivated subscription ${subscriptionId} due to payment failure`
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }
}
