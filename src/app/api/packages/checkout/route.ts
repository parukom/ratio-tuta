import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// POST /api/packages/checkout
// Body: { teamId: string, packageSlug: string, annual?: boolean }
// Creates a Stripe Checkout session for package purchase
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const actor = session;

  const { teamId, packageSlug, annual } = (await req.json()) as {
    teamId: string;
    packageSlug: string;
    annual?: boolean;
  };

  if (!teamId || !packageSlug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Ensure actor belongs to the team (owner/admin)
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: actor.userId },
        {
          members: {
            some: { userId: actor.userId, role: { in: ['ADMIN', 'OWNER'] } },
          },
        },
      ],
    },
    select: { id: true, ownerId: true, name: true },
  });

  if (!team) {
    await logAudit({
      action: 'package.checkout',
      status: 'DENIED',
      actor,
      teamId,
      message: 'Forbidden',
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pkg = await prisma.package.findUnique({
    where: { slug: packageSlug },
  });

  if (!pkg || !pkg.isActive) {
    await logAudit({
      action: 'package.checkout',
      status: 'ERROR',
      actor,
      teamId,
      message: 'Package not found',
      metadata: { packageSlug },
    });
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const isAnnual = !!annual;
  const priceCents = isAnnual ? pkg.annualCents : pkg.monthlyCents;
  const stripePriceId = isAnnual
    ? pkg.stripeAnnualPriceId
    : pkg.stripeMonthlyPriceId;

  if (!stripePriceId) {
    await logAudit({
      action: 'package.checkout',
      status: 'ERROR',
      actor,
      teamId,
      message: 'Stripe price ID not configured',
      metadata: { packageSlug, annual: isAnnual },
    });
    return NextResponse.json(
      { error: 'Package not configured for payments' },
      { status: 500 }
    );
  }

  try {
    // Check if team already has an active subscription with a Stripe customer ID
    const existingSubscription = await prisma.teamSubscription.findFirst({
      where: {
        teamId,
        isActive: true,
        stripeCustomerId: { not: null },
      },
      select: { stripeCustomerId: true },
    });

    // Create or use existing Stripe customer
    let customerId = existingSubscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          teamId,
          teamName: team.name,
          userId: actor.userId,
        },
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages?canceled=true`,
      metadata: {
        teamId,
        packageId: pkg.id,
        packageSlug: pkg.slug,
        isAnnual: isAnnual.toString(),
        userId: actor.userId,
      },
      subscription_data: {
        metadata: {
          teamId,
          packageId: pkg.id,
          packageSlug: pkg.slug,
        },
      },
    });

    // Create pending subscription record
    await prisma.teamSubscription.create({
      data: {
        teamId,
        packageId: pkg.id,
        isActive: false, // Will be activated by webhook
        isAnnual,
        priceCents,
        stripeCheckoutSessionId: checkoutSession.id,
        stripeCustomerId: customerId,
        stripePriceId,
        metadata: { initiatedBy: actor.userId },
      },
    });

    await logAudit({
      action: 'package.checkout',
      status: 'SUCCESS',
      actor,
      teamId,
      metadata: { packageSlug, annual: isAnnual, sessionId: checkoutSession.id },
    });

    return NextResponse.json(
      {
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);
    await logAudit({
      action: 'package.checkout',
      status: 'ERROR',
      actor,
      teamId,
      message: 'Stripe error',
      metadata: { packageSlug, error: String(error) },
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
