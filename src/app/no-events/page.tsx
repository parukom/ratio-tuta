import React from 'react';
import LogoutButton from '@/components/LogoutButton';

export default function NoEventsPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No events found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">You don't have access to any places yet. Please contact your administrator.</p>
      </div>
      <LogoutButton />
    </div>
  );
}
