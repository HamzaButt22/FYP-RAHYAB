// Screens of the server-backed app, driven like a user would (server responses are real ones, recorded from the
// RahYaab Flask server in fixtures/server_responses.json; the network layer is replaced by jest mocks).
import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import fx from './fixtures/server_responses.json';
import {api} from '../api';
import {tokenStore} from '../api/session';
import App from '../../App';
import {Questionnaire} from '../screens/Assessment';
import Assessment from '../screens/Assessment';
import Report from '../screens/Report';
import SchoolAdmin from '../screens/SchoolAdmin';

jest.mock('expo-secure-store', () => {
  const m = new Map();
  return {isAvailableAsync: async () => true, getItemAsync: async (k) => (m.has(k) ? m.get(k) : null),
    setItemAsync: async (k, v) => void m.set(k, v), deleteItemAsync: async (k) => void m.delete(k)};
});
jest.mock('expo-screen-orientation', () => ({lockAsync: jest.fn(() => Promise.resolve()), OrientationLock: {PORTRAIT_UP: 'P', LANDSCAPE: 'L'}}));
jest.mock('../api', () => {
  const names = ['register', 'login', 'logout', 'forgot', 'resetWithCode', 'me', 'saveProfile', 'changePassword', 'startAssessment',
    'assessments', 'assessment', 'linkGame', 'riasecItems', 'saveAnswers', 'submit', 'result', 'feedback', 'abandon', 'schoolStudents',
    'addStudent', 'updateStudent', 'resetCode', 'schoolStats', 'orgs', 'createOrg', 'updateOrg', 'users', 'updateUser', 'adminItems',
    'addItem', 'updateItem', 'adminFields', 'addField', 'updateField', 'adminStats', 'createExport'];
  const api = Object.fromEntries(names.map((n) => [n, jest.fn()]));
  api.absolute = (p) => `https://srv${p}`;
  return {api, serverUrl: () => 'https://srv', builtInServer: () => 'https://srv', httpAllowed: () => true,
    setServerUrl: jest.fn(async (u) => u), loadSettings: jest.fn(async () => {}), setOnSessionExpired: jest.fn()};
});

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const ME = fx.me;
const apiError = (status, message) => Object.assign(new Error(message), {status});

beforeEach(async () => {
  Object.values(api).forEach((f) => f.mockReset && f.mockReset());
  await tokenStore.clear();
  api.assessments.mockResolvedValue(fx.assessments);
});

