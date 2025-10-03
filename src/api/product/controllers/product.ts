/**
 * product controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }: { strapi: Core.Strapi }) => ({
  async findOneBySlug(ctx){
    const { slug } = ctx.params;

    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const entity = await strapi.documents('api::product.product').findFirst({
      filters: {
        slug
      },
      populate: {
        thumbnail: {
          fields: ['url', 'provider_metadata', 'alternativeText']
        },
        product_colors: {
          populate: {
            color: {
              fields: ['name', 'slug'],
              populate: {
                sample: {
                  fields: ['url', 'provider_metadata', 'alternativeText']
                }
              }
            },
            productMedia: {
              fields: ['url', 'provider_metadata', 'alternativeText']
            }
          }
        },
        materials: {
          fields: ['name']
        },
        finishings: {
          fields: ['name']
        },
        category: {
          fields: ['name', 'slug', 'quality']
        }
      },
      ...sanitizedQuery
    });

    if (!entity) {
      return ctx.notFound();
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

}));
