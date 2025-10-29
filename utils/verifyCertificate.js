const validCertificates = require("./validCertificates.json");

function verifyCertificate(sport, certificateName) {
  const record = validCertificates.find(
    (entry) => entry.sport.toLowerCase() === sport.toLowerCase()
  );

  if (!record) return { valid: false, reason: "Invalid sport" };

  const isValid = record.certificates.some(
    (cert) => cert.toLowerCase() === certificateName.toLowerCase()
  );

  if (!isValid) {
    return {
      valid: false,
      reason: `Invalid certificate for ${sport}. Expected one of: ${record.certificates.join(", ")}.`,
    };
  }

  return { valid: true, authority: record.authority };
}

module.exports = verifyCertificate;
