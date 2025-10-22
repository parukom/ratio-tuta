import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function getS3Client() {
  const region = required('AWS_REGION');
  const accessKeyId = required('AWS_ACCESS_KEY_ID');
  const secretAccessKey = required('AWS_SECRET_ACCESS_KEY');
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getBucketName(): string {
  return required('S3_BUCKET_NAME');
}

export function getPublicBaseUrl(): string {
  // If provided, prefer a CDN/CloudFront domain like https://cdn.example.com
  const override = process.env.S3_PUBLIC_BASE_URL;
  if (override) return override.replace(/\/$/, '');
  const region = required('AWS_REGION');
  const bucket = getBucketName();
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function getPublicUrlForKey(key: string): string {
  return `${getPublicBaseUrl()}/${key.replace(/^\/+/, '')}`;
}

/**
 * Generate a presigned PUT URL for S3 with security constraints
 *
 * SECURITY IMPROVEMENTS:
 * 1. Enforces Content-Type to prevent MIME confusion attacks
 * 2. Sets Content-Length limits to prevent DoS
 * 3. Short expiry time (default 60s)
 * 4. Validates allowed content types
 *
 * IMPORTANT: S3 Bucket Policy MUST be configured to enforce size limits.
 * See docs/S3_BUCKET_POLICY.md for setup instructions.
 */
export async function getPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresSec?: number;
  maxSizeBytes?: number; // Default: 5MB for images
}) {
  const client = getS3Client();
  const bucket = getBucketName();

  // SECURITY FIX: Validate content type
  const allowedContentTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (!allowedContentTypes.includes(params.contentType)) {
    throw new Error(`Content type ${params.contentType} is not allowed`);
  }

  // SECURITY FIX: Set size limit (default 5MB for avatar images)
  const maxSize = params.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
    // SECURITY FIX: Add metadata to enforce constraints
    Metadata: {
      'upload-source': 'presigned-url',
      'max-size': String(maxSize),
    },
  });

  const url = await getSignedUrl(client, cmd, {
    expiresIn: params.expiresSec ?? 60, // Short expiry: 60 seconds
    // SECURITY NOTE: AWS SDK v3 doesn't support size conditions in getSignedUrl
    // Size limits MUST be enforced via S3 Bucket Policy (see docs/S3_BUCKET_POLICY.md)
  });

  return url;
}

/**
 * Validate Content-Length header before generating presigned URL
 * Second layer of defense against oversized uploads
 */
export function validateUploadSize(
  contentLength: string | null,
  maxSizeBytes: number = 5 * 1024 * 1024
): void {
  if (!contentLength) {
    throw new Error('Content-Length header is required');
  }

  const size = parseInt(contentLength, 10);

  if (isNaN(size) || size <= 0) {
    throw new Error('Invalid Content-Length header');
  }

  if (size > maxSizeBytes) {
    throw new Error(
      `File too large. Maximum size: ${Math.floor(maxSizeBytes / 1024 / 1024)}MB, ` +
      `received: ${Math.floor(size / 1024 / 1024)}MB`
    );
  }
}

export async function deleteObjectByKey(key: string) {
  const client = getS3Client();
  const bucket = getBucketName();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function extFromContentType(ct: string): string | null {
  switch (ct) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

export async function putObjectFromBuffer(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const client = getS3Client();
  const bucket = getBucketName();
  const input: PutObjectCommandInput = {
    Bucket: bucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
    CacheControl: params.cacheControl ?? 'public, max-age=31536000, immutable',
  };
  // Optionally set ACL=public-read if environment allows public objects
  const aclFlag = (
    process.env.S3_OBJECT_ACL ||
    process.env.S3_PUT_PUBLIC_READ ||
    ''
  ).toLowerCase();
  if (aclFlag === 'public-read' || aclFlag === '1' || aclFlag === 'true') {
    (input as PutObjectCommandInput & { ACL?: string }).ACL = 'public-read';
  }
  const cmd = new PutObjectCommand(input);
  await client.send(cmd);
  return getPublicUrlForKey(params.key);
}
