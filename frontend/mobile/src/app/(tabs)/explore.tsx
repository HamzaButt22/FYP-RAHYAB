import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/Placeholder';

export default function ExploreScreen() {
  const { t } = useTranslation();
  return <Placeholder title={t('explore.title')} body={t('explore.body')} />;
}
