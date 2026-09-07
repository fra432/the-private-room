import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 500 * 1024; // 500 KB target
const MAX_DIM = 512;

// Compress+resize an image file to a JPEG blob under ~500 KB.
export async function compressAvatar(file: File): Promise<Blob> {
	if (!file.type.startsWith("image/")) {
		throw new Error("Il file deve essere un'immagine.");
	}
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
	const w = Math.round(bitmap.width * scale);
	const h = Math.round(bitmap.height * scale);
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas non disponibile");
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close?.();

	// iteratively lower quality until under target
	let quality = 0.85;
	let blob = await canvasToBlob(canvas, quality);
	while (blob.size > MAX_BYTES && quality > 0.4) {
		quality -= 0.1;
		blob = await canvasToBlob(canvas, quality);
	}
	if (blob.size > MAX_BYTES) {
		throw new Error("Immagine troppo pesante anche dopo la compressione.");
	}
	return blob;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error("Compressione fallita"))),
			"image/jpeg",
			quality,
		);
	});
}

// Uploads a compressed avatar and returns the storage path saved in profiles.avatar_url.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
	const blob = await compressAvatar(file);
	const path = `${userId}/avatar.jpg`;
	const { error } = await supabase.storage
		.from("avatars")
		.upload(path, blob, {
			upsert: true,
			contentType: "image/jpeg",
			cacheControl: "3600",
		});
	if (error) throw error;
	return path;
}

export async function deleteAvatar(userId: string): Promise<void> {
	await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`]);
}

// Resolve a signed URL for a single avatar path (1h).
export async function getAvatarUrl(path: string | null | undefined) {
	if (!path) return null;
	const { data } = await supabase.storage
		.from("avatars")
		.createSignedUrl(path, 3600);
	return data?.signedUrl ?? null;
}

// Bulk resolve a map of userId -> avatar_url path into userId -> signed URL.
export async function resolveAvatarUrls(
	entries: Array<{ id: string; avatar_url: string | null }>,
): Promise<Record<string, string>> {
	const withPath = entries.filter((e) => e.avatar_url);
	if (withPath.length === 0) return {};
	const paths = withPath.map((e) => e.avatar_url as string);
	const { data } = await supabase.storage
		.from("avatars")
		.createSignedUrls(paths, 3600);
	const out: Record<string, string> = {};
	(data ?? []).forEach((row, i) => {
		if (row.signedUrl) out[withPath[i].id] = row.signedUrl;
	});
	return out;
}