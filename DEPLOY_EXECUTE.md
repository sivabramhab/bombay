# Execute Deployment to EC2 - Automated Script

## Quick Deploy - Run This Command

### Option 1: Use the Automated PowerShell Script

```powershell
# Run the deployment script
.\deploy-to-ec2.ps1
```

### Option 2: Manual SSH and Deploy (Recommended)

**Step 1: Open PowerShell/Terminal and SSH into EC2**

```bash
ssh ubuntu@ec2-54-236-21-8.compute-1.amazonaws.com
```

If that doesn't work, try:
```bash
ssh ec2-user@ec2-54-236-21-8.compute-1.amazonaws.com
```

**Step 2: Once connected, run this ONE command:**

```bash
cd ~ && wget https://raw.githubusercontent.com/sivabramhab/bombay/main/deploy-and-seed.sh && chmod +x deploy-and-seed.sh && ./deploy-and-seed.sh
```

**That's it!** The script will:
- ✅ Install all required software
- ✅ Clone code from GitHub
- ✅ Install dependencies
- ✅ Build the application
- ✅ Configure environment
- ✅ Start services
- ✅ Seed database
- ✅ Verify deployment

### Option 3: Step-by-Step Manual Deployment

If you prefer to run commands manually, follow the steps in `DEPLOY_TO_EC2.md`

## After Deployment

Once the script completes, open your browser:

**Application URL:**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:3000
```

**API Endpoint:**
```
http://ec2-54-236-21-8.compute-1.amazonaws.com:5000/api
```

## Verify Deployment

On your EC2 instance, run:

```bash
# Check services
pm2 list

# View logs
pm2 logs --lines 30

# Verify database
mongosh marketplace --eval "db.products.count()"
```

## Troubleshooting

### SSH Connection Issues:
- Make sure port 22 is open in Security Groups
- Try different usernames: `ubuntu`, `ec2-user`, `admin`
- If using SSH keys, ensure key file path is correct

### Deployment Script Issues:
- Check if you have internet connection on EC2
- Ensure sufficient disk space
- Check EC2 instance type (t2.micro may be slow)

## Expected Deployment Time

- Full deployment: 5-10 minutes
- Updates: 2-5 minutes

