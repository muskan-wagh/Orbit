const COMPANY_SUFFIXES = [
  "inc",
  "llc",
  "ltd",
  "llp",
  "pllc",
  "corporation",
  "corp",
  "company",
  "co",
  "limited",
  "technologies",
  "technology",
  "tech",
  "systems",
  "group",
  "holdings",
  "international",
  "intl",
  "software",
  "solutions",
  "gmbh",
  "pvt",
  "labs",
  "labsinc",
  "services",
  "digital",
  "labsinc",
] as const;

export function normalizeCompany(name: string): string {
  let normalized = name.toLowerCase();
  for (const suffix of COMPANY_SUFFIXES) {
    normalized = normalized.replace(
      new RegExp(`\\b${suffix}\\b`, "g"),
      " ",
    );
  }
  return normalized.replace(/[^a-z0-9]/g, "").trim();
}

export function companyNamesMatch(a: string, b: string): boolean {
  const na = normalizeCompany(a);
  const nb = normalizeCompany(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const minLength = Math.min(na.length, nb.length);
  if (minLength < 4) return false;
  return na.includes(nb) || nb.includes(na);
}

export function domainMatchesCompany(domain: string, company: string): boolean {
  const primarySegment = domain.split(".")[0] ?? "";
  return companyNamesMatch(primarySegment, company);
}

export function rolesMatch(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (!na || !nb) return false;
  if (na === nb) return true;
  const minLength = Math.min(na.length, nb.length);
  if (minLength < 3) return false;
  return na.includes(nb) || nb.includes(na);
}

export function senderDomainFromEmail(email: string): string {
  return email.includes("@") ? email.split("@")[1].toLowerCase() : "";
}