# Email Sequences for Revenue Analytics Pro

These email templates should be set up in your email service provider (e.g., SendGrid, Mailgun, Resend) with scheduled triggers based on user trial start date.

## Day 1 Email (After Install)

**Trigger:** Send immediately after initial data sync completes

**Subject:** Your data is ready! 🎉

```
Hey {name},

Your Revenue Analytics Pro dashboard is live!

We've analyzed your {company_name} data and found some interesting insights:

🎯 {at_risk_count} members are at high risk of churning
💳 ${failed_payment_amount} in failed payments can be recovered
📊 Your churn rate is {churn_comparison}% {better_or_worse} than average

View Your Dashboard →
{dashboard_url}

Questions? Just reply to this email.

Best,
Revenue Analytics Pro Team

---

P.S. Your 7-day trial includes everything. Cancel before it ends and pay nothing.
```

**Variables needed:**
- `{name}` - User's name
- `{company_name}` - Company name
- `{at_risk_count}` - Number of members with high churn risk (>60)
- `{failed_payment_amount}` - Total failed payment amount
- `{churn_comparison}` - Percentage difference from benchmark
- `{better_or_worse}` - "better" or "worse"
- `{dashboard_url}` - Link to dashboard

---

## Day 2 Email

**Trigger:** Send 24 hours after Day 1 email

**Subject:** Did you see your cohort retention? 📊

```
{name},

One of our most powerful features is cohort retention analysis.

It shows which signup months have the best retention rates for {company_name}.

This helps you:
• Identify what's working (and when)
• Predict future churn patterns
• Time promotions strategically
• Optimize your member acquisition

Check Your Cohorts →
{dashboard_url}

Pro tip: Look for months with 90%+ retention at month 3. Those are your golden cohorts. Try to replicate what made them successful.

Stuck? Reply and I'll help.

Best,
Revenue Analytics Pro Team

---

Trial days remaining: 6
```

**Variables needed:**
- `{name}` - User's name
- `{company_name}` - Company name
- `{dashboard_url}` - Link to dashboard

---

## Day 7 Email (Final)

**Trigger:** Send on day 6 of trial (day before trial ends)

**Subject:** Your trial ends tomorrow ⏰

```
{name},

Tomorrow your 7-day trial of Revenue Analytics Pro ends.

Here's what you'll lose access to:

❌ Member-level churn risk scoring
❌ Failed payment tracking (${failed_payment_amount} at risk!)
❌ Cohort retention analysis
❌ Benchmarking vs similar communities
❌ Historical data beyond 30 days
❌ Unlimited data exports

Continue with full access for just $49/month.

Keep Growing with Data →
{upgrade_url}

Not convinced? Reply and let me know why.

Best,
Revenue Analytics Pro Team

---

P.S. That's less than $2/day to prevent churn and maximize revenue. Most creators recover the cost in their first week.
```

**Variables needed:**
- `{name}` - User's name
- `{failed_payment_amount}` - Total failed payment amount
- `{upgrade_url}` - Link to upgrade/payment page

---

## Implementation Notes

### Option 1: Manual Setup (Recommended for MVP)
1. **Use a tool like Loops.so, Customer.io, or Resend**
2. **Trigger emails manually or via webhook** when user installs app
3. **Store trial start date** in database
4. **Use scheduled jobs** to send emails at correct intervals

### Option 2: Automated with Vercel Cron (Future)
Create API routes that run on cron schedule:
- `/api/cron/send-day1-emails` - Runs hourly, checks for new users
- `/api/cron/send-day2-emails` - Runs daily, sends to users at day 2
- `/api/cron/send-day3-emails` - Runs daily, sends to users at day 3

### Email Service Providers

**Recommended (Free tier available):**
- **Resend** - Developer-friendly, 3k emails/month free
- **Loops.so** - Built for SaaS, visual editor
- **SendGrid** - 100 emails/day free

**Template Variables to Track:**
Store these in your database when user installs:
```typescript
{
  userId: string;
  companyId: string;
  trialStartDate: Date;
  emailsSent: {
    day1: Date | null;
    day2: Date | null;
    day3: Date | null;
  }
}
```

### Rate Limiting
- Don't send more than 1 email per day per user
- Check `emailsSent` timestamps before sending
- Handle bounces and unsubscribes

---

## Testing Checklist

- [ ] Day 1 email sends after install
- [ ] Day 2 email sends 24 hours later
- [ ] Day 3 email sends 48 hours later
- [ ] All variables populate correctly
- [ ] Links work and track to correct user
- [ ] Unsubscribe link works
- [ ] Emails render correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile responsive design
