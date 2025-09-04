import Modal from "@/components/modals/Modal";

// Conflict modal at page root
export function ConflictModal({ info, onClose }: { info: { id: string; places: { placeId: string; placeName: string; quantity: number }[] } | null; onClose: () => void }) {
    return (
        <Modal open={!!info} onClose={onClose} size="lg">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cannot delete item</h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">This item is currently assigned to the following places. To delete it, remove it from these shops first.</p>
            <div className="mt-4 max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-white/10">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">Place</th>
                            <th className="px-3 py-2 text-right font-medium">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {(info?.places ?? []).map(p => (
                            <tr key={p.placeId}>
                                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.placeName}</td>
                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{p.quantity}</td>
                            </tr>
                        ))}
                        {(info?.places?.length ?? 0) === 0 && (
                            <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-600 dark:text-gray-300">No detailed usage available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Close</button>
            </div>
        </Modal>
    )
}