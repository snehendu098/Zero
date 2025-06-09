import {
  Bell,
  Calendar,
  Docx,
  Figma,
  Forward,
  ImageFile,
  Lightning,
  PDF,
  Reply,
  ReplyAll,
  ThreeDots,
  Tag,
  User,
  ChevronDown,
  Check,
  Printer,
} from '../icons/icons';
import {
  Briefcase,
  Star,
  StickyNote,
  Users,
  Lock,
  Download,
  MoreVertical,
  HardDriveDownload,
  Paperclip,
  Loader2,
  CopyIcon,
  SearchIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { memo, useEffect, useMemo, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { Sender, ParsedMessage, Attachment } from '@/types';
import { useActiveConnection } from '@/hooks/use-connections';
import { handleUnsubscribe } from '@/lib/email-utils.client';
import { getListUnsubscribeAction } from '@/lib/email-utils';
import AttachmentsAccordion from './attachments-accordion';
import { cn, getEmailLogo, formatDate } from '@/lib/utils';
import { useBrainState } from '../../hooks/use-summary';
import { useTRPC } from '@/providers/query-provider';
import { useThreadLabels } from '@/hooks/use-labels';
import { useMutation } from '@tanstack/react-query';
import { Markdown } from '@react-email/components';
import AttachmentDialog from './attachment-dialog';
import { useSummary } from '@/hooks/use-summary';
import { TextShimmer } from '../ui/text-shimmer';
import { useSession } from '@/lib/auth-client';
import { RenderLabels } from './render-labels';
import ReplyCompose from './reply-composer';
import { Separator } from '../ui/separator';
import { MailIframe } from './mail-iframe';
import { useTranslations } from 'use-intl';
import { useParams } from 'react-router';
import { MailLabels } from './mail-list';
import { FileText } from 'lucide-react';
import { format, set } from 'date-fns';
import { Button } from '../ui/button';
import { useQueryState } from 'nuqs';
import { Badge } from '../ui/badge';

function TextSelectionPopover({
  children,
  onSearch,
}: {
  children: React.ReactNode;
  onSearch: (query: string) => void;
}) {
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const popoverTriggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionCoords(null);
      setSelectedText('');
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 + window.scrollX - window.innerWidth / 2;
      const y = rect.top + window.scrollY;

      setSelectionCoords({ x: centerX, y });
      setSelectedText(selection.toString().trim());
    } catch (error) {
      console.error('Error handling text selection:', error);
      setSelectionCoords(null);
      setSelectedText('');
    }
  }, []);

  //   const handleClickOutside = useCallback((event: MouseEvent) => {
  //     if (
  //       popoverRef.current &&
  //       !popoverRef.current.contains(event.target as Node) &&
  //       !popoverTriggerRef.current?.contains(event.target as Node)
  //     ) {
  //       setSelectionCoords(null);
  //       setSelectedText('');
  //     }
  //   }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange);
    // document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setSelectionCoords(null);
        setSelectedText('');
      }
    });

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      //   document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleSelectionChange]);

  return (
    <div className="relative" ref={popoverTriggerRef}>
      {children}
      {selectionCoords && (
        <div
          ref={popoverRef}
          className="absolute z-50"
          style={{
            top: selectionCoords.y,
            left: selectionCoords.x,
          }}
          role="dialog"
          aria-label="Text selection options"
        >
          <Popover
            open={!!selectedText.trim().length}
            onOpenChange={(open) => (open ? undefined : setSelectedText(''))}
          >
            <PopoverTrigger asChild>
              <button className="invisible h-0 w-0" aria-label="Text selection options" />
            </PopoverTrigger>
            <PopoverContent
              side="top"
              className="break-words rounded-lg p-0"
              onInteractOutside={() => {
                setSelectionCoords(null);
                setSelectedText('');
              }}
            >
              <div className="flex items-center justify-between gap-2 px-2">
                <p className="text-muted-foreground max-w-[200px] truncate text-sm">
                  {selectedText}
                </p>
                <div className="flex">
                  <Button
                    size="icon"
                    className="scale-75 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onSearch(selectedText);
                    }}
                  >
                    <SearchIcon />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="scale-75 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigator.clipboard.writeText(selectedText);
                    }}
                  >
                    <CopyIcon />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

// Add formatFileSize utility function
const formatFileSize = (size: number) => {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  return sizeInMB === '0.00' ? '' : `${sizeInMB} MB`;
};

// Add getFileIcon utility function
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return <PDF className="fill-[#F43F5E]" />;
    case 'jpg':
      return <ImageFile />;
    case 'jpeg':
      return <ImageFile />;
    case 'png':
      return <ImageFile />;
    case 'gif':
      return <ImageFile />;
    case 'docx':
      return <Docx />;
    case 'fig':
      return <Figma />;
    case 'webp':
      return <ImageFile />;
    default:
      return <FileText className="h-4 w-4 text-[#8B5CF6]" />;
  }
};

