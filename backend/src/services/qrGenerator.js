const QRCode = require('qrcode');

exports.generateQRCode = async (text) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(text);
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};
