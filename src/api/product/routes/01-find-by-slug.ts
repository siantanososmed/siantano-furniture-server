export default {
  routes: [
    {
      method: 'GET',
      path: '/product/slug/:slug',
      handler: 'product.findOneBySlug',
    }
  ]
}