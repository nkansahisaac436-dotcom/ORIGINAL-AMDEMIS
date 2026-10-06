import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEMO_ACCOUNTS = {
  headteachers: [
    {
      loginId: 'AMD-0001',
      pin: '123456',
      school: {
        id: 'sch-001',
        name: 'Nyinahin Catholic Basic School',
        school_login_id: 'AMD-0001',
        status: 'public',
        town: 'Nyinahin',
        emis_code: '201042001',
        levels: ['kg', 'primary', 'jhs'],
        headteacher_name: 'Mr. Emmanuel Osei',
        headteacher_phone: '0244998877',
        circuits: { id: 'circ-001', name: 'Nyinahin' },
      },
    },
    {
      loginId: 'AMD-0002',
      pin: '654321',
      school: {
        id: 'sch-002',
        name: 'Mpasatia D/A JHS',
        school_login_id: 'AMD-0002',
        status: 'public',
        town: 'Mpasatia',
        emis_code: '201042002',
        levels: ['jhs'],
        headteacher_name: 'Madam Akua Afriyie',
        headteacher_phone: '0244556677',
        circuits: { id: 'circ-002', name: 'Mpasatia' },
      },
    },
  ],
  admin: {
    email: 'admin@amdemis.gov.gh',
    password: 'DistrictAdmin2026!',
    profile: {
      id: 'admin-001',
      full_name: 'Directorate Planning Officer',
      role: 'super_admin',
    },
  },
  activeRound: {
    id: 'round-2026',
    title: '2026/2027 Academic Year Annual Census',
    deadline: '2026-11-30T23:59:59Z',
    is_active: true,
  },
  circuits: [
    { id: 'circ-001', name: 'Nyinahin Circuit', officer_name: 'Mr. Kwame Mensah', schools: [{ id: 'sch-001', is_active: true }] },
    { id: 'circ-002', name: 'Mpasatia Circuit', officer_name: 'Mrs. Abena Serwaa', schools: [{ id: 'sch-002', is_active: true }] },
    { id: 'circ-003', name: 'Tanodumase Circuit', officer_name: 'Mr. Kofi Boateng', schools: [] },
  ],
};

const SESSION_KEY = '@amdemis_current_session';

export async function setDemoSession(session: any) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getDemoSession() {
  const data = await AsyncStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearDemoSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
