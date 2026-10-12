import { previewDocument } from './preview-document';

export async function printInvoice(entityType: string, id: number | string) {
  return previewDocument('invoice', entityType, id);
}
