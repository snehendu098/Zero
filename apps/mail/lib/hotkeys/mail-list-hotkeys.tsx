import { useOptimisticActions } from '@/hooks/use-optimistic-actions';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchValue } from '@/hooks/use-search-value';
import { keyboardShortcuts } from '@/config/shortcuts';
import { useLocation, useParams } from 'react-router';
import { useMail } from '@/components/mail/use-mail';
import { Categories } from '@/components/mail/mail';
import { useShortcuts } from './use-hotkey-utils';
import { useThreads } from '@/hooks/use-threads';
import { cleanSearchValue } from '@/lib/utils';
import { useTranslations } from 'use-intl';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';

export function MailListHotkeys() {
  const scope = 'mail-list';
  const [mail, setMail] = useMail();
  const [{ }, items] = useThreads();
  const t = useTranslations();
  const hoveredEmailId = useRef<string | null>(null);
  const categories = Categories();
  const [, setCategory] = useQueryState('category');
  const [searchValue, setSearchValue] = useSearchValue();
  const pathname = useLocation().pathname;
  const params = useParams<{ folder: string }>();
  const folder = params?.folder ?? 'inbox';
  const shouldUseHover = mail.bulkSelected.length === 0;

  const {
    optimisticMarkAsRead,
    optimisticMarkAsUnread,
    optimisticMoveThreadsTo,
    optimisticToggleImportant,
    optimisticDeleteThreads,
    optimisticToggleStar,
  } = useOptimisticActions();

  useEffect(() => {
    const handleEmailHover = (event: CustomEvent<{ id: string | null }>) => {
      hoveredEmailId.current = event.detail.id;
    };

    window.addEventListener('emailHover', handleEmailHover as EventListener);
    return () => {
      window.removeEventListener('emailHover', handleEmailHover as EventListener);
    };
  }, []);

  const selectAll = useCallback(() => {
    if (mail.bulkSelected.length > 0) {
      setMail((prev) => ({
        ...prev,
        bulkSelected: [],
      }));
    } else if (items.length > 0) {
      const allIds = items.map((item) => item.id);
      setMail((prev) => ({
        ...prev,
        bulkSelected: allIds,
      }));
    } else {
      toast.info(t('common.mail.noEmailsToSelect'));
    }
  }, [items, mail]);

  const markAsRead = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticMarkAsRead([hoveredEmailId.current]);
      return;
    }

    const idsToMark = mail.bulkSelected;
    if (idsToMark.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticMarkAsRead(idsToMark);
  }, [mail.bulkSelected, optimisticMarkAsRead, t, shouldUseHover]);

  const markAsUnread = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticMarkAsUnread([hoveredEmailId.current]);
      return;
    }

    const idsToMark = mail.bulkSelected;
    if (idsToMark.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticMarkAsUnread(idsToMark);
  }, [mail.bulkSelected, optimisticMarkAsUnread, t, shouldUseHover]);

  const markAsImportant = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticToggleImportant([hoveredEmailId.current], true);
      return;
    }

    const idsToArchive = mail.bulkSelected;
    if (idsToArchive.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticToggleImportant(idsToMark, true);
  }, [mail.bulkSelected, optimisticToggleImportant, t, shouldUseHover]);

  const archiveEmail = useCallback(async () => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticMoveThreadsTo([hoveredEmailId.current], folder, 'archive');
      return;
    }

    const idsToArchive = mail.bulkSelected;
    if (idsToArchive.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticMoveThreadsTo(idsToArchive, folder, 'archive');
  }, [mail.bulkSelected, folder, optimisticMoveThreadsTo, t, shouldUseHover]);

  const bulkArchive = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticMoveThreadsTo([hoveredEmailId.current], folder, 'archive');
      return;
    }

    const idsToArchive = mail.bulkSelected;
    if (idsToArchive.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticMoveThreadsTo(idsToArchive, folder, 'archive');
  }, [mail.bulkSelected, folder, optimisticMoveThreadsTo, t, shouldUseHover]);

  const bulkDelete = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticDeleteThreads([hoveredEmailId.current], folder);
      return;
    }

    const idsToDelete = mail.bulkSelected;
    if (idsToDelete.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticDeleteThreads(idsToDelete, folder);
  }, [mail.bulkSelected, folder, optimisticDeleteThreads, t, shouldUseHover]);

  const bulkStar = useCallback(() => {
    if (shouldUseHover && hoveredEmailId.current) {
      optimisticToggleStar([hoveredEmailId.current], true);
      return;
    }

    const idsToStar = mail.bulkSelected;
    if (idsToStar.length === 0) {
      toast.info(t('common.mail.noEmailsToSelect'));
      return;
    }

    optimisticToggleStar(idsToStar, true);
  }, [mail.bulkSelected, optimisticToggleStar, t, shouldUseHover]);

  const exitSelectionMode = useCallback(() => {
    setMail((prev) => ({
      ...prev,
      bulkSelected: [],
    }));
  }, [shouldUseHover]);

  const switchMailListCategory = useCallback(
    (category: string | null) => {
      if (pathname?.includes('/mail/inbox')) {
        const cat = categories.find((cat) => cat.id === category);
        if (!cat) {
          setCategory(null);
          setSearchValue({
            value: '',
            highlight: searchValue.highlight,
            folder: '',
          });
          return;
        }
        setCategory(cat.id);
        setSearchValue({
          value: `${cat.searchValue} ${cleanSearchValue(searchValue.value).trim().length ? `AND ${cleanSearchValue(searchValue.value)}` : ''}`,
          highlight: searchValue.highlight,
          folder: '',
        });
      }
    },
    [categories, pathname, searchValue, setCategory, setSearchValue],
  );

  const handlers = useMemo(
    () => ({
      markAsRead,
      markAsUnread,
      markAsImportant,
      selectAll,
      archiveEmail,
      bulkArchive,
      bulkDelete,
      bulkStar,
      exitSelectionMode,
      showImportant: () => {
        switchMailListCategory(null);
      },
      showAllMail: () => {
        switchMailListCategory('All Mail');
      },
      showPersonal: () => {
        switchMailListCategory('Personal');
      },
      showUpdates: () => {
        switchMailListCategory('Updates');
      },
      showPromotions: () => {
        switchMailListCategory('Promotions');
      },
      showUnread: () => {
        switchMailListCategory('Unread');
      },
    }),
    [
      switchMailListCategory,
      markAsRead,
      markAsUnread,
      markAsImportant,
      selectAll,
      archiveEmail,
      bulkArchive,
      bulkDelete,
      bulkStar,
      exitSelectionMode,
    ],
  );

  const mailListShortcuts = keyboardShortcuts.filter((shortcut) => shortcut.scope === scope);

  useShortcuts(mailListShortcuts, handlers, { scope });

  return null;
}