// ------------------------------------------------------------------ app shell: login, roles, temporary passwords
describe('App', () => {
  it('logs in, stores the token securely and shows the student home with tabs', async () => {
    api.login.mockResolvedValue({token: 'tok-1', user: ME});
    await render(<App />);
    await flush();
    await fireEvent.changeText(screen.getByPlaceholderText('Email or username'), 'ayesha@example.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), 'Secret123');
    await fireEvent.press(screen.getByText('Log in'));
    await flush();
    expect(api.login).toHaveBeenCalledWith('ayesha@example.com', 'Secret123');
    expect(await tokenStore.get()).toBe('tok-1');
    expect(screen.getByText('Hi Ayesha 👋')).toBeTruthy();
    expect(screen.getByText('Practice')).toBeTruthy();
    expect(screen.getByText('📊 Latest results')).toBeTruthy();
  });

  it('shows the server error for a wrong password and stays on the login screen', async () => {
    api.login.mockRejectedValue(apiError(401, 'Invalid login or password.'));
    await render(<App />);
    await flush();
    await fireEvent.changeText(screen.getByPlaceholderText('Email or username'), 'x');
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), 'y');
    await fireEvent.press(screen.getByText('Log in'));
    await flush();
    expect(screen.getByText('Invalid login or password.')).toBeTruthy();
    expect(await tokenStore.get()).toBeNull();
  });

  it('forces a new password after logging in with a temporary one', async () => {
    api.login.mockResolvedValue({token: 't', user: {...ME, must_change_password: true}});
    api.changePassword.mockResolvedValue({token: 't2', user: {...ME, must_change_password: false}});
    await render(<App />);
    await flush();
    await fireEvent.changeText(screen.getByPlaceholderText('Email or username'), 'ali.raza');
    await fireEvent.changeText(screen.getByPlaceholderText('Password'), 'TEMP-1');
    await fireEvent.press(screen.getByText('Log in'));
    await flush();
    expect(screen.getByText(/temporary password/)).toBeTruthy();
    expect(screen.queryByText('Practice')).toBeNull(); // nothing else is reachable
    await fireEvent.changeText(screen.getByPlaceholderText('Current password'), 'TEMP-1');
    await fireEvent.changeText(screen.getByPlaceholderText('New password (8+ characters, letters and numbers)'), 'MyOwnPass1');
    await fireEvent.changeText(screen.getByPlaceholderText('Repeat new password'), 'MyOwnPass1');
    await fireEvent.press(screen.getAllByText('Change password').pop());
    await flush();
    expect(await tokenStore.get()).toBe('t2');
    expect(screen.getByText('Hi Ayesha 👋')).toBeTruthy();
  });

  it('routes admins to their own screens', async () => {
    await tokenStore.set('adm');
    api.me.mockResolvedValue({...ME, role: 'SCHOOL_ADMIN', name: 'Ms Sana', org: {org_id: 1, name: 'Riverside School'}});
    api.schoolStudents.mockResolvedValue({students: []});
    api.schoolStats.mockResolvedValue({students: 0, students_completed: 0, completion_rate: 0, assessments_completed: 0, flagged: 0, feedback: {useful_avg: null}, by_grade: {}});
    const first = await render(<App />);
    await flush();
    expect(screen.getByText('Riverside School 🏫')).toBeTruthy();
    await first.unmount();
    api.me.mockResolvedValue({...ME, role: 'PLATFORM_ADMIN', subscription: {active: true, until: null, source: 'platform'}});
    api.adminStats.mockResolvedValue({users: {STUDENT: 1, SCHOOL_ADMIN: 0, PLATFORM_ADMIN: 1}, schools: 0, individual_students: 1, individual_active_subscriptions: 1,
      assessments: {COMPLETED: 1, IN_PROGRESS: 0, ABANDONED: 0}, completion_rate: 1, flagged_assessments: 0, flags: {}, feedback: {n: 0}, per_school: [], email: 'smtp'});
    await render(<App />);
    await flush();
    expect(screen.getByText('RahYaab admin 🛠️')).toBeTruthy();
  });

  it('returns to the login screen when the session expired', async () => {
    await tokenStore.set('old');
    api.me.mockRejectedValue(apiError(401, 'Please log in again.'));
    await render(<App />);
    await flush();
    expect(screen.getByText('Welcome back')).toBeTruthy();
    expect(await tokenStore.get()).toBeNull();
  });
});

// ------------------------------------------------------------------ consent (FR-1.4)
describe('consent', () => {
  it('needs the student and, for an individual under 18, a parent or guardian', async () => {
    api.assessments.mockResolvedValue({assessments: []});
    api.startAssessment.mockResolvedValue({...fx.assessments.assessments[0], status: 'IN_PROGRESS', game: {done: false}});
    await render(<Assessment u={{...ME, age: 15, org: null}} onPlay={jest.fn()} onResult={jest.fn()} onExit={jest.fn()} />);
    await flush();
    expect(screen.getByText('What we collect and why')).toBeTruthy();
    await fireEvent.press(screen.getByText('Start'));
    expect(api.startAssessment).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('I understand and agree to take part.'));
    await fireEvent.press(screen.getByText('Start'));
    expect(api.startAssessment).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('My parent or guardian knows about RahYaab and agrees.'));
    await fireEvent.press(screen.getByText('Start'));
    await flush();
    expect(api.startAssessment).toHaveBeenCalledWith({accepted: true, guardian: true});
    expect(screen.getByText('Play levels 1-6')).toBeTruthy();
  });

  it('does not ask school students for a guardian (the school agreed)', async () => {
    api.assessments.mockResolvedValue({assessments: []});
    await render(<Assessment u={{...ME, age: 15, org: {org_id: 1, name: 'Riverside'}}} onPlay={jest.fn()} onResult={jest.fn()} onExit={jest.fn()} />);
    await flush();
    expect(screen.queryByText(/parent or guardian knows/)).toBeNull();
    expect(screen.getByText(/Your school \(Riverside\) has agreed/)).toBeTruthy();
  });
});

