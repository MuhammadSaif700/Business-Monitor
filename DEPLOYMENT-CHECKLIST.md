# 🚀 Production Deployment Checklist

## Pre-Deployment Steps

### 1. Security Configuration (CRITICAL)
- [ ] Generate new `BACKEND_API_KEY` (run: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] Set strong `BACKEND_PASSWORD` (12+ characters, mixed case, numbers, symbols)
- [ ] Add your own `GOOGLE_API_KEY` from https://makersuite.google.com/app/apikey
- [ ] Remove any demo/test credentials
- [ ] Review all `.env` variables

### 2. Environment Configuration
- [ ] Set `ENVIRONMENT=production` in backend `.env`
- [ ] Set `DEBUG=false` in backend `.env`
- [ ] Configure `ALLOWED_ORIGINS` for your production domain
- [ ] Update API base URL in frontend if needed

### 3. Testing
- [ ] Test login with new credentials
- [ ] Upload a sample dataset and verify dashboard works
- [ ] Test all AI features (charts, insights, AI Designer)
- [ ] Test on mobile devices
- [ ] Test in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify all navigation links work
- [ ] Test file upload/download functionality

### 4. Code Review
- [ ] No console.log statements in production code
- [ ] No hardcoded credentials in source code
- [ ] All error handling in place
- [ ] Proper input validation
- [ ] CORS configured correctly

### 5. Database
- [ ] Database file has proper permissions
- [ ] Backup strategy in place
- [ ] Migration scripts ready (if needed)

### 6. Performance
- [ ] Frontend built with `npm run build`
- [ ] Images optimized
- [ ] Large dependencies reviewed
- [ ] Caching configured

### 7. Monitoring & Logging
- [ ] Error logging configured
- [ ] Access logs enabled
- [ ] Monitoring solution in place (optional)

## Deployment Steps

### Option A: Manual Deployment on Server

1. **Prepare Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install dependencies
   sudo apt install python3.10 python3-pip nodejs npm nginx
   ```

2. **Deploy Backend**
   ```bash
   cd /var/www/business-monitor/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Configure systemd service
   sudo nano /etc/systemd/system/business-monitor.service
   sudo systemctl enable business-monitor
   sudo systemctl start business-monitor
   ```

3. **Deploy Frontend**
   ```bash
   cd /var/www/business-monitor/frontend
   npm install
   npm run build
   
   # Configure Nginx
   sudo nano /etc/nginx/sites-available/business-monitor
   sudo ln -s /etc/nginx/sites-available/business-monitor /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

4. **Configure SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option B: Docker Deployment

1. **Build and Run**
   ```bash
   docker-compose up -d --build
   ```

2. **Configure Reverse Proxy**
   - Use Nginx or Traefik
   - Enable SSL/TLS
   - Set up automatic certificate renewal

### Option C: Platform as a Service

**Backend (Render/Railway/Fly.io):**
1. Connect GitHub repository
2. Add environment variables
3. Deploy

**Frontend (Vercel/Netlify):**
1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

## Post-Deployment Verification

### Immediate Checks
- [ ] Application loads correctly
- [ ] Login works with new credentials
- [ ] Dashboard displays properly
- [ ] File upload works
- [ ] AI features respond correctly
- [ ] No console errors in browser
- [ ] All pages accessible
- [ ] Mobile responsive design works

### 24-Hour Monitoring
- [ ] Check server logs for errors
- [ ] Monitor resource usage (CPU, RAM, disk)
- [ ] Verify backup ran successfully
- [ ] Test with real users

### Weekly Maintenance
- [ ] Review access logs
- [ ] Check for security updates
- [ ] Monitor AI API usage/costs
- [ ] Database backup verification

## Rollback Plan

If issues occur after deployment:

1. **Immediate Actions**
   ```bash
   # Revert to previous version
   git checkout <previous-commit>
   
   # Restart services
   sudo systemctl restart business-monitor
   sudo systemctl restart nginx
   ```

2. **Database Restore**
   ```bash
   # Restore from backup
   cp backup/business.db.backup backend/business.db
   ```

3. **Communication**
   - Notify users of downtime
   - Document the issue
   - Plan fix and re-deployment

## Success Criteria

✅ Application accessible at production URL  
✅ SSL certificate valid and auto-renewing  
✅ All features working as expected  
✅ No security warnings  
✅ Performance acceptable (<2s page load)  
✅ Mobile experience smooth  
✅ Monitoring and alerts configured  
✅ Backup system verified  

## Support & Maintenance

### Regular Tasks
- Weekly: Check logs and performance
- Monthly: Security updates, dependency updates
- Quarterly: Full security audit, API key rotation
- Annually: Review and optimize infrastructure

### Emergency Contacts
- Server provider support
- Google AI API support
- Your development team

---

**Last Updated:** 2025-10-01  
**Status:** Ready for Production Deployment