const StreamingText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    setIsComplete(false);
    setIsThinking(true);

    const thinkingTimeout = setTimeout(() => {
      setIsThinking(false);
      setDisplayText('');

      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          const nextChar = text[currentIndex];
          setDisplayText((prev) => prev + nextChar);
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }, 1000);

    return () => {
      clearTimeout(thinkingTimeout);
    };
  }, [text]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'bg-gradient-to-r from-neutral-500 via-neutral-300 to-neutral-500 bg-[length:200%_100%] bg-clip-text text-sm leading-relaxed text-transparent',
          isComplete ? 'animate-shine-slow' : '',
        )}
      >
        {isThinking ? (
          <TextShimmer duration={1}>Thinking...</TextShimmer>
        ) : (
          <span>{displayText}</span>
        )}
        {!isComplete && !isThinking && (
          <span className="animate-blink bg-primary ml-0.5 inline-block h-4 w-0.5"></span>
        )}
      </div>
    </div>
  );
};

type Props = {
  emailData: ParsedMessage;
  isFullscreen: boolean;
  isMuted: boolean;
  isLoading: boolean;
  index: number;
  totalEmails?: number;
  demo?: boolean;
  subject?: string;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  threadAttachments?: Attachment[];
};

const MailDisplayLabels = ({ labels }: { labels: string[] }) => {
  const visibleLabels = labels.filter(
    (label) => !['unread', 'inbox'].includes(label.toLowerCase()),
  );

  if (!visibleLabels.length) return null;

  return (
    <div className="flex">
      {visibleLabels.map((label, index) => {
        const normalizedLabel = label.toLowerCase().replace(/^category_/i, '');

        let icon = null;
        let bgColor = '';

        switch (normalizedLabel) {
          case 'important':
            icon = <Lightning className="h-3.5 w-3.5 fill-primary-foreground" />;
            bgColor = 'bg-primary';
            break;
          case 'promotions':
            icon = <Tag className="h-3.5 w-3.5 fill-white" />;
            bgColor = 'bg-[#F43F5E]';
            break;
          case 'personal':
            icon = <User className="h-3.5 w-3.5 fill-white" />;
            bgColor = 'bg-[#39AE4A]';
            break;
          case 'updates':
            icon = <Bell className="h-3.5 w-3.5 fill-white" />;
            bgColor = 'bg-[#8B5CF6]';
            break;
          case 'work':
            icon = <Briefcase className="h-3.5 w-3.5 text-white" />;
            bgColor = '';
            break;
          case 'forums':
            icon = <Users className="h-3.5 w-3.5 text-white" />;
            bgColor = 'bg-blue-600';
            break;
          case 'notes':
            icon = <StickyNote className="h-3.5 w-3.5 text-white" />;
            bgColor = 'bg-amber-500';
            break;
          case 'starred':
            icon = <Star className="h-3.5 w-3.5 fill-white text-white" />;
            bgColor = 'bg-yellow-500';
            break;
          default:
            return null;
        }

        return (
          <Tooltip key={`${label}-${index}`}>
            <TooltipTrigger>
              <Badge
                key={`${label}-${index}`}
                className={`rounded-md p-1 ${bgColor} dark:border-panelDark -ml-1.5 border-2 border-white transition-transform first:ml-0`}
              >
                {icon}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs text-white">{label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

// Helper function to get first letter character
const getFirstLetterCharacter = (name?: string) => {
  if (!name) return '';
  const match = name.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : '';
};

// Helper function to clean email display
const cleanEmailDisplay = (email?: string) => {
  if (!email) return '';
  const match = email.match(/^[^a-zA-Z]*(.*?)[^a-zA-Z]*$/);
  return match ? match[1] : email;
};

// Helper function to clean name display
const cleanNameDisplay = (name?: string) => {
  if (!name) return '';
  return name.trim();
};

const ThreadAttachments = ({ attachments }: { attachments: Attachment[] }) => {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(attachment.body);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Thread Attachments <span className="text-[#8D8D8D]">[{attachments.length}]</span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <button
            key={attachment.attachmentId}
            onClick={() => handleDownload(attachment)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
          >
            <span className="text-muted-foreground">{getFileIcon(attachment.filename)}</span>
            <span className="max-w-[200px] truncate" title={attachment.filename}>
              {attachment.filename}
            </span>
            <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const AiSummary = () => {
  const [threadId] = useQueryState('threadId');
  const { data: summary, isLoading } = useSummary(threadId ?? null);
  const [showSummary, setShowSummary] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSummary(!showSummary);
  };

  if (isLoading) return null;
  if (!summary?.data.short?.length) return null;

  return (
    <div
      className="mt-2 max-w-3xl rounded-xl border border-[#8B5CF6] bg-white px-4 py-2 dark:bg-[#252525]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex cursor-pointer items-center" onClick={handleToggle}>
        <TextShimmer className="text-xs font-medium text-[#929292]">Summary</TextShimmer>

        {!isLoading && (
          <ChevronDown
            className={`ml-1 h-2.5 w-2.5 fill-[#929292] transition-transform ${showSummary ? 'rotate-180' : ''}`}
          />
        )}
      </div>
      {showSummary && (
        <Markdown markdownContainerStyles={{ fontSize: 15 }}>{summary?.data.short || ''}</Markdown>
      )}
    </div>
  );
};

type ActionButtonProps = {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  text: string;
  shortcut?: string;
};

const ActionButton = ({ onClick, icon, text, shortcut }: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-7 items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 dark:border-none dark:bg-[#313131]"
    >
      {icon}
      <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
        <div className="justify-start text-sm leading-none text-black dark:text-white">{text}</div>
      </div>
      {shortcut && (
        <kbd
          className={cn(
            'border-muted-foreground/10 bg-accent h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
            '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
          )}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

const downloadAttachment = (attachment: { body: string; mimeType: string; filename: string }) => {
  try {
    const byteCharacters = atob(attachment.body);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.mimeType });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading attachment:', error);
  }
};

const handleDownloadAllAttachments =
  (subject: string, attachments: { body: string; mimeType: string; filename: string }[]) =>
  async () => {
    if (!attachments.length) return;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    console.log('attachments', attachments);
    attachments.forEach((attachment) => {
      try {
        const byteCharacters = atob(attachment.body);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        zip.file(attachment.filename, byteArray, {
          binary: true,
          date: new Date(),
          unixPermissions: 0o644,
        });
      } catch (error) {
        console.error(`Error adding ${attachment.filename} to zip:`, error);
      }
    });

    // Generate and download the zip file
    zip
      .generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      })
      .then((content) => {
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attachments-${subject || 'email'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error generating zip file:', error);
      });

    console.log('downloaded', subject, attachments);
  };

const openAttachment = (attachment: { body: string; mimeType: string; filename: string }) => {
  try {
    const byteCharacters = atob(attachment.body);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.mimeType });
    const url = window.URL.createObjectURL(blob);

    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      url,
      'attachment-viewer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no,menubar=no`,
    );

    if (popup) {
      popup.focus();
      // Clean up the URL after a short delay to ensure the browser has time to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('Error opening attachment:', error);
  }
};

const MoreAboutPerson = ({
  person,
  extra,
  open,
  onOpenChange,
}: {
  person: Sender;
  extra?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const trpc = useTRPC();
  const {
    mutate: doSearch,
    isPending,
    data,
    error,
  } = useMutation(trpc.ai.webSearch.mutationOptions());
  const handleSearch = useCallback(() => {
    doSearch({
      query: `In 50 words or less: What is the background of ${person.name} & ${person.email}, of ${person.email.split('@')[1]}. 
      This could be a phishing email address, indicate if the domain is suspicious, example: x.io is not a valid domain for x.com | example: x.com is a valid domain for x.com | example: paypalcom.com is not a valid domain for paypal.com`,
    });
  }, [person.name]);

  useEffect(() => {
    if (open) {
      handleSearch();
    }
  }, [open]);

  const findSource = useCallback(
    (id: string) => {
      const sources = data?.sources;
      if (!sources) return;
      return sources.find((source) => source.id === id);
    },
    [data],
  );

  const replaceSourcesInText = useCallback(
    (text: string) => {
      const sources = data?.sources;
      if (!sources) return text;
      const sourcesRegex = /\[(\d+)\]/g;
      return text.replaceAll(sourcesRegex, (match, p1) => {
        console.log('p1', p1);
        const source = findSource(p1);
        return source ? `SOURCE HERE` : match;
      });
    },
    [data],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showOverlay>
        <DialogHeader>
          <DialogTitle>More about {cleanNameDisplay(person.name)}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : data ? (
            <StreamingText text={replaceSourcesInText(data.text)} />
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MoreAboutQuery = ({
  query,
  open,
  onOpenChange,
}: {
  query: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const trpc = useTRPC();
  const {
    mutate: doSearch,
    isPending,
    data,
    error,
  } = useMutation(trpc.ai.webSearch.mutationOptions());

  const handleSearch = useCallback(() => {
    doSearch({
      query: query,
    });
  }, [query, doSearch]);

  useEffect(() => {
    if (open && query) {
      handleSearch();
    }
  }, [open, query, handleSearch]);

  const findSource = useCallback(
    (id: string) => {
      const sources = data?.sources;
      if (!sources) return;
      return sources.find((source) => source.id === id);
    },
    [data],
  );

  const replaceSourcesInText = useCallback(
    (text: string) => {
      const sources = data?.sources;
      if (!sources) return text;
      const sourcesRegex = /\[(\d+)\]/g;
      return text.replaceAll(sourcesRegex, (match, p1) => {
        const source = findSource(p1);
        return source ? `SOURCE HERE` : match;
      });
    },
    [data, findSource],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showOverlay>
        <DialogHeader>
          <DialogTitle>Search Results</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : data ? (
            <StreamingText text={replaceSourcesInText(data.text)} />
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : (
            <Loader2 className="animate-spin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MailDisplay = ({ emailData, index, totalEmails, demo, threadAttachments }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  //   const [unsubscribed, setUnsubscribed] = useState(false);
  //   const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [preventCollapse, setPreventCollapse] = useState(false);
  const { folder } = useParams<{ folder: string }>();
  //   const [selectedAttachment, setSelectedAttachment] = useState<null | {
  //     id: string;
  //     name: string;
  //     type: string;
  //     url: string;
  //   }>(null);
  const [openDetailsPopover, setOpenDetailsPopover] = useState<boolean>(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations();
  const [activeReplyId, setActiveReplyId] = useQueryState('activeReplyId');
  const { labels: threadLabels } = useThreadLabels(
    emailData.tags ? emailData.tags.map((l) => l.id) : [],
  );
  const { data: brainState } = useBrainState();
  const { data: activeConnection } = useActiveConnection();
  const [researchSender, setResearchSender] = useState<Sender | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const isLastEmail = totalEmails && index === totalEmails - 1;

  useEffect(() => {
    if (!demo) {
      if (activeReplyId === emailData.id) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(activeReplyId ? true : isLastEmail ? false : true);
      }
      // Set all emails to collapsed by default except the last one
      if (totalEmails && index === totalEmails - 1) {
        if (totalEmails > 5) {
          setTimeout(() => {
            const element = document.getElementById(`mail-${emailData.id}`);
            element?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [demo, emailData.id, isLastEmail]);

  //   const listUnsubscribeAction = useMemo(
  //     () =>
  //       emailData.listUnsubscribe
  //         ? getListUnsubscribeAction({
  //             listUnsubscribe: emailData.listUnsubscribe,
  //             listUnsubscribePost: emailData.listUnsubscribePost,
  //           })
  //         : undefined,
  //     [emailData.listUnsubscribe, emailData.listUnsubscribePost],
  //   );

  //   const _handleUnsubscribe = async () => {
  //     setIsUnsubscribing(true);
  //     try {
  //       await handleUnsubscribe({
  //         emailData,
  //       });
  //       setIsUnsubscribing(false);
  //       setUnsubscribed(true);
  //     } catch (e) {
  //       setIsUnsubscribing(false);
  //       setUnsubscribed(false);
  //     }
  //   };

  const [, setMode] = useQueryState('mode');

  // Clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Function to handle popover state changes
  const handlePopoverChange = useCallback((open: boolean) => {
    setOpenDetailsPopover(open);

    if (!open) {
      // When closing the popover, prevent collapse for a short time
      setPreventCollapse(true);

      // Clear any existing timeout
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }

      // Set a timeout to allow collapse again after a delay
      collapseTimeoutRef.current = setTimeout(() => {
        setPreventCollapse(false);
      }, 300);
    }
  }, []);

  // Handle email collapse toggle
  const toggleCollapse = useCallback(() => {
    // Only toggle if we're not in prevention mode
    if (!preventCollapse && !openDetailsPopover) {
      setIsCollapsed(!isCollapsed);
    }
  }, [isCollapsed, preventCollapse, openDetailsPopover]);

  // email printing
  const printMail = () => {
    try {
      // Create a hidden iframe for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';

      document.body.appendChild(printFrame);

      // Generate clean, simple HTML content for printing
      const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Print Email - ${emailData.subject || 'No Subject'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              background: white;
              padding: 20px;
              font-size: 12px;
            }
            
            .email-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
            }
            
            .email-header {
              margin-bottom: 25px;
            }
            
            .email-title {
              font-size: 18px;
              font-weight: bold;
              color: #000;
              margin-bottom: 15px;
              word-wrap: break-word;
            }
            
            .email-meta {
              margin-bottom: 20px;
            }
            
            .meta-row {
              margin-bottom: 5px;
              display: flex;
              align-items: flex-start;
            }
            
            .meta-label {
              font-weight: bold;
              min-width: 60px;
              color: #333;
              margin-right: 10px;
            }
            
            .meta-value {
              flex: 1;
              word-wrap: break-word;
              color: #333;
            }
            
            .separator {
              width: 100%;
              height: 1px;
              background: #ddd;
              margin: 20px 0;
            }
            
            .email-body {
              margin: 20px 0;
              background: white;
            }
            
            .email-content {
              word-wrap: break-word;
              overflow-wrap: break-word;
              font-size: 12px;
              line-height: 1.6;
            }
            
            .email-content img {
              max-width: 100% !important;
              height: auto !important;
              display: block;
              margin: 10px 0;
            }
            
            .email-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            .email-content td, .email-content th {
              padding: 6px;
              text-align: left;
              font-size: 11px;
            }
            
            .email-content a {
              color: #0066cc;
              text-decoration: underline;
            }
            
            .attachments-section {
              margin-top: 25px;
              background: white;
            }
            
            .attachments-title {
              font-size: 14px;
              font-weight: bold;
              color: #000;
              margin-bottom: 10px;
            }
            
            .attachment-item {
              margin-bottom: 5px;
              font-size: 11px;
              padding: 3px 0;
            }
            
            .attachment-name {
              font-weight: 500;
              color: #333;
            }
            
            .attachment-size {
              color: #666;
              font-size: 10px;
            }
            
            .labels-section {
              margin: 10px 0;
            }
            
            .label-badge {
              display: inline-block;
              padding: 2px 6px;
              background: #f5f5f5;
              color: #333;
              font-size: 10px;
              margin-right: 5px;
              margin-bottom: 3px;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 15px;
                font-size: 11px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .email-container {
                max-width: none;
                width: 100%;
              }
              
              
              .separator {
                background: #000 !important;
              }
              
              .email-content a {
                color: #000 !important;
              }
              
              .label-badge {
                background: #f0f0f0 !important;
                border: 1px solid #ccc;
              }
              
              .no-print {
                display: none !important;
              }
              
              /* Remove any default borders */
              * {
                border: none !important;
                box-shadow: none !important;
              }
              
              /* Ensure clean page breaks */
              .email-header {
                page-break-after: avoid;
              }
              
              .attachments-section {
                page-break-inside: avoid;
              }
            }
            
            @page {
              margin: 0.5in;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Email Header -->
            <div class="email-header">
              <h1 class="email-title">${emailData.subject || 'No Subject'}</h1>
              
              ${emailData?.tags && emailData.tags.length > 0
          ? `
                <div class="labels-section">
                  ${emailData.tags
            .map((tag) => `<span class="label-badge">${tag.name}</span>`)
            .join('')}
                </div>
              `
          : ''
        }
              
              <div class="email-meta">
                <div class="meta-row">
                  <span class="meta-label">From:</span>
                  <span class="meta-value">
                    ${cleanNameDisplay(emailData.sender?.name)} 
                    ${emailData.sender?.email ? `&lt;${emailData.sender.email}&gt;` : ''}
                  </span>
                </div>
                
                ${emailData.to && emailData.to.length > 0
          ? `
                  <div class="meta-row">
                    <span class="meta-label">To:</span>
                    <span class="meta-value">
                      ${emailData.to
            .map(
              (recipient) =>
                `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`,
            )
            .join(', ')}
                    </span>
                  </div>
                `
          : ''
        }
                
                ${emailData.cc && emailData.cc.length > 0
          ? `
                  <div class="meta-row">
                    <span class="meta-label">CC:</span>
                    <span class="meta-value">
                      ${emailData.cc
            .map(
              (recipient) =>
                `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`,
            )
            .join(', ')}
                    </span>
                  </div>
                `
          : ''
        }
                
                ${emailData.bcc && emailData.bcc.length > 0
          ? `
                  <div class="meta-row">
                    <span class="meta-label">BCC:</span>
                    <span class="meta-value">
                      ${emailData.bcc
            .map(
              (recipient) =>
                `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`,
            )
            .join(', ')}
                    </span>
                  </div>
                `
          : ''
        }
                
                <div class="meta-row">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${formatDate(emailData.receivedOn)}</span>
                </div>
              </div>
            </div>
            
            <div class="separator"></div>
            
            <!-- Email Body -->
            <div class="email-body">
              <div class="email-content">
                ${emailData.decodedBody || '<p><em>No email content available</em></p>'}
              </div>
            </div>
            
            <!-- Attachments -->
            ${emailData.attachments && emailData.attachments.length > 0
          ? `
              <div class="attachments-section">
                <h2 class="attachments-title">Attachments (${emailData.attachments.length})</h2>
                ${emailData.attachments
            .map(
              (attachment, index) => `
                  <div class="attachment-item">
                    <span class="attachment-name">${attachment.filename}</span>
                    ${formatFileSize(attachment.size) ? ` - <span class="attachment-size">${formatFileSize(attachment.size)}</span>` : ''}
                  </div>
                `,
            )
            .join('')}
              </div>
            `
          : ''
        }
          </div>
        </body>
      </html>
    `;

      if (printFrame.contentWindow) {
        // Write content to the iframe
        const iframeDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();

        // Wait for content to load, then print
        printFrame.onload = function () {
          setTimeout(() => {
            try {
              if (!printFrame.contentWindow) {
                console.error('Failed to get iframe window');
                return;
              }
              // Focus the iframe and print
              printFrame.contentWindow.focus();
              printFrame.contentWindow.print();

              // Clean up - remove the iframe after a delay
              setTimeout(() => {
                if (printFrame && printFrame.parentNode) {
                  document.body.removeChild(printFrame);
                }
              }, 1000);
            } catch (error) {
              console.error('Error during print:', error);
              // Clean up on error
              if (printFrame && printFrame.parentNode) {
                document.body.removeChild(printFrame);
              }
            }
          }, 500);
        };
      }
    } catch (error) {
      console.error('Error printing email:', error);
      alert('Failed to print email. Please try again.');
    }
  };

  const renderPerson = useCallback(
    (person: Sender) => (
      <Popover key={person.email}>
        <PopoverTrigger asChild>
          <div
            key={person.email}
            className="dark:bg-panelDark inline-flex items-center justify-start gap-1.5 overflow-hidden rounded-full border bg-white p-1 pr-2"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={getEmailLogo(person.email)} className="rounded-full" />
              <AvatarFallback className="bg-offsetLight rounded-full text-xs font-bold dark:bg-[#373737]">
                {getFirstLetterCharacter(person.name || person.email)}
              </AvatarFallback>
            </Avatar>
            <div className="text-panelDark justify-start text-sm font-medium leading-none dark:text-white">
              {person.name || person.email}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-sm">
          <p>Email: {person.email}</p>
          <p>Name: {person.name || 'Unknown'}</p>
        </PopoverContent>
      </Popover>
    ),
    [],
  );

  const people = useMemo(() => {
    if (!activeConnection) return [];
    const allPeople = [
      ...(folder === 'sent' ? [] : [emailData.sender]),
      ...(emailData.to || []),
      ...(emailData.cc || []),
      ...(emailData.bcc || []),
    ];
    return allPeople.filter(
      (p): p is Sender =>
        Boolean(p?.email) &&
        p.email !== activeConnection!.email &&
        p.name !== 'No Sender Name' &&
        p === allPeople.find((other) => other?.email === p?.email),
    );
  }, [emailData, activeConnection]);

  return (
    <div
      className={cn('relative flex-1 overflow-hidden')}
      id={`mail-${emailData.id}`}
      onClick={(e) => {
        if (openDetailsPopover) {
          e.stopPropagation();
        }
      }}
    >
      <TextSelectionPopover onSearch={setSearchQuery}>
        {searchQuery && (
          <MoreAboutQuery
            query={searchQuery}
            open={!!searchQuery}
            onOpenChange={(open) => (open ? void 0 : setSearchQuery(null))}
          />
        )}
        {researchSender && (
          <MoreAboutPerson
            open={!!researchSender}
            onOpenChange={(open) => (open ? void 0 : setResearchSender(null))}
            person={researchSender}
          />
        )}
        <div className="relative h-full overflow-y-auto">
          <div className={cn('px-4', index === 0 && 'border-b py-4')}>
            {index === 0 && (
              <>
                <span className="inline-flex items-center gap-2 font-medium text-black dark:text-white">
                  <span>
                    {emailData.subject}{' '}
                    <span className="text-muted-foreground dark:text-[#8C8C8C]">
                      {totalEmails && totalEmails > 1 && `[${totalEmails}]`}
                    </span>
                  </span>
                </span>

                <div className="mt-2 flex items-center gap-2">
                  {emailData?.tags?.length ? (
                    <MailDisplayLabels labels={emailData?.tags.map((t) => t.name) || []} />
                  ) : null}
                  {emailData?.tags?.length ? (
                    <div className="bg-iconLight dark:bg-iconDark/20 relative h-3 w-0.5 rounded-full" />
                  ) : null}
                  <RenderLabels labels={threadLabels} />
                  {threadLabels.length ? (
                    <div className="bg-iconLight dark:bg-iconDark/20 relative h-3 w-0.5 rounded-full" />
                  ) : null}
                  <div className="text-muted-foreground flex items-center gap-2 text-sm dark:text-[#8C8C8C]">
                    {(() => {
                      if (people.length <= 2) {
                        return people.map(renderPerson);
                      }

                      // Only show first two people plus count if we have at least two people
                      const firstPerson = people[0];
                      const secondPerson = people[1];

                      if (firstPerson && secondPerson) {
                        return (
                          <>
                            {renderPerson(firstPerson)}
                            {renderPerson(secondPerson)}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm">
                                  +{people.length - 2}{' '}
                                  {people.length - 2 === 1 ? 'other' : 'others'}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col gap-1">
                                {people.slice(2).map((person, index) => (
                                  <div key={index}>{renderPerson(person)}</div>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          </>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
                {brainState?.enabled && <AiSummary />}
                {threadAttachments && threadAttachments.length > 0 && (
                  <ThreadAttachments attachments={threadAttachments} />
                )}
              </>
            )}
          </div>
          <div
            className="flex cursor-pointer flex-col pb-2 transition-all duration-200"
            onClick={toggleCollapse}
          >
            <div className="mt-3 flex w-full items-start justify-between gap-4 px-4">
              <div className="flex w-full justify-center gap-4">
                <Avatar className="mt-3 h-8 w-8 rounded-full border dark:border-none">
                  <AvatarImage
                    className="rounded-full"
                    src={getEmailLogo(emailData?.sender?.email)}
                  />
                  <AvatarFallback className="rounded-full bg-[#FFFFFF] font-bold text-[#9F9F9F] dark:bg-[#373737]">
                    {getFirstLetterCharacter(emailData?.sender?.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex w-full items-center justify-between">
                  <div className="flex w-full items-center justify-start">
                    <div className="flex w-full flex-col">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setResearchSender({
                                name: emailData?.sender?.name || '',
                                email: emailData?.sender?.email || '',
                                //   extra: emailData?.sender?.extra || '',
                              });
                            }}
                            className="hover:bg-muted font-semibold"
                          >
                            {cleanNameDisplay(emailData?.sender?.name)}
                          </span>

                          <Popover open={openDetailsPopover} onOpenChange={handlePopoverChange}>
                            <PopoverTrigger asChild>
                              <button
                                className="hover:bg-iconLight/10 dark:hover:bg-iconDark/20 flex items-center gap-2 rounded-md p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setOpenDetailsPopover(!openDetailsPopover);
                                }}
                                ref={triggerRef}
                              >
                                <p className="text-muted-foreground text-xs underline dark:text-[#8C8C8C]">
                                  Details
                                </p>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="align-items-start dark:bg-panelDark w-[420px] rounded-lg border p-3 text-left shadow-lg"
                              onBlur={(e) => {
                                if (!triggerRef.current?.contains(e.relatedTarget)) {
                                  setOpenDetailsPopover(false);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-1 text-sm">
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">
                                    {t('common.mailDisplay.from')}:
                                  </span>
                                  <div className="ml-3">
                                    <span className="text-muted-foreground pr-1 font-bold">
                                      {cleanNameDisplay(emailData?.sender?.name)}
                                    </span>
                                    {emailData?.sender?.name !== emailData?.sender?.email && (
                                      <span className="text-muted-foreground">
                                        {cleanEmailDisplay(emailData?.sender?.email)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">
                                    {t('common.mailDisplay.to')}:
                                  </span>
                                  <span className="text-muted-foreground ml-3">
                                    {emailData?.to
                                      ?.map((t) => cleanEmailDisplay(t.email))
                                      .join(', ')}
                                  </span>
                                </div>
                                {emailData?.cc && emailData.cc.length > 0 && (
                                  <div className="flex">
                                    <span className="w-24 text-end text-gray-500">
                                      {t('common.mailDisplay.cc')}:
                                    </span>
                                    <span className="text-muted-foreground ml-3">
                                      {emailData?.cc
                                        ?.map((t) => cleanEmailDisplay(t.email))
                                        .join(', ')}
                                    </span>
                                  </div>
                                )}
                                {emailData?.bcc && emailData.bcc.length > 0 && (
                                  <div className="flex">
                                    <span className="w-24 text-end text-gray-500">
                                      {t('common.mailDisplay.bcc')}:
                                    </span>
                                    <span className="text-muted-foreground ml-3">
                                      {emailData?.bcc
                                        ?.map((t) => cleanEmailDisplay(t.email))
                                        .join(', ')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">
                                    {t('common.mailDisplay.date')}:
                                  </span>
                                  <span className="text-muted-foreground ml-3">
                                    {emailData?.receivedOn &&
                                    !isNaN(new Date(emailData.receivedOn).getTime())
                                      ? format(new Date(emailData.receivedOn), 'PPpp')
                                      : ''}
                                  </span>
                                </div>
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">
                                    {t('common.mailDisplay.mailedBy')}:
                                  </span>
                                  <span className="text-muted-foreground ml-3">
                                    {cleanEmailDisplay(emailData?.sender?.email)}
                                  </span>
                                </div>
                                <div className="flex">
                                  <span className="w-24 text-end text-gray-500">
                                    {t('common.mailDisplay.signedBy')}:
                                  </span>
                                  <span className="text-muted-foreground ml-3">
                                    {cleanEmailDisplay(emailData?.sender?.email)}
                                  </span>
                                </div>
                                {emailData.tls && (
                                  <div className="flex items-center">
                                    <span className="w-24 text-end text-gray-500">
                                      {t('common.mailDisplay.security')}:
                                    </span>
                                    <div className="text-muted-foreground ml-3 flex items-center gap-1">
                                      <Lock className="h-4 w-4 text-green-600" />{' '}
                                      {t('common.mailDisplay.standardEncryption')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="flex items-center justify-center">
                          <time className="text-muted-foreground mr-2 text-sm font-medium dark:text-[#8C8C8C]">
                            {formatDate(emailData?.receivedOn)}
                          </time>

                          {/* options menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center gap-1 overflow-hidden rounded-md bg-white focus:outline-none focus:ring-0 dark:bg-[#313131]"
                              >
                                <ThreeDots className="fill-iconLight dark:fill-iconDark" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-[#313131]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  printMail();
                                }}
                              >
                                <Printer className="fill-iconLight dark:fill-iconDark mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!emailData.attachments?.length}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDownloadAllAttachments(
                                    emailData.subject || 'email',
                                    emailData.attachments || [],
                                  )();
                                }}
                              >
                                <HardDriveDownload className="fill-iconLight dark:text-iconDark dark:fill-iconLight mr-2 h-4 w-4" />
                                Download All Attachments
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
                            To:{' '}
                            {(() => {
                              // Combine to and cc recipients
                              const allRecipients = [
                                ...(emailData?.to || []),
                                ...(emailData?.cc || []),
                              ];

                              // If you're the only recipient
                              if (allRecipients.length === 1 && folder !== 'sent') {
                                return <span key="you">You</span>;
                              }

                              // Show first 3 recipients + count of others
                              const visibleRecipients = allRecipients.slice(0, 3);
                              const remainingCount = allRecipients.length - 3;

                              return (
                                <>
                                  {visibleRecipients.map((recipient, index) => (
                                    <span key={recipient.email}>
                                      {cleanNameDisplay(recipient.name) ||
                                        cleanEmailDisplay(recipient.email)}
                                      {index < visibleRecipients.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                  {remainingCount > 0 && (
                                    <span key="others">{`, +${remainingCount} others`}</span>
                                  )}
                                </>
                              );
                            })()}
                          </p>
                          {(emailData?.bcc?.length || 0) > 0 && (
                            <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
                              Bcc:{' '}
                              {emailData?.bcc?.map((recipient, index) => (
                                <span key={recipient.email}>
                                  {cleanNameDisplay(recipient.name) ||
                                    cleanEmailDisplay(recipient.email)}
                                  {index < (emailData?.bcc?.length || 0) - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pending, needs a storage to make the unsubscribe status consitent */}
                    {/* <span className="text-muted-foreground flex grow-0 items-center gap-2 text-sm">
                    {listUnsubscribeAction && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="xs"
                            variant="secondary"
                            disabled={unsubscribed || isUnsubscribing}
                          >
                            {unsubscribed && <Check className="h-4 w-4" />}
                            {isUnsubscribing && (
                              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                            )}
                            {unsubscribed
                              ? t('common.mailDisplay.unsubscribed')
                              : t('common.mailDisplay.unsubscribe')}
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('common.mailDisplay.unsubscribe')}</DialogTitle>
                            <DialogDescription className="break-words">
                              {t('common.mailDisplay.unsubscribeDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2">
                            <DialogClose asChild>
                              <Button disabled={isUnsubscribing} variant="outline">
                                {t('common.mailDisplay.cancel')}
                              </Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button disabled={isUnsubscribing} onClick={_handleUnsubscribe}>
                                {t('common.mailDisplay.unsubscribe')}
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </span> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'h-0 overflow-hidden transition-all duration-200',
              !isCollapsed && 'h-[1px]',
            )}
          ></div>

          <div
            className={cn(
              'grid overflow-hidden transition-all duration-200',
              isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="h-fit w-full p-0">
                {/* mail main body */}
                {emailData?.decodedBody ? (
                  <MailIframe html={emailData?.decodedBody} senderEmail={emailData.sender.email} />
                ) : null}
                {/* mail attachments */}
                {emailData?.attachments && emailData?.attachments.length > 0 ? (
                  <div className="mb-4 flex flex-wrap items-center gap-2 px-4 pt-4">
                    {emailData?.attachments.map((attachment, index) => (
                      <div key={index} className="flex">
                        <button
                          className="flex cursor-pointer items-center gap-1 rounded-[5px] bg-[#FAFAFA] px-1.5 py-1 text-sm font-medium hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
                          onClick={() => openAttachment(attachment)}
                        >
                          {getFileIcon(attachment.filename)}
                          <span className="max-w-[15ch] truncate text-sm text-black dark:text-white">
                            {attachment.filename}
                          </span>{' '}
                          <span className="text-muted-foreground whitespace-nowrap text-sm dark:text-[#929292]">
                            {formatFileSize(attachment.size)}
                          </span>
                        </button>
                        <button
                          onClick={() => downloadAttachment(attachment)}
                          className="flex cursor-pointer items-center gap-1 rounded-[5px] px-1.5 py-1 text-sm"
                        >
                          <HardDriveDownload className="text-muted-foreground dark:text-muted-foreground h-4 w-4 fill-[#FAFAFA] dark:fill-[#262626]" />
                        </button>
                        {index < (emailData?.attachments?.length || 0) - 1 && (
                          <div className="m-auto h-2 w-[1px] bg-[#E0E0E0] dark:bg-[#424242]" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mb-2 mt-2 flex gap-2 px-4">
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollapsed(false);
                      setMode('reply');
                      setActiveReplyId(emailData.id);
                    }}
                    icon={<Reply className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                    text={t('common.mail.reply')}
                    shortcut={isLastEmail ? 'r' : undefined}
                  />
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollapsed(false);
                      setMode('replyAll');
                      setActiveReplyId(emailData.id);
                    }}
                    icon={<ReplyAll className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                    text={t('common.mail.replyAll')}
                    shortcut={isLastEmail ? 'a' : undefined}
                  />
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollapsed(false);
                      setMode('forward');
                      setActiveReplyId(emailData.id);
                    }}
                    icon={<Forward className="fill-muted-foreground dark:fill-[#9B9B9B]" />}
                    text={t('common.mail.forward')}
                    shortcut={isLastEmail ? 'f' : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TextSelectionPopover>
    </div>
  );
};

export default memo(MailDisplay);
