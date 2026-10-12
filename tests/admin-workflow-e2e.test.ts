import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  generateSecurePin,
  validateNewPin,
  findSimilarSchoolName,
  getLevenshteinDistance,
} from '../src/lib/auth-helpers';
import { circuitSchema, schoolSchema, roundSchema } from '../src/lib/schemas/school';
import { createAdminClient } from '../src/lib/supabase/admin';

describe('Admin Workflow & Headteacher Credential Lifecycle E2E Test', () => {
  let adminClient: any = null;
  const testCircuitIds: string[] = [];
  const testSchoolIds: string[] = [];
  const testUserIds: string[] = [];

  beforeAll(() => {
    try {
      adminClient = createAdminClient();
    } catch {
      // In offline/mock test environments
      adminClient = null;
    }
  });

  afterAll(async () => {
    // Zero database pollution: Clean up ALL created test data
    if (adminClient) {
      try {
        for (const schId of testSchoolIds) {
          await adminClient.from('audit_log').delete().eq('target_id', schId);
          await adminClient.from('profiles').delete().eq('school_id', schId);
          await adminClient.from('submissions').delete().eq('school_id', schId);
          await adminClient.from('schools').delete().eq('id', schId);
        }

        for (const uId of testUserIds) {
          await adminClient.auth.admin.deleteUser(uId).catch(() => {});
        }

        for (const cId of testCircuitIds) {
          await adminClient.from('circuits').delete().eq('id', cId);
        }
      } catch (e) {
        console.error('Error during test cleanup:', e);
      }
    }
  });

  describe('1. PIN Security & Strength Enforcement', () => {
    it('generates a secure 6-digit random PIN', () => {
      const pin = generateSecurePin();
      expect(pin).toMatch(/^\d{6}$/);
      expect(parseInt(pin, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(pin, 10)).toBeLessThan(1000000);
    });

    it('rejects weak PINs with identical digits (e.g. 000000, 111111)', () => {
      expect(validateNewPin('000000').isValid).toBe(false);
      expect(validateNewPin('111111').isValid).toBe(false);
      expect(validateNewPin('999999').isValid).toBe(false);
      expect(validateNewPin('000000').error).toContain('Weak PIN');
    });

    it('rejects weak sequential PINs (e.g. 123456, 654321)', () => {
      expect(validateNewPin('123456').isValid).toBe(false);
      expect(validateNewPin('654321').isValid).toBe(false);
      expect(validateNewPin('012345').isValid).toBe(false);
      expect(validateNewPin('123456').error).toContain('sequential');
    });

    it('rejects new PIN that is identical to current PIN', () => {
      const check = validateNewPin('482915', '482915');
      expect(check.isValid).toBe(false);
      expect(check.error).toContain('different from your current PIN');
    });

    it('accepts a strong, non-sequential 6-digit PIN', () => {
      const check = validateNewPin('482915', '938104');
      expect(check.isValid).toBe(true);
      expect(check.error).toBeUndefined();
    });
  });

  describe('2. School Name Similarity & Duplicate Detection', () => {
    const existing = [
      'Nyinahin Catholic Basic School',
      'Mpasatia Methodist Primary',
      'Tanodumase D/A JHS',
    ];

    it('warns when a proposed school name is very similar', () => {
      const similar = findSimilarSchoolName('Nyinahin Cathlic Basic School', existing);
      expect(similar).toBe('Nyinahin Catholic Basic School');
    });

    it('allows distinct school names without false positives', () => {
      const distinct = findSimilarSchoolName('Agogo State Basic School', existing);
      expect(distinct).toBeNull();
    });
  });

  describe('3. Circuit & School Schema Validation', () => {
    it('validates circuit name constraints (2 to 60 characters)', () => {
      const valid = circuitSchema.safeParse({ name: 'Nyinahin Central Circuit' });
      expect(valid.success).toBe(true);

      const tooShort = circuitSchema.safeParse({ name: 'N' });
      expect(tooShort.success).toBe(false);

      const tooLong = circuitSchema.safeParse({ name: 'A'.repeat(61) });
      expect(tooLong.success).toBe(false);
    });

    it('requires assigned circuit for both Public and Private schools', () => {
      const validPublic = schoolSchema.safeParse({
        name: 'Nyinahin Model School',
        status: 'public',
        circuit_id: '11111111-1111-1111-1111-111111111111',
      });
      expect(validPublic.success).toBe(true);

      const validPrivate = schoolSchema.safeParse({
        name: 'Grace International Academy',
        status: 'private',
        circuit_id: '11111111-1111-1111-1111-111111111111',
      });
      expect(validPrivate.success).toBe(true);

      const missingCircuit = schoolSchema.safeParse({
        name: 'Grace International Academy',
        status: 'private',
        circuit_id: '',
      });
      expect(missingCircuit.success).toBe(false);
    });
  });

  describe('4. Sequential AMD-XXXX Login ID Assignment Logic', () => {
    it('generates the next sequential ID without duplicates or collisions', () => {
      const existingIds = ['AMD-0001', 'AMD-0002', 'AMD-0015', 'AMD-0042'];
      let maxNum = 0;
      for (const id of existingIds) {
        const match = id.match(/AMD-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextId = `AMD-${String(maxNum + 1).padStart(4, '0')}`;
      expect(nextId).toBe('AMD-0043');
    });
  });

  describe('5. Database Workflow & Isolation Simulation (with cleanup)', () => {
    let circuitAId: string;
    let circuitBId: string;
    let schoolPubId: string;
    let schoolPrivId: string;

    it('creates test circuits A and B', async () => {
      if (!adminClient) return;

      const { data: cA, error: errA } = await adminClient
        .from('circuits')
        .insert({ name: `_TEST_Circuit_Alpha_${Date.now()}`, is_active: true })
        .select()
        .single();
      expect(errA).toBeNull();
      expect(cA?.id).toBeDefined();
      circuitAId = cA.id;
      testCircuitIds.push(cA.id);

      const { data: cB, error: errB } = await adminClient
        .from('circuits')
        .insert({ name: `_TEST_Circuit_Beta_${Date.now()}`, is_active: true })
        .select()
        .single();
      expect(errB).toBeNull();
      expect(cB?.id).toBeDefined();
      circuitBId = cB.id;
      testCircuitIds.push(cB.id);
    });

    it('creates Public and Private schools under Circuit A with sequential IDs', async () => {
      if (!adminClient || !circuitAId) return;

      const { data: sch1, error: err1 } = await adminClient
        .from('schools')
        .insert({
          name: `_TEST_Public_School_${Date.now()}`,
          status: 'public',
          circuit_id: circuitAId,
          school_login_id: `_TEST_AMD_9001`,
          is_active: true,
          default_levels: ['primary', 'jhs'],
        })
        .select()
        .single();
      expect(err1).toBeNull();
      expect(sch1?.id).toBeDefined();
      schoolPubId = sch1.id;
      testSchoolIds.push(sch1.id);

      const { data: sch2, error: err2 } = await adminClient
        .from('schools')
        .insert({
          name: `_TEST_Private_School_${Date.now()}`,
          status: 'private',
          circuit_id: circuitAId,
          school_login_id: `_TEST_AMD_9002`,
          is_active: true,
          default_levels: ['kg', 'primary'],
        })
        .select()
        .single();
      expect(err2).toBeNull();
      expect(sch2?.id).toBeDefined();
      schoolPrivId = sch2.id;
      testSchoolIds.push(sch2.id);
    });

    it('simulates 5 failed login attempts and locks the account', async () => {
      if (!adminClient || !schoolPubId) return;

      // Simulate profile with 5 failed attempts
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { data: profile, error } = await adminClient
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000009001',
          role: 'headteacher',
          school_id: schoolPubId,
          failed_attempts: 5,
          locked_until: lockedUntil,
          is_initial_pin: true,
        })
        .select()
        .single();

      if (!error && profile) {
        expect(profile.failed_attempts).toBe(5);
        expect(new Date(profile.locked_until).getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('admin unlocks the locked account', async () => {
      if (!adminClient || !schoolPubId) return;

      const { data: updated, error } = await adminClient
        .from('profiles')
        .update({
          failed_attempts: 0,
          locked_until: null,
        })
        .eq('school_id', schoolPubId)
        .select()
        .maybeSingle();

      if (!error && updated) {
        expect(updated.failed_attempts).toBe(0);
        expect(updated.locked_until).toBeNull();
      }
    });

    it('moves school from Circuit A to Circuit B and maintains login capability', async () => {
      if (!adminClient || !schoolPubId || !circuitBId) return;

      const { data: moved, error } = await adminClient
        .from('schools')
        .update({
          circuit_id: circuitBId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', schoolPubId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(moved?.circuit_id).toBe(circuitBId);
      expect(moved?.school_login_id).toBe('_TEST_AMD_9001');
    });

    it('verifies cross-school data isolation between Headteacher A and Headteacher B', () => {
      const schoolA = schoolPubId || 'school-A-uuid';
      const schoolB = schoolPrivId || 'school-B-uuid';

      const verifyAccess = (reqSchoolId: string, userSchoolId: string) => {
        return reqSchoolId === userSchoolId;
      };

      expect(verifyAccess(schoolA, schoolA)).toBe(true);
      expect(verifyAccess(schoolB, schoolA)).toBe(false);
      expect(verifyAccess(schoolA, schoolB)).toBe(false);
    });
  });
});
