import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/providers/query-provider';
import { useSession } from '@/lib/auth-client';
import { useMemo } from 'react';
import { toast } from 'sonner';

export const useThemes = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // User themes query
  const useUserThemes = (connectionId?: string) => {
    return useQuery(
      trpc.themes.list.queryOptions(
        { connectionId },
        {
          enabled: !!session?.user.id,
          staleTime: 1000 * 60 * 5, // 5 minutes
          meta: {
            customError: 'Failed to load your themes',
          },
        },
      ),
    );
  };

  // Connection themes query
  const useConnectionThemes = () => {
    return useQuery(
      trpc.themes.getConnectionThemes.queryOptions(undefined, {
        enabled: !!session?.user.id,
        staleTime: 1000 * 60 * 5,
        meta: {
          customError: 'Failed to load connection themes',
        },
      }),
    );
  };

  // Single theme query
  const useTheme = (themeId: string) => {
    return useQuery(
      trpc.themes.get.queryOptions(
        { themeId: themeId! },
        {
          enabled: !!themeId && !!session?.user.id,
          staleTime: 1000 * 60 * 10, // 10 minutes
          meta: {
            customError: 'Failed to load theme',
          },
        },
      ),
    );
  };

  // Public theme query
  const usePublicTheme = (themeId: string | null) => {
    return useQuery(
      trpc.themes.getPublic.queryOptions(
        { themeId: themeId! },
        {
          enabled: !!themeId,
          staleTime: 1000 * 60 * 10,
          meta: {
            customError: 'Failed to load public theme',
          },
        },
      ),
    );
  };

  // Mutations with proper cache invalidation
  const createTheme = useMutation(
    trpc.themes.create.mutationOptions({
      onSuccess: () => {
        // Invalidate all theme queries
        queryClient.invalidateQueries({
          queryKey: trpc.themes.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.getConnectionThemes.queryKey(),
        });
        toast.success('Theme created successfully');
      },
    }),
  );

  const updateTheme = useMutation(
    trpc.themes.update.mutationOptions({
      onSuccess: (data) => {
        // Update specific theme in cache
        queryClient.setQueryData(trpc.themes.get.queryKey({ themeId: data.theme.id }), {
          theme: data.theme,
        });

        // Invalidate list queries
        queryClient.invalidateQueries({
          queryKey: trpc.themes.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.getConnectionThemes.queryKey(),
        });

        if (data.theme.isPublic) {
          queryClient.invalidateQueries({
            queryKey: trpc.themes.marketplace.queryKey(),
          });
        }

        toast.success('Theme updated successfully');
      },
    }),
  );

  const deleteTheme = useMutation(
    trpc.themes.delete.mutationOptions({
      onSuccess: (_, variables) => {
        // Remove from cache
        queryClient.removeQueries({
          queryKey: trpc.themes.get.queryKey({ themeId: variables.themeId }),
        });

        // Invalidate list queries
        queryClient.invalidateQueries({
          queryKey: trpc.themes.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.getConnectionThemes.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.marketplace.queryKey(),
        });

        toast.success('Theme deleted successfully');
      },
    }),
  );

  const togglePublic = useMutation(
    trpc.themes.togglePublic.mutationOptions({
      onSuccess: (data) => {
        // Update specific theme in cache
        queryClient.setQueryData(trpc.themes.get.queryKey({ themeId: data.theme.id }), {
          theme: data.theme,
        });

        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: trpc.themes.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.getConnectionThemes.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.marketplace.queryKey(),
        });

        toast.success(
          data.theme.isPublic ? 'Theme is now public in marketplace' : 'Theme is now private',
        );
      },
    }),
  );

  const copyPublicTheme = useMutation(
    trpc.themes.copyPublic.mutationOptions({
      onSuccess: () => {
        // Invalidate user theme queries
        queryClient.invalidateQueries({
          queryKey: trpc.themes.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.themes.getConnectionThemes.queryKey(),
        });

        toast.success('Theme copied to your collection');
      },
    }),
  );

  return {
    // Queries
    useUserThemes,
    useConnectionThemes,
    useTheme,
    usePublicTheme,

    // Mutations
    createTheme,
    updateTheme,
    deleteTheme,
    togglePublic,
    copyPublicTheme,
  };
};

// Marketplace themes hook with infinite query (similar to your useThreads pattern)
export const useMarketplaceThemes = (searchQuery = '') => {
  const trpc = useTRPC();

  const marketplaceQuery = useInfiniteQuery(
    trpc.themes.marketplace.infiniteQueryOptions(
      {
        q: searchQuery,
        limit: 20,
      },
      {
        initialCursor: '',
        getNextPageParam: (lastPage, allPages) => {
          // If we got less than the limit, we're at the end
          if (lastPage.themes.length < 20) return null;
          // Return the offset for the next page
          return (allPages.length * 20).toString();
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchOnMount: true,
        meta: {
          customError: 'Failed to load marketplace themes',
        },
      },
    ),
  );

  // Flatten themes from all pages (similar to your threads pattern)
  const themes = useMemo(
    () =>
      marketplaceQuery.data
        ? marketplaceQuery.data.pages.flatMap((page) => page.themes).filter(Boolean)
        : [],
    [marketplaceQuery.data],
  );

  const isEmpty = useMemo(() => themes.length === 0, [themes]);
  const isReachingEnd =
    isEmpty ||
    (marketplaceQuery.data &&
      !marketplaceQuery.data.pages[marketplaceQuery.data.pages.length - 1]?.themes.length);

  const loadMore = async () => {
    if (marketplaceQuery.isLoading || marketplaceQuery.isFetching) return;
    await marketplaceQuery.fetchNextPage();
  };

  return [marketplaceQuery, themes, isReachingEnd, loadMore] as const;
};
