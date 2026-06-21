import { useCallback, useEffect, useState } from 'react';
import { validateDates } from '../../../lib/rental-utils';
import type { DateRange, TFunction } from '../../../types/domain';
import type { CatalogueParamUpdates } from './catalogueControllerUtils';
import type { NavigateOptions } from 'react-router-dom';

type UpdateCatalogueParams = (updates: CatalogueParamUpdates, options?: NavigateOptions) => void;

export function useCatalogueSearchDraft({
  appliedDates,
  appliedQuery,
  cartItemCount,
  t,
  updateCatalogueParams,
}: {
  appliedDates: DateRange;
  appliedQuery: string;
  cartItemCount: number;
  t: TFunction;
  updateCatalogueParams: UpdateCatalogueParams;
}) {
  const [draftQuery, setDraftQuery] = useState(appliedQuery);
  const [draftDates, setDraftDates] = useState(appliedDates);
  const [dateError, setDateError] = useState('');
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    setDraftDates(appliedDates);
  }, [appliedDates.start, appliedDates.end]);

  const applySearch = useCallback(() => {
    const error = validateDates(draftDates);
    setDateError(error ? t(error) : '');
    if (error) return;

    const changed = draftDates.start !== appliedDates.start || draftDates.end !== appliedDates.end;
    updateCatalogueParams({
      q: draftQuery.trim(),
      start: draftDates.start,
      end: draftDates.end,
      search: '1',
    }, { replace: false });
    if (changed && cartItemCount > 0) setShowSyncPrompt(true);
  }, [appliedDates.end, appliedDates.start, cartItemCount, draftDates, draftQuery, t, updateCatalogueParams]);

  return {
    applySearch,
    dateError,
    draftDates,
    draftQuery,
    setDraftDates,
    setDraftQuery,
    setShowSyncPrompt,
    showSyncPrompt,
  };
}
