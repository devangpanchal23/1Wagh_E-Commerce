const https = require('https');

/**
 * Sends real SMS OTP to Indian mobile number via configured SMS Gateway
 * Supports: Fast2SMS, Twilio, MSG91, 2Factor
 */
exports.sendRealSmsOtp = async (mobileNumber, otpCode) => {
  const cleanNumber = String(mobileNumber).replace(/\D/g, '');

  // 1. Fast2SMS Integration (Popular Indian SMS Gateway)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const apiKey = process.env.FAST2SMS_API_KEY;
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=otp&variables_values=${encodeURIComponent(otpCode)}&numbers=${encodeURIComponent(cleanNumber)}`;

      const response = await fetchUrl(url);
      console.log(`[REAL SMS - FAST2SMS] Sent to +91${cleanNumber}:`, response);
      return { success: true, provider: 'Fast2SMS', details: response };
    } catch (err) {
      console.error('[REAL SMS - FAST2SMS ERROR]:', err.message);
    }
  }

  // 2. Twilio Integration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const toNumber = cleanNumber.startsWith('+') ? cleanNumber : `+91${cleanNumber}`;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const postData = new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: `Your WAGH E-Commerce verification code is ${otpCode}. Valid for 5 minutes.`,
      }).toString();

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const response = await httpRequest(options, postData);
      console.log(`[REAL SMS - TWILIO] Sent to ${toNumber}:`, response);
      return { success: true, provider: 'Twilio', details: response };
    } catch (err) {
      console.error('[REAL SMS - TWILIO ERROR]:', err.message);
    }
  }

  // 3. MSG91 Integration
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const authKey = process.env.MSG91_AUTH_KEY;
      const templateId = process.env.MSG91_TEMPLATE_ID;
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=91${cleanNumber}&authkey=${encodeURIComponent(authKey)}&otp=${encodeURIComponent(otpCode)}`;

      const response = await fetchUrl(url);
      console.log(`[REAL SMS - MSG91] Sent to +91${cleanNumber}:`, response);
      return { success: true, provider: 'MSG91', details: response };
    } catch (err) {
      console.error('[REAL SMS - MSG91 ERROR]:', err.message);
    }
  }

  // Fallback: Log to server console
  console.log(`[SMS GATEWAY LOG] Real SMS provider API key not set in server/.env. OTP for +91${cleanNumber} is: ${otpCode}`);
  return { success: false, provider: 'ConsoleLog', message: 'No active SMS API key found in server/.env' };
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', (err) => reject(err));
  });
}

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}
