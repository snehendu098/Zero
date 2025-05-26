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
  Tag,
  User,
  ChevronDown,
} from '../icons/icons';
import { memo, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Briefcase, Star, StickyNote, Users, Lock, Download, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useActiveConnection } from '@/hooks/use-connections';
import { handleUnsubscribe } from '@/lib/email-utils.client';
import { getListUnsubscribeAction } from '@/lib/email-utils';
import AttachmentsAccordion from './attachments-accordion';
import { cn, getEmailLogo, formatDate } from '@/lib/utils';
import { useBrainState } from '../../hooks/use-summary';
import { useThreadLabels } from '@/hooks/use-labels';
import type { Sender, ParsedMessage } from '@/types';
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
            icon = <Lightning className="h-3.5 w-3.5 fill-white" />;
            bgColor = 'bg-[#F59E0D]';
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
            icon = <Star className="h-3.5 w-3.5 text-white" />;
            bgColor = 'bg-yellow-500';
            break;
          default:
            return null;
        }

        return (
          <Badge
            key={`${label}-${index}`}
            className={`rounded-md p-1 ${bgColor} -ml-1.5 border-2 border-white transition-transform first:ml-0 dark:border-[#1A1A1A]`}
          >
            {icon}
          </Badge>
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
        <Markdown markdownContainerStyles={{ fontSize: 12 }}>{summary?.data.short || ''}</Markdown>
      )}
    </div>
  );
};

