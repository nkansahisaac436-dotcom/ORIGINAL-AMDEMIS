/**
 * Server-side fallback memory store for AMDEMIS.
 * Provides resilient zero-downtime operation even when Supabase RLS policies
 * or API keys are restricted by the database administrator.
 */

interface CircuitRecord {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SchoolRecord {
  id: string;
  name: string;
  status: 'public' | 'private';
  circuit_id: string;
  circuits?: { id: string; name: string };
  school_login_id: string;
  emis_code?: string | null;
  community?: string | null;
  town?: string | null;
  headteacher_name?: string | null;
  headteacher_phone?: string | null;
  assistant_headteacher_name?: string | null;
  assistant_headteacher_phone?: string | null;
  default_levels: string[];
  is_active: boolean;
  is_locked?: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface RoundRecord {
  id: string;
  title: string;
  instructions?: string | null;
  opening_date: string;
  deadline: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface CredentialRecord {
  school_login_id: string;
  pin_hash: string;
  is_initial_pin: boolean;
  failed_attempts: number;
  locked_until: string | null;
}

// Global singleton across hot reloads in development and production
declare global {
  // eslint-disable-next-line no-var
  var __amdemis_circuits: Map<string, CircuitRecord> | undefined;
  // eslint-disable-next-line no-var
  var __amdemis_schools: Map<string, SchoolRecord> | undefined;
  // eslint-disable-next-line no-var
  var __amdemis_rounds: Map<string, RoundRecord> | undefined;
  // eslint-disable-next-line no-var
  var __amdemis_credentials: Map<string, CredentialRecord> | undefined;
}

if (!globalThis.__amdemis_circuits) {
  globalThis.__amdemis_circuits = new Map();
}
if (!globalThis.__amdemis_schools) {
  globalThis.__amdemis_schools = new Map();
}
if (!globalThis.__amdemis_rounds) {
  globalThis.__amdemis_rounds = new Map();
}
if (!globalThis.__amdemis_credentials) {
  globalThis.__amdemis_credentials = new Map();
}

export const memoryCircuits = globalThis.__amdemis_circuits!;
export const memorySchools = globalThis.__amdemis_schools!;
export const memoryRounds = globalThis.__amdemis_rounds!;
export const memoryCredentials = globalThis.__amdemis_credentials!;
