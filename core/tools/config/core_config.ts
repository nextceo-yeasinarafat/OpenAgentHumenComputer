

import type { ComputerHardware } from "./config_hardware";
import {
  countryForZone,
  languageFor,
  systemTimezone,
  timezonesFor,
} from "./config_data";



export type ComputerIdentity = {
  
  password: string;
  
  confirmPassword: string;
  
  name: string;
  
  username: string;
  country: string;
  language: string;
  timezone: string;
};

export const EMPTY_IDENTITY: ComputerIdentity = {
  password: "",
  confirmPassword: "",
  name: "",
  username: "",
  country: "",
  language: "",
  timezone: "UTC",
};




export function passwordProblem(password: string, confirmPassword: string): string | null {
  if (password.length < 8) return "The password needs at least 8 characters.";
  if (password !== confirmPassword) return "The two passwords do not match.";
  return null;
}


export function nameProblem(name: string): string | null {
  const text = name.trim();
  if (text.length === 0) return "The computer needs a name.";
  if (text.length > 63) return "The name is longer than 63 characters.";
  return null;
}


export function usernameProblem(username: string): string | null {
  if (username.length === 0) return "The computer needs a user name.";
  if (!/^[a-z][a-z0-9_-]{1,31}$/.test(username))
    return "The user name must start with a small letter and use 2–32 of a–z, 0–9, - or _.";
  return null;
}


export function identityProblem(identity: ComputerIdentity): string | null {
  return (
    nameProblem(identity.name) ??
    usernameProblem(identity.username) ??
    passwordProblem(identity.password, identity.confirmPassword) ??
    (identity.country.length === 0 ? "The computer needs a country." : null) ??
    (identity.language.length === 0 ? "The computer needs a language." : null) ??
    (identity.timezone.length === 0 ? "The computer needs a time zone." : null)
  );
}




export function withCountry(identity: ComputerIdentity, country: string): ComputerIdentity {
  const zones = timezonesFor(country);
  const language = languageFor(country);
  return {
    ...identity,
    country,
    timezone: zones.includes(identity.timezone) ? identity.timezone : (zones[0] ?? "UTC"),
    language: language.length > 0 ? language : identity.language,
  };
}




export function detectedIdentity(): ComputerIdentity {
  const zone = systemTimezone();
  const country = countryForZone(zone);
  return {
    ...EMPTY_IDENTITY,
    country,
    timezone: zone,
    language: languageFor(country),
  };
}




export async function submitCreate(
  identity: ComputerIdentity,
  hardware: ComputerHardware,
): Promise<boolean> {
  try {
    const answer = await fetch("/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: identity.name.trim(),
        username: identity.username,
        password: identity.password,
        country: identity.country,
        language: identity.language,
        timezone: identity.timezone,
        cpuCores: hardware.cpuCores,
        ramGb: hardware.ramGb,
        storageGb: hardware.storageGb,
        gpuPercent: hardware.gpuPercent,
      }),
    });
    return answer.ok;
  } catch {
    return false;
  }
}
