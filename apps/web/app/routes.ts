import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("home.tsx"),
  route("render", "render.tsx"),
  route("progress/:id", "progress.tsx"),
  route("editor", "routes/Editor.tsx"),
] satisfies RouteConfig;
