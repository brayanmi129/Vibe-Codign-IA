import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Bucket names ──────────────────────────────────────────────────────────────
const BUCKET_MEDIA    = 'media';
const BUCKET_INVOICES = 'invoices';

// ── Path helpers ──────────────────────────────────────────────────────────────
export const storagePaths = {
  storeLogo:    (tenantId: string)               => `stores/${tenantId}/logo`,
  productImage: (tenantId: string, productId: string) => `stores/${tenantId}/products/${productId}`,
  userAvatar:   (userId: string)                 => `users/${userId}/avatar`,
  invoice:      (tenantId: string, invoiceNumber: string) => `${tenantId}/${invoiceNumber}.pdf`,
};

// ── Generic upload ────────────────────────────────────────────────────────────
async function upload(bucket: string, path: string, file: File | Blob, contentType?: string): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  if (bucket === BUCKET_MEDIA) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Private bucket → return signed URL valid 1 hour
  const { data, error: urlErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);
  if (urlErr) throw new Error(`Could not sign URL: ${urlErr.message}`);
  return data.signedUrl;
}

async function remove(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function uploadStoreLogo(tenantId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  return upload(BUCKET_MEDIA, `stores/${tenantId}/logo.${ext}`, file, file.type);
}

export async function uploadProductImage(tenantId: string, productId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  return upload(BUCKET_MEDIA, `stores/${tenantId}/products/${productId}.${ext}`, file, file.type);
}

export async function deleteProductImage(tenantId: string, productId: string, ext = 'jpg'): Promise<void> {
  await remove(BUCKET_MEDIA, `stores/${tenantId}/products/${productId}.${ext}`);
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  return upload(BUCKET_MEDIA, `users/${userId}/avatar.${ext}`, file, file.type);
}

export async function uploadInvoicePdf(tenantId: string, invoiceNumber: string, pdfBlob: Blob): Promise<string> {
  return upload(BUCKET_INVOICES, storagePaths.invoice(tenantId, invoiceNumber), pdfBlob, 'application/pdf');
}

// Genera una URL firmada temporal para descargar una factura (default: 1 hora)
export async function getInvoiceDownloadUrl(tenantId: string, invoiceNumber: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_INVOICES)
    .createSignedUrl(storagePaths.invoice(tenantId, invoiceNumber), expiresIn);
  if (error) throw new Error(`Could not generate invoice URL: ${error.message}`);
  return data.signedUrl;
}
