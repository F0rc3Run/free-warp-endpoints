// کد برای Google Apps Script
function doPost(e) {
  // باز کردن شیت فعال
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // گرفتن تاریخ و زمان فعلی
  const timestamp = new Date();
  // گرفتن آی‌پی کاربر از طریق پارامترهای درخواست (اگرچه این آی‌پی سرور گوگل است، نه کاربر نهایی)
  // برای آی‌پی واقعی، نیاز به سرویس‌های پیچیده‌تر است، اما این برای لاگ‌گیری کلیک کافیست.
  const userIp = e.parameter.ip || "IP Not Available"; 

  // اضافه کردن یک ردیف جدید با اطلاعات
  sheet.appendRow([timestamp, userIp]);

  // بازگرداندن یک پاسخ موفقیت‌آمیز
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
}
