export default {
  routes: [
    {
      method: 'POST',
      path: '/jobs/:slug/apply',
      handler: 'job-applicant.apply',
    }
  ]
}