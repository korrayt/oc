/**
 * koraytasan.com iletisim formu icin core-I entegrasyonu.
 * Bu kodu form submit akisiniza baglayin.
 */
export async function submitToCoreIContact(payload) {
  const response = await fetch("https://coreapi.koraytasan.com/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CoreI-Source": "koraytasan-contact-form",
    },
    body: JSON.stringify({
      name: payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      subject: payload.subject || "Iletisim",
      message: payload.message || "",
      source: "koraytasan-contact",
    }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json || !json.ok) {
    throw new Error(
      (json && json.error) || `COREI_CONTACT_FAILED_${response.status}`
    );
  }

  return json;
}

/**
 * Ornek:
 *
 * const result = await submitToCoreIContact({
 *   name: "Koray",
 *   email: "ben@koraytasan.com",
 *   subject: "Video projesi",
 *   message: "Kisa film teklifini netlestirelim."
 * });
 *
 * console.log(result.reply);
 */

