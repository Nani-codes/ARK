export default {
  routes: [
    {
      method: 'GET',
      path: '/professionals',
      handler: 'professional-profile.listProfessionals',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/professionals/:id',
      handler: 'professional-profile.getProfessional',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/professionals/:id/reviews',
      handler: 'professional-profile.listReviews',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/professionals/:id/reviews',
      handler: 'professional-profile.submitReview',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/professionals/:id/callback',
      handler: 'professional-profile.requestCallback',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/professional-profile/me',
      handler: 'professional-profile.me',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/professional-profile/me',
      handler: 'professional-profile.updateMe',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/professional-profile/me/projects',
      handler: 'professional-profile.createProject',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/professional-profile/me/projects/:projectId',
      handler: 'professional-profile.updateProject',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/professional-profile/me/projects/:projectId',
      handler: 'professional-profile.deleteProject',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
