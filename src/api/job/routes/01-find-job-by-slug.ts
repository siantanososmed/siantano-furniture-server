export default {
  routes: [
    {
      method: 'GET',
      path: '/jobs/slug/:slug',
      handler: 'job.findOneBySlug',
    }
  ]
}