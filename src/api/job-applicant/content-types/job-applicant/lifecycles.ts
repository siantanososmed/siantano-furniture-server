import {readFileSync} from "node:fs";
import { errors } from '@strapi/utils';

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    const job = await strapi.documents('api::job.job').findFirst({
      filters: { documentId: data.jobId },
    });

    if (job.jobStatus === 'Close') {
      throw new errors.ValidationError('You cannot apply for a closed job.');
    }
  },
  async afterCreate(event) {
    const { result } = event;
    const emails = await strapi.documents('api::email-inbox.email-inbox').findFirst();

    if (!emails || !emails.careerInbox) {
      console.log('No email found in Email Inbox');
      return;
    }

    const job = await strapi.documents('api::job.job').findFirst({
      filters: { documentId: result.jobId },
    });

    try {
      const baseUrl = process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'
      const template = {
        subject: 'New Job Application from ' + result.name,
        text: readFileSync('./html/careers-fallback.txt', 'utf-8'),
        html: readFileSync('./html/careers.html', 'utf-8'),
      }
      await strapi.plugin('email').service('email').sendTemplatedEmail({
        to: emails.careerInbox,
      }, template, {
        name: result.name,
        email: result.email,
        phone: result.phoneNumber,
        position_applied: job ? `${job.position} (${job.experience}) - [${job.documentId}]` : 'N/A',
        submitted_at: new Date(result.createdAt).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
        }),
        dashboard_link: baseUrl + '/admin/content-manager/collection-types/api::job-applicant.job-applicant/' + result.documentId
      })
    } catch (e) {
      console.log(e)
    }
  }
}