// ------------------------------------------------------------------ questionnaire (FR-4.3)
describe('questionnaire', () => {
  const items = fx.items.items;
  const a = (answers) => ({assessment_id: 9, riasec_answers: answers, game: {done: true}});

  it('continues at the first unanswered question and saves every answer at once', async () => {
    api.riasecItems.mockResolvedValue(fx.items);
    api.saveAnswers.mockResolvedValue({saved: 3, total: 24});
    const answers = {[items[0].item_id]: 3, [items[1].item_id]: 4};
    await render(<Questionnaire a={a(answers)} onDone={jest.fn()} onExit={jest.fn()} />);
    await flush();
    expect(screen.getByText('Question 3 of 24')).toBeTruthy();
    expect(screen.getByText(items[2].text)).toBeTruthy();
    await fireEvent.press(screen.getByText('Very much'));
    await flush();
    const [aid, sent, timing] = api.saveAnswers.mock.calls[0];
    expect(aid).toBe(9);
    expect(sent).toEqual({[String(items[2].item_id)]: 5});
    expect(typeof timing[String(items[2].item_id)]).toBe('number');
    expect(screen.getByText('Question 4 of 24')).toBeTruthy();
    expect(screen.queryByText('See my results')).toBeNull(); // cannot submit with gaps
    expect(screen.getByText(/21 questions left/)).toBeTruthy();
  });

  it('keeps unsaved answers when offline and sends them with the next answer', async () => {
    api.riasecItems.mockResolvedValue(fx.items);
    api.saveAnswers.mockRejectedValueOnce(apiError(0, "Can't reach the RahYaab server.")).mockResolvedValue({});
    await render(<Questionnaire a={a({})} onDone={jest.fn()} onExit={jest.fn()} />);
    await flush();
    await fireEvent.press(screen.getByText('A little'));
    await flush();
    expect(screen.getByText('Not saved yet')).toBeTruthy();
    expect(screen.getByText('Question 1 of 24')).toBeTruthy(); // does not move on with an unsaved answer
    await fireEvent.press(screen.getByText('Somewhat'));
    await flush();
    expect(api.saveAnswers.mock.calls[1][1]).toEqual({[String(items[0].item_id)]: 3});
    expect(screen.getByText('✓ Saved')).toBeTruthy();
  });

  it('offers results only when everything is answered and saved', async () => {
    api.riasecItems.mockResolvedValue(fx.items);
    api.submit.mockResolvedValue({});
    const all = Object.fromEntries(items.map((it) => [String(it.item_id), 3]));
    const onDone = jest.fn();
    await render(<Questionnaire a={a(all)} onDone={onDone} onExit={jest.fn()} />);
    await flush();
    await fireEvent.press(screen.getByText('See my results'));
    await flush();
    expect(api.submit).toHaveBeenCalledWith(9);
    expect(onDone).toHaveBeenCalledWith(9);
  });
});

