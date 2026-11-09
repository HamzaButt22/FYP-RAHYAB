import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import reports from '../fixtures/reports.json';
import { ResultsScreen } from '../../screens/ResultsScreen';
import { parseReport } from '../../types/api';

describe('ResultsScreen (real backend reports)', () => {
  it('shows the five traits with server scores and the evidence of the selected trait', async () => {
    const report = parseReport(reports.full);
    const onDone = jest.fn();
    await render(<ResultsScreen report={report} playerName="Ayesha" onDone={onDone} />);
    expect(screen.getByText('BIG FIVE INDICATORS')).toBeTruthy();
    for (const t of ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    const n = report.result.evidence.neuroticism;
    await fireEvent.press(screen.getByLabelText(new RegExp(`^Neuroticism ${Math.round(report.result.scores.neuroticism)}`)));
    expect(screen.getByText(n.headline)).toBeTruthy();
    expect(screen.getByText(n.caveat)).toBeTruthy();
    expect(screen.getByText(/PROTOTYPE SCORING/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('results-done'));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows the RIASEC tab with the Holland code and the analytics tab', async () => {
    const report = parseReport(reports.full);
    await render(<ResultsScreen report={report} playerName="Ayesha" onDone={() => undefined} />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Career interests' }));
    expect(screen.getByText('CAREER INTEREST PROFILE (RIASEC)')).toBeTruthy();
    expect(screen.getByText(`Top interests (Holland code): ${report.riasec?.holland_code}`)).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Analytics' }));
    expect(screen.getByText('TELEMETRY ANALYTICS')).toBeTruthy();
    expect(screen.getByText(String(report.summary.decisions_made))).toBeTruthy();
  });

  it('career-only sessions have no Big Five tab', async () => {
    const report = parseReport(reports.career);
    await render(<ResultsScreen report={report} playerName="Bilal" onDone={() => undefined} />);
    expect(screen.queryByRole('tab', { name: 'Big Five' })).toBeNull();
    expect(screen.getByText('CAREER INTEREST PROFILE (RIASEC)')).toBeTruthy();
  });
});
