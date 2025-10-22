import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { generateCsrfToken } from '@lib/csrf';

/**
 * GET /api/csrf-token
 *
 * Returns a CSRF token for the current session.
 * Client should include this token in X-CSRF-Token header for state-changing requests.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const csrfToken = generateCsrfToken(session);

    return NextResponse.json(
      { csrfToken },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
