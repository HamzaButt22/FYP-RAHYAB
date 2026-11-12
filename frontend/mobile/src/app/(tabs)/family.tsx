import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/Placeholder';

export default function FamilyScreen() {
  const { t } = useTranslation();
  return <Placeholder title={t('family.title')} body={t('family.body')} />;
}