const MailDisplay = ({ emailData, index, totalEmails, demo }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [preventCollapse, setPreventCollapse] = useState(false);
  const { folder } = useParams<{ folder: string }>();
  const [selectedAttachment, setSelectedAttachment] = useState<null | {
    id: string;
    name: string;
    type: string;
    url: string;
  }>(null);
  const [openDetailsPopover, setOpenDetailsPopover] = useState<boolean>(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations();
  const [activeReplyId, setActiveReplyId] = useQueryState('activeReplyId');
  const { data: session } = useSession();
  const { labels: threadLabels } = useThreadLabels(
    emailData.tags ? emailData.tags.map((l) => l.id) : [],
  );
  const { data: brainState } = useBrainState();
  const { data: activeConnection } = useActiveConnection();

  useEffect(() => {
    if (!demo) {
      if (activeReplyId === emailData.id) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(activeReplyId ? true : totalEmails ? index !== totalEmails - 1 : false);
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
  }, [index, activeReplyId, emailData.id, totalEmails, demo]);

  const listUnsubscribeAction = useMemo(
    () =>
      emailData.listUnsubscribe
        ? getListUnsubscribeAction({
          listUnsubscribe: emailData.listUnsubscribe,
          listUnsubscribePost: emailData.listUnsubscribePost,
        })
        : undefined,
    [emailData.listUnsubscribe, emailData.listUnsubscribePost],
  );

  const _handleUnsubscribe = async () => {
    setIsUnsubscribing(true);
    try {
      await handleUnsubscribe({
        emailData,
      });
      setIsUnsubscribing(false);
      setUnsubscribed(true);
    } catch (e) {
      setIsUnsubscribing(false);
      setUnsubscribed(false);
    }
  };

  const [mode, setMode] = useQueryState('mode');

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
              
              ${emailData?.tags && emailData.tags.length > 0 ? `
                <div class="labels-section">
                  ${emailData.tags.map(tag =>
        `<span class="label-badge">${tag.name}</span>`
      ).join('')}
                </div>
              ` : ''}
              
              <div class="email-meta">
                <div class="meta-row">
                  <span class="meta-label">From:</span>
                  <span class="meta-value">
                    ${cleanNameDisplay(emailData.sender?.name)} 
                    ${emailData.sender?.email ? `&lt;${emailData.sender.email}&gt;` : ''}
                  </span>
                </div>
                
                ${emailData.to && emailData.to.length > 0 ? `
                  <div class="meta-row">
                    <span class="meta-label">To:</span>
                    <span class="meta-value">
                      ${emailData.to.map(recipient =>
        `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`
      ).join(', ')}
                    </span>
                  </div>
                ` : ''}
                
                ${emailData.cc && emailData.cc.length > 0 ? `
                  <div class="meta-row">
                    <span class="meta-label">CC:</span>
                    <span class="meta-value">
                      ${emailData.cc.map(recipient =>
        `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`
      ).join(', ')}
                    </span>
                  </div>
                ` : ''}
                
                ${emailData.bcc && emailData.bcc.length > 0 ? `
                  <div class="meta-row">
                    <span class="meta-label">BCC:</span>
                    <span class="meta-value">
                      ${emailData.bcc.map(recipient =>
        `${cleanNameDisplay(recipient.name)} &lt;${recipient.email}&gt;`
      ).join(', ')}
                    </span>
                  </div>
                ` : ''}
                
                <div class="meta-row">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${format(new Date(emailData.receivedOn), 'PPpp')}</span>
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
            ${emailData.attachments && emailData.attachments.length > 0 ? `
              <div class="attachments-section">
                <h2 class="attachments-title">Attachments (${emailData.attachments.length})</h2>
                ${emailData.attachments.map((attachment, index) => `
                  <div class="attachment-item">
                    <span class="attachment-name">${attachment.filename}</span>
                    ${formatFileSize(attachment.size) ? ` - <span class="attachment-size">${formatFileSize(attachment.size)}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;

      // Write content to the iframe
      const iframeDoc = printFrame.contentDocument || printFrame.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load, then print
      printFrame.onload = function () {
        setTimeout(() => {
          try {
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
            className="inline-flex items-center justify-start gap-1.5 overflow-hidden rounded-full border border-[#DBDBDB] bg-white p-1 pr-2 dark:border-[#2B2B2B] dark:bg-[#1A1A1A]"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={getEmailLogo(person.email)} className="rounded-full" />
              <AvatarFallback className="rounded-full bg-[#F5F5F5] text-xs font-bold dark:bg-[#373737]">
                {getFirstLetterCharacter(person.name || person.email)}
              </AvatarFallback>
            </Avatar>
            <div className="justify-start text-sm font-medium leading-none text-[#1A1A1A] dark:text-white">
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
      <div className="relative h-full overflow-y-auto">
        <div className={cn('px-4', index === 0 && 'border-b py-4')}>
          {index === 0 && (
            <>
              <span className="inline-flex items-center gap-2 font-medium text-black dark:text-white">
                <span>
                  {emailData.subject}{' '}
                  <span className="text-[#6D6D6D] dark:text-[#8C8C8C]">
                    {totalEmails && totalEmails > 1 && `[${totalEmails}]`}
                  </span>
                </span>
                {emailData?.tags ? (
                  <MailDisplayLabels labels={emailData?.tags.map((t) => t.name) || []} />
                ) : null}
              </span>
              <div className="mt-2 flex items-center gap-4">
                <RenderLabels labels={threadLabels} />
                {threadLabels.length ? (
                  <div className="bg-iconLight dark:bg-iconDark/20 relative h-3 w-0.5 rounded-full" />
                ) : null}
                <div className="flex items-center gap-2 text-sm text-[#6D6D6D] dark:text-[#8C8C8C]">
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
                                +{people.length - 2} {people.length - 2 === 1 ? 'other' : 'others'}
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
                        <span className="font-semibold">
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
                              <p className="text-xs text-[#6D6D6D] underline dark:text-[#8C8C8C]">
                                Details
                              </p>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="align-items-start w-[420px] rounded-lg border p-3 text-left shadow-lg dark:bg-[#1A1A1A]"
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
                                  {emailData?.to?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
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
                                  {format(new Date(emailData?.receivedOn), 'PPpp')}
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

                      <div className='flex items-center justify-center' >

                        <time className="text-sm font-medium text-[#6D6D6D] dark:text-[#8C8C8C]">
                          {formatDate(emailData?.receivedOn)}
                        </time>

                        {/* print button */}
                        <button onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          printMail()
                        }} className='ml-4 z-50' >

                          <kbd
                            className={cn(
                              'border-muted-foreground/10 bg-accent hover:bg-primary/25 h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
                              '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
                            )}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </kbd>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pb-2">
                      <p className="text-sm font-medium text-[#6D6D6D] dark:text-[#8C8C8C]">
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
                        <p className="text-sm font-medium text-[#6D6D6D] dark:text-[#8C8C8C]">
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

                  <span className="text-muted-foreground flex grow-0 items-center gap-2 text-sm">
                    {/* <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {emailData?.sender?.email}
                    </span> */}

                    {/* {listUnsubscribeAction && (
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
                    {isMuted && <BellOff className="h-4 w-4" />} */}
                  </span>
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
                    <div key={index}>
                      <button
                        className="dark: flex h-7 items-center gap-1 rounded-[5px] border bg-[#FAFAFA] px-4 text-sm font-medium hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
                        onClick={() => {
                          try {
                            // Convert base64 to blob
                            const byteCharacters = atob(attachment.body);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                              byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: attachment.mimeType });

                            // Create object URL and trigger download
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
                        }}
                      >
                        {getFileIcon(attachment.filename)}
                        <span className="max-w-[15ch] truncate text-sm text-black dark:text-white">
                          {attachment.filename}
                        </span>{' '}
                        <span className="whitespace-nowrap text-sm text-[#6D6D6D] dark:text-[#929292]">
                          {formatFileSize(attachment.size)}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mb-2 mt-2 flex gap-2 px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('reply');
                    setActiveReplyId(emailData.id);
                  }}
                  className="inline-flex h-7 items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 dark:border-none dark:bg-[#313131]"
                >
                  <Reply className="fill-[#6D6D6D] dark:fill-[#9B9B9B]" />
                  <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
                    <div className="justify-start text-sm leading-none text-black dark:text-white">
                      {t('common.mail.reply')}
                    </div>
                  </div>
                  <kbd
                    className={cn(
                      'border-muted-foreground/10 bg-accent h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
                      '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
                    )}
                  >
                    r
                  </kbd>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('replyAll');
                    setActiveReplyId(emailData.id);
                  }}
                  className="inline-flex h-7 items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 dark:border-none dark:bg-[#313131]"
                >
                  <ReplyAll className="fill-[#6D6D6D] dark:fill-[#9B9B9B]" />
                  <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
                    <div className="justify-start text-sm leading-none text-black dark:text-white">
                      {t('common.mail.replyAll')}
                    </div>
                  </div>
                  <kbd
                    className={cn(
                      'border-muted-foreground/10 bg-accent h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
                      '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
                    )}
                  >
                    a
                  </kbd>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('forward');
                    setActiveReplyId(emailData.id);
                  }}
                  className="inline-flex h-7 items-center justify-center gap-1 overflow-hidden rounded-md border bg-white px-1.5 dark:border-none dark:bg-[#313131]"
                >
                  <Forward className="fill-[#6D6D6D] dark:fill-[#9B9B9B]" />
                  <div className="flex items-center justify-center gap-2.5 pl-0.5 pr-1">
                    <div className="justify-start text-sm leading-none text-black dark:text-white">
                      {t('common.mail.forward')}
                    </div>
                  </div>
                  <kbd
                    className={cn(
                      'border-muted-foreground/10 bg-accent h-6 rounded-[6px] border px-1.5 font-mono text-xs leading-6',
                      '-me-1 ms-auto hidden max-h-full items-center md:inline-flex',
                    )}
                  >
                    f
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MailDisplay);
