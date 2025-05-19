import { v5 as uuidv5 } from 'uuid'

// UUID namespace to use for deterministic UUID generation
// Using the DNS namespace UUID as a standard practice
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

/**
 * Converts a Google ID (or any other provider ID) to a UUID
 * This creates a deterministic UUID based on the provider ID
 * 
 * @param providerId - The ID from the auth provider (e.g., Google ID)
 * @returns A UUID v5 generated from the provider ID
 */
export function providerIdToUuid(providerId: string): string {
  if (!providerId) {
    throw new Error('Provider ID cannot be empty')
  }
  
  // Generate a v5 UUID (SHA-1 hash of namespace + name)
  return uuidv5(providerId.toString(), UUID_NAMESPACE)
}

/**
 * Checks if a string is a valid UUID
 * 
 * @param id - The string to check
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Safely converts any ID to a UUID
 * If the ID is already a valid UUID, it's returned as is
 * Otherwise, it's converted to a UUID using providerIdToUuid
 * 
 * @param id - The ID to convert
 * @returns A valid UUID
 */
export function ensureUuid(id: string): string {
  if (isValidUuid(id)) {
    return id
  }
  return providerIdToUuid(id)
}
