import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
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

export async function getPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresSec?: number;
}) {
  const client = getS3Client();
  const bucket = getBucketName();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
    // If your bucket enforces ACLs, you may need: ACL: 'public-read'
  });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: params.expiresSec ?? 60,
  });
  return url;
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
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
    CacheControl: params.cacheControl ?? 'public, max-age=31536000, immutable',
  });
  await client.send(cmd);
  return getPublicUrlForKey(params.key);
}
