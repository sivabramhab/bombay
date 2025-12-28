# Configure AWS Security Group for HTTPS Access

## Problem
Unable to access `https://ec2-54-236-21-8.compute-1.amazonaws.com` because ports 80 and 443 are not open in the Security Group.

## Solution: Open Ports via AWS Console

### Step-by-Step Instructions

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Login with credentials: `team@svgnai.com` / `Theteamofbella@123`

2. **Navigate to EC2**
   - Search for "EC2" in the top search bar
   - Click on "EC2" service

3. **Find Your Instance**
   - Click "Instances" in the left sidebar
   - Search for instance ID: `i-0f75a79829213e975`
   - Click on the instance

4. **Open Security Group**
   - Click on the "Security" tab (at the bottom of instance details)
   - Click on the Security Group name (e.g., `sg-xxxxx`) - it's a blue link

5. **Edit Inbound Rules**
   - Click "Edit inbound rules" button
   - Click "Add rule" button

6. **Add HTTP Rule**
   - **Type:** HTTP
   - **Protocol:** TCP
   - **Port range:** 80
   - **Source:** Custom → `0.0.0.0/0`
   - **Description:** Allow HTTP access

7. **Add HTTPS Rule**
   - Click "Add rule" again
   - **Type:** HTTPS
   - **Protocol:** TCP
   - **Port range:** 443
   - **Source:** Custom → `0.0.0.0/0`
   - **Description:** Allow HTTPS access

8. **Save Rules**
   - Click "Save rules" button at the bottom

### Verification

After saving, wait 10-20 seconds, then test:
- `https://ec2-54-236-21-8.compute-1.amazonaws.com`
- `http://ec2-54-236-21-8.compute-1.amazonaws.com` (should redirect to HTTPS)

## Alternative: Using AWS CLI (If Available)

If AWS CLI is installed and configured:

```bash
# Get security group ID
aws ec2 describe-instances --instance-ids i-0f75a79829213e975 --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
    --group-id <SECURITY_GROUP_ID> \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
    --group-id <SECURITY_GROUP_ID> \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0
```

## Current Security Group Status

Check current rules:
- Instance: `i-0f75a79829213e975`
- Expected open ports: 3000, 5000 (already configured)
- **Needed:** Ports 80 and 443

## Troubleshooting

If still unable to access after configuring:
1. Wait 30-60 seconds for changes to propagate
2. Clear browser cache
3. Try incognito/private mode
4. Check if Nginx is running: `sudo systemctl status nginx`
5. Verify ports are listening: `sudo ss -tlnp | grep -E ':80|:443'`

