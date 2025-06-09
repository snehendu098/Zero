import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../ui/context-menu';
import {
  Archive,
  ArchiveX,
  Forward,
  Inbox,
  MailOpen,
  Reply,
  ReplyAll,
  Star,
  StarOff,
  Tag,
  Trash,
} from 'lucide-react';
import { useOptimisticThreadState } from '@/components/mail/optimistic-thread-state';
import { useOptimisticActions } from '@/hooks/use-optimistic-actions';
import { type ThreadDestination } from '@/lib/thread-actions';
import { useThread, useThreads } from '@/hooks/use-threads';
import { ExclamationCircle, Mail } from '../icons/icons';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { useLabels } from '@/hooks/use-labels';
import { FOLDERS, LABELS } from '@/lib/utils';
import { useMail } from '../mail/use-mail';
import { useTranslations } from 'use-intl';
import { Checkbox } from '../ui/checkbox';
import { useParams } from 'react-router';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';

interface EmailAction {
  id: string;
  label: string | ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  condition?: () => boolean;
}

interface EmailContextMenuProps {
  children: ReactNode;
  threadId: string;
  isInbox?: boolean;
  isSpam?: boolean;
  isSent?: boolean;
  isBin?: boolean;
  refreshCallback?: () => void;
}

const LabelsList = ({ threadId }: { threadId: string }) => {
  const { data: labels } = useLabels();
  const { data: thread, refetch } = useThread(threadId);
  const t = useTranslations();
  const trpc = useTRPC();
  const { mutateAsync: modifyLabels } = useMutation(trpc.mail.modifyLabels.mutationOptions());

  if (!labels || !thread) return null;

  const handleToggleLabel = async (labelId: string) => {
    if (!labelId) return;
    const hasLabel = thread.labels?.map((label) => label.id).includes(labelId);
    const promise = modifyLabels({
      threadId: [threadId],
      addLabels: hasLabel ? [] : [labelId],
      removeLabels: hasLabel ? [labelId] : [],
    });
    toast.promise(promise, {
      error: hasLabel ? 'Failed to remove label' : 'Failed to add label',
      finally: async () => {
        await refetch();
      },
    });
  };

  return (
    <>
      {labels
        .filter((label) => label.id)
        .map((label) => (
          <ContextMenuItem
            key={label.id}
            onClick={() => label.id && handleToggleLabel(label.id)}
            className="font-normal"
          >
            <div className="flex items-center">
              <Checkbox
                checked={
                  label.id ? thread.labels?.map((label) => label.id).includes(label.id) : false
                }
                className="mr-2 h-4 w-4"
              />
              {label.name}
            </div>
          </ContextMenuItem>
        ))}
    </>
  );
};

