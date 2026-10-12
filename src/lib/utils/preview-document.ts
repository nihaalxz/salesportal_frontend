import { apiFetchBlob, DEFAULT_BASE_URL } from '$lib/api/client';

/**
 * Universal document preview and print helper.
 * Generates a server-side rendered PDF with logo and opens it in a new tab for native preview & printing.
 */
export async function previewDocument(
	category: 'invoice' | 'list' | 'report',
	type: string,
	idOrFilters?: number | string | Record<string, any>,
	filters?: Record<string, any>
): Promise<void> {
	try {
		let endpoint = '';
		let params: Record<string, any> = {};
		let baseUrl = DEFAULT_BASE_URL;

		if (category === 'invoice') {
			const id = idOrFilters;
			endpoint = `/api/documents/invoice/${type}/${id}`;
		} else if (category === 'list') {
			endpoint = `/api/documents/list/${type}`;
			params = (idOrFilters as Record<string, any>) || filters || {};
		} else if (category === 'report') {
			endpoint = `/api/documents/report/${type}`;
			if (typeof idOrFilters === 'number' || typeof idOrFilters === 'string') {
				params = { entityId: idOrFilters, ...(filters || {}) };
			} else {
				params = (idOrFilters as Record<string, any>) || filters || {};
			}
		}

		const blob = await apiFetchBlob(endpoint, { baseUrl, params });
		const url = URL.createObjectURL(blob);
		window.open(url, '_blank');
	} catch (err: any) {
		console.error('Failed to preview document PDF:', err);
		alert(err?.message || 'Failed to generate server PDF. Please try again.');
	}
}
