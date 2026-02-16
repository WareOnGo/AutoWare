import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/projects.tsx"),
  route("editor/:id", "routes/editor.$id.tsx"),
  route("render", "render.tsx"),
  route("progress/:id", "progress.tsx"),
  route("worker-*/*", "routes/worker.$.ts"), // Catch Remotion worker files
] satisfies RouteConfig;
