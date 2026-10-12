import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from './supabase/admin';
import crypto from 'crypto';

export interface AuthContext {
  userId: string | null;
  role: 'super_admin' | 'district_officer' | 'headteacher' | null;
  schoolId?: string | null;
  schoolLoginId?: string | null;
}

/**
 * Validates whether the incoming request is authenticated as Super Admin or District Officer.
 */
export async function verifyAdminRole(): Promise<{
  isAdmin: boolean;
  role?: 'super_admin' | 'district_officer';
  userId?: string | null;
  error?: string;
}> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('amdemis_admin_session')?.value;

  if (adminCookie) {
    return {
      isAdmin: true,
      role: 'super_admin',
      userId: '00000000-0000-0000-0000-000000000001',
    };
  }

  // Fallback to Supabase Auth token
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isAdmin: false, error: 'Authentication required. Please sign in.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'super_admin' || profile?.role === 'district_officer') {
      return {
        isAdmin: true,
        role: profile.role,
        userId: user.id,
      };
    }

    return {
      isAdmin: false,
      error: 'Forbidden: Only Directorate Super Admin or District Officers can perform this action.',
    };
  } catch {
    return { isAdmin: false, error: 'Authentication verification failed.' };
  }
}

/**
 * Validates whether the incoming request is authenticated as Headteacher and returns their school ID.
 */
export async function verifyHeadteacherRole(): Promise<{
  isHeadteacher: boolean;
  schoolId?: string | null;
  schoolLoginId?: string | null;
  userId?: string | null;
  error?: string;
}> {
  const cookieStore = await cookies();
  const htCookie = cookieStore.get('amdemis_headteacher_session')?.value;

  if (htCookie) {
    // Look up school by Login ID
    let schoolId: string | null = null;
    try {
      const adminClient = createAdminClient();
      const { data: sch } = await adminClient
        .from('schools')
        .select('id')
        .ilike('school_login_id', htCookie.trim().toUpperCase())
        .maybeSingle();
      if (sch) schoolId = sch.id;
    } catch {
      // Offline / fallback
    }

    return {
      isHeadteacher: true,
      schoolId: schoolId || htCookie,
      schoolLoginId: htCookie.trim().toUpperCase(),
      userId: null,
    };
  }

  // Supabase Auth
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isHeadteacher: false, error: 'Headteacher sign in required.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'headteacher' && profile.school_id) {
      const { data: sch } = await supabase
        .from('schools')
        .select('school_login_id')
        .eq('id', profile.school_id)
        .maybeSingle();

      return {
        isHeadteacher: true,
        schoolId: profile.school_id,
        schoolLoginId: sch?.school_login_id || null,
        userId: user.id,
      };
    }

    return { isHeadteacher: false, error: 'Forbidden: Headteacher account required.' };
  } catch {
    return { isHeadteacher: false, error: 'Headteacher verification failed.' };
  }
}

/**
 * Generates a cryptographically secure 6-digit random PIN.
 */
export function generateSecurePin(): string {
  // Generates 100000 to 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Validates a PIN against security rules:
 * - Exactly 6 digits
 * - Reject all same digits (000000, 111111, etc.)
 * - Reject simple sequences (123456, 654321, 012345, etc.)
 * - Reject same as old PIN (if provided)
 */
export function validateNewPin(
  newPin: string,
  oldPin?: string
): { isValid: boolean; error?: string } {
  const trimmed = (newPin || '').trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { isValid: false, error: 'PIN must be exactly 6 numeric digits.' };
  }

  // Reject all same digits (e.g. 000000, 111111, 999999)
  if (/^(\d)\1{5}$/.test(trimmed)) {
    return { isValid: false, error: 'Weak PIN: Cannot be all identical digits (e.g. 000000, 111111).' };
  }

  // Reject simple sequential numbers
  const sequentialPatterns = [
    '012345', '123456', '234567', '345678', '456789',
    '987654', '876543', '765432', '654321', '543210',
  ];
  if (sequentialPatterns.includes(trimmed)) {
    return { isValid: false, error: 'Weak PIN: Cannot be a sequential number (e.g. 123456, 654321).' };
  }

  if (oldPin && trimmed === oldPin.trim()) {
    return { isValid: false, error: 'New PIN must be different from your current PIN.' };
  }

  return { isValid: true };
}

/**
 * Helper to compute Levenshtein distance between two strings
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[s2.length][s1.length];
}

/**
 * Checks if a school name is very similar to an existing school name.
 */
export function findSimilarSchoolName(newName: string, existingNames: string[]): string | null {
  const cleanNew = newName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  for (const existing of existingNames) {
    const cleanExisting = existing.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (cleanNew === cleanExisting) return existing;
    const distance = getLevenshteinDistance(cleanNew, cleanExisting);
    if (distance <= 2 && Math.abs(cleanNew.length - cleanExisting.length) <= 2) {
      return existing;
    }
  }
  return null;
}
