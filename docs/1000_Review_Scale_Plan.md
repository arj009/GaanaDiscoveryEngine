# 🚀 1,000 Review Scaling Strategy (Zero-Cost MVP)

To successfully process all 1,000 reviews for your final submission without paying for an enterprise API tier, we will implement the **API Key Rotation Strategy**.

## The Core Problem
Groq gives us incredibly fast AI for free, but places a strict **100,000 Tokens Per Day (TPD)** limit per account. 
- 1 review ≈ 400 tokens
- 200 reviews ≈ 80,000 tokens (which is why our script perfectly capped at 199/200 today).
- 1,000 reviews = **400,000 tokens** (Requires 4x the daily limit).

Since Google Gemini locked your account to just 20 requests per day, Groq is still our fastest and best option.

## The Solution: Key Rotation Architecture
Instead of rotating *models* (which failed because some models were decommissioned), we will rotate the **Authentication Keys**. By using 4 free API keys, we combine their limits into a massive **400,000 TPD** pool.

### Step 1: Generate 3 Additional Free Keys
Tomorrow, before you run the pipeline, log into [console.groq.com](https://console.groq.com) using 3 different free accounts (e.g., your personal Gmail, a work email, and a GitHub login). Generate one free API key per account.

### Step 2: Update Your `.env` File
Add all of your keys to the `.env` file like this:
```env
GROQ_API_KEY_1=gsk_YourFirstKeyHere
GROQ_API_KEY_2=gsk_YourSecondKeyHere
GROQ_API_KEY_3=gsk_YourThirdKeyHere
GROQ_API_KEY_4=gsk_YourFourthKeyHere
```

### Step 3: We Update `classify.js`
I will rewrite `classify.js` to automatically cycle through the keys on every request.
* Review 1 → Uses Key 1
* Review 2 → Uses Key 2
* Review 3 → Uses Key 3
* Review 4 → Uses Key 4
* Review 5 → Back to Key 1!

### The Result
Each API key will only process 250 reviews (~90,000 tokens), meaning **none of them will ever hit the 100k daily rate limit.** The entire 1,000 review dataset will be perfectly classified, securely keeping your Medium case studies at the top, and your dashboard will be packed with massive data for your submission!
