// The teacher and admin dashboard. First screen: D-03 class roster, with sample data
// until staff sign-in and the dashboard API exist (designs in design/screens/, API in docs/api/openapi.yaml).
import './app.css';
import { I18nProvider } from './i18n';
import { Roster } from './Roster';

export function App() {
  return (
    <I18nProvider>
      <Roster />
    </I18nProvider>
  );
}
