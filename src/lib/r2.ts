import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let client: S3Client | undefined;

function r2(): S3Client {
  if (!client) {
    const { accountId, accessKeyId, secretAccessKey } = env.r2;
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

/** Short-lived download link, minted only after an ownership check. */
export async function signedDownloadUrl(
  key: string,
  filename: string,
  expiresInSeconds = 600,
): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"`,
    }),
    { expiresIn: expiresInSeconds },
  );
}

/** Browser uploads go straight to R2 with this URL; the app never proxies file bytes. */
export async function signedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
): Promise<string> {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: env.r2.bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}

/** Public read URL for images and preview meshes served through a public bucket domain. */
export function publicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return `/api/asset/${encodeURIComponent(key)}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function signedReadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}
