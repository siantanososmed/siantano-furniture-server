/**
 * job-applicant controller
 */

import {type Core, factories} from '@strapi/strapi'
import {fileTypeFromBlob, fileTypeFromBuffer} from "file-type";
import {readFile} from "node:fs/promises";

export default factories.createCoreController('api::job-applicant.job-applicant', ({ strapi }: { strapi: Core.Strapi }) => ({
  async apply(ctx){
    const { slug } = ctx.params;
    const { cv } = ctx.request.files;

    await this.validateQuery(ctx);
    await this.validateInput(ctx.request.body, ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

    interface ApplicantBody {
      name: string;
      email: string;
      phoneNumber: string;
    }

    function isApplicantBody(body: unknown): body is ApplicantBody {
      return (
        typeof body === 'object' &&
        body !== null &&
        'name' in body &&
        'email' in body &&
        'phoneNumber' in body
      );
    }

    const job = await strapi.documents('api::job.job').findFirst({
      filters: {
        slug
      },
      ...sanitizedQuery
    });

    if (!job) {
      return ctx.notFound('Job not found');
    }

    if (!isApplicantBody(sanitizedBody)) {
      return ctx.badRequest('Invalid applicant data provided.');
    }

    const filesToUpload = Array.isArray(cv) ? cv : [cv];

    if (!filesToUpload || filesToUpload.length === 0) {
      return ctx.badRequest('CV/Portfolio file is required.');
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    for (const file of filesToUpload) {
      const buffer = await readFile(file.filepath);
      const fileType = await fileTypeFromBuffer(buffer);

      if (file.size > MAX_FILE_SIZE) {
        return ctx.badRequest('File size exceeds the 5MB limit.');
      }

      if (!fileType) {
        return ctx.badRequest('Unable to detect file type.');
      }

      const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg', 'zip'];
      if (!allowedTypes.includes(fileType.ext)) {
        return ctx.badRequest(`Invalid file type: ${fileType.ext}`);
      }
    }

    const uploadedFilesPromise = filesToUpload.map((file, i) => {
      return strapi.plugin('upload').service('upload').upload({
        data: {
          fileInfo: {
            name: `CV_${sanitizedBody.name.replace(/\s+/g, '_')}_${job.position}${i === 0 ? '' : '_' + i}`,
          }
        },
        files: file,
      });
    });

    const uploadedFiles = (await Promise.all(uploadedFilesPromise)).flat();

    const applicant = await strapi.documents('api::job-applicant.job-applicant').create({
      data: {
        jobId: job.documentId,
        name: sanitizedBody.name,
        email: sanitizedBody.email,
        phoneNumber: sanitizedBody.phoneNumber,
        cv: uploadedFiles.map((file) => file.id),
      }
    });

    const sanitizedResult = await this.sanitizeOutput(applicant, ctx);
    return this.transformResponse(sanitizedResult);
  }
}));