// ------------------------------------------------------------------ results (FR-5, FR-6)
describe('results', () => {
  it('shows levels with descriptions, interests, explained fields with grade pathways, the disclaimer and rating', async () => {
    api.result.mockResolvedValue(fx.result);
    api.feedback.mockResolvedValue({});
    await render(<Report id={fx.result.assessment_id} onBack={jest.fn()} />);
    await flush();
    const t0 = fx.result.bigfive.traits[0];
    expect(screen.getByText(t0.description)).toBeTruthy();
    expect(screen.getByLabelText(/Personality chart/)).toBeTruthy();
    expect(screen.getByText(`🧭 Your interests: ${fx.result.riasec.code}`)).toBeTruthy();
    const top = fx.result.recommendations[0];
    expect(screen.getByText(top.why)).toBeTruthy();
    await fireEvent.press(screen.getAllByText(/Pathway for grades/)[0]);
    expect(screen.getByText(`1. ${top.pathways[0]}`)).toBeTruthy();
    await fireEvent.press(screen.getAllByText('How was this worked out?')[0]);
    expect(screen.getByText(new RegExp(`= ${top.pct}%`))).toBeTruthy();
    expect(screen.getByText(fx.result.disclaimer)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('How useful are these results? 4 of 5'));
    await fireEvent.press(screen.getByLabelText('How well do they describe you? 3 of 5'));
    await fireEvent.press(screen.getByText('Send rating'));
    await flush();
    expect(api.feedback).toHaveBeenCalledWith(fx.result.assessment_id, {useful: 4, accurate: 3, comment: null});
    expect(screen.getByText('Thanks for your rating!')).toBeTruthy();
  });

  it('marks traits the game could not measure, and the quality note', async () => {
    const r = JSON.parse(JSON.stringify(fx.result));
    Object.assign(r.bigfive.traits[0], {measured: false, score: null, level: null, description: 'Not enough game evidence for this trait.'});
    r.quality = {flags: ['too_fast'], message: 'Some choices or answers were very quick … you can retake the assessment when you have more time.'};
    api.result.mockResolvedValue(r);
    await render(<Report id={1} onBack={jest.fn()} />);
    await flush();
    expect(screen.getByText('Not enough data')).toBeTruthy();
    expect(screen.getByText(/retake the assessment/)).toBeTruthy();
  });
});

// ------------------------------------------------------------------ school admin (FR-7)
describe('school admin', () => {
  it('adds a student and shows the temporary password once; issues reset codes', async () => {
    api.schoolStudents.mockResolvedValue({students: [{user_id: 5, name: 'Ali Raza', login: 'ali.raza', grade: 9, status: 'ACTIVE', assessments_completed: 0, assessment_in_progress: false}]});
    api.schoolStats.mockResolvedValue({students: 1, students_completed: 0, completion_rate: 0, assessments_completed: 0, flagged: 0, feedback: {useful_avg: null}, by_grade: {9: 1}});
    api.addStudent.mockResolvedValue({student: {name: 'Sara K', login: 'sara.k'}, temporary_password: 'ABCD-EFGH-42', message: 'Give the login privately.'});
    api.resetCode.mockResolvedValue({code: 'WXYZ-2345', message: 'Works once.'});
    await render(<SchoolAdmin u={{...ME, role: 'SCHOOL_ADMIN', org: {org_id: 1, name: 'Riverside School'}, subscription: {active: true, until: '2027-06-30'}}} />);
    await flush();
    await fireEvent.changeText(screen.getByPlaceholderText('Full name'), 'Sara K');
    await fireEvent.changeText(screen.getByPlaceholderText('Login (username like ali.raza, or email)'), 'sara.k');
    await fireEvent.press(screen.getAllByText('11')[0]);
    await fireEvent.press(screen.getByText('Add student'));
    await flush();
    expect(api.addStudent).toHaveBeenCalledWith({name: 'Sara K', login: 'sara.k', grade: 11});
    expect(screen.getByText('Temporary password: ABCD-EFGH-42')).toBeTruthy();
    await fireEvent.press(screen.getByText('Done'));
    expect(screen.queryByText(/ABCD-EFGH-42/)).toBeNull();
    await fireEvent.press(screen.getByText('Reset code'));
    await flush();
    expect(api.resetCode).toHaveBeenCalledWith(5);
    expect(screen.getByText('Code: WXYZ-2345')).toBeTruthy();
  });
});
