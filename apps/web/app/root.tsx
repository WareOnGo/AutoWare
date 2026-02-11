import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ToastProvider } from "~/lib/toast-context";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import stylesheet from "~/app.css?url";

export const links = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => {
  return [
    {
      title: "Remotion Starter",
    },
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { property: "og:title", content: "Remotion + React Router" },
  ];
};

export default function App() {
  return (
    <html lang="en" className="light">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </ErrorBoundary>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
