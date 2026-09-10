import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("auth", "routes/auth.tsx"),
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("recap", "routes/recap.tsx"),
    route("categories", "routes/categories.tsx"),
    route("categories/:categoryId", "routes/category-detail.tsx"),
    route("test", "routes/test.tsx"),
  ]),
] satisfies RouteConfig;
