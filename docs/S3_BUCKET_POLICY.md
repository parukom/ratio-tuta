# S3 Bucket Security Configuration

## Required S3 Bucket Policy for File Upload Security

To prevent users from uploading files larger than allowed limits via presigned URLs, you MUST configure your S3 bucket with the following policy.

### Why This Is Critical

AWS SDK v3's `getSignedUrl()` doesn't support size limit conditions directly. Without a bucket policy, users could bypass the 5MB limit by modifying the upload request.

### Bucket Policy Configuration

1. Go to AWS S3 Console
2. Select your bucket (e.g., `ratio-tuta-uploads`)
3. Go to **Permissions** → **Bucket Policy**
4. Add the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceMaxFileSize",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "NumericGreaterThan": {
          "s3:content-length": 5242880
        }
      }
    },
    {
      "Sid": "EnforceContentTypeForImages",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringNotLike": {
          "s3:content-type": [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
          ]
        }
      }
    },
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### Configuration Steps

1. **Replace placeholders:**
   - `YOUR-BUCKET-NAME` → Your actual S3 bucket name (e.g., `ratio-tuta-uploads`)
   - `YOUR-ACCOUNT-ID` → Your AWS account ID (12 digits)
   - `YOUR-IAM-USER` → IAM user name used for uploads

2. **Adjust limits if needed:**
   - `5242880` = 5MB in bytes
   - For 10MB: use `10485760`
   - For 1MB: use `1048576`

3. **Save the policy**

### CORS Configuration

Also ensure your bucket has proper CORS configuration:

1. Go to **Permissions** → **CORS**
2. Add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Verification

Test the policy:

```bash
# This should FAIL (file too large)
curl -X PUT \
  -H "Content-Type: image/jpeg" \
  --data-binary "@large-file.jpg" \
  "YOUR-PRESIGNED-URL"

# Expected response: 403 Forbidden
```

### Additional Security Recommendations

1. **Block Public Access:** Enable "Block all public access" unless you need public reads
2. **Enable Versioning:** Protect against accidental deletions
3. **Enable Logging:** Track all bucket access
4. **Encryption:** Enable default encryption (SSE-S3 or SSE-KMS)
5. **Lifecycle Policies:** Auto-delete incomplete multipart uploads after 7 days

### Example AWS CLI Commands

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket YOUR-BUCKET-NAME \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket YOUR-BUCKET-NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket YOUR-BUCKET-NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Monitoring

Monitor failed uploads in CloudWatch:

1. Enable S3 server access logging
2. Set up CloudWatch alarms for:
   - 403 errors (denied uploads)
   - 413 errors (payload too large)
   - Unusual upload patterns

### References

- [AWS S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
