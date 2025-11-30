import { getSession } from '@lib/session';
import PricingPageClient from './PricingPageClient';

export default async function PricingPage() {
  const session = await getSession({ skipDbCheck: true });

  return <PricingPageClient session={session} />;
}
