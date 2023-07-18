import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '@/views/Main/LandingPage.vue';
import Main from '@/views/Main/Main.vue';
import Signup from '@/views/Main/Signup.vue';
import ServiceMain from '@/views/Service/Main.vue';
import Service from '@/views/Service/Service.vue';
import EditFiles from '@/views/Service/Subdomain/EditFiles.vue';
import UsersMain from '@/views/Service/Users/Main.vue';
import Users from '@/views/Service/Users/Users.vue';
import Mail from '@/views/Main/Mail.vue';
import RecordsMain from '@/views/Service/Records/Main.vue';
import Tables from '@/views/Service/Records/Tables.vue';
import TableRecord from '@/views/Service/Records/TableRecord.vue';
import Admin from '@/views/Main/Admin.vue';
import Settings from '@/views/Main/Settings.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Main,
      children: [
        {
          path: '',
          name: 'home',
          component: LandingPage
        },
        {
          path: 'admin',
          name: 'admin',
          component: Admin
        },
        {
          path: 'account-settings',
          name: 'settings',
          component: Settings
        },
        {
          path: 'signup',
          name: 'signup',
          component: Signup
        },
        {
          path: 'forgotpassword',
          name: 'forgotpassword',
          component: () => import('@/views/Main/ForgotPassword.vue')
        },
        {
          path: 'confirmation',
          name: 'confirmation',
          component: () => import('@/views/Main/ResendConfirmation.vue')
        },
        {
          path: 'success',
          name: 'success',
          component: () => import('@/views/Main/EmailConfirmed.vue')
        },
        {
          path: 'deleted',
          name: 'deleted',
          component: () => import('@/views/Main/DeleteConfirmed.vue')
        },
        {
          path: "/:catchAll(.*)",
          name: 'notFound',
          component: () => import('@/views/Main/404.vue')
        }
      ]
    },
    {
      path: '/admin',
      children: [
        {
          path: ':service',
          component: ServiceMain,
          children: [
            {
              path: '',
              name: 'service',
              component: Service
            },
            {
              path: 'files/:folders*',
              name: 'files',
              component: EditFiles
            },
            {
              path: 'records',
              component: RecordsMain,
              children: [
                {
                  path: '',
                  name: 'records',
                  component: Tables
                },
                {
                  path: 'search',
                  name: 'recordSearch',
                  component: ()=>import('@/views/Service/Records/SearchResult.vue')
                },
                {
                  path: 'mobile-search',
                  name: 'mobileSearchRecord',
                  component: ()=>import('@/views/Service/Records/MobileSearch.vue')
                },
                {
                  path: 'mobile-view',
                  name: 'mobileRecordView',
                  component: ()=>import('@/views/Service/Records/MobileViewRecord.vue')
                },
                {
                  path: 'list',
                  name: 'recordList',
                  component: TableRecord
                }
              ]
            },
            {
              path: 'users',
              component: UsersMain,
              children: [
                {
                  path: '',
                  name: 'users',
                  component: Users
                },
                {
                  path: 'user-search',
                  name: 'mobileSearchUser',
                  component: ()=>import('@/views/Service/Users/MobileSearch.vue')
                },
                {
                  path: 'user/:user_id',
                  name: 'userView',
                  component: ()=>import('@/views/Service/Users/MobileView.vue')
                },
                {
                  path: 'search',
                  name: 'userSearch',
                  component: ()=>import('@/views/Service/Users/SearchResult.vue')
                },
              ]
            },
            {
              path: 'mail',
              name: 'mail',
              component: Mail
            }
          ]
        }
      ]
    }
  ],
  scrollBehavior() {
    // always scroll to top
    return { top: 0 };
  }
});

export default router;
