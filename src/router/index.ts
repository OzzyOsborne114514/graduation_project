import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue"),
  },
  {
    path: "/home",
    name: "home",
    component: () => import("../views/home/HomeView.vue"),
    redirect: "/home/dashboard",
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("../views/home/DashboardView.vue"),
      },
      {
        path: "messages",
        name: "messages",
        component: () => import("../views/home/MessagesView.vue"),
      },
      {
        path: "friends",
        name: "friends",
        component: () => import("../views/home/FriendsView.vue"),
      },
      {
        path:"tools",
        name:"tools",
        component: () => import("../views/home/ToolsView.vue"),
      },
      {
        path: "chat/:groupId",
        name: "chat",
        component: () => import("../views/home/ChatView.vue"),
      }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
