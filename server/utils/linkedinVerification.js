const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/.+/i;

export const normalizeLinkedInUrl = (url) => {
  const trimmed = String(url || "").trim();
  if (!trimmed || !LINKEDIN_PATTERN.test(trimmed)) return null;
  return trimmed;
};

export const extractLinkedInFromSocial = (social) => {
  if (!social) return null;

  let parsed = social;
  if (typeof social === "string") {
    try {
      parsed = JSON.parse(social);
    } catch {
      if (LINKEDIN_PATTERN.test(social)) return social.trim();
      return null;
    }
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  if (parsed.linkedin) {
    return normalizeLinkedInUrl(parsed.linkedin);
  }

  for (const value of Object.values(parsed)) {
    const normalized = normalizeLinkedInUrl(value);
    if (normalized) return normalized;
  }

  return null;
};

export const checkLinkedInAccessibility = async (url) => {
  const normalized = normalizeLinkedInUrl(url);
  if (!normalized) {
    return { ok: false, reason: "Invalid LinkedIn profile URL format" };
  }

  try {
    const response = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; StartupConnect/1.0; +https://startupconnect.local)",
      },
    });

    if (response.status === 404) {
      return { ok: false, reason: "LinkedIn profile was not found (404)" };
    }

    if (response.status >= 200 && response.status < 400) {
      return { ok: true, url: normalized };
    }

    return {
      ok: false,
      reason: `LinkedIn returned status ${response.status}. Ensure the profile is public.`,
    };
  } catch {
    // LinkedIn often blocks automated checks — allow format-valid URLs.
    return { ok: true, url: normalized, soft: true };
  }
};
