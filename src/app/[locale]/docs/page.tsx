import { getSession } from '@lib/session';
import DocsPageClient from './DocsPageClient';

export default async function DocsPage() {
  const session = await getSession({ skipDbCheck: true });
  return <DocsPageClient session={session} />;
}