export function ThreadContextMenu({
  children,
  threadId,
  isInbox = true,
  isSpam = false,
  isSent = false,
  isBin = false,
}: EmailContextMenuProps) {
  const { folder } = useParams<{ folder: string }>();
  const [mail, setMail] = useMail();
  const [{ isLoading, isFetching }] = useThreads();
  const currentFolder = folder ?? '';
  const isArchiveFolder = currentFolder === FOLDERS.ARCHIVE;
  const t = useTranslations();
  const [, setMode] = useQueryState('mode');
  const [, setThreadId] = useQueryState('threadId');
  const { data: threadData } = useThread(threadId);
  const optimisticState = useOptimisticThreadState(threadId);

  const isUnread = useMemo(() => {
    return threadData?.hasUnread ?? false;
  }, [threadData]);

  const isStarred = useMemo(() => {
    if (optimisticState.optimisticStarred !== null) {
      return optimisticState.optimisticStarred;
    }
    return threadData?.messages.some((message) =>
      message.tags?.some((tag) => tag.name.toLowerCase() === 'starred'),
    );
  }, [threadData, optimisticState.optimisticStarred]);

  const isImportant = useMemo(() => {
    if (optimisticState.optimisticImportant !== null) {
      return optimisticState.optimisticImportant;
    }
    return threadData?.messages.some((message) =>
      message.tags?.some((tag) => tag.name.toLowerCase() === 'important'),
    );
  }, [threadData]);

  const noopAction = () => async () => {
    toast.info(t('common.actions.featureNotImplemented'));
  };

  const { optimisticMoveThreadsTo } = useOptimisticActions();

  const handleMove = (from: string, to: string) => () => {
    try {
      let targets = [];
      if (mail.bulkSelected.length) {
        targets = mail.bulkSelected;
      } else {
        targets = [threadId];
      }

      let destination: ThreadDestination = null;
      if (to === LABELS.INBOX) destination = FOLDERS.INBOX;
      else if (to === LABELS.SPAM) destination = FOLDERS.SPAM;
      else if (to === LABELS.TRASH) destination = FOLDERS.BIN;
      else if (from && !to) destination = FOLDERS.ARCHIVE;

      optimisticMoveThreadsTo(targets, currentFolder, destination);

      if (mail.bulkSelected.length) {
        setMail({ ...mail, bulkSelected: [] });
      }
    } catch (error) {
      console.error(`Error moving ${threadId ? 'email' : 'thread'}:`, error);
      toast.error(t('common.actions.failedToMove'));
    }
  };

  const { optimisticToggleStar } = useOptimisticActions();

  const handleFavorites = () => {
    const targets = mail.bulkSelected.length ? mail.bulkSelected : [threadId];

    const newStarredState = !isStarred;

    optimisticToggleStar(targets, newStarredState);

    if (mail.bulkSelected.length) {
      setMail((prev) => ({ ...prev, bulkSelected: [] }));
    }
  };

  const { optimisticToggleImportant } = useOptimisticActions();

  const handleToggleImportant = () => {
    const targets = mail.bulkSelected.length ? mail.bulkSelected : [threadId];
    const newImportantState = !isImportant;

    // Use optimistic update with undo functionality
    optimisticToggleImportant(targets, newImportantState);

    // Clear bulk selection after action
    if (mail.bulkSelected.length) {
      setMail((prev) => ({ ...prev, bulkSelected: [] }));
    }
  };

  const { optimisticMarkAsRead, optimisticMarkAsUnread } = useOptimisticActions();

  const handleReadUnread = () => {
    const targets = mail.bulkSelected.length ? mail.bulkSelected : [threadId];
    const newReadState = isUnread; // If currently unread, mark as read (true)

    // Use optimistic update with undo functionality
    if (newReadState) {
      optimisticMarkAsRead(targets);
    } else if (!newReadState) {
      optimisticMarkAsUnread(targets);
    } else {
      toast.error('Failed to mark as read');
    }

    // Clear bulk selection after action
    if (mail.bulkSelected.length) {
      setMail((prev) => ({ ...prev, bulkSelected: [] }));
    }
  };
  const [, setActiveReplyId] = useQueryState('activeReplyId');

  const handleThreadReply = () => {
    setMode('reply');
    setThreadId(threadId);
    if (threadData?.latest) setActiveReplyId(threadData?.latest?.id);
  };

  const handleThreadReplyAll = () => {
    setMode('replyAll');
    setThreadId(threadId);
    if (threadData?.latest) setActiveReplyId(threadData?.latest?.id);
  };

  const handleThreadForward = () => {
    setMode('forward');
    setThreadId(threadId);
    if (threadData?.latest) setActiveReplyId(threadData?.latest?.id);
  };

  const primaryActions: EmailAction[] = [
    {
      id: 'reply',
      label: t('common.mail.reply'),
      icon: <Reply className="mr-2.5 h-4 w-4" />,
      action: handleThreadReply,
      disabled: false,
    },
    {
      id: 'reply-all',
      label: t('common.mail.replyAll'),
      icon: <ReplyAll className="mr-2.5 h-4 w-4" />,
      action: handleThreadReplyAll,
      disabled: false,
    },
    {
      id: 'forward',
      label: t('common.mail.forward'),
      icon: <Forward className="mr-2.5 h-4 w-4" />,
      action: handleThreadForward,
      disabled: false,
    },
  ];
  const { optimisticDeleteThreads } = useOptimisticActions();

  const handleDelete = () => () => {
    const targets = mail.bulkSelected.length ? mail.bulkSelected : [threadId];

    // Use optimistic update with undo functionality
    optimisticDeleteThreads(targets, currentFolder);

    // Clear bulk selection after action
    if (mail.bulkSelected.length) {
      setMail((prev) => ({ ...prev, bulkSelected: [] }));
    }

    // Navigation removed to prevent route change on current thread action
    // if (!mail.bulkSelected.length && threadId) {
    //   navigate(`/mail/${currentFolder}`);
    // }
  };

  const getActions = () => {
    if (isSpam) {
      return [
        {
          id: 'move-to-inbox',
          label: t('common.mail.moveToInbox'),
          icon: <Inbox className="mr-2.5 h-4 w-4" />,
          action: handleMove(LABELS.SPAM, LABELS.INBOX),
          disabled: false,
        },
        {
          id: 'move-to-bin',
          label: t('common.mail.moveToBin'),
          icon: <Trash className="mr-2.5 h-4 w-4" />,
          action: handleMove(LABELS.SPAM, LABELS.TRASH),
          disabled: false,
        },
      ];
    }

    if (isBin) {
      return [
        {
          id: 'restore-from-bin',
          label: t('common.mail.restoreFromBin'),
          icon: <Inbox className="mr-2.5 h-4 w-4" />,
          action: handleMove(LABELS.TRASH, LABELS.INBOX),
          disabled: false,
        },
        {
          id: 'delete-from-bin',
          label: t('common.mail.deleteFromBin'),
          icon: <Trash className="mr-2.5 h-4 w-4" />,
          action: handleDelete(),
          disabled: true,
        },
      ];
    }

    if (isArchiveFolder || !isInbox) {
      return [
        {
          id: 'move-to-inbox',
          label: t('common.mail.unarchive'),
          icon: <Inbox className="mr-2.5 h-4 w-4" />,
          action: handleMove('', LABELS.INBOX),
          disabled: false,
        },
        {
          id: 'move-to-bin',
          label: t('common.mail.moveToBin'),
          icon: <Trash className="mr-2.5 h-4 w-4" />,
          action: handleMove('', LABELS.TRASH),
          disabled: false,
        },
      ];
    }

    if (isSent) {
      return [
        {
          id: 'archive',
          label: t('common.mail.archive'),
          icon: <Archive className="mr-2.5 h-4 w-4" />,
          action: handleMove(LABELS.SENT, ''),
          disabled: false,
        },
        {
          id: 'move-to-bin',
          label: t('common.mail.moveToBin'),
          icon: <Trash className="mr-2.5 h-4 w-4" />,
          action: handleMove(LABELS.SENT, LABELS.TRASH),
          disabled: false,
        },
      ];
    }

    return [
      {
        id: 'archive',
        label: t('common.mail.archive'),
        icon: <Archive className="mr-2.5 h-4 w-4" />,
        action: handleMove(LABELS.INBOX, ''),
        disabled: false,
      },
      {
        id: 'move-to-spam',
        label: t('common.mail.moveToSpam'),
        icon: <ArchiveX className="mr-2.5 h-4 w-4" />,
        action: handleMove(LABELS.INBOX, LABELS.SPAM),
        disabled: !isInbox,
      },
      {
        id: 'move-to-bin',
        label: t('common.mail.moveToBin'),
        icon: <Trash className="mr-2.5 h-4 w-4" />,
        action: handleMove(LABELS.INBOX, LABELS.TRASH),
        disabled: false,
      },
    ];
  };

  const otherActions: EmailAction[] = [
    {
      id: 'toggle-read',
      label: isUnread ? t('common.mail.markAsRead') : t('common.mail.markAsUnread'),
      icon: !isUnread ? (
        <Mail className="mr-2.5 h-4 w-4 fill-[#9D9D9D] dark:fill-[#9D9D9D]" />
      ) : (
        <MailOpen className="mr-2.5 h-4 w-4" />
      ),
      action: handleReadUnread,
      disabled: false,
    },
    {
      id: 'toggle-important',
      label: isImportant ? t('common.mail.removeFromImportant') : t('common.mail.markAsImportant'),
      icon: <ExclamationCircle className={'mr-2.5 h-4 w-4'} />,
      action: handleToggleImportant,
    },
    {
      id: 'favorite',
      label: isStarred ? t('common.mail.removeFavorite') : t('common.mail.addFavorite'),
      icon: isStarred ? (
        <StarOff className="mr-2.5 h-4 w-4" />
      ) : (
        <Star className="mr-2.5 h-4 w-4" />
      ),
      action: handleFavorites,
    },
  ];

  const renderAction = (action: EmailAction) => {
    return (
      <ContextMenuItem
        key={action.id}
        onClick={action.action}
        disabled={action.disabled}
        className="font-normal"
      >
        {action.icon}
        {action.label}
        {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
      </ContextMenuItem>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isLoading || isFetching} className="w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        className="dark:bg-panelDark w-56 overflow-y-auto bg-white"
        onContextMenu={(e) => e.preventDefault()}
      >
        {primaryActions.map(renderAction)}

        <ContextMenuSeparator className="bg-[#252525] dark:bg-[#252525]" />

        <ContextMenuSub>
          <ContextMenuSubTrigger className="font-normal">
            <Tag className="mr-2.5 h-4 w-4" />
            {t('common.mail.labels')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="dark:bg-panelDark max-h-[520px] w-48 overflow-y-auto bg-white">
            <LabelsList threadId={threadId} />
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="bg-[#252525] dark:bg-[#252525]" />

        {getActions().map(renderAction as any)}

        <ContextMenuSeparator className="bg-[#252525] dark:bg-[#252525]" />

        {otherActions.map(renderAction)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
