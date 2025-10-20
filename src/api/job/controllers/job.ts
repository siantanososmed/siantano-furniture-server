/**
 * job controller
 */

import {type Core, factories} from '@strapi/strapi'

export default factories.createCoreController('api::job.job', ({ strapi }: { strapi: Core.Strapi }) => ({
  async findOneBySlug(ctx){
    const { slug } = ctx.params;

    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    let job = await strapi.documents('api::job.job').findFirst({
      filters: {
        slug
      },
      ...sanitizedQuery
    });

    const sanitizedEntity = await this.sanitizeOutput(job, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
