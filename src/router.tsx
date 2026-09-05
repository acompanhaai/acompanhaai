import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Side-effecting Sentry client init/integration only ever runs in the
  // browser — this module is also evaluated during SSR, where importing
  // the client SDK would double-initialize against the server build.
  if (!router.isServer) {
    void import("./sentry-browser-init")
      .then(() => import("@sentry/tanstackstart-react"))
      .then((Sentry) => {
        Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router));
      });
  }

  return router;
};